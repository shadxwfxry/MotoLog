/**
 * Transport abstraction for live group-ride data.
 *
 * Two implementations sit behind this: `RelayTransport` over Supabase Realtime,
 * which always works, and `P2PTransport` over WebRTC DataChannels, which works
 * between riders whose networks allow it. `HybridTransport` composes them.
 *
 * Only live position and chat travel over this. Refuels, maintenance and
 * statistics go through server actions and Postgres — they need durability and
 * authorization, which a peer connection cannot provide.
 */

export type TransportState =
  | "idle"
  | "connecting"
  | "connected"
  /** Reachable, but not by the preferred path — e.g. P2P failed, relay carries. */
  | "degraded"
  | "closed";

export interface RideChannelContext {
  groupId: string;
  /** Stable id of the local rider; also the presence key. */
  userId: string;
  nickname: string;
}

export interface LivePosition {
  userId: string;
  nickname: string;
  lat: number;
  lon: number;
  speedKph: number | null;
  headingDeg: number | null;
  /** Epoch ms when the fix was taken, not when it was sent. */
  t: number;
  /**
   * Monotonic per-sender counter. With both relay and P2P delivering the same
   * update, the receiver keeps the first arrival and drops the duplicate.
   */
  seq: number;
}

export type RideMessageKind = "chat" | "status";

/** Preset statuses; free text goes through `chat`. */
export const RIDE_STATUSES = ["need-stop", "fuel", "ok", "slow-down", "emergency"] as const;
export type RideStatusCode = (typeof RIDE_STATUSES)[number];

export interface RideMessage {
  id: string;
  userId: string;
  nickname: string;
  kind: RideMessageKind;
  /** Free text for `chat`; a RideStatusCode for `status`. */
  body: string;
  t: number;
  seq: number;
}

export interface RidePresence {
  userId: string;
  nickname: string;
  onlineAt: number;
}

export interface TransportEvents {
  position: LivePosition;
  message: RideMessage;
  presence: RidePresence[];
  state: TransportState;
}

export type TransportEvent = keyof TransportEvents;
export type Handler<E extends TransportEvent> = (payload: TransportEvents[E]) => void;
export type Unsubscribe = () => void;

export interface ITransportProvider {
  readonly name: string;
  readonly state: TransportState;

  connect(context: RideChannelContext): Promise<void>;
  disconnect(): Promise<void>;

  publishPosition(position: LivePosition): void;
  sendMessage(message: RideMessage): void;

  on<E extends TransportEvent>(event: E, handler: Handler<E>): Unsubscribe;
}

/**
 * Event fan-out shared by the transports.
 *
 * A throwing handler must not prevent the other subscribers from being called,
 * nor take down the connection that delivered the event.
 */
export class EventBus {
  private handlers = new Map<TransportEvent, Set<(payload: never) => void>>();

  on<E extends TransportEvent>(event: E, handler: Handler<E>): Unsubscribe {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as (payload: never) => void);
    this.handlers.set(event, set);

    return () => {
      set.delete(handler as (payload: never) => void);
    };
  }

  emit<E extends TransportEvent>(event: E, payload: TransportEvents[E]): void {
    const set = this.handlers.get(event);
    if (!set) return;

    // Copy first: a handler may unsubscribe itself while we iterate.
    for (const handler of [...set]) {
      try {
        (handler as Handler<E>)(payload);
      } catch {
        // Swallowed deliberately — see the class comment.
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
