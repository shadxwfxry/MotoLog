"use client";

import { useState } from "react";
import { addRefuelLog } from "@/app/actions";
import { useLanguage } from "./LanguageProvider";

export function AddRefuelForm({ vehicleId }: { vehicleId: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [liters, setLiters] = useState("");
  const [ppl, setPpl] = useState(""); // price per liter
  const [cost, setCost] = useState("");

  // Auto-calculate cost from liters × price/L
  function handleLitersChange(val: string) {
    setLiters(val);
    const l = parseFloat(val);
    const p = parseFloat(ppl);
    if (!isNaN(l) && !isNaN(p) && p > 0) setCost((l * p).toFixed(2));
  }
  function handlePplChange(val: string) {
    setPpl(val);
    const l = parseFloat(liters);
    const p = parseFloat(val);
    if (!isNaN(l) && !isNaN(p) && p > 0) setCost((l * p).toFixed(2));
  }
  function handleCostChange(val: string) {
    setCost(val);
    const l = parseFloat(liters);
    const c = parseFloat(val);
    if (!isNaN(l) && l > 0 && !isNaN(c)) setPpl((c / l).toFixed(2));
  }

  async function handleSubmit(formData: FormData) {
    // Inject calculated values
    formData.set("liters", liters);
    formData.set("pricePerLiter", ppl);
    formData.set("cost", cost);
    await addRefuelLog(vehicleId, formData);
    setAdded(true);
    setOpen(false);
    setLiters(""); setPpl(""); setCost("");
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        {added ? "✓ Added!" : `⛽ ${t("add_refuel")}`}
      </button>

      {open && (
        <form action={handleSubmit} className="mt-3 p-4 border border-border rounded-xl bg-muted/20 space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            ⛽ {t("add_refuel")}
          </h4>

          {/* ─ Calculator row ─ */}
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">⚡ {t("fuel_calc")}</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{t("liters")}</label>
                <input
                  type="number" step="0.01" min="0" required
                  value={liters}
                  onChange={e => handleLitersChange(e.target.value)}
                  className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{t("price_per_liter")} (₴)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={ppl}
                  onChange={e => handlePplChange(e.target.value)}
                  className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{t("cost")} (₴)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={cost}
                  onChange={e => handleCostChange(e.target.value)}
                  className="p-2 rounded-lg border border-border bg-background text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* ─ Other fields ─ */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("odometer_km")}</label>
              <input name="odometer" type="number" required className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("fuel_grade")}</label>
              <input name="fuelGrade" type="text" placeholder={t("fuel_grade_placeholder")} className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("station_name")}</label>
              <input name="stationName" type="text" placeholder={t("station_placeholder")} className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("notes")}</label>
              <input name="notes" type="text" className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              {t("cancel")}
            </button>
            <button type="submit" className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              {t("save")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
