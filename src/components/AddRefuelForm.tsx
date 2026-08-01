"use client";

import { useState } from "react";
import { Check, Fuel, HardDriveDownload, Zap } from "lucide-react";
import { addRefuelLog } from "@/features/fuel/actions";
import { useLanguage } from "./LanguageProvider";
import { addToSyncQueue } from "@/lib/offlineSync";
import { FormField } from "@/shared/ui";

const ODO_STEPS = [
  { label: "−1k", value: -1000 },
  { label: "−100", value: -100 },
  { label: "+100", value: 100 },
  { label: "+1k", value: 1000 },
];

export function AddRefuelForm({ vehicleId }: { vehicleId: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    const result = await addRefuelLog(vehicleId, formData);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    setAdded(true);
    setOpen(false);
    setLiters(""); setPpl(""); setCost(""); setOdo("");
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`btn h-12 w-full border border-dashed ${
          offlineSaved
            ? "border-signal-cyan/50 bg-signal-cyan/10 text-signal-cyan"
            : added
              ? "border-signal-lime/50 bg-signal-lime/10 text-signal-lime"
              : "text-muted-foreground hover:border-primary/50 hover:text-primary [border-color:hsl(var(--hairline))]"
        }`}
      >
        {added ? (
          <>
            <Check size={15} strokeWidth={3} />
            {t("added")}
          </>
        ) : offlineSaved ? (
          <>
            <HardDriveDownload size={15} strokeWidth={2.4} />
            {t("saved_locally")}
          </>
        ) : (
          <>
            <Fuel size={15} strokeWidth={2.4} />
            {t("add_refuel")}
          </>
        )}
      </button>

      {open && (
        <form
          action={handleSubmit as any}
          className="mt-3 space-y-4 rounded-md border bg-background/40 p-4 [border-color:hsl(var(--hairline))]"
        >
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive">
              {error}
            </p>
          )}

          {/* ── Calculator: the three fields that derive from each other ── */}
          <div className="space-y-3 rounded-md border border-primary/25 bg-primary/[0.06] p-3">
            <p className="eyebrow">
              <Zap size={12} strokeWidth={3} />
              {t("fuel_calc")}
            </p>

            <div className="grid grid-cols-3 gap-2">
              <FormField label={t("liters")}>
                <input
                  type="number" step="0.01" min="0" required
                  inputMode="decimal"
                  value={liters}
                  onChange={(e) => handleLitersChange(e.target.value)}
                  className="field-lg px-3"
                />
              </FormField>
              <FormField label={t("price_per_liter")}>
                <input
                  type="number" step="0.01" min="0"
                  inputMode="decimal"
                  value={ppl}
                  onChange={(e) => handlePplChange(e.target.value)}
                  className="field-lg px-3"
                />
              </FormField>
              <FormField label={t("cost")}>
                <input
                  type="number" step="0.01" min="0"
                  inputMode="decimal"
                  value={cost}
                  onChange={(e) => handleCostChange(e.target.value)}
                  className="field-lg px-3 text-primary"
                />
              </FormField>
            </div>
          </div>

          <FormField label={t("odometer_km")}>
            <input
              name="odometer"
              type="number"
              required
              inputMode="decimal"
              value={odo}
              onChange={(e) => setOdo(e.target.value)}
              className="field-lg"
            />
          </FormField>

          <div className="grid grid-cols-4 gap-2">
            {ODO_STEPS.map((step) => (
              <button
                key={step.label}
                type="button"
                onClick={() => adjustOdo(step.value)}
                className="num rounded-md border py-2 text-[11px] font-bold transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95 [border-color:hsl(var(--hairline))]"
              >
                {step.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <FormField label={t("fuel_grade")}>
              <input
                name="fuelGrade"
                type="text"
                placeholder={t("fuel_grade_placeholder")}
                className="field"
              />
            </FormField>
            <FormField label={t("station_name")}>
              <input
                name="stationName"
                type="text"
                placeholder={t("station_placeholder")}
                className="field"
              />
            </FormField>
            <FormField label={t("notes")}>
              <input name="notes" type="text" className="field" />
            </FormField>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button type="submit" className="btn-primary h-14 text-sm">
              {t("save")}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost h-11">
              {t("cancel")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
