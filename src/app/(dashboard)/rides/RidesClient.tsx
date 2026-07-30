"use client";

import Link from "next/link";
import { useState } from "react";
import { RideRecorder } from "@/features/trips/components/RideRecorder";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatSpeed,
  type FormatPrefs,
} from "@/shared/lib/format";

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
  const [tab, setTab] = useState<"record" | "history">("record");

  const vehicleName = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.make} ${v.model}` : "—";
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6 pb-24">
      <h1 className="text-2xl font-bold tracking-tight uppercase">Rides</h1>

      <div className="flex rounded-xl overflow-hidden border border-border">
        {(["record", "history"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
              tab === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {value === "record" ? "🛰 Record" : `📜 History (${trips.length})`}
          </button>
        ))}
      </div>

      {tab === "record" ? (
        <RideRecorder vehicles={vehicles} prefs={prefs} />
      ) : trips.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border-2 border-dashed border-border/50">
          <div className="text-6xl mb-4 opacity-20">🛰</div>
          <p className="text-sm text-muted-foreground">No rides recorded yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/rides/${trip.id}`}
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-all"
            >
              <div className="flex justify-between items-start gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-bold truncate">
                    {trip.title || `Ride · ${vehicleName(trip.vehicleId)}`}
                  </p>
                  <p suppressHydrationWarning className="text-xs text-muted-foreground">
                    {formatDate(trip.startedAt, prefs)}
                  </p>
                </div>
                <span className="text-lg font-black text-primary shrink-0">
                  {formatDistance(trip.distanceM / 1000, prefs, 1)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Time" value={formatDuration(trip.durationS)} />
                <Stat label="Avg" value={formatSpeed(trip.avgSpeedKph, prefs)} />
                <Stat label="Top" value={formatSpeed(trip.maxSpeedKph, prefs)} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 py-2">
      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
