"use client";

import { useState } from "react";
import { addMaintenanceLog } from "@/lib/actions/maintenance";
import { useLanguage } from "./LanguageProvider";
import { addToSyncQueue } from "@/lib/offlineSync";

const CATEGORY_PRESETS: Record<string, string[]> = {
  service: ["Oil Change", "Air Filter", "Oil Filter", "Spark Plugs", "Coolant Flush", "Brake Fluid", "Full Service"],
  repair: ["Chain & Sprocket", "Brake Pads", "Tires", "Clutch Plates", "Levers", "Mirror", "Electrical"],
  consumable: ["Chain Lube", "Contact Cleaner", "Coolant Top-up", "Brake Pads Check", "Tire Check"],
};

export function AddMaintenanceForm({ vehicleId }: { vehicleId: string }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [category, setCategory] = useState("service");
  const [customType, setCustomType] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [odo, setOdo] = useState("");

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
      setCustomType(""); setSelectedPreset(""); setOdo("");
      setTimeout(() => setOfflineSaved(false), 4000);
      return;
    }

    await addMaintenanceLog(vehicleId, formData);
    setAdded(true);
    setOpen(false);
    setCustomType(""); setSelectedPreset(""); setOdo("");
    setTimeout(() => setAdded(false), 2500);
  }

  const catLabel: Record<string, string> = {
    service: t("maint_service"),
    repair: t("maint_repair"),
    consumable: t("maint_consumable"),
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full py-2.5 rounded-xl border border-dashed text-sm transition-colors ${
          offlineSaved 
            ? "border-blue-500 bg-blue-500/10 text-blue-400 font-bold" 
            : "border-border text-muted-foreground hover:border-orange-400 hover:text-orange-400 transition-colors"
        }`}
      >
        {added ? "✓ Saved!" : offlineSaved ? `💾 ${lang === "uk" ? "Збережено локально!" : lang === "ru" ? "Сохранено локально!" : "Saved locally!"}` : `🔧 ${t("add_service")}`}
      </button>

      {open && (
        <form action={handleSubmit as any} className="mt-3 p-4 border border-border rounded-xl bg-muted/20 space-y-4 shadow-inner">
          <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
            🔧 {t("add_service")}
          </h4>

          {/* Category tabs */}
          <div className="flex rounded-xl overflow-hidden border border-border">
            {Object.keys(CATEGORY_PRESETS).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); setSelectedPreset(""); }}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {catLabel[cat]}
              </button>
            ))}
          </div>

          {/* Preset quick-select */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_PRESETS[category].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSelectedPreset(preset === selectedPreset ? "" : preset)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  selectedPreset === preset
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Or custom name */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("custom_type")}</label>
            <input
              type="text"
              value={customType}
              onChange={e => { setCustomType(e.target.value); setSelectedPreset(""); }}
              placeholder={t("custom_type_placeholder")}
              className="h-12 p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Fields */}
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
              <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("cost")} (₴)</label>
              <input
                name="cost"
                type="number"
                step="0.01"
                defaultValue="0"
                required
                inputMode="decimal"
                className="h-14 text-lg p-3 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-bold"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("parts_replaced")}</label>
              <input name="parts" type="text" placeholder={t("parts_placeholder")} className="h-12 p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">{t("description")}</label>
              <textarea name="description" rows={2} className="p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button type="submit" className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-wider transition-all duration-200 shadow-md shadow-orange-500/20 flex items-center justify-center">
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
