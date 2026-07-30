"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import dynamicImport from "next/dynamic";
import { useRouter } from "next/navigation";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { decodePolyline } from "@/features/trips/polyline";
import { deleteTrip } from "@/features/trips/actions";
import type { GeoFix } from "@/features/trips/geo";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatSpeed,
  type FormatPrefs,
} from "@/shared/lib/format";

const RouteMap = dynamicImport(() => import("@/features/trips/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

interface Trip {
  id: string;
  title: string | null;
  vehicleName: string;
  startedAt: string;
  distanceM: number;
  durationS: number;
  avgSpeedKph: number | null;
  maxSpeedKph: number | null;
  maxLeanAngleDeg: number | null;
  trackEncoded: string | null;
  samples: { t: number[]; speed: number[] } | null;
}

export function TripDetailClient({ trip, prefs }: { trip: Trip; prefs: FormatPrefs }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decoding a few thousand points is cheap but not free; do it once.
  const track: GeoFix[] = useMemo(() => {
    if (!trip.trackEncoded) return [];
    return decodePolyline(trip.trackEncoded).map((p, i) => ({
      lat: p.lat,
      lon: p.lon,
      t: (trip.samples?.t[i] ?? i) * 1000,
    }));
  }, [trip.trackEncoded, trip.samples]);

  const speedSeries = useMemo(() => {
    if (!trip.samples) return [];
    return trip.samples.t.map((seconds, i) => ({
      t: seconds,
      speed: trip.samples?.speed[i] ?? 0,
    }));
  }, [trip.samples]);

  const handleDelete = async () => {
    if (!confirm("Delete this ride? This cannot be undone.")) return;
    setDeleting(true);

    const result = await deleteTrip(trip.id);
    if (!result.ok) {
      setError(result.error);
      setDeleting(false);
      return;
    }

    router.push("/rides");
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/rides" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {trip.title || "Ride"}
          </h1>
          <p suppressHydrationWarning className="text-xs text-muted-foreground">
            {trip.vehicleName} · {formatDate(trip.startedAt, prefs)}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {track.length >= 2 && (
        <div className="h-72 sm:h-96 rounded-2xl overflow-hidden border border-border">
          <RouteMap track={track} />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="Distance" value={formatDistance(trip.distanceM / 1000, prefs, 1)} accent />
        <Metric label="Duration" value={formatDuration(trip.durationS)} />
        <Metric label="Avg speed" value={formatSpeed(trip.avgSpeedKph, prefs)} />
        <Metric label="Top speed" value={formatSpeed(trip.maxSpeedKph, prefs)} />
      </div>

      {/* Lean is shown only when the recording device actually reported it. */}
      {trip.maxLeanAngleDeg !== null && (
        <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground">Max lean angle</span>
          <span className="text-2xl font-black text-primary">
            {Math.round(trip.maxLeanAngleDeg)}°
          </span>
        </div>
      )}

      {speedSeries.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">
            📈 Speed
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedSeries}>
                <defs>
                  <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="t"
                  tickFormatter={(v: number) => formatDuration(v)}
                  stroke="currentColor"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="currentColor" fontSize={10} tickLine={false} width={34} />
                <Tooltip
                  formatter={(value: number) => formatSpeed(value, prefs)}
                  labelFormatter={(v: number) => formatDuration(v)}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="speed"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#speedFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "🗑 Delete ride"}
      </button>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 text-center ${
        accent ? "border-primary/30 bg-primary/10" : "border-border bg-card"
      }`}
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
        {label}
      </p>
      <p className={`text-xl font-black ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
