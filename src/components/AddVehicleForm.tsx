"use client";

import { useState, useRef } from "react";
import { addVehicle } from "@/features/garage/actions";
import { useLanguage } from "./LanguageProvider";
import { compressImage } from "@/lib/imageUtils";
import { addToSyncQueue } from "@/lib/offlineSync";
import { db } from "@/lib/dexie";

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
          engineDisplacement: payload.engineDisplacement ? Number(payload.engineDisplacement) : null,
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
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
      >
        + {t("add_vehicle")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{t("add_vehicle")}</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground p-2">
                ✕
              </button>
            </div>

            <form action={handleSubmit as any} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("make")}</label>
                  <input name="make" required className="w-full bg-muted rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary" placeholder="Honda, BMW..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("model")}</label>
                  <input name="model" required className="w-full bg-muted rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary" placeholder="CBR600, GS1250..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("year")}</label>
                  <input name="year" type="number" required defaultValue={new Date().getFullYear()} className="w-full bg-muted rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("type")}</label>
                  <select name="type" className="w-full bg-muted rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary">
                    <option value="motorcycle">Motorcycle</option>
                    <option value="scooter">Scooter</option>
                    <option value="atv">ATV</option>
                    <option value="car">Car</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("photo_url") || "Photo"}</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition overflow-hidden relative"
                >
                  {photoBase64 ? (
                    <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="text-2xl mb-1">📸</span>
                      <span className="text-xs font-medium text-muted-foreground">{t("tap_to_upload") || "Tap to upload photo"}</span>
                    </>
                  )}
                </div>
                <input type="hidden" name="photoUrl" value={photoBase64} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("initial_odometer") || "Initial Odometer (km)"}</label>
                <input name="initialOdometer" type="number" className="w-full bg-muted rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary" placeholder="e.g. 15000" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">cc</label>
                  <input name="engineDisplacement" type="number" className="w-full bg-muted rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">hp</label>
                  <input name="power" type="number" className="w-full bg-muted rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">kg</label>
                  <input name="weight" type="number" className="w-full bg-muted rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

              <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition">
                {t("add_vehicle")}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
