"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/shared/lib/logger";
import type { SignalingChannel } from "./P2PTransport";
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

const POSITION_EVENT = "position";
const MESSAGE_EVENT = "message";
const SIGNAL_EVENT = "signal";

interface SignalEnvelope {
  from: string;
  to: string;
  signal: unknown;
}

/**
 * Group-ride transport over Supabase Realtime.
 *
 * Presence tracks who is in the ride; Broadcast carries positions and chat.
 * Neither is persisted — the database stores membership and finished trips, not
 * the live stream.
 *
 * This is the baseline that always works, whatever the riders' networks look
 * like. `P2PTransport` is an optimisation layered on top, never a replacement.
 */
export class RelayTransport implements ITransportProvider {
  readonly name = "relay";

  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private bus = new EventBus();
  private currentState: TransportState = "idle";
  private context: RideChannelContext | null = null;
  private signalHandlers = new Set<(from: string, signal: unknown) => void>();

  get state(): TransportState {
    return this.currentState;
  }

  on<E extends TransportEvent>(event: E, handler: Handler<E>): Unsubscribe {
    return this.bus.on(event, handler);
  }

  async connect(context: RideChannelContext): Promise<void> {
    this.context = context;
    this.setState("connecting");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      this.setState("closed");
      throw new Error("Supabase realtime is not configured");
    }

    this.client = createClient(url, anonKey, {
      // No Supabase session exists — auth is NextAuth, and the channel
      // credential is the minted JWT applied below.
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: {
        params: {
          // Roughly 10 position updates per second across the whole channel;
          // a group of eight at 1 Hz sits comfortably inside this.
          eventsPerSecond: 10,
        },
      },
    });

    await this.authorize();

    this.channel = this.client.channel(`ride:${context.groupId}`, {
      config: {
        presence: { key: context.userId },
        // Our own broadcasts are applied optimistically by the caller.
        broadcast: { self: false, ack: false },
      },
    });

    this.channel
      .on("presence", { event: "sync" }, () => this.emitPresence())
      .on("broadcast", { event: POSITION_EVENT }, ({ payload }) => {
        if (isLivePosition(payload)) this.bus.emit("position", payload);
      })
      .on("broadcast", { event: MESSAGE_EVENT }, ({ payload }) => {
        if (isRideMessage(payload)) this.bus.emit("message", payload);
      })
      // WebRTC signalling rides this channel, so P2P needs no separate server.
      // Broadcast is inherently fan-out, hence the explicit `to` filter.
      .on("broadcast", { event: SIGNAL_EVENT }, ({ payload }) => {
        const envelope = payload as Partial<SignalEnvelope> | null;
        if (!envelope || typeof envelope.from !== "string") return;
        if (envelope.to !== this.context?.userId) return;

        for (const handler of this.signalHandlers) handler(envelope.from, envelope.signal);
      });

    await new Promise<void>((resolve, reject) => {
      this.channel?.subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          void this.channel?.track({
            userId: context.userId,
            nickname: context.nickname,
            onlineAt: Date.now(),
          });
          this.setState("connected");
          resolve();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          this.setState("closed");
          reject(error ?? new Error(`Realtime channel ${status}`));
          return;
        }

        if (status === "CLOSED") this.setState("closed");
      });
    });
  }

  async disconnect(): Promise<void> {
    try {
      await this.channel?.untrack();
      await this.channel?.unsubscribe();
    } catch (error) {
      logger.debug("relay disconnect", error);
    } finally {
      this.channel = null;
      this.client = null;
      this.context = null;
      this.signalHandlers.clear();
      this.setState("closed");
      this.bus.clear();
    }
  }

  publishPosition(position: LivePosition): void {
    // Fire and forget: a dropped position is corrected by the next one a second
    // later, so waiting on an ack would add latency for no benefit.
    void this.channel?.send({ type: "broadcast", event: POSITION_EVENT, payload: position });
  }

  sendMessage(message: RideMessage): void {
    void this.channel?.send({ type: "broadcast", event: MESSAGE_EVENT, payload: message });
  }

  /**
   * Signalling channel for `P2PTransport`.
   *
   * Exposed here because the relay is already an authenticated, membership-
   * scoped fan-out to exactly the riders in this group — which is precisely
   * what SDP and ICE exchange needs.
   */
  asSignalingChannel(): SignalingChannel {
    return {
      send: (to, signal) => {
        if (!this.context) return;
        void this.channel?.send({
          type: "broadcast",
          event: SIGNAL_EVENT,
          payload: { from: this.context.userId, to, signal } satisfies SignalEnvelope,
        });
      },
      onSignal: (handler) => {
        this.signalHandlers.add(handler);
        return () => this.signalHandlers.delete(handler);
      },
    };
  }

  /** Fetches a channel credential and applies it to the socket. */
  private async authorize(): Promise<void> {
    const response = await fetch("/api/realtime/token", { method: "POST" });
    if (!response.ok) {
      throw new Error(
        response.status === 503
          ? "Group rides are not configured on this deployment."
          : "Could not authorize the group ride channel.",
      );
    }

    const { token } = (await response.json()) as { token: string };
    await this.client?.realtime.setAuth(token);
  }

  private emitPresence(): void {
    const raw = this.channel?.presenceState() ?? {};

    const riders: RidePresence[] = Object.values(raw)
      .flat()
      .flatMap((entry) => {
        const candidate = entry as Partial<RidePresence>;
        if (typeof candidate.userId !== "string" || typeof candidate.nickname !== "string") {
          return [];
        }
        return [
          {
            userId: candidate.userId,
            nickname: candidate.nickname,
            onlineAt: candidate.onlineAt ?? Date.now(),
          },
        ];
      });

    this.bus.emit("presence", riders);
  }

  private setState(state: TransportState): void {
    if (this.currentState === state) return;
    this.currentState = state;
    this.bus.emit("state", state);
  }
}

// Broadcast payloads arrive as untyped JSON from other clients and must be
// validated before reaching the UI.
function isLivePosition(value: unknown): value is LivePosition {
  const p = value as Partial<LivePosition> | null;
  return (
    !!p &&
    typeof p.userId === "string" &&
    typeof p.lat === "number" &&
    typeof p.lon === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lon) &&
    typeof p.seq === "number"
  );
}

function isRideMessage(value: unknown): value is RideMessage {
  const m = value as Partial<RideMessage> | null;
  return (
    !!m &&
    typeof m.id === "string" &&
    typeof m.userId === "string" &&
    typeof m.body === "string" &&
    (m.kind === "chat" || m.kind === "status") &&
    typeof m.seq === "number"
  );
}
