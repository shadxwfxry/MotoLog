"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRideStore } from "@/store/rideStore";
import { useActiveVehicleStore } from "@/store/activeVehicleStore";
import { useGeoTracker } from "../hooks/useGeoTracker";
import { useLeanAngle } from "../hooks/useLeanAngle";
import { useWakeLock } from "../hooks/useWakeLock";
import { calcTripStats } from "../geo";
import { encodePolyline } from "../polyline";
import { saveTrip } from "../actions";
import {
  formatDistance,
  formatDuration,
  formatSpeed,
  type FormatPrefs,
} from "@/shared/lib/format";

// MapLibre touches `window` at import time, so it must never run on the server.
const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-2xl" />,
});

interface VehicleOption {
  id: string;
  make: string;
  model: string;
}

interface Props {
  vehicles: VehicleOption[];
  prefs: FormatPrefs;
}

export function RideRecorder({ vehicles, prefs }: Props) {
  const router = useRouter();

  const status = useRideStore((s) => s.status);
  const fixes = useRideStore((s) => s.fixes);
  const startedAt = useRideStore((s) => s.startedAt);
  const storedVehicleId = useRideStore((s) => s.vehicleId);
  const maxLeanFromStore = useRideStore((s) => s.maxLeanAngleDeg);
  const geoError = useRideStore((s) => s.error);
  const { start, pause, resume, reset, setMaxLean } = useRideStore();

  const resolveActiveId = useActiveVehicleStore((s) => s.resolveActiveId);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Zustand rehydrates from localStorage after the first paint, so the initial
  // server and client renders must agree — pick the vehicle in an effect.
  useEffect(() => {
    setVehicleId(storedVehicleId ?? resolveActiveId(vehicles.map((v) => v.id)));
  }, [storedVehicleId, resolveActiveId, vehicles]);

  const recording = status === "recording";
  useGeoTracker();
  useWakeLock(recording || status === "paused");

  const lean = useLeanAngle(recording);
  useEffect(() => {
    if (lean.maxAngleDeg > 0) setMaxLean(lean.maxAngleDeg);
  }, [lean.maxAngleDeg, setMaxLean]);

  const stats = useMemo(() => calcTripStats(fixes), [fixes]);
  const currentSpeed = stats.speedsKph.at(-1) ?? 0;

  const handleStart = async () => {
    if (!vehicleId) return;
    // Must be requested from this click; iOS rejects it otherwise.
    await lean.request();
    lean.reset();
    start(vehicleId);
  };

  const handleFinish = async () => {
    if (!vehicleId || !startedAt) return;

    // A ride with one fix has no route, distance or duration worth keeping.
    if (fixes.length < 2) {
      reset();
      return;
    }

    setSaving(true);
    setSaveError(null);

    const result = await saveTrip({
      vehicleId,
      startedAt: new Date(startedAt),
      endedAt: new Date(fixes[fixes.length - 1].t),
      distanceM: Math.round(stats.distanceM),
      durationS: Math.round(stats.durationS),
      avgSpeedKph: stats.avgSpeedKph,
      maxSpeedKph: stats.maxSpeedKph,
      maxLeanAngleDeg: maxLeanFromStore > 0 ? maxLeanFromStore : null,
      trackEncoded: encodePolyline(fixes),
      samples: {
        t: fixes.map((f) => Math.round((f.t - startedAt) / 1000)),
        speed: stats.speedsKph.map((s) => Math.round(s * 10) / 10),
        ...(lean.supported ? { lean: fixes.map(() => null) } : {}),
      },
    });

    setSaving(false);

    if (!result.ok) {
      // The recorded track stays in the store, so the rider can retry rather
      // than losing the ride they just finished.
      setSaveError(result.error);
      return;
    }

    reset();
    router.push(`/rides/${result.data.id}`);
  };

  const handleDiscard = () => {
    if (!confirm("Discard this ride? The recorded track will be lost.")) return;
    reset();
    setSaveError(null);
  };

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 rounded-3xl border-2 border-dashed border-border/50">
        <div className="text-5xl mb-4 opacity-20">🏍️</div>
        <p className="text-sm text-muted-foreground">Add a vehicle before recording a ride.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Live map ── */}
      <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-border">
        <RouteMap
          track={fixes}
          markers={
            fixes.length > 0
              ? [
                  {
                    id: "self",
                    lat: fixes[fixes.length - 1].lat,
                    lon: fixes[fixes.length - 1].lon,
                    label: "You",
                    sublabel: formatSpeed(currentSpeed, prefs),
                    isSelf: true,
                  },
                ]
              : []
          }
          followMarkerId={recording ? "self" : null}
        />
      </div>

      {geoError && (
        <p className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
          {geoError}
        </p>
      )}
      {saveError && (
        <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">
          {saveError}
        </p>
      )}

      {/* ── Live figures ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="Speed" value={formatSpeed(currentSpeed, prefs)} big />
        <Metric label="Distance" value={formatDistance(stats.distanceM / 1000, prefs, 1)} />
        <Metric label="Time" value={formatDuration(stats.durationS)} />
        {/* Hidden entirely when the device has no orientation sensor, rather
            than showing a gauge stuck at zero. */}
        {lean.supported ? (
          <Metric label="Lean" value={`${Math.round(lean.angleDeg ?? 0)}°`} />
        ) : (
          <Metric label="Top speed" value={formatSpeed(stats.maxSpeedKph, prefs)} />
        )}
      </div>

      {/* ── Controls ── */}
      {status === "idle" ? (
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
            Vehicle
          </label>
          <select
            value={vehicleId ?? ""}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full bg-muted border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model}
              </option>
            ))}
          </select>

          <button
            onClick={handleStart}
            disabled={!vehicleId}
            className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-lg shadow-lg shadow-primary/20 active:scale-95 transition disabled:opacity-50"
          >
            ▶ Start ride
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={recording ? pause : resume}
            className="h-16 rounded-2xl bg-muted border border-border font-black uppercase tracking-widest active:scale-95 transition"
          >
            {recording ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="h-16 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "⏹ Finish"}
          </button>
          <button
            onClick={handleDiscard}
            className="col-span-2 h-11 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition"
          >
            Discard ride
          </button>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
        {label}
      </p>
      <p className={`font-black ${big ? "text-3xl text-primary" : "text-xl"}`}>{value}</p>
    </div>
  );
}
