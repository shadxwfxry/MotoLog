"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { AddVehicleForm } from "@/components/AddVehicleForm";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/dexie";
import { cacheVehiclesLocally } from "@/lib/offlineSync";
import { useEffect } from "react";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  engineDisplacement: number | null;
  photoUrl: string | null;
  brandName: string | null;
  refuelingLogs: { odometer: number }[];
};

export function GarageClient({ vehicles }: { vehicles: Vehicle[] }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.onLine) {
      cacheVehiclesLocally(vehicles);
    }
  }, [vehicles]);

  const cachedVehicles = useLiveQuery(() => db.vehicles.toArray());
  const displayedVehicles = (cachedVehicles !== undefined && cachedVehicles.length > 0) ? (cachedVehicles as any[]) : vehicles;

  const handleShare = (slug: string) => {
    const url = `${window.location.origin}/public/${slug}`;
    navigator.clipboard.writeText(url);
    alert(t("link_copied") || "Link copied to clipboard!");
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight uppercase">{t("go_garage")}</h1>
        <AddVehicleForm />
      </div>

      {displayedVehicles.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border-2 border-dashed border-border/50">
          <div className="text-7xl mb-6 grayscale opacity-20">🏍️</div>
          <p className="text-xl font-medium text-muted-foreground">{t("garage_empty")}</p>
          <p className="text-sm text-muted-foreground mt-2">{t("start_adding")}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {displayedVehicles.map((vehicle) => {
            const lastOdo = vehicle.refuelingLogs[0]?.odometer ?? 0;
            return (
              <div key={vehicle.id} className="group relative block rounded-3xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
                <Link href={`/garage/${vehicle.id}`} className="block">
                  <div className="h-48 w-full bg-muted relative overflow-hidden">
                    {vehicle.photoUrl ? (
                      <img src={vehicle.photoUrl} alt={vehicle.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                         <span className="text-6xl grayscale opacity-20 select-none">🏍️</span>
                         {vehicle.brandName && <span className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-tighter text-white border border-white/10">{vehicle.brandName}</span>}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-6">
                       <h2 className="text-xl font-bold text-white uppercase tracking-tight">{vehicle.make} {vehicle.model}</h2>
                       <p className="text-xs text-white/70 font-medium tracking-widest">{vehicle.year} · {vehicle.engineDisplacement}cc</p>
                    </div>
                  </div>
                </Link>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("last_odometer")}</p>
                      <p className="text-lg font-black">{lastOdo.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">km</span></p>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          // In a real app we'd need the slug here. 
                          // Let's assume we can share by ID or add slug to types.
                          handleShare(vehicle.id); 
                        }}
                        className="p-2 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                        title={t("share") || "Share"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 right-4">
                   <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
