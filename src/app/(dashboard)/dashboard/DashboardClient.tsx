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

  // ── Fuel stats & Full-to-Full Fuel Consumption ──────────────────────────
  const totalFuelCost = refuels.reduce((s, l) => s + l.cost, 0);
  const totalLiters = refuels.reduce((s, l) => s + l.liters, 0);
  const avgPricePerL = totalLiters > 0 ? totalFuelCost / totalLiters : 0;

  // Group refuels by vehicle to calculate Full-to-Full consumption per vehicle
  const refuelsByVehicle: Record<string, Refuel[]> = {};
  for (const r of refuels) {
    const key = (r as any).vehicleId || `${r.vehicle.make} ${r.vehicle.model}`;
    if (!refuelsByVehicle[key]) {
      refuelsByVehicle[key] = [];
    }
    refuelsByVehicle[key].push(r);
  }

  let totalWeightedKm = 0;
  let totalWeightedLiters = 0;

  for (const [_, list] of Object.entries(refuelsByVehicle)) {
    // Sort refuels by odometer ascending
    const sorted = [...list].sort((a, b) => a.odometer - b.odometer);
    if (sorted.length >= 2) {
      const minOdometer = sorted[0].odometer;
      const maxOdometer = sorted[sorted.length - 1].odometer;
      const path = maxOdometer - minOdometer;
      
      if (path > 0) {
        // sum liters of all refuels except the first
        const litersWithoutFirst = sorted.slice(1).reduce((s, r) => s + r.liters, 0);
        totalWeightedKm += path;
        totalWeightedLiters += litersWithoutFirst;
      }
    }
  }

  const averageWeightedConsumption = totalWeightedKm > 0 
    ? (totalWeightedLiters / totalWeightedKm) * 100 
    : null;

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
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("stats") || "Statistics"}</h1>
        <p className="text-sm text-muted-foreground">{t("welcome_back") || "Track your rides and maintenance in one place."}</p>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label={t("total_fuel_cost")} value={`${totalFuelCost.toFixed(0)} ₴`} accent />
        <StatCard label={t("total_liters")} value={`${totalLiters.toFixed(1)} L`} />
        <StatCard label={t("avg_price_l")} value={avgPricePerL > 0 ? `${avgPricePerL.toFixed(2)} ₴` : "—"} />
        <StatCard label={t("fuel_consumption")} value={averageWeightedConsumption !== null ? `${averageWeightedConsumption.toFixed(1)} л/100 км` : "—"} />
        <StatCard label={t("total_maint_cost")} value={`${totalMaintCost.toFixed(0)} ₴`} warn={totalMaintCost > 0} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
    </div>
  );
}

function StatCard({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded-3xl border p-6 text-center shadow-lg transition-all hover:scale-105 ${accent ? "border-primary/30 bg-primary/10 shadow-primary/5" : warn ? "border-orange-500/30 bg-orange-500/10 shadow-orange-500/5" : "border-border bg-card"}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-bold">{label}</p>
      <p className={`text-2xl font-black ${accent ? "text-primary" : warn ? "text-orange-400" : ""}`}>{value}</p>
    </div>
  );
}
