"use client";

import { Bike, Droplets, Fuel, Layers, Wrench } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import type { FleetStats } from "@/server/repositories/statsRepository";
import {
  formatConsumption,
  formatCurrency,
  formatPricePerVolume,
  formatVolume,
  type FormatPrefs,
} from "@/shared/lib/format";
import { EmptyState, Panel, PanelTitle, PageHeader, PageShell, StatTile } from "@/shared/ui";
import type { Tone } from "@/shared/ui";

interface Props {
  stats: FleetStats;
  /** Vehicle id → display name, so the chart does not need the full rows. */
  vehicleNames: Record<string, string>;
  prefs: FormatPrefs;
}

const CATEGORY_TONE: Record<string, Tone> = {
  service: "cyan",
  repair: "rose",
  consumable: "amber",
};

export function DashboardClient({ stats, vehicleNames, prefs }: Props) {
  const { t } = useLanguage();

  const categoryLabel: Record<string, string> = {
    service: t("maint_service"),
    repair: t("maint_repair"),
    consumable: t("maint_consumable"),
  };

  const hasData = stats.byVehicle.length > 0;

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("telemetry")}
        title={t("stats")}
        description={t("spending_breakdown")}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
        <StatTile
          tone="primary"
          label={t("total_fuel_cost")}
          value={formatCurrency(stats.fuel.totalCost, prefs)}
        />
        <StatTile
          tone="cyan"
          label={t("total_liters")}
          value={formatVolume(stats.fuel.totalLiters, prefs)}
        />
        <StatTile
          label={t("avg_price_l")}
          value={formatPricePerVolume(stats.fuel.avgPricePerLiter, prefs)}
        />
        <StatTile
          tone="lime"
          label={t("fuel_consumption")}
          value={formatConsumption(stats.consumption.per100, prefs)}
        />
        <StatTile
          tone={stats.maintenance.totalCost > 0 ? "amber" : "default"}
          label={t("total_maint_cost")}
          value={formatCurrency(stats.maintenance.totalCost, prefs)}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {hasData ? (
        <div className="grid gap-5 md:grid-cols-2">
          {/* ── Spend per bike ── */}
          <Panel>
            <PanelTitle icon={<Bike size={13} strokeWidth={2.6} />}>{t("by_vehicle")}</PanelTitle>

            <div className="space-y-4">
              {stats.byVehicle.map((v) => {
                const total = v.fuel + v.maintenance;
                // Guard the divisor: a vehicle with logs but zero cost would
                // otherwise produce NaN widths and collapse the bar.
                const divisor = total || 1;

                return (
                  <div key={v.vehicleId}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-semibold">
                        {vehicleNames[v.vehicleId] ?? t("unknown")}
                      </span>
                      <span className="num shrink-0 text-sm font-bold">
                        {formatCurrency(total, prefs)}
                      </span>
                    </div>

                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 shadow-[0_0_12px_hsl(var(--primary)/0.7)]"
                        style={{ width: `${(v.fuel / divisor) * 100}%` }}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-signal-cyan/80 to-signal-cyan/50"
                        style={{ width: `${(v.maintenance / divisor) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center gap-4 border-t pt-4 [border-color:hsl(var(--hairline))]">
              <Legend className="bg-primary" label={t("fuel")} />
              <Legend className="bg-signal-cyan" label={t("maintenance")} />
            </div>
          </Panel>

          {/* ── Maintenance by category ── */}
          {stats.maintenance.byCategory.length > 0 && (
            <Panel>
              <PanelTitle icon={<Wrench size={13} strokeWidth={2.6} />}>
                {t("by_category")}
              </PanelTitle>

              <ul className="divide-y [&>li]:py-3 first:[&>li]:pt-0 last:[&>li]:pb-0 [&>li]:border-[hsl(var(--hairline))]">
                {stats.maintenance.byCategory.map((c) => (
                  <li key={c.category} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Dot tone={CATEGORY_TONE[c.category] ?? "default"} />
                      <span className="truncate text-sm font-medium">
                        {categoryLabel[c.category] ?? c.category}
                      </span>
                      <span className="num shrink-0 text-[11px] text-muted-foreground">
                        ×{c.count}
                      </span>
                    </span>
                    <span className="num shrink-0 text-sm font-bold">
                      {formatCurrency(c.cost, prefs)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* ── Fuel stations ── */}
          {stats.byStation.length > 0 && (
            <Panel className="md:col-span-2">
              <PanelTitle icon={<Fuel size={13} strokeWidth={2.6} />}>
                {t("by_station")}
              </PanelTitle>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stats.byStation.slice(0, 6).map((s) => (
                  <div
                    key={s.station ?? "unknown"}
                    className="flex items-center justify-between gap-3 rounded-md bg-foreground/[0.04] px-3 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Droplets size={14} className="shrink-0 text-primary" strokeWidth={2.4} />
                      <span className="truncate text-sm font-medium">
                        {s.station || t("unknown")}
                      </span>
                      <span className="num shrink-0 text-[11px] text-muted-foreground">
                        ×{s.count}
                      </span>
                    </span>
                    <span className="num shrink-0 text-sm font-bold">
                      {formatCurrency(s.cost, prefs)}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Layers size={44} strokeWidth={1.5} />}
          title={t("no_refuels")}
          description={t("start_adding")}
        />
      )}
    </PageShell>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
      <span className={`h-2 w-4 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function Dot({ tone }: { tone: Tone }) {
  const color: Record<Tone, string> = {
    default: "bg-muted-foreground",
    primary: "bg-primary",
    cyan: "bg-signal-cyan",
    lime: "bg-signal-lime",
    amber: "bg-signal-amber",
    rose: "bg-signal-rose",
    violet: "bg-signal-violet",
  };
  return <span className={`h-2 w-2 shrink-0 rounded-full ${color[tone]}`} />;
}
