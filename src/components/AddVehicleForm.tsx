"use client";

import { useState, useRef } from "react";
import { Camera, Plus } from "lucide-react";
import { addVehicle } from "@/features/garage/actions";
import { useLanguage } from "./LanguageProvider";
import { compressImage } from "@/lib/imageUtils";
import { addToSyncQueue } from "@/lib/offlineSync";
import { db } from "@/lib/dexie";
import { FormField, Modal } from "@/shared/ui";

export function AddVehicleForm() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string>("");
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
    setError(null);
    setLoading(true);

    if (photoBase64) {
      formData.set("photoUrl", photoBase64);
    }

    if (typeof window !== "undefined" && !navigator.onLine) {
      const payload: Record<string, string> = {};
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });

      const tempId = `temp_${Date.now()}`;
      payload.tempId = tempId;

      try {
        await addToSyncQueue("ADD_VEHICLE", payload);
        await db.vehicles.put({
          id: tempId,
          make: payload.make,
          model: payload.model,
          year: Number(payload.year),
          engineDisplacement: payload.engineDisplacement
            ? Number(payload.engineDisplacement)
            : null,
          photoUrl: photoBase64 || null,
          brandName: payload.brandName || null,
          slug: tempId,
          refuelingLogs: [],
          maintenanceLogs: [],
          plannedMaintenances: [],
          specs: null,
        });
        setIsOpen(false);
        setPhotoBase64("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save offline");
      } finally {
        setLoading(false);
      }
      return;
    }

    const result = await addVehicle(formData);
    setLoading(false);

    // The old action returned `{ error }` for validation failures while this
    // component only caught thrown errors, so an invalid form closed the dialog
    // as though it had saved.
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setIsOpen(false);
    setPhotoBase64("");
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary h-11 px-5">
        <Plus size={15} strokeWidth={3} />
        {t("add_vehicle")}
      </button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title={t("add_vehicle")}>
        <form action={handleSubmit as any} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("make")}>
              <input name="make" required className="field" placeholder="Honda, BMW…" />
            </FormField>
            <FormField label={t("model")}>
              <input name="model" required className="field" placeholder="CBR600, GS1250…" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("year")}>
              <input
                name="year"
                type="number"
                required
                defaultValue={new Date().getFullYear()}
                className="field num"
              />
            </FormField>
            <FormField label={t("type")}>
              <select name="type" className="field cursor-pointer appearance-none">
                <option value="motorcycle">Motorcycle</option>
                <option value="scooter">Scooter</option>
                <option value="atv">ATV</option>
                <option value="car">Car</option>
              </select>
            </FormField>
          </div>

          {/* Photo upload */}
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
              className="relative flex h-36 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-md border border-dashed transition-all hover:border-primary/50 hover:bg-primary/[0.04] [border-color:hsl(var(--hairline))]"
            >
              {photoBase64 ? (
                <img src={photoBase64} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <>
                  <Camera size={22} strokeWidth={1.8} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("tap_to_upload")}
                  </span>
                </>
              )}
            </button>
            <input type="hidden" name="photoUrl" value={photoBase64} />
          </div>

          <FormField label={t("initial_odometer")}>
            <input
              name="initialOdometer"
              type="number"
              className="field num"
              placeholder="15000"
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="cc">
              <input name="engineDisplacement" type="number" className="field num" />
            </FormField>
            <FormField label="hp">
              <input name="power" type="number" className="field num" />
            </FormField>
            <FormField label="kg">
              <input name="weight" type="number" className="field num" />
            </FormField>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary h-12 w-full">
            {loading ? `${t("loading")}…` : t("add_vehicle")}
          </button>
        </form>
      </Modal>
    </>
  );
}
