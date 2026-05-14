"use client";

import { useState } from "react";
import { addPlannedMaintenance, completePlannedMaintenance, deletePlannedMaintenance } from "@/app/actions";
import { useLanguage } from "./LanguageProvider";

type Reminder = {
  id: string;
  type: string;
  category: string;
  targetOdometer: number | null;
  targetDate: Date | null;
  intervalKm: number | null;
  isCompleted: boolean;
  description: string | null;
};

const REMINDER_PRESETS = ["Oil Change", "Chain Lube", "Air Filter", "Tire Pressure", "Brake Fluid", "Coolant", "General Inspection"];

export function RemindersSection({
  vehicleId,
  reminders: initial,
  currentOdometer,
}: {
  vehicleId: string;
  reminders: Reminder[];
  currentOdometer: number;
}) {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState(initial);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("consumable");
  const [customType, setCustomType] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  async function handleAdd(formData: FormData) {
    formData.set("category", category);
    formData.set("type", customType || selectedPreset || "Reminder");
    await addPlannedMaintenance(vehicleId, formData);
    setOpen(false);
    setCustomType(""); setSelectedPreset("");
  }

  async function handleComplete(id: string) {
    await completePlannedMaintenance(id);
    setReminders(r => r.map(x => x.id === id ? { ...x, isCompleted: true } : x));
  }

  async function handleDelete(id: string) {
    await deletePlannedMaintenance(id);
    setReminders(r => r.filter(x => x.id !== id));
  }

  const active = reminders.filter(r => !r.isCompleted);
  const done = reminders.filter(r => r.isCompleted);

  function urgency(r: Reminder): "urgent" | "soon" | "ok" {
    if (r.targetOdometer) {
      const diff = r.targetOdometer - currentOdometer;
      if (diff <= 0) return "urgent";
      if (diff <= 500) return "soon";
    }
    if (r.targetDate) {
      const diff = (new Date(r.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (diff <= 0) return "urgent";
      if (diff <= 7) return "soon";
    }
    return "ok";
  }

  const urgencyStyle: Record<string, string> = {
    urgent: "border-red-500 bg-red-500/10 text-red-400",
    soon: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
    ok: "border-border bg-muted/20",
  };

  const catLabel: Record<string, string> = {
    consumable: t("maint_consumable"),
    service: t("maint_service"),
    reminder: t("reminder"),
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          🔔 {t("reminders")}
        </h4>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs px-3 py-1.5 rounded-xl border border-dashed border-border text-muted-foreground hover:border-yellow-400 hover:text-yellow-400 transition-colors"
        >
          + {t("add_reminder")}
        </button>
      </div>

      {/* Active reminders */}
      {active.length > 0 && (
        <ul className="space-y-2">
          {active.map(r => {
            const u = urgency(r);
            return (
              <li key={r.id} className={`rounded-xl border p-3 ${urgencyStyle[u]}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{r.type}</p>
                    <p className="text-xs opacity-70">{catLabel[r.category] ?? r.category}</p>
                    {r.targetOdometer && (
                      <p className="text-xs mt-0.5">
                        🛣 {r.targetOdometer.toLocaleString()} km
                        {currentOdometer > 0 && (
                          <span className="ml-1 opacity-70">
                            ({Math.abs(r.targetOdometer - currentOdometer).toLocaleString()} km {r.targetOdometer > currentOdometer ? "left" : "overdue"})
                          </span>
                        )}
                      </p>
                    )}
                    {r.targetDate && (
                      <p className="text-xs mt-0.5">📅 {new Date(r.targetDate).toLocaleDateString()}</p>
                    )}
                    {r.intervalKm && (
                      <p className="text-xs mt-0.5 opacity-70">↻ every {r.intervalKm.toLocaleString()} km</p>
                    )}
                    {r.description && <p className="text-xs mt-1 opacity-70">{r.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleComplete(r.id)}
                      className="px-2 py-1 text-xs rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-colors"
                      title="Mark done"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-2 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {active.length === 0 && !open && (
        <p className="text-xs text-muted-foreground">{t("no_reminders")}</p>
      )}

      {/* Completed (collapsed) */}
      {done.length > 0 && (
        <p className="text-xs text-muted-foreground opacity-50">{done.length} completed reminder(s)</p>
      )}

      {/* Add form */}
      {open && (
        <form action={handleAdd} className="p-4 border border-border rounded-xl bg-muted/20 space-y-4">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("add_reminder")}</h5>

          {/* Category */}
          <div className="flex rounded-xl overflow-hidden border border-border">
            {["consumable", "service", "reminder"].map((cat) => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${category === cat ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {catLabel[cat]}
              </button>
            ))}
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {REMINDER_PRESETS.map(p => (
              <button key={p} type="button" onClick={() => setSelectedPreset(p === selectedPreset ? "" : p)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${selectedPreset === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Custom name */}
          <input type="text" value={customType} onChange={e => { setCustomType(e.target.value); setSelectedPreset(""); }}
            placeholder={t("custom_type_placeholder")}
            className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("target_odometer")}</label>
              <input name="targetOdometer" type="number" placeholder={t("optional")} className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("target_date")}</label>
              <input name="targetDate" type="date" className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("interval_km")}</label>
              <input name="intervalKm" type="number" placeholder={t("optional")} className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("description")}</label>
              <input name="description" type="text" className="p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">{t("cancel")}</button>
            <button type="submit" className="flex-1 py-2 rounded-xl bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition-colors">{t("save")}</button>
          </div>
        </form>
      )}
    </div>
  );
}
