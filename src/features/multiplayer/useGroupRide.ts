"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HybridTransport } from "./transport/HybridTransport";
import { RelayTransport } from "./transport/RelayTransport";
import { P2PTransport } from "./transport/P2PTransport";
import { SequenceGenerator } from "./transport/dedupe";
import type {
  ITransportProvider,
  LivePosition,
  RideMessage,
  RidePresence,
  RideStatusCode,
  TransportState,
} from "./transport/types";
import { logger } from "@/shared/lib/logger";

/** Positions are published at most this often, whatever the GPS fix rate. */
const PUBLISH_INTERVAL_MS = 1000;
const MAX_CHAT_HISTORY = 50;

export interface GroupRideState {
  state: TransportState;
  riders: RidePresence[];
  positions: Map<string, LivePosition>;
  messages: RideMessage[];
  error: string | null;
  publish: (fix: { lat: number; lon: number; speedKph: number | null; t: number }) => void;
  sendChat: (body: string) => void;
  sendStatus: (status: RideStatusCode) => void;
}

interface Options {
  groupId: string | null;
  userId: string;
  nickname: string;
  /** Feature flag; when false no connection is attempted at all. */
  enabled: boolean;
}

export function useGroupRide({ groupId, userId, nickname, enabled }: Options): GroupRideState {
  const [state, setState] = useState<TransportState>("idle");
  const [riders, setRiders] = useState<RidePresence[]>([]);
  const [positions, setPositions] = useState<Map<string, LivePosition>>(new Map());
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const transport = useRef<ITransportProvider | null>(null);
  const sequence = useRef(new SequenceGenerator());
  const lastPublish = useRef(0);

  useEffect(() => {
    if (!enabled || !groupId) return;

    const relay = new RelayTransport();

    // P2P is opt-in and layered on top; the relay carries everything either
    // way, so turning the flag off changes latency, never correctness.
    const p2pEnabled = process.env.NEXT_PUBLIC_FEATURE_P2P === "true";
    const p2p = p2pEnabled ? new P2PTransport(relay.asSignalingChannel()) : null;

    const hybrid = new HybridTransport(relay, p2p);
    transport.current = hybrid;

    const unsubscribers = [
      hybrid.on("state", setState),
      hybrid.on("presence", (list) => {
        setRiders(list);
        // Drop the map entry for anyone who left, so a stale marker does not
        // linger on the map after a rider goes home.
        const present = new Set(list.map((r) => r.userId));
        setPositions((current) => {
          const next = new Map(current);
          for (const id of next.keys()) if (!present.has(id)) next.delete(id);
          return next;
        });
      }),
      hybrid.on("position", (position) => {
        setPositions((current) => new Map(current).set(position.userId, position));
      }),
      hybrid.on("message", (message) => {
        setMessages((current) => [...current, message].slice(-MAX_CHAT_HISTORY));
      }),
    ];

    hybrid.connect({ groupId, userId, nickname }).catch((cause) => {
      logger.warn("group ride connection failed", cause);
      setError(cause instanceof Error ? cause.message : "Could not join the group ride.");
    });

    return () => {
      for (const off of unsubscribers) off();
      void hybrid.disconnect();
      transport.current = null;
      setPositions(new Map());
      setRiders([]);
    };
  }, [enabled, groupId, userId, nickname]);

  const publish = useCallback(
    (fix: { lat: number; lon: number; speedKph: number | null; t: number }) => {
      const now = Date.now();
      // GPS can fire several times a second; the group does not need that, and
      // it would burn through the channel's rate limit.
      if (now - lastPublish.current < PUBLISH_INTERVAL_MS) return;
      lastPublish.current = now;

      transport.current?.publishPosition({
        userId,
        nickname,
        lat: fix.lat,
        lon: fix.lon,
        speedKph: fix.speedKph,
        headingDeg: null,
        t: fix.t,
        seq: sequence.current.next(),
      });
    },
    [userId, nickname],
  );

  const emit = useCallback(
    (kind: "chat" | "status", body: string) => {
      const message: RideMessage = {
        id: `${userId}-${Date.now()}`,
        userId,
        nickname,
        kind,
        body,
        t: Date.now(),
        seq: sequence.current.next(),
      };

      transport.current?.sendMessage(message);
      // Applied locally too: the channel is configured with `self: false`, so
      // the sender never receives their own broadcast back.
      setMessages((current) => [...current, message].slice(-MAX_CHAT_HISTORY));
    },
    [userId, nickname],
  );

  const sendChat = useCallback(
    (body: string) => {
      const trimmed = body.trim().slice(0, 200);
      if (trimmed) emit("chat", trimmed);
    },
    [emit],
  );

  const sendStatus = useCallback((status: RideStatusCode) => emit("status", status), [emit]);

  return { state, riders, positions, messages, error, publish, sendChat, sendStatus };
}
