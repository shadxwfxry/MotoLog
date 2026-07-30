"use client";

import { useEffect, useRef } from "react";
import { logger } from "@/shared/lib/logger";

/**
 * Keeps the screen awake while recording.
 *
 * Without this the phone sleeps mid-ride and the browser throttles or suspends
 * `watchPosition`, leaving a track with a hole in it. The Wake Lock API is not
 * universally available and the lock is released automatically whenever the tab
 * is hidden, so it is re-acquired on visibility change.
 */
export function useWakeLock(active: boolean): void {
  const sentinel = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        sentinel.current = await navigator.wakeLock.request("screen");
      } catch (error) {
        // Rejected when the document is not focused or the battery is critical.
        // Recording still works; the screen simply may sleep.
        logger.debug("wake lock unavailable", error);
      }
    };

    const handleVisibility = () => {
      if (!cancelled && document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      void sentinel.current?.release().catch(() => {});
      sentinel.current = null;
    };
  }, [active]);
}
