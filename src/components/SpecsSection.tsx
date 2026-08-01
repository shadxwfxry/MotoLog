"use client";

import { useState } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { updateVehicleSpecs } from "@/features/garage/actions";
import { Panel, PanelTitle } from "@/shared/ui";

interface Props {
  vehicleId: string;
  /** Free-form JSON column; validated into Record<string, string> below. */
  initialSpecs: unknown;
}

export function SpecsSection({ vehicleId, initialSpecs }: Props) {
  const { t } = useLanguage();
  const [specs, setSpecs] = useState<Record<string, string>>(
    typeof initialSpecs === "object" && initialSpecs !== null
      ? (initialSpecs as Record<string, string>)
      : {},
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

  const entries = Object.entries(specs);

  return (
    <Panel>
      <PanelTitle icon={<Wrench size={13} strokeWidth={2.6} />}>{t("specs_title")}</PanelTitle>

      {entries.length > 0 ? (
        <div className="grid gap-2">
          {entries.map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between gap-3 rounded-md bg-foreground/[0.04] px-3 py-2.5 transition-colors hover:bg-foreground/[0.07]"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] font-bold uppercase leading-none tracking-[0.18em] text-muted-foreground">
                  {k}
                </span>
                <span className="num mt-1 truncate text-sm font-bold">{v}</span>
              </div>

              <button
                onClick={() => handleDelete(k)}
                disabled={saving}
                title={t("delete")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 size={14} strokeWidth={2.4} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground [border-color:hsl(var(--hairline))]">
          {t("no_specs")}
        </p>
      )}

      <form
        onSubmit={handleAdd}
        className="mt-4 space-y-2 border-t pt-4 [border-color:hsl(var(--hairline))]"
      >
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder={t("spec_key")}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="field py-2.5 text-xs"
            disabled={saving}
            required
          />
          <input
            type="text"
            placeholder={t("spec_value")}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="field num py-2.5 text-xs"
            disabled={saving}
            required
          />
        </div>

        <button type="submit" disabled={saving} className="btn-ghost h-10 w-full">
          <Plus size={13} strokeWidth={3} />
          {t("add_spec")}
        </button>
      </form>
    </Panel>
  );
}
