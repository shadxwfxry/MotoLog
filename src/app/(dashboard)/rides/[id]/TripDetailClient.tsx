"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import dynamicImport from "next/dynamic";
import { useRouter } from "next/navigation";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ChevronLeft, Compass, Trash2 } from "lucide-react";
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
import { Panel, PanelTitle, PageShell, StatTile } from "@/shared/ui";
import { useLanguage } from "@/components/LanguageProvider";

const RouteMap = dynamicImport(() => import("@/features/trips/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
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
  const { t } = useLanguage();
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
    <PageShell>
      <div className="space-y-5">
        <Link
          href="/rides"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft size={14} strokeWidth={2.8} />
          {t("rides")}
        </Link>

        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
            {trip.title || t("ride")}
          </h1>
          <p
            suppressHydrationWarning
            className="num mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            {trip.vehicleName} · {formatDate(trip.startedAt, prefs)}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}

      {track.length >= 2 && (
        <Panel padding="none" className="overflow-hidden">
          <div className="h-72 w-full sm:h-[26rem]">
            <RouteMap track={track} />
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatTile
          tone="primary"
          label={t("distance")}
          value={formatDistance(trip.distanceM / 1000, prefs, 1)}
        />
        <StatTile label={t("duration")} value={formatDuration(trip.durationS)} />
        <StatTile tone="cyan" label={t("avg_speed")} value={formatSpeed(trip.avgSpeedKph, prefs)} />
        <StatTile tone="lime" label={t("top_speed")} value={formatSpeed(trip.maxSpeedKph, prefs)} />
      </div>

      {/* Lean is shown only when the recording device actually reported it. */}
      {trip.maxLeanAngleDeg !== null && (
        <Panel className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2.5 text-sm font-semibold text-muted-foreground">
            <Compass size={16} strokeWidth={2.4} className="text-signal-violet" />
            {t("max_lean")}
          </span>
          <span className="num text-3xl font-black text-signal-violet">
            {Math.round(trip.maxLeanAngleDeg)}°
          </span>
        </Panel>
      )}

      {speedSeries.length > 1 && (
        <Panel>
          <PanelTitle icon={<Activity size={13} strokeWidth={2.6} />}>{t("speed_profile")}</PanelTitle>

          {/* `text-primary` + `currentColor` below is deliberate: recharts writes
              these straight onto SVG attributes, where `var(--primary)` would
              not resolve. Inheriting the colour keeps the chart on whatever
              accent the user has chosen. */}
          <div className="h-56 text-primary">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="t"
                  tickFormatter={(v: number) => formatDuration(v)}
                  stroke="hsl(215 18% 65%)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(215 18% 65%)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={34}
                />
                <Tooltip
                  formatter={(value: number) => formatSpeed(value, prefs)}
                  labelFormatter={(v: number) => formatDuration(v)}
                  cursor={{ stroke: "currentColor", strokeOpacity: 0.4 }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                    boxShadow: "0 20px 40px -20px rgb(0 0 0 / 0.8)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="speed"
                  stroke="currentColor"
                  strokeWidth={2}
                  fill="url(#speedFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="btn h-12 w-full border border-destructive/25 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
      >
        <Trash2 size={15} strokeWidth={2.4} />
        {deleting ? `${t("loading")}…` : t("delete_ride")}
      </button>
    </PageShell>
  );
}
