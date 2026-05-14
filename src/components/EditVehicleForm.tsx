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
  
  const isFullyConfigured = defaultValues.engineDisplacement && defaultValues.power && defaultValues.weight;
  const [isEditing, setIsEditing] = useState(!isFullyConfigured);

  async function handleSubmit(formData: FormData) {
    await updateVehicleCharacteristics(vehicleId, formData);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsEditing(false); // Hide after save
    }, 1500);
  }

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)}
        className="w-full text-center text-xs text-muted-foreground hover:text-primary py-3 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-all font-medium"
      >
        ⚙️ {t("edit_characteristics") || "Edit Specs (CC, HP, Weight)"}
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-3 p-4 border border-border rounded-xl bg-muted/30 relative">
      {isFullyConfigured && (
        <button 
          type="button" 
          onClick={() => setIsEditing(false)} 
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("characteristics")}</h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("engine_cc")}</label>
          <input
            name="engineDisplacement"
            type="number"
            min="0"
            defaultValue={defaultValues.engineDisplacement ?? ""}
            placeholder="cc"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("power_hp")}</label>
          <input
            name="power"
            type="number"
            min="0"
            defaultValue={defaultValues.power ?? ""}
            placeholder="hp"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("weight_kg")}</label>
          <input
            name="weight"
            type="number"
            min="0"
            defaultValue={defaultValues.weight ?? ""}
            placeholder="kg"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold tracking-wide hover:bg-primary/90 transition-colors shadow-md"
      >
        {saved ? "✓ Saved!" : t("save_changes")}
      </button>
    </form>
  );
}
