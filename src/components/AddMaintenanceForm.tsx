"use client";

import { useState } from "react";
import { Check, HardDriveDownload, Wrench } from "lucide-react";
import { addMaintenanceLog } from "@/features/maintenance/actions";
import { useLanguage } from "./LanguageProvider";
import { addToSyncQueue } from "@/lib/offlineSync";
import { FormField } from "@/shared/ui";
import { cn } from "@/lib/utils";

const CATEGORY_PRESETS: Record<string, string[]> = {
  service: ["Oil Change", "Air Filter", "Oil Filter", "Spark Plugs", "Coolant Flush", "Brake Fluid", "Full Service"],
  repair: ["Chain & Sprocket", "Brake Pads", "Tires", "Clutch Plates", "Levers", "Mirror", "Electrical"],
  consumable: ["Chain Lube", "Contact Cleaner", "Coolant Top-up", "Brake Pads Check", "Tire Check"],
};

const ODO_STEPS = [
  { label: "−1k", value: -1000 },
  { label: "−100", value: -100 },
  { label: "+100", value: 100 },
  { label: "+1k", value: 1000 },
];

export function AddMaintenanceForm({
  vehicleId,
  currentOdometer,
}: {
  vehicleId: string;
  /** Seeds the odometer field. Absent on the offline screen, which has no stats. */
  currentOdometer?: number;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [category, setCategory] = useState("service");
  const [customType, setCustomType] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  // See AddRefuelForm: the steppers were counting up from zero.
  const seedOdo = currentOdometer && currentOdometer > 0 ? String(currentOdometer) : "";
  const [odo, setOdo] = useState(seedOdo);

  const adjustOdo = (amount: number) => {
    const current = parseInt(odo) || 0;
    const next = Math.max(0, current + amount);
    setOdo(next.toString());
  };

  async function handleSubmit(formData: FormData) {
    formData.set("category", category);
    formData.set("type", customType || selectedPreset || "Other");
    formData.set("odometer", odo);

    if (typeof window !== "undefined" && !navigator.onLine) {
      const payload: Record<string, string> = { vehicleId };
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });

      await addToSyncQueue("MAINTENANCE", payload);
      setOfflineSaved(true);
      setOpen(false);
      setCustomType(""); setSelectedPreset(""); setOdo(seedOdo);
      setTimeout(() => setOfflineSaved(false), 4000);
      return;
    }

    const result = await addMaintenanceLog(vehicleId, formData);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    setAdded(true);
    setOpen(false);
    setCustomType(""); setSelectedPreset(""); setOdo(seedOdo);
    setTimeout(() => setAdded(false), 2500);
  }

  const catLabel: Record<string, string> = {
    service: t("maint_service"),
    repair: t("maint_repair"),
    consumable: t("maint_consumable"),
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "btn h-12 w-full border border-dashed",
          offlineSaved
            ? "border-signal-cyan/50 bg-signal-cyan/10 text-signal-cyan"
            : added
              ? "border-signal-lime/50 bg-signal-lime/10 text-signal-lime"
              : "text-muted-foreground hover:border-signal-cyan/50 hover:text-signal-cyan [border-color:hsl(var(--hairline))]",
        )}
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
            <Wrench size={15} strokeWidth={2.4} />
            {t("add_service")}
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

          <div className="flex rounded-md border p-1 [border-color:hsl(var(--hairline))]">
            {Object.keys(CATEGORY_PRESETS).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setSelectedPreset("");
                }}
                aria-pressed={category === cat}
                className={cn(
                  "flex-1 rounded-sm py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-all",
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {catLabel[cat]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_PRESETS[category].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSelectedPreset(preset === selectedPreset ? "" : preset)}
                className={cn(
                  "chip transition-all",
                  selectedPreset === preset
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "text-muted-foreground hover:border-primary/40 hover:text-primary",
                )}
              >
                {preset}
              </button>
            ))}
          </div>

          <FormField label={t("custom_type")}>
            <input
              type="text"
              value={customType}
              onChange={(e) => {
                setCustomType(e.target.value);
                setSelectedPreset("");
              }}
              placeholder={t("custom_type_placeholder")}
              className="field"
            />
          </FormField>

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

          <FormField label={t("cost")}>
            <input
              name="cost"
              type="number"
              step="0.01"
              defaultValue="0"
              required
              inputMode="decimal"
              className="field-lg"
            />
          </FormField>

          <FormField label={t("parts_replaced")}>
            <input
              name="parts"
              type="text"
              placeholder={t("parts_placeholder")}
              className="field"
            />
          </FormField>

          <FormField label={t("description")}>
            <textarea name="description" rows={2} className="field resize-none" />
          </FormField>

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
