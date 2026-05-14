"use client";

import { useState } from "react";
import { addMaintenanceLog } from "@/lib/actions/maintenance";
import { useLanguage } from "./LanguageProvider";

const CATEGORY_PRESETS: Record<string, string[]> = {
  service: ["Oil Change", "Air Filter", "Oil Filter", "Spark Plugs", "Coolant Flush", "Brake Fluid", "Full Service"],
  repair: ["Chain & Sprocket", "Brake Pads", "Tires", "Clutch Plates", "Levers", "Mirror", "Electrical"],
  consumable: ["Chain Lube", "Contact Cleaner", "Coolant Top-up", "Brake Pads Check", "Tire Check"],
};

export function AddMaintenanceForm({ vehicleId }: { vehicleId: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [category, setCategory] = useState("service");
  const [customType, setCustomType] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  async function handleSubmit(formData: FormData) {
    formData.set("category", category);
    formData.set("type", customType || selectedPreset || "Other");
    await addMaintenanceLog(vehicleId, formData);
    setAdded(true);
    setOpen(false);
    setCustomType(""); setSelectedPreset("");
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
        className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-orange-400 hover:text-orange-400 transition-colors"
      >
        {added ? "✓ Saved!" : `🔧 ${t("add_service")}`}
      </button>

      {open && (
        <form action={handleSubmit} className="mt-3 p-4 border border-border rounded-xl bg-muted/20 space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
            <label className="text-xs text-muted-foreground">{t("custom_type")}</label>
            <input
              type="text"
              value={customType}
              onChange={e => { setCustomType(e.target.value); setSelectedPreset(""); }}
              placeholder={t("custom_type_placeholder")}
              className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("odometer_km")}</label>
              <input name="odometer" type="number" required className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("cost")} (₴)</label>
              <input name="cost" type="number" step="0.01" defaultValue="0" required className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("parts_replaced")}</label>
              <input name="parts" type="text" placeholder={t("parts_placeholder")} className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("description")}</label>
              <textarea name="description" rows={2} className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              {t("cancel")}
            </button>
            <button type="submit" className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors">
              {t("save")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
