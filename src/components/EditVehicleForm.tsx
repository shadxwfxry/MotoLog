"use client";

import { useState, useRef } from "react";
import { updateVehicleCharacteristics } from "@/features/garage/actions";
import { useLanguage } from "./LanguageProvider";
import { compressImage } from "@/lib/imageUtils";

interface Props {
  vehicleId: string;
  defaultValues: {
    engineDisplacement?: number | null;
    power?: number | null;
    weight?: number | null;
    photoUrl?: string | null;
  };
}

export function EditVehicleForm({ vehicleId, defaultValues }: Props) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isFullyConfigured = defaultValues.engineDisplacement && defaultValues.power && defaultValues.weight;
  const [isEditing, setIsEditing] = useState(!isFullyConfigured);
  const [photoBase64, setPhotoBase64] = useState<string>(defaultValues.photoUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setPhotoBase64(base64);
    } catch (err) {
      console.error("Failed to compress image", err);
    }
  };

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    if (photoBase64) {
      formData.set("photoUrl", photoBase64);
    }

    const result = await updateVehicleCharacteristics(vehicleId, formData);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsEditing(false);
    }, 1500);
  }

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)}
        className="w-full text-center text-xs text-muted-foreground hover:text-primary py-3 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-all font-medium"
      >
        ⚙️ {t("edit_specs_photo")}
      </button>
    );
  }

  return (
    <form action={handleSubmit as any} className="mt-4 space-y-3 p-4 border border-border rounded-xl bg-muted/30 relative">
      {isFullyConfigured && (
        <button 
          type="button" 
          onClick={() => setIsEditing(false)} 
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}
      
      {/* Hidden inputs to pass validation schema */}
      {/* @ts-ignore */}
      <input type="hidden" name="make" value={defaultValues.make} />
      {/* @ts-ignore */}
      <input type="hidden" name="model" value={defaultValues.model} />
      {/* @ts-ignore */}
      <input type="hidden" name="year" value={defaultValues.year} />
      
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("characteristics") || "Specs & Photo"}</h4>
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
      
      <div className="flex flex-col gap-1 mt-2">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Vehicle Photo</label>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden" 
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition overflow-hidden relative"
        >
          {photoBase64 ? (
            <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <span className="text-xl mb-1">📸</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tap to upload photo</span>
            </>
          )}
        </div>
        <input type="hidden" name="photoUrl" value={photoBase64} />
      </div>

      {error && (
        <div className="p-2 text-[10px] bg-destructive/10 text-destructive rounded border border-destructive/20 font-bold animate-in fade-in zoom-in duration-200">
          ⚠️ {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold tracking-wide hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
           <span className="flex items-center justify-center gap-2">
             <span className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
             Saving...
           </span>
        ) : saved ? "✓ Saved!" : t("save_changes")}
      </button>
    </form>
  );
}
