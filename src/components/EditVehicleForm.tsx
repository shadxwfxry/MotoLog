"use client";

import { useState, useRef } from "react";
import { Camera, Check, Settings2, X } from "lucide-react";
import { updateVehicleCharacteristics } from "@/features/garage/actions";
import { useLanguage } from "./LanguageProvider";
import { compressImage } from "@/lib/imageUtils";
import { FormField } from "@/shared/ui";

interface Props {
  vehicleId: string;
  defaultValues: {
    // `make`/`model`/`year` are re-submitted as hidden fields because the
    // action validates the whole vehicle schema. They were read off this object
    // behind three `@ts-ignore` comments; declaring them is the actual fix.
    make: string;
    model: string;
    year: number;
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

  const isFullyConfigured =
    defaultValues.engineDisplacement && defaultValues.power && defaultValues.weight;
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
      <button onClick={() => setIsEditing(true)} className="btn-ghost h-11 w-full">
        <Settings2 size={14} strokeWidth={2.4} />
        {t("edit_specs_photo")}
      </button>
    );
  }

  return (
    <form
      action={handleSubmit as any}
      className="relative space-y-4 rounded-md border bg-background/40 p-4 [border-color:hsl(var(--hairline))]"
    >
      {isFullyConfigured && (
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          aria-label={t("close")}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        >
          <X size={15} strokeWidth={2.6} />
        </button>
      )}

      {/* Re-submitted unchanged so the action's schema validates. */}
      <input type="hidden" name="make" value={defaultValues.make} />
      <input type="hidden" name="model" value={defaultValues.model} />
      <input type="hidden" name="year" value={defaultValues.year} />

      <p className="label-micro">{t("characteristics")}</p>

      {/* Unit symbols rather than the translated names: "Мощность (л.с.)" and
          "Вес (кг)" are far too wide for a third of this rail and ran into each
          other. The same three fields read as cc/hp/kg when adding a vehicle. */}
      <div className="grid grid-cols-3 gap-2">
        <FormField label="cc">
          <input
            name="engineDisplacement"
            type="number"
            min="0"
            defaultValue={defaultValues.engineDisplacement ?? ""}
            className="field num py-2.5"
          />
        </FormField>
        <FormField label="hp">
          <input
            name="power"
            type="number"
            min="0"
            defaultValue={defaultValues.power ?? ""}
            className="field num py-2.5"
          />
        </FormField>
        <FormField label="kg">
          <input
            name="weight"
            type="number"
            min="0"
            defaultValue={defaultValues.weight ?? ""}
            className="field num py-2.5"
          />
        </FormField>
      </div>

      <div className="space-y-1.5">
        <span className="label-micro">{t("photo_url")}</span>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex h-28 w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-md border border-dashed transition-all hover:border-primary/50 hover:bg-primary/[0.04] [border-color:hsl(var(--hairline))]"
        >
          {photoBase64 ? (
            <img src={photoBase64} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <>
              <Camera size={18} strokeWidth={1.8} className="text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {t("tap_to_upload")}
              </span>
            </>
          )}
        </button>
        <input type="hidden" name="photoUrl" value={photoBase64} />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary h-11 w-full">
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("loading")}…
          </>
        ) : saved ? (
          <>
            <Check size={14} strokeWidth={3} />
            {t("save_changes")}
          </>
        ) : (
          t("save_changes")
        )}
      </button>
    </form>
  );
}
