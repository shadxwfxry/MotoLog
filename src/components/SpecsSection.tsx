"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { updateVehicleSpecs } from "@/features/garage/actions";

interface Props {
  vehicleId: string;
  /** Free-form JSON column; validated into Record<string, string> below. */
  initialSpecs: unknown;
}

export function SpecsSection({ vehicleId, initialSpecs }: Props) {
  const { t, lang } = useLanguage();
  const [specs, setSpecs] = useState<Record<string, string>>(
    (typeof initialSpecs === "object" && initialSpecs !== null) ? (initialSpecs as Record<string, string>) : {}
  );
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    const updated = { ...specs, [newKey.trim()]: newValue.trim() };
    setSaving(true);
    const result = await updateVehicleSpecs(vehicleId, updated);
    setSaving(false);

    if (!result.ok) {
      // Previously a failed save was silent: the row simply never appeared.
      alert(result.error);
      return;
    }

    setSpecs(updated);
    setNewKey("");
    setNewValue("");
  };

  const handleDelete = async (keyToDelete: string) => {
    const updated = { ...specs };
    delete updated[keyToDelete];

    setSaving(true);
    const result = await updateVehicleSpecs(vehicleId, updated);
    setSaving(false);

    if (!result.ok) {
      alert(result.error);
      return;
    }

    setSpecs(updated);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        🛠️ {lang === "uk" ? "ТТХ та запчастини" : lang === "ru" ? "ТТХ и Памятка" : "Specs & Torque"}
      </h3>

      {/* Specs list */}
      <div className="space-y-2">
        {Object.entries(specs).length > 0 ? (
          <div className="grid gap-2">
            {Object.entries(specs).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between p-2.5 rounded-xl bg-muted/45 border border-border/60 hover:bg-muted/70 hover:border-border transition"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider leading-none">
                    {k}
                  </span>
                  <span className="text-sm font-black text-foreground truncate mt-1">
                    {v}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(k)}
                  disabled={saving}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition active:scale-95 flex-shrink-0"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            {lang === "uk" ? "Немає записів" : lang === "ru" ? "Нет записей" : "No specs added yet."}
          </div>
        )}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="pt-2 border-t border-border space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder={lang === "uk" ? "Назва" : lang === "ru" ? "Название" : "Key"}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="h-10 text-xs p-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
            disabled={saving}
            required
          />
          <input
            type="text"
            placeholder={lang === "uk" ? "Значення" : lang === "ru" ? "Значение" : "Value"}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="h-10 text-xs p-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-bold"
            disabled={saving}
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full h-10 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground border border-border text-xs font-black uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1"
        >
          ➕ {lang === "uk" ? "Додати пам'ятку" : lang === "ru" ? "Добавить памятку" : "Add spec"}
        </button>
      </form>
    </div>
  );
}
