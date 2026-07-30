"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GeoFix } from "@/features/trips/geo";

export type RideStatus = "idle" | "recording" | "paused";

interface RideState {
  status: RideStatus;
  vehicleId: string | null;
  startedAt: number | null;
  /** Filtered fixes accumulated so far. */
  fixes: GeoFix[];
  maxLeanAngleDeg: number;
  /** Set when the browser denies or loses geolocation. */
  error: string | null;

  start: (vehicleId: string, now?: number) => void;
  pause: () => void;
  resume: () => void;
  addFix: (fix: GeoFix) => void;
  setMaxLean: (deg: number) => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

/**
 * The in-progress ride.
 *
 * Persisted to localStorage on every fix so a reload, a crash, or the browser
 * evicting the tab mid-ride does not lose the track — a rider will not notice
 * until they stop, by which point re-recording is impossible.
 *
 * This is exactly the ephemeral client state Zustand is for; the finished trip
 * is written to Postgres through a server action and read back via RSC.
 */
export const useRideStore = create<RideState>()(
  persist(
    (set) => ({
      status: "idle",
      vehicleId: null,
      startedAt: null,
      fixes: [],
      maxLeanAngleDeg: 0,
      error: null,

      start: (vehicleId, now = Date.now()) =>
        set({
          status: "recording",
          vehicleId,
          startedAt: now,
          fixes: [],
          maxLeanAngleDeg: 0,
          error: null,
        }),

      pause: () => set((s) => (s.status === "recording" ? { status: "paused" } : s)),

      resume: () => set((s) => (s.status === "paused" ? { status: "recording" } : s)),

      // Fixes are appended only while recording, so a paused rider sitting at a
      // cafe does not accumulate GPS drift into their distance.
      addFix: (fix) =>
        set((s) => (s.status === "recording" ? { fixes: [...s.fixes, fix] } : s)),

      setMaxLean: (deg) => set((s) => (deg > s.maxLeanAngleDeg ? { maxLeanAngleDeg: deg } : s)),

      setError: (error) => set({ error }),

      reset: () =>
        set({
          status: "idle",
          vehicleId: null,
          startedAt: null,
          fixes: [],
          maxLeanAngleDeg: 0,
          error: null,
        }),
    }),
    {
      name: "motolog:active-ride",
      storage: createJSONStorage(() => localStorage),
      // `error` is a transient UI concern and must not survive a reload.
      partialize: ({ status, vehicleId, startedAt, fixes, maxLeanAngleDeg }) => ({
        status,
        vehicleId,
        startedAt,
        fixes,
        maxLeanAngleDeg,
      }),
    },
  ),
);
