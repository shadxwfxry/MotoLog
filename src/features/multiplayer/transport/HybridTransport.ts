"use client";

import { SequenceFilter } from "./dedupe";
import {
  EventBus,
  type Handler,
  type ITransportProvider,
  type LivePosition,
  type RideChannelContext,
  type RideMessage,
  type RidePresence,
  type TransportEvent,
  type TransportState,
  type Unsubscribe,
} from "./types";

/**
 * The subset of `P2PTransport` the hybrid drives. Declared structurally so the
 * hybrid stays testable with plain fakes and does not depend on WebRTC.
 */
export interface PeerCapableTransport extends ITransportProvider {
  connectToPeer(peerId: string): Promise<void>;
  dropPeer(peerId: string): void;
  readonly connectedPeerIds: string[];
}

/**
 * Composes the relay and P2P transports.
 *
 * The relay is never torn down. It is the floor: every rider is reachable
 * through it regardless of NAT, firewall or carrier. P2P is layered on top and
 * upgrades whichever pairs of riders can reach each other directly.
 *
 * This is what makes the fallback transparent, as the plan requires. There is
 * no moment where a rider is "switched over" to P2P and would lose data if it
 * failed — both paths carry the same updates, and the receiver keeps whichever
 * copy arrives first. A peer whose direct connection never establishes, or
 * drops mid-ride, simply keeps being served by the relay and nobody notices.
 *
 * The cost is duplicate traffic on upgraded links. Positions are tens of bytes
 * at 1 Hz, so that is a trade worth making for never showing a rider a stale or
 * missing position.
 */
export class HybridTransport implements ITransportProvider {
  readonly name = "hybrid";

  private bus = new EventBus();
  private positionFilter = new SequenceFilter();
  private messageFilter = new SequenceFilter();
  private subscriptions: Unsubscribe[] = [];
  private currentState: TransportState = "idle";
  /** Riders seen in the last presence sync, to detect departures. */
  private knownRiders = new Set<string>();

  constructor(
    private readonly relay: ITransportProvider,
    private readonly p2p: ITransportProvider | null,
  ) {}

  get state(): TransportState {
    return this.currentState;
  }

  on<E extends TransportEvent>(event: E, handler: Handler<E>): Unsubscribe {
    return this.bus.on(event, handler);
  }

  async connect(context: RideChannelContext): Promise<void> {
    this.setState("connecting");

    this.subscribe(this.relay);
    // Presence comes from the relay alone — it is the one transport that sees
    // every rider, including those P2P could never reach.
    this.subscriptions.push(
      this.relay.on("presence", (riders: RidePresence[]) => {
        this.bus.emit("presence", riders);
        this.reconcilePeers(context.userId, riders);
      }),
      this.relay.on("state", () => this.recomputeState()),
    );

    // The relay must be up before P2P, which signals over it.
    await this.relay.connect(context);

    if (this.p2p) {
      this.subscribe(this.p2p);
      this.subscriptions.push(this.p2p.on("state", () => this.recomputeState()));

      try {
        await this.p2p.connect(context);
      } catch {
        // P2P is an optimisation. Failing to start it is not a ride-ending
        // error — the relay is already carrying everything.
      }
    }

    this.recomputeState();
  }

  async disconnect(): Promise<void> {
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions = [];

    await Promise.allSettled([this.relay.disconnect(), this.p2p?.disconnect()]);

    this.positionFilter.reset();
    this.messageFilter.reset();
    this.knownRiders.clear();
    this.setState("closed");
    this.bus.clear();
  }

  /**
   * Sends on both paths. The relay guarantees delivery to everyone; P2P gets
   * there sooner for the peers it has reached.
   */
  publishPosition(position: LivePosition): void {
    this.relay.publishPosition(position);
    this.p2p?.publishPosition(position);
  }

  sendMessage(message: RideMessage): void {
    this.relay.sendMessage(message);
    this.p2p?.sendMessage(message);
  }

  /** Forgets a departed rider so a rejoin with a reset counter is not filtered. */
  forgetRider(userId: string): void {
    this.positionFilter.forget(userId);
    this.messageFilter.forget(userId);
  }

  /**
   * Keeps the peer mesh in step with who is actually in the ride.
   *
   * Presence is the trigger for dialling a peer: it is the moment we learn a
   * rider exists. Riders who leave are dropped so their connection and marker
   * do not linger, and their sequence counter is forgotten so a rejoin — which
   * restarts at 1 — is not filtered out as stale.
   */
  private reconcilePeers(selfId: string, riders: RidePresence[]): void {
    const p2p = this.peerCapable();
    const present = new Set(riders.map((r) => r.userId));

    if (p2p) {
      for (const rider of riders) {
        if (rider.userId === selfId) continue;
        // connectToPeer is idempotent and applies the glare rule itself.
        void p2p.connectToPeer(rider.userId);
      }

      for (const peerId of p2p.connectedPeerIds) {
        if (!present.has(peerId)) p2p.dropPeer(peerId);
      }
    }

    for (const userId of this.knownRiders) {
      if (!present.has(userId)) this.forgetRider(userId);
    }
    this.knownRiders = present;
  }

  /** The P2P transport, when one is present and exposes the mesh controls. */
  private peerCapable(): PeerCapableTransport | null {
    const candidate = this.p2p as Partial<PeerCapableTransport> | null;
    if (!candidate || typeof candidate.connectToPeer !== "function") return null;
    return candidate as PeerCapableTransport;
  }

  private subscribe(transport: ITransportProvider): void {
    this.subscriptions.push(
      transport.on("position", (position) => {
        if (this.positionFilter.accept(position)) this.bus.emit("position", position);
      }),
      transport.on("message", (message) => {
        if (this.messageFilter.accept(message)) this.bus.emit("message", message);
      }),
    );
  }

  /**
   * Overall state follows the relay, because the relay is what determines
   * whether the rider sees the group at all. P2P only distinguishes "connected"
   * from "degraded", which the UI shows as an indicator rather than an error.
   */
  private recomputeState(): void {
    const relayState = this.relay.state;

    if (relayState !== "connected") {
      this.setState(relayState);
      return;
    }

    this.setState(this.p2p && this.p2p.state === "connected" ? "connected" : "degraded");
  }

  private setState(state: TransportState): void {
    if (this.currentState === state) return;
    this.currentState = state;
    this.bus.emit("state", state);
  }
}
