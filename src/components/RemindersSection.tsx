"use client";

import { useState } from "react";
import { Bell, Check, Plus, RotateCw, X } from "lucide-react";
import {
  addPlannedMaintenance,
  completePlannedMaintenance,
  deletePlannedMaintenance,
} from "@/features/maintenance/actions";
import { URGENCY_HORIZON, calcUrgency, type Urgency } from "@/features/maintenance/reminders";
import { useLanguage } from "./LanguageProvider";
import { formatDate } from "@/shared/lib/format";
import { FormField, PanelTitle } from "@/shared/ui";
import { cn } from "@/lib/utils";

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

const REMINDER_PRESETS = [
  "Oil Change",
  "Chain Lube",
  "Air Filter",
  "Tire Pressure",
  "Brake Fluid",
  "Coolant",
  "General Inspection",
];

const URGENCY_STYLE: Record<Urgency, string> = {
  overdue: "border-destructive/35 bg-destructive/[0.07]",
  soon: "border-signal-amber/35 bg-signal-amber/[0.07]",
  ok: "border-[hsl(var(--hairline))] bg-foreground/[0.03]",
};

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
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("consumable");
  const [customType, setCustomType] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  async function handleAdd(formData: FormData) {
    formData.set("category", category);
    formData.set("type", customType || selectedPreset || "Reminder");

    const result = await addPlannedMaintenance(vehicleId, formData);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    setOpen(false);
    setCustomType(""); setSelectedPreset("");
  }

  async function handleComplete(id: string) {
    const result = await completePlannedMaintenance(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReminders(r => r.map(x => x.id === id ? { ...x, isCompleted: true } : x));
  }

  async function handleDelete(id: string) {
    const result = await deletePlannedMaintenance(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReminders(r => r.filter(x => x.id !== id));
  }

  const active = reminders.filter(r => !r.isCompleted);
  const done = reminders.filter(r => r.isCompleted);

  // Shared with the home screen; this page uses the near-term horizon.
  const urgency = (r: Reminder): Urgency =>
    calcUrgency(r, currentOdometer, URGENCY_HORIZON.detail);

  const catLabel: Record<string, string> = {
    consumable: t("maint_consumable"),
    service: t("maint_service"),
    reminder: t("reminder"),
  };

  return (
    <div>
      <PanelTitle
        icon={<Bell size={13} strokeWidth={2.6} />}
        action={
          <button
            onClick={() => setOpen(!open)}
            className="btn h-8 border border-dashed px-3 text-muted-foreground hover:border-primary/50 hover:text-primary [border-color:hsl(var(--hairline))]"
          >
            <Plus size={12} strokeWidth={3} />
            {t("add_reminder")}
          </button>
        }
      >
        {t("reminders")}
      </PanelTitle>

      {error && (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}

      {active.length > 0 && (
        <ul className="space-y-2">
          {active.map((r) => {
            const u = urgency(r);
            const remaining =
              r.targetOdometer != null && currentOdometer > 0
                ? Math.abs(r.targetOdometer - currentOdometer)
                : null;

            return (
              <li key={r.id} className={cn("rounded-md border p-3.5", URGENCY_STYLE[u])}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          u === "overdue"
                            ? "bg-destructive"
                            : u === "soon"
                              ? "bg-signal-amber"
                              : "bg-muted-foreground",
                        )}
                      />
                      <p className="truncate text-sm font-bold">{r.type}</p>
                    </div>

                    <p className="mt-0.5 pl-4 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {catLabel[r.category] ?? r.category}
                    </p>

                    <div className="mt-2 space-y-1 pl-4">
                      {r.targetOdometer != null && (
                        <p className="num text-[11px] text-muted-foreground">
                          {r.targetOdometer.toLocaleString()} km
                          {remaining !== null && (
                            <span className="ml-1.5 opacity-70">
                              ({remaining.toLocaleString()} km{" "}
                              {r.targetOdometer > currentOdometer ? "left" : "overdue"})
                            </span>
                          )}
                        </p>
                      )}
                      {r.targetDate && (
                        <p
                          suppressHydrationWarning
                          className="num text-[11px] text-muted-foreground"
                        >
                          {formatDate(r.targetDate)}
                        </p>
                      )}
                      {r.intervalKm && (
                        <p className="num flex items-center gap-1 text-[11px] text-muted-foreground opacity-70">
                          <RotateCw size={10} strokeWidth={2.6} />
                          every {r.intervalKm.toLocaleString()} km
                        </p>
                      )}
                      {r.description && (
                        <p className="text-[11px] text-muted-foreground opacity-80">
                          {r.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => handleComplete(r.id)}
                      title={t("mark_done")}
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-signal-lime/15 text-signal-lime transition-colors hover:bg-signal-lime/30"
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      title={t("delete")}
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/15 text-destructive transition-colors hover:bg-destructive/30"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {active.length === 0 && !open && (
        <p className="py-2 text-xs text-muted-foreground">{t("no_reminders")}</p>
      )}

      {done.length > 0 && (
        <p className="num mt-3 text-[11px] text-muted-foreground opacity-60">
          {done.length} {t("completed")}
        </p>
      )}

      {/* ── Add form ── */}
      {open && (
        <form
          action={handleAdd as any}
          className="mt-3 space-y-4 rounded-md border bg-background/40 p-4 [border-color:hsl(var(--hairline))]"
        >
          <div className="flex rounded-md border p-1 [border-color:hsl(var(--hairline))]">
            {["consumable", "service", "reminder"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
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
            {REMINDER_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPreset(p === selectedPreset ? "" : p)}
                className={cn(
                  "chip transition-all",
                  selectedPreset === p
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "text-muted-foreground hover:border-primary/40 hover:text-primary",
                )}
              >
                {p}
              </button>
            ))}
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("target_odometer")}>
              <input
                name="targetOdometer"
                type="number"
                placeholder={t("optional")}
                className="field num"
              />
            </FormField>
            <FormField label={t("target_date")}>
              <input name="targetDate" type="date" className="field num" />
            </FormField>
            <FormField label={t("interval_km")} className="col-span-2">
              <input
                name="intervalKm"
                type="number"
                placeholder={t("optional")}
                className="field num"
              />
            </FormField>
            <FormField label={t("description")} className="col-span-2">
              <input name="description" type="text" className="field" />
            </FormField>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost h-11 flex-1">
              {t("cancel")}
            </button>
            <button type="submit" className="btn-primary h-11 flex-1">
              {t("save")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
