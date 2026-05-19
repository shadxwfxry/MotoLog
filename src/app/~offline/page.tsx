"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/dexie";
import { useLanguage } from "@/components/LanguageProvider";
import { AddRefuelForm } from "@/components/AddRefuelForm";
import { AddMaintenanceForm } from "@/components/AddMaintenanceForm";
import { AddVehicleForm } from "@/components/AddVehicleForm";
import { useState } from "react";

export default function OfflinePage() {
  const { t, lang } = useLanguage();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const vehicles = useLiveQuery(() => db.vehicles.toArray());

  // Determine active vehicle (defaults to first cached vehicle or selected one)
  const activeVehicle = vehicles && vehicles.length > 0 
    ? (vehicles.find(v => v.id === selectedVehicleId) || vehicles[0]) 
    : null;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8 pb-24">
      {/* Offline Alert Header Banner */}
      <div className="rounded-3xl bg-amber-500/10 border border-amber-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold flex items-center gap-2 text-amber-500">
            ⚠️ {lang === "uk" ? "Автономний режим" : lang === "ru" ? "Автономный режим" : "Offline Mode"}
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === "uk" 
              ? "Ви поза мережею. Відображаються останні кэшовані дані на цьому пристрої. Нові записи будуть збережені та синхронізовані, коли з'явиться інтернет."
              : lang === "ru"
              ? "Вы вне сети. Отображаются последние кэшированные данные на этом устройстве. Новые записи будут сохранены и синхронизированы при подключении к сети."
              : "You are offline. Showing last cached data. New entries will be saved and synchronized once connection is restored."}
          </p>
        </div>
      </div>

      {vehicles === undefined ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border-2 border-dashed border-border/50 max-w-md mx-auto space-y-6">
          <div className="text-7xl grayscale opacity-20">🏍️</div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold">
              {lang === "uk" ? "Локальний кэш порожній" : lang === "ru" ? "Локальный кэш пуст" : "Local cache is empty"}
            </h2>
            <p className="text-xs text-muted-foreground px-6">
              {lang === "uk"
                ? "Створіть свій перший мотоцикл оффлайн, щоб почати вести лог заправок та ТО!"
                : lang === "ru"
                ? "Создайте свой первый мотоцикл оффлайн, чтобы начать вести лог заправок и ТО!"
                : "Create your first vehicle offline to start logging refueling and maintenance!"}
            </p>
          </div>
          <div className="flex justify-center">
            <AddVehicleForm />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Active vehicle offline logs & summary */}
          <div className="md:col-span-2 space-y-6">
            {activeVehicle && (
              <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg">
                <div className="h-48 w-full bg-muted relative overflow-hidden">
                  {activeVehicle.photoUrl ? (
                    <img src={activeVehicle.photoUrl} alt={activeVehicle.model} className="w-full h-full object-cover animate-fade-in" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <span className="text-6xl grayscale opacity-20 select-none">🏍️</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-6">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                      {activeVehicle.make} {activeVehicle.model}
                    </h2>
                    <p className="text-xs text-white/70 font-medium tracking-widest">
                      {activeVehicle.year} · {activeVehicle.engineDisplacement}cc
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Forms for quick logging */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "uk" ? "Швидкі записи" : lang === "ru" ? "Быстрые записи" : "Quick Actions"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <AddRefuelForm vehicleId={activeVehicle.id} />
                      <AddMaintenanceForm vehicleId={activeVehicle.id} />
                    </div>
                  </div>

                  {/* Logs list fallback */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {lang === "uk" ? "Останні заправки" : lang === "ru" ? "Последние заправки" : "Last Refuelings"}
                    </h3>
                    {activeVehicle.refuelingLogs && activeVehicle.refuelingLogs.length > 0 ? (
                      <div className="space-y-2">
                        {activeVehicle.refuelingLogs.map((log: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-muted/40 border border-border/40 text-sm hover:bg-muted/60 transition-colors">
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{log.stationName || t("refuel")}</p>
                              <p className="text-[10px] text-muted-foreground font-medium">{log.odometer.toLocaleString()} km</p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-black text-primary">{log.cost} ₴</p>
                              <p className="text-[10px] text-muted-foreground font-semibold">{log.liters} L</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-muted/10 border border-dashed border-border/40 rounded-2xl">
                        <p className="text-xs text-muted-foreground italic">
                          {lang === "uk" ? "Немає записів заправок" : lang === "ru" ? "Нет записей заправок" : "No refueling logs cached."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar vehicles selector list */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {lang === "uk" ? "Техніка в гаражі" : lang === "ru" ? "Техника в гараже" : "Your Vehicles"}
                </h3>
                <AddVehicleForm />
              </div>
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                      activeVehicle?.id === v.id
                        ? "border-primary/40 bg-primary/5 text-foreground shadow-sm shadow-primary/5"
                        : "border-border/50 bg-muted/10 hover:border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-2xl">🏍️</span>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight">{v.make} {v.model}</h4>
                      <p className="text-[10px] font-semibold">{v.year}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
