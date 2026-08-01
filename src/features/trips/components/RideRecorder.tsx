"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Bike, Pause, Play, Square, Trash2, AlertTriangle } from "lucide-react";
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
import { Badge, EmptyState, Panel } from "@/shared/ui";
import { useLanguage } from "@/components/LanguageProvider";

// MapLibre touches `window` at import time, so it must never run on the server.
const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
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
  const { t } = useLanguage();
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
      <EmptyState
        icon={<Bike size={44} strokeWidth={1.5} />}
        title={t("no_bike_title")}
        description={t("no_bike_desc")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Live map with the readouts laid over it, cockpit-style ── */}
      {/* No HUD brackets here: they land on top of MapLibre's own controls and
          attribution, which have to stay legible. */}
      <Panel padding="none" className="overflow-hidden">
        <div className="relative h-72 w-full sm:h-96">
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

          {/* Recording state, top-left, always visible over the map. */}
          <div className="pointer-events-none absolute left-4 top-4">
            {status === "idle" ? (
              <Badge tone="default" className="glass">
                {t("standby")}
              </Badge>
            ) : (
              <Badge tone={recording ? "rose" : "amber"} dot pulse={recording} className="glass">
                {recording ? t("recording") : t("paused")}
              </Badge>
            )}
          </div>

          {/* The speed readout floats over the map so the rider's eye has one
              place to go — the number is the point of this screen. */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/80 to-transparent p-5 pt-14">
            <p className="label-micro">{t("speed")}</p>
            <p className="num text-6xl font-black leading-none text-primary text-glow sm:text-7xl">
              {Math.round(currentSpeed)}
              <span className="ml-2 text-lg font-bold text-muted-foreground">
                {prefs.unitSystem === "imperial" ? "mph" : "km/h"}
              </span>
            </p>
          </div>
        </div>
      </Panel>

      {geoError && <Notice tone="amber">{geoError}</Notice>}
      {saveError && <Notice tone="rose">{saveError}</Notice>}

      {/* ── Secondary figures ── */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label={t("distance")} value={formatDistance(stats.distanceM / 1000, prefs, 1)} />
        <Metric label={t("duration")} value={formatDuration(stats.durationS)} />
        {/* Hidden entirely when the device has no orientation sensor, rather
            than showing a gauge stuck at zero. */}
        {lean.supported ? (
          <Metric label="Lean" value={`${Math.round(lean.angleDeg ?? 0)}°`} />
        ) : (
          <Metric label={t("top_speed")} value={formatSpeed(stats.maxSpeedKph, prefs)} />
        )}
      </div>

      {/* ── Controls ── */}
      {status === "idle" ? (
        <div className="space-y-3">
          <label className="label-micro block" htmlFor="ride-vehicle">
            {t("vehicle")}
          </label>
          <select
            id="ride-vehicle"
            value={vehicleId ?? ""}
            onChange={(e) => setVehicleId(e.target.value)}
            className="field cursor-pointer appearance-none"
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
            className="btn-primary h-16 w-full animate-pulse-ring text-base"
          >
            <Play size={20} strokeWidth={3} fill="currentColor" />
            {t("start_ride")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={recording ? pause : resume} className="btn-ghost h-16 text-sm">
            {recording ? (
              <>
                <Pause size={18} strokeWidth={3} fill="currentColor" />
                {t("pause_ride")}
              </>
            ) : (
              <>
                <Play size={18} strokeWidth={3} fill="currentColor" />
                {t("resume_ride")}
              </>
            )}
          </button>

          <button onClick={handleFinish} disabled={saving} className="btn-primary h-16 text-sm">
            <Square size={16} strokeWidth={3} fill="currentColor" />
            {saving ? `${t("loading")}…` : t("finish_ride")}
          </button>

          <button
            onClick={handleDiscard}
            className="btn col-span-2 h-11 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} strokeWidth={2.4} />
            {t("discard_ride")}
          </button>
        </div>
      )}
    </div>
  );
}

function Notice({ tone, children }: { tone: "amber" | "rose"; children: React.ReactNode }) {
  return (
    <p
      className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-xs font-semibold ${
        tone === "amber"
          ? "border-signal-amber/30 bg-signal-amber/10 text-signal-amber"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
    >
      <AlertTriangle size={14} strokeWidth={2.6} className="mt-px shrink-0" />
      {children}
    </p>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Panel padding="none" className="p-4 text-center">
      <p className="label-micro">{label}</p>
      <p className="num mt-1 text-xl font-black">{value}</p>
    </Panel>
  );
}
