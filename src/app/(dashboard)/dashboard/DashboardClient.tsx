"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { FleetStats } from "@/server/repositories/statsRepository";
import {
  formatConsumption,
  formatCurrency,
  formatPricePerVolume,
  formatVolume,
  type FormatPrefs,
} from "@/shared/lib/format";

interface Props {
  stats: FleetStats;
  /** Vehicle id → display name, so the chart does not need the full rows. */
  vehicleNames: Record<string, string>;
  prefs: FormatPrefs;
}

const CATEGORY_COLOR: Record<string, string> = {
  service: "text-blue-400",
  repair: "text-red-400",
  consumable: "text-yellow-400",
};

export function DashboardClient({ stats, vehicleNames, prefs }: Props) {
  const { t } = useLanguage();

  const categoryLabel: Record<string, string> = {
    service: t("maint_service"),
    repair: t("maint_repair"),
    consumable: t("maint_consumable"),
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("stats") || "Statistics"}</h1>
        <p className="text-sm text-muted-foreground">
          {t("welcome_back") || "Track your rides and maintenance in one place."}
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard
          label={t("total_fuel_cost")}
          value={formatCurrency(stats.fuel.totalCost, prefs)}
          accent
        />
        <StatCard label={t("total_liters")} value={formatVolume(stats.fuel.totalLiters, prefs)} />
        <StatCard
          label={t("avg_price_l")}
          value={formatPricePerVolume(stats.fuel.avgPricePerLiter, prefs)}
        />
        <StatCard
          label={t("fuel_consumption")}
          value={formatConsumption(stats.consumption.per100, prefs)}
        />
        <StatCard
          label={t("total_maint_cost")}
          value={formatCurrency(stats.maintenance.totalCost, prefs)}
          warn={stats.maintenance.totalCost > 0}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ── By Vehicle ── */}
        {stats.byVehicle.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">
              🏍 {t("by_vehicle")}
            </h2>
            <div className="space-y-4">
              {stats.byVehicle.map((v) => {
                const total = v.fuel + v.maintenance;
                // Guard the divisor: a vehicle with logs but zero cost would
                // otherwise produce NaN widths and collapse the bar.
                const divisor = total || 1;
                return (
                  <div key={v.vehicleId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{vehicleNames[v.vehicleId] ?? t("unknown")}</span>
                      <span className="font-bold">{formatCurrency(total, prefs)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${(v.fuel / divisor) * 100}%` }}
                      />
                      <div
                        className="bg-orange-500 h-full"
                        style={{ width: `${(v.maintenance / divisor) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Maintenance category breakdown ── */}
        {stats.maintenance.byCategory.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">
              🔧 {t("by_category")}
            </h2>
            <div className="space-y-3">
              {stats.maintenance.byCategory.map((c) => (
                <div key={c.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${CATEGORY_COLOR[c.category] ?? ""}`}>
                      {categoryLabel[c.category] ?? c.category}
                    </span>
                    <span className="text-xs text-muted-foreground">×{c.count}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(c.cost, prefs)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Fuel stations ── */}
        {stats.byStation.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">
              ⛽ {t("by_station") || "By station"}
            </h2>
            <div className="space-y-3">
              {stats.byStation.slice(0, 6).map((s) => (
                <div key={s.station ?? "unknown"} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.station || t("unknown")}</span>
                    <span className="text-xs text-muted-foreground">×{s.count}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(s.cost, prefs)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {stats.byVehicle.length === 0 && (
        <div className="text-center py-16 rounded-3xl border-2 border-dashed border-border/50">
          <p className="text-sm text-muted-foreground">{t("no_refuels")}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-6 text-center shadow-lg transition-all hover:scale-105 ${
        accent
          ? "border-primary/30 bg-primary/10 shadow-primary/5"
          : warn
          ? "border-orange-500/30 bg-orange-500/10 shadow-orange-500/5"
          : "border-border bg-card"
      }`}
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-bold">
        {label}
      </p>
      <p className={`text-2xl font-black ${accent ? "text-primary" : warn ? "text-orange-400" : ""}`}>
        {value}
      </p>
    </div>
  );
}
