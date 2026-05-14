"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type Refuel = {
  id: string;
  date: Date;
  odometer: number;
  liters: number;
  cost: number;
  pricePerLiter: number | null;
  stationName: string | null;
  fuelGrade: string | null;
  vehicle: { make: string; model: string };
};

type Maintenance = {
  id: string;
  date: Date;
  odometer: number;
  type: string;
  category: string;
  cost: number;
  description: string | null;
  parts: { name: string; price: number | null }[];
  vehicle: { make: string; model: string };
};

interface Props {
  refuels: Refuel[];
  maintenance: Maintenance[];
}

export function DashboardClient({ refuels, maintenance }: Props) {
  const { t, lang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (date: Date) => {
    if (!mounted) return "";
    return new Date(date).toLocaleDateString(lang);
  };

  // ── Fuel stats ──────────────────────────────────────────────────────────
  const totalFuelCost = refuels.reduce((s, l) => s + l.cost, 0);
  const totalLiters = refuels.reduce((s, l) => s + l.liters, 0);
  const avgPricePerL = totalLiters > 0 ? totalFuelCost / totalLiters : 0;

  // Station map
  const stationMap: Record<string, { count: number; cost: number; liters: number }> = {};
  for (const r of refuels) {
    const key = r.stationName || t("unknown");
    if (!stationMap[key]) stationMap[key] = { count: 0, cost: 0, liters: 0 };
    stationMap[key].count++;
    stationMap[key].cost += r.cost;
    stationMap[key].liters += r.liters;
  }

  // ── Maintenance stats ────────────────────────────────────────────────────
  const totalMaintCost = maintenance.reduce((s, l) => s + l.cost, 0);
  const totalCostAll = totalFuelCost + totalMaintCost;

  const categoryMap: Record<string, { count: number; cost: number }> = {};
  for (const m of maintenance) {
    const key = m.category;
    if (!categoryMap[key]) categoryMap[key] = { count: 0, cost: 0 };
    categoryMap[key].count++;
    categoryMap[key].cost += m.cost;
  }

  const catLabel: Record<string, string> = {
    service: t("maint_service"),
    repair: t("maint_repair"),
    consumable: t("maint_consumable"),
  };
  const catColor: Record<string, string> = {
    service: "text-blue-400",
    repair: "text-red-400",
    consumable: "text-yellow-400",
  };

  const vehicleMap: Record<string, { fuel: number; maint: number }> = {};
  for (const r of refuels) {
    const key = `${r.vehicle.make} ${r.vehicle.model}`;
    if (!vehicleMap[key]) vehicleMap[key] = { fuel: 0, maint: 0 };
    vehicleMap[key].fuel += r.cost;
  }
  for (const m of maintenance) {
    const key = `${m.vehicle.make} ${m.vehicle.model}`;
    if (!vehicleMap[key]) vehicleMap[key] = { fuel: 0, maint: 0 };
    vehicleMap[key].maint += m.cost;
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">📊 {t("stats")}</h1>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t("total_fuel_cost")} value={`${totalFuelCost.toFixed(0)} ₴`} accent />
        <StatCard label={t("total_liters")} value={`${totalLiters.toFixed(1)} L`} />
        <StatCard label={t("avg_price_l")} value={avgPricePerL > 0 ? `${avgPricePerL.toFixed(2)} ₴` : "—"} />
        <StatCard label={t("total_maint_cost")} value={`${totalMaintCost.toFixed(0)} ₴`} warn={totalMaintCost > 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* ── By Vehicle ── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">🏍 {t("by_vehicle")}</h2>
          <div className="space-y-4">
            {Object.entries(vehicleMap).map(([name, d]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{name}</span>
                  <span className="font-bold">{(d.fuel + d.maint).toFixed(0)} ₴</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                  <div className="bg-primary h-full" style={{ width: `${(d.fuel / (d.fuel + d.maint || 1)) * 100}%` }} />
                  <div className="bg-orange-500 h-full" style={{ width: `${(d.maint / (d.fuel + d.maint || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Station table ── */}
        {Object.keys(stationMap).length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">⛽ {t("by_station")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border">
                    <th className="pb-2 text-left">{t("station_name")}</th>
                    <th className="pb-2 text-right">{t("liters")}</th>
                    <th className="pb-2 text-right">₴/L</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stationMap).slice(0, 5).map(([station, d]) => (
                    <tr key={station} className="border-b border-border last:border-0">
                      <td className="py-2 font-medium truncate max-w-[100px]">{station}</td>
                      <td className="py-2 text-right">{d.liters.toFixed(1)}</td>
                      <td className="py-2 text-right font-semibold text-primary">
                        {d.liters > 0 ? (d.cost / d.liters).toFixed(2) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Maintenance category breakdown ── */}
        {Object.keys(categoryMap).length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">🔧 {t("by_category")}</h2>
            <div className="space-y-3">
              {Object.entries(categoryMap).map(([cat, d]) => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${catColor[cat] ?? ""}`}>{catLabel[cat] ?? cat}</span>
                    <span className="text-xs text-muted-foreground">×{d.count}</span>
                  </div>
                  <span className="font-semibold">{d.cost.toFixed(0)} ₴</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── All refuels ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">⛽ {t("refuels")}</h2>
        {refuels.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_refuels")}</p>
        ) : (
          <ul className="space-y-2">
            {refuels.map((log) => (
              <li key={log.id} className="flex flex-wrap items-start justify-between gap-2 text-sm border-b border-border last:border-0 pb-2">
                <div>
                  <p className="font-medium">{log.vehicle.make} {log.vehicle.model}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.stationName ?? "—"}{log.fuelGrade ? ` · ${log.fuelGrade}` : ""}
                    {" · "}{formatDate(log.date)}
                    {" · "}{log.odometer.toLocaleString()} km
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{log.cost} ₴</p>
                  <p className="text-xs text-muted-foreground">
                    {log.liters} L{log.pricePerLiter ? ` · ${log.pricePerLiter} ₴/L` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── All maintenance ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">🔧 {t("services")}</h2>
        {maintenance.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_maintenance")}</p>
        ) : (
          <ul className="space-y-2">
            {maintenance.map((log) => (
              <li key={log.id} className="flex flex-wrap items-start justify-between gap-2 text-sm border-b border-border last:border-0 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{log.type}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded bg-muted ${catColor[log.category] ?? ""}`}>
                      {catLabel[log.category] ?? log.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {log.vehicle.make} {log.vehicle.model}
                    {" · "}{formatDate(log.date)}
                    {" · "}{log.odometer.toLocaleString()} km
                  </p>
                  {log.parts.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      🔩 {log.parts.map(p => p.name).join(", ")}
                    </p>
                  )}
                  {log.description && <p className="text-xs text-muted-foreground">{log.description}</p>}
                </div>
                <p className="font-semibold">{log.cost > 0 ? `${log.cost} ₴` : "—"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 text-center shadow-sm ${accent ? "border-primary/30 bg-primary/10" : warn ? "border-orange-500/30 bg-orange-500/10" : "border-border bg-card"}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 leading-tight">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-primary" : warn ? "text-orange-400" : ""}`}>{value}</p>
    </div>
  );
}
