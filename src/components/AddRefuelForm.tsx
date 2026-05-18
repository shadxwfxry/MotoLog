"use client";

import { useState } from "react";
import { addRefuelLog } from "@/lib/actions/refuel";
import { useLanguage } from "./LanguageProvider";
import { addToSyncQueue } from "@/lib/offlineSync";

export function AddRefuelForm({ vehicleId }: { vehicleId: string }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [liters, setLiters] = useState("");
  const [ppl, setPpl] = useState(""); // price per liter
  const [cost, setCost] = useState("");
  const [odo, setOdo] = useState("");

  const adjustOdo = (amount: number) => {
    const current = parseInt(odo) || 0;
    const next = Math.max(0, current + amount);
    setOdo(next.toString());
  };

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
    formData.set("odometer", odo);

    if (typeof window !== "undefined" && !navigator.onLine) {
      const payload: Record<string, string> = { vehicleId };
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });

      await addToSyncQueue("REFUEL", payload);
      setOfflineSaved(true);
      setOpen(false);
      setLiters(""); setPpl(""); setCost(""); setOdo("");
      setTimeout(() => setOfflineSaved(false), 4000);
      return;
    }

    await addRefuelLog(vehicleId, formData);
    setAdded(true);
    setOpen(false);
    setLiters(""); setPpl(""); setCost(""); setOdo("");
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full py-2.5 rounded-xl border border-dashed text-sm transition-colors ${
          offlineSaved 
            ? "border-blue-500 bg-blue-500/10 text-blue-400 font-bold" 
            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
        }`}
      >
        {added ? "✓ Added!" : offlineSaved ? `💾 ${lang === "uk" ? "Збережено локально!" : lang === "ru" ? "Сохранено локально!" : "Saved locally!"}` : `⛽ ${t("add_refuel")}`}
      </button>

      {open && (
        <form action={handleSubmit as any} className="mt-3 p-4 border border-border rounded-xl bg-muted/20 space-y-4 shadow-inner">
          <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
            ⛽ {t("add_refuel")}
          </h4>

          {/* ─ Calculator row ─ */}
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">⚡ {t("fuel_calc")}</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("liters")}</label>
                <input
                  type="number" step="0.01" min="0" required
                  inputMode="decimal"
                  value={liters}
                  onChange={e => handleLitersChange(e.target.value)}
                  className="h-14 text-lg p-3 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("price_per_liter")} (₴)</label>
                <input
                  type="number" step="0.01" min="0"
                  inputMode="decimal"
                  value={ppl}
                  onChange={e => handlePplChange(e.target.value)}
                  className="h-14 text-lg p-3 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("cost")} (₴)</label>
                <input
                  type="number" step="0.01" min="0"
                  inputMode="decimal"
                  value={cost}
                  onChange={e => handleCostChange(e.target.value)}
                  className="h-14 text-lg p-3 px-4 rounded-xl border border-border bg-background font-black text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* ─ Other fields ─ */}
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("odometer_km")}</label>
              <input
                name="odometer"
                type="number"
                required
                inputMode="decimal"
                value={odo}
                onChange={e => setOdo(e.target.value)}
                className="h-14 text-lg p-3 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-bold"
              />
              {/* Odometer quick adjustment controls */}
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                {[
                  { label: "-1k", value: -1000 },
                  { label: "-100", value: -100 },
                  { label: "+100", value: 100 },
                  { label: "+1k", value: 1000 }
                ].map(btn => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => adjustOdo(btn.value)}
                    className="py-2 rounded-lg bg-background hover:bg-primary/20 hover:text-primary text-[11px] font-black uppercase tracking-wider border border-border/60 hover:border-primary/30 transition-all duration-100 active:scale-95 shadow-sm"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="col-span-2 flex flex-col gap-1 mt-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("fuel_grade")}</label>
              <input name="fuelGrade" type="text" placeholder={t("fuel_grade_placeholder")} className="h-12 p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("station_name")}</label>
              <input name="stationName" type="text" placeholder={t("station_placeholder")} className="h-12 p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("notes")}</label>
              <input name="notes" type="text" className="h-12 p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button type="submit" className="w-full h-14 text-lg rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-wider hover:bg-primary/90 transition-all duration-200 shadow-md shadow-primary/20 flex items-center justify-center">
              {t("save")}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="w-full h-12 text-sm rounded-xl border border-border text-muted-foreground hover:bg-muted/50 transition-colors">
              {t("cancel")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
