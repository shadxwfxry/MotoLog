"use client";

import { useEffect, useRef } from "react";
import { useRideStore } from "@/store/rideStore";
import { DEFAULT_FILTER, haversineM, speedBetweenKph, type GeoFix } from "../geo";

/**
 * Feeds the ride store from the Geolocation API.
 *
 * Fixes are filtered here, as they arrive, rather than at the end: the same
 * rules as `filterFixes` but applied incrementally, so what is persisted is
 * already clean and a mid-ride reload resumes from good data.
 *
 * Geolocation requires a secure context — on a phone this means HTTPS, so
 * testing needs a tunnel or a deploy, not a LAN IP.
 */
export function useGeoTracker(): void {
  const status = useRideStore((s) => s.status);
  const addFix = useRideStore((s) => s.addFix);
  const setError = useRideStore((s) => s.setError);

  // Held in a ref rather than read from the store so the watch callback does
  // not need to re-subscribe on every fix.
  const lastFix = useRef<GeoFix | null>(null);

  useEffect(() => {
    if (status !== "recording") {
      lastFix.current = null;
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This device has no geolocation support.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const fix: GeoFix = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          t: position.timestamp,
          accuracyM: position.coords.accuracy,
          speedMps: position.coords.speed,
          altitudeM: position.coords.altitude,
          headingDeg: position.coords.heading,
        };

        if (!Number.isFinite(fix.lat) || !Number.isFinite(fix.lon)) return;
        if (fix.accuracyM != null && fix.accuracyM > DEFAULT_FILTER.maxAccuracyM) return;

        const previous = lastFix.current;
        if (previous) {
          if (fix.t <= previous.t) return;
          if (haversineM(previous, fix) < DEFAULT_FILTER.minStepM) return;

          const kph = speedBetweenKph(previous, fix);
          if (kph !== null && kph > DEFAULT_FILTER.maxSpeedKph) return;
        }

        lastFix.current = fix;
        setError(null);
        addFix(fix);
      },
      (error) => {
        setError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Enable it to record rides."
            : "Waiting for a GPS signal…",
        );
      },
      {
        enableHighAccuracy: true,
        // Never serve a cached position: a stale fix would register as a jump.
        maximumAge: 0,
        timeout: 30_000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [status, addFix, setError]);
}
