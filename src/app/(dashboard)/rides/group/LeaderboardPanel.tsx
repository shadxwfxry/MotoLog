"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { getLeaderboard, type LeaderboardRow } from "@/features/multiplayer/actions";
import { Panel, PanelTitle } from "@/shared/ui";
import { cn } from "@/lib/utils";

type Scope = "crew" | "friends";

/** Podium colours for the first three places; the rest stay neutral. */
const RANK_STYLE = [
  "border-signal-amber/40 bg-signal-amber/10 text-signal-amber",
  "border-foreground/20 bg-foreground/[0.06] text-foreground",
  "border-primary/30 bg-primary/10 text-primary",
];

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
    <Panel>
      <PanelTitle icon={<Trophy size={13} strokeWidth={2.6} />}>Leaderboard</PanelTitle>

      <div className="mb-4 flex rounded-md border p-1 [border-color:hsl(var(--hairline))]">
        {(["crew", "friends"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setScope(value)}
            aria-pressed={scope === value}
            className={cn(
              "flex-1 rounded-sm py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-all duration-300",
              scope === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {value === "crew" ? "Crew" : "Friends"}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {loading ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          {scope === "crew" ? "No recorded rides in this crew yet." : "No friends with rides yet."}
        </p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, index) => (
            <li
              key={row.userId}
              className="flex items-center justify-between gap-3 rounded-md bg-foreground/[0.04] p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "num flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-black",
                    RANK_STYLE[index] ??
                      "border-[hsl(var(--hairline))] text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{row.name}</p>
                  <p className="num text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {row.trips} ride{row.trips === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="num text-sm font-black text-primary">
                  {(row.distanceM / 1000).toFixed(0)} km
                </p>
                <p className="num text-[10px] text-muted-foreground">
                  {row.avgSpeedKph != null ? `${Math.round(row.avgSpeedKph)} avg` : "—"}
                  {row.maxSpeedKph != null ? ` · ${Math.round(row.maxSpeedKph)} top` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
