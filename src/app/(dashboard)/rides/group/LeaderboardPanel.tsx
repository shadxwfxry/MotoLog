"use client";

import { useEffect, useState } from "react";
import { getLeaderboard, type LeaderboardRow } from "@/features/multiplayer/actions";

type Scope = "crew" | "friends";

export function LeaderboardPanel({ groupId }: { groupId: string }) {
  const [scope, setScope] = useState<Scope>("crew");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getLeaderboard(scope, groupId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.ok) setRows(result.data);
      else setError(result.error);
    });

    return () => {
      cancelled = true;
    };
  }, [scope, groupId]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex rounded-xl overflow-hidden border border-border">
        {(["crew", "friends"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setScope(value)}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
              scope === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {value === "crew" ? "Crew" : "Friends"}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {scope === "crew" ? "No recorded rides in this crew yet." : "No friends with rides yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row.userId}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-black text-muted-foreground w-5">{index + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{row.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {row.trips} ride{row.trips === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-primary">
                  {(row.distanceM / 1000).toFixed(0)} km
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {row.avgSpeedKph != null ? `${Math.round(row.avgSpeedKph)} avg` : "—"}
                  {row.maxSpeedKph != null ? ` · ${Math.round(row.maxSpeedKph)} top` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
