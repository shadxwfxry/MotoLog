"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, History, Radio, Route, Users } from "lucide-react";
import { RideRecorder } from "@/features/trips/components/RideRecorder";
import { useLanguage } from "@/components/LanguageProvider";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatSpeed,
  type FormatPrefs,
} from "@/shared/lib/format";
import { EmptyState, MiniStat, Panel, PageHeader, PageShell } from "@/shared/ui";
import { cn } from "@/lib/utils";

interface TripSummary {
  id: string;
  vehicleId: string;
  title: string | null;
  startedAt: string;
  distanceM: number;
  durationS: number;
  avgSpeedKph: number | null;
  maxSpeedKph: number | null;
}

interface Props {
  vehicles: { id: string; make: string; model: string }[];
  trips: TripSummary[];
  prefs: FormatPrefs;
}

export function RidesClient({ vehicles, trips, prefs }: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"record" | "history">("record");

  const vehicleName = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.make} ${v.model}` : "—";
  };

  const tabs = [
    { value: "record", label: t("record_ride"), Icon: Radio },
    { value: "history", label: `${t("ride_history")} · ${trips.length}`, Icon: History },
  ] as const;

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("telemetry")}
        title={t("rides")}
        action={
          <Link href="/rides/group" className="btn-ghost h-11 px-5">
            <Users size={15} strokeWidth={2.6} />
            {t("group_ride")}
          </Link>
        }
      />

      {/* Segmented control: a single framed track with a sliding active state,
          rather than two buttons that happen to sit next to each other. */}
      <div className="flex rounded-lg border p-1 [border-color:hsl(var(--hairline))]">
        {tabs.map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-all duration-300",
              tab === value
                ? "bg-primary text-primary-foreground shadow-[0_6px_18px_-8px_hsl(var(--primary))]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={14} strokeWidth={2.6} />
            {label}
          </button>
        ))}
      </div>

      {tab === "record" ? (
        <RideRecorder vehicles={vehicles} prefs={prefs} />
      ) : trips.length === 0 ? (
        <EmptyState
          icon={<Route size={44} strokeWidth={1.5} />}
          title={t("no_rides_yet")}
          description={t("no_rides_desc")}
        />
      ) : (
        <div className="grid gap-3">
          {trips.map((trip, index) => (
            <Panel
              key={trip.id}
              interactive
              padding="none"
              className="animate-rise-in"
              style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
            >
              <Link href={`/rides/${trip.id}`} className="group block p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold uppercase tracking-tight">
                      {trip.title || vehicleName(trip.vehicleId)}
                    </p>
                    <p
                      suppressHydrationWarning
                      className="num mt-0.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      {formatDate(trip.startedAt, prefs)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="num text-2xl font-black leading-none text-primary">
                      {formatDistance(trip.distanceM / 1000, prefs, 1)}
                    </span>
                    <ArrowRight
                      size={16}
                      strokeWidth={2.6}
                      className="text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <MiniStat label={t("duration")} value={formatDuration(trip.durationS)} />
                  <MiniStat label={t("avg_speed")} value={formatSpeed(trip.avgSpeedKph, prefs)} />
                  <MiniStat
                    label={t("top_speed")}
                    value={formatSpeed(trip.maxSpeedKph, prefs)}
                    tone="primary"
                  />
                </div>
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </PageShell>
  );
}
