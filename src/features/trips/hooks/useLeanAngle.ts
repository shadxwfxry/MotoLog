"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lean angle from the device's orientation sensor.
 *
 * Browser support is genuinely limited and this must degrade gracefully:
 * - iOS 13+ requires `DeviceOrientationEvent.requestPermission()`, and it must
 *   be called from a user gesture — hence the explicit `request()` rather than
 *   asking on mount.
 * - The API requires a secure context (HTTPS or localhost).
 * - Desktop browsers and many Android devices fire nothing at all, so a
 *   listener that never fires must not look like "0 degrees of lean".
 *
 * `supported` stays false until a real reading arrives, so callers hide the
 * lean UI entirely instead of showing a permanently-zero gauge.
 */

type PermissionState = "unknown" | "prompt" | "granted" | "denied" | "unavailable";

interface DeviceOrientationEventWithPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export interface LeanAngleState {
  /** True once at least one orientation reading has arrived. */
  supported: boolean;
  permission: PermissionState;
  /** Absolute lean in degrees, or null when unavailable. */
  angleDeg: number | null;
  maxAngleDeg: number;
  /** Must be called from a user gesture; iOS ignores it otherwise. */
  request: () => Promise<boolean>;
  reset: () => void;
}

export function useLeanAngle(enabled: boolean): LeanAngleState {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [angleDeg, setAngleDeg] = useState<number | null>(null);
  const [maxAngleDeg, setMaxAngleDeg] = useState(0);
  const listening = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("DeviceOrientationEvent" in window)) {
      setPermission("unavailable");
      return;
    }
    // iOS exposes requestPermission; elsewhere the events just flow.
    const ctor = window.DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;
    setPermission(typeof ctor?.requestPermission === "function" ? "prompt" : "granted");
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // `gamma` is the left-right tilt, which is the bike's roll when the phone
    // is mounted upright in portrait. It is null on devices without the sensor.
    if (event.gamma === null || event.gamma === undefined) return;

    setSupported(true);

    const lean = Math.abs(event.gamma);
    setAngleDeg(lean);
    setMaxAngleDeg((current) => (lean > current ? lean : current));
  }, []);

  useEffect(() => {
    if (!enabled || permission !== "granted" || typeof window === "undefined") return;

    window.addEventListener("deviceorientation", handleOrientation);
    listening.current = true;

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      listening.current = false;
    };
  }, [enabled, permission, handleOrientation]);

  const request = useCallback(async () => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setPermission("unavailable");
      return false;
    }

    const ctor = window.DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;
    if (typeof ctor.requestPermission !== "function") {
      setPermission("granted");
      return true;
    }

    try {
      const result = await ctor.requestPermission();
      setPermission(result === "granted" ? "granted" : "denied");
      return result === "granted";
    } catch {
      // Thrown when not called from a user gesture.
      setPermission("denied");
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setAngleDeg(null);
    setMaxAngleDeg(0);
  }, []);

  return { supported, permission, angleDeg, maxAngleDeg, request, reset };
}
