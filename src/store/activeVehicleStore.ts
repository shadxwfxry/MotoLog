"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActiveVehicleState {
  activeVehicleId: string | null;
  setActiveVehicle: (id: string | null) => void;
  /**
   * Resolves the active vehicle against the ids the user actually owns,
   * falling back to the first one. Guards against a stale id left in storage
   * after a bike is deleted or the user signs into a different account.
   */
  resolveActiveId: (availableIds: readonly string[]) => string | null;
}

/**
 * Which bike the user is currently working with.
 *
 * The home screen used to assume `vehicles[0]`, so the "Active Ride" widget
 * silently changed bike whenever the ordering changed and could not be chosen
 * by the user. This is client-only, ephemeral UI state — exactly what Zustand
 * is for — while the vehicle list itself stays server-rendered.
 */
export const useActiveVehicleStore = create<ActiveVehicleState>()(
  persist(
    (set, get) => ({
      activeVehicleId: null,

      setActiveVehicle: (id) => set({ activeVehicleId: id }),

      resolveActiveId: (availableIds) => {
        if (availableIds.length === 0) return null;
        const current = get().activeVehicleId;
        return current && availableIds.includes(current) ? current : availableIds[0];
      },
    }),
    { name: "motolog:active-vehicle" },
  ),
);
