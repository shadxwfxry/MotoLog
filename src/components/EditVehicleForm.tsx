"use client";

import { useState } from "react";
import { updateVehicleCharacteristics } from "@/lib/actions/vehicle";
import { useLanguage } from "./LanguageProvider";

interface Props {
  vehicleId: string;
  defaultValues: {
    engineDisplacement?: number | null;
    power?: number | null;
    weight?: number | null;
  };
}

export function EditVehicleForm({ vehicleId, defaultValues }: Props) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    await updateVehicleCharacteristics(vehicleId, formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-3 p-4 border border-border rounded-xl bg-muted/30">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("characteristics")}</h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">{t("engine_cc")}</label>
          <input
            name="engineDisplacement"
            type="number"
            min="0"
            defaultValue={defaultValues.engineDisplacement ?? ""}
            className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">{t("power_hp")}</label>
          <input
            name="power"
            type="number"
            min="0"
            defaultValue={defaultValues.power ?? ""}
            className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">{t("weight_kg")}</label>
          <input
            name="weight"
            type="number"
            min="0"
            defaultValue={defaultValues.weight ?? ""}
            className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        {saved ? "✓ Saved!" : t("save_changes")}
      </button>
    </form>
  );
}
