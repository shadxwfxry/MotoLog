"use client";

import { useState } from "react";
import { addVehicle } from "@/lib/actions/vehicle";
import { useLanguage } from "./LanguageProvider";

export function AddVehicleForm() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await addVehicle(formData);
      setIsOpen(false);
    } catch (e: any) {
      setError(e.message);
    }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{t("add_vehicle")}</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
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

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Photo URL</label>
                <input name="photoUrl" type="url" className="w-full bg-muted rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary" placeholder="https://example.com/bike.jpg" />
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
