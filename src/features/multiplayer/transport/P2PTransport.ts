"use client";

import { logger } from "@/shared/lib/logger";
import {
  EventBus,
  type Handler,
  type ITransportProvider,
  type LivePosition,
  type RideChannelContext,
  type RideMessage,
  type TransportEvent,
  type TransportState,
  type Unsubscribe,
} from "./types";

/**
 * Direct peer-to-peer transport over WebRTC DataChannels.
 *
 * A full mesh, which is appropriate here: group rides are a handful of riders,
 * and n² connections at n≈8 is 28 links carrying one small message per second.
 * An SFU would be the answer for a much larger group, and is not worth the
 * server for this.
 *
 * Signalling rides on the existing relay channel — SDP and ICE are just
 * messages, so no separate signalling server is needed.
 *
 * This never runs alone. `HybridTransport` keeps the relay up underneath, so a
 * peer that cannot be reached directly still receives everything.
 */

export interface SignalingChannel {
  /** Sends a signalling payload to one peer. */
  send(to: string, signal: unknown): void;
  /** Registers a handler for signals addressed to this device. */
  onSignal(handler: (from: string, signal: unknown) => void): Unsubscribe;
}

type PeerSignal =
  | { kind: "offer"; sdp: RTCSessionDescriptionInit }
  | { kind: "answer"; sdp: RTCSessionDescriptionInit }
  | { kind: "ice"; candidate: RTCIceCandidateInit };

interface Peer {
  connection: RTCPeerConnection;
  channel: RTCDataChannel | null;
}

function iceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
  ];

  // Symmetric NAT and many mobile carriers require a relay candidate; without
  // TURN those peers simply never connect and fall back to the Supabase relay,
  // which is the designed behaviour rather than a failure.
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }

  return servers;
}

export class P2PTransport implements ITransportProvider {
  readonly name = "p2p";

  private peers = new Map<string, Peer>();
  private bus = new EventBus();
  private currentState: TransportState = "idle";
  private context: RideChannelContext | null = null;
  private unsubscribeSignals: Unsubscribe | null = null;

  constructor(private readonly signaling: SignalingChannel) {}

  get state(): TransportState {
    return this.currentState;
  }

  /** Peers with an open data channel — what the hybrid reports as upgraded. */
  get connectedPeerIds(): string[] {
    return [...this.peers.entries()]
      .filter(([, peer]) => peer.channel?.readyState === "open")
      .map(([id]) => id);
  }

  on<E extends TransportEvent>(event: E, handler: Handler<E>): Unsubscribe {
    return this.bus.on(event, handler);
  }

  async connect(context: RideChannelContext): Promise<void> {
    this.context = context;
    this.setState("connecting");

    this.unsubscribeSignals = this.signaling.onSignal((from, signal) => {
      void this.handleSignal(from, signal as PeerSignal);
    });

    this.setState("connected");
  }

  async disconnect(): Promise<void> {
    this.unsubscribeSignals?.();
    this.unsubscribeSignals = null;

    for (const peer of this.peers.values()) {
      peer.channel?.close();
      peer.connection.close();
    }

    this.peers.clear();
    this.context = null;
    this.setState("closed");
    this.bus.clear();
  }

  /**
   * Offers a connection to a peer.
   *
   * Only the lexicographically smaller id offers. Without that rule both sides
   * offer simultaneously on presence sync and collide in `have-local-offer` —
   * the classic glare problem.
   */
  async connectToPeer(peerId: string): Promise<void> {
    if (!this.context || this.peers.has(peerId)) return;
    if (this.context.userId >= peerId) return;

    const peer = this.createPeer(peerId);

    const channel = peer.connection.createDataChannel("ride", {
      // Positions are superseded a second later, so retransmitting a lost one
      // is worse than dropping it — it would arrive out of order and behind.
      ordered: false,
      maxRetransmits: 0,
    });
    this.attachChannel(peerId, channel);

    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);
    this.signaling.send(peerId, { kind: "offer", sdp: offer } satisfies PeerSignal);
  }

  dropPeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.channel?.close();
    peer.connection.close();
    this.peers.delete(peerId);
  }

  publishPosition(position: LivePosition): void {
    this.broadcast({ type: "position", payload: position });
  }

  sendMessage(message: RideMessage): void {
    this.broadcast({ type: "message", payload: message });
  }

  private broadcast(envelope: { type: "position" | "message"; payload: unknown }): void {
    const encoded = JSON.stringify(envelope);

    for (const [peerId, peer] of this.peers) {
      if (peer.channel?.readyState !== "open") continue;
      try {
        peer.channel.send(encoded);
      } catch (error) {
        logger.debug(`p2p send to ${peerId} failed`, error);
      }
    }
  }

  private createPeer(peerId: string): Peer {
    const connection = new RTCPeerConnection({ iceServers: iceServers() });
    const peer: Peer = { connection, channel: null };
    this.peers.set(peerId, peer);

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.send(peerId, {
          kind: "ice",
          candidate: event.candidate.toJSON(),
        } satisfies PeerSignal);
      }
    };

    connection.ondatachannel = (event) => this.attachChannel(peerId, event.channel);

    connection.onconnectionstatechange = () => {
      const state = connection.connectionState;
      if (state === "failed" || state === "closed") {
        // The hybrid keeps relaying for this peer; nothing is lost.
        logger.debug(`p2p connection to ${peerId} ${state}`);
        this.dropPeer(peerId);
      }
    };

    return peer;
  }

  private attachChannel(peerId: string, channel: RTCDataChannel): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.channel = channel;

    channel.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data as string) as {
          type: "position" | "message";
          payload: unknown;
        };
        // Payloads from a peer are as untrusted as relay payloads; the hybrid
        // validates and de-duplicates before anything reaches the UI.
        if (envelope.type === "position") {
          this.bus.emit("position", envelope.payload as LivePosition);
        } else if (envelope.type === "message") {
          this.bus.emit("message", envelope.payload as RideMessage);
        }
      } catch (error) {
        logger.debug("malformed p2p payload", error);
      }
    };

    channel.onclose = () => {
      const current = this.peers.get(peerId);
      if (current) current.channel = null;
    };
  }

  private async handleSignal(from: string, signal: PeerSignal): Promise<void> {
    let peer = this.peers.get(from);

    if (signal.kind === "offer") {
      if (!peer) peer = this.createPeer(from);
      await peer.connection.setRemoteDescription(signal.sdp);
      const answer = await peer.connection.createAnswer();
      await peer.connection.setLocalDescription(answer);
      this.signaling.send(from, { kind: "answer", sdp: answer } satisfies PeerSignal);
      return;
    }

    if (!peer) return;

    if (signal.kind === "answer") {
      // Ignore a duplicate answer; setting it twice throws.
      if (peer.connection.signalingState !== "have-local-offer") return;
      await peer.connection.setRemoteDescription(signal.sdp);
      return;
    }

    try {
      await peer.connection.addIceCandidate(signal.candidate);
    } catch (error) {
      // Candidates can arrive before the remote description; they are retried
      // by the ICE agent and a rejection here is not fatal.
      logger.debug(`ice candidate from ${from} rejected`, error);
    }
  }

  private setState(state: TransportState): void {
    if (this.currentState === state) return;
    this.currentState = state;
    this.bus.emit("state", state);
  }
}
