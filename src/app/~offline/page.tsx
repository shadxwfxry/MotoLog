"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Bike, CloudOff, Fuel } from "lucide-react";
import { db } from "@/lib/dexie";
import { useLanguage } from "@/components/LanguageProvider";
import { AddRefuelForm } from "@/components/AddRefuelForm";
import { AddMaintenanceForm } from "@/components/AddMaintenanceForm";
import { AddVehicleForm } from "@/components/AddVehicleForm";
import { EmptyState, Panel, PanelTitle, PageShell } from "@/shared/ui";
import { Skeleton, SkeletonPanel } from "@/shared/ui/Skeleton";
import { cn } from "@/lib/utils";

export default function OfflinePage() {
  const { t } = useLanguage();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const vehicles = useLiveQuery(() => db.vehicles.toArray());

  // Determine active vehicle (defaults to first cached vehicle or selected one)
  const activeVehicle =
    vehicles && vehicles.length > 0
      ? (vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0])
      : null;

  return (
    <PageShell>
      <Panel corners className="border-signal-amber/30 bg-signal-amber/[0.06]">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-signal-amber/30 bg-signal-amber/10 text-signal-amber">
            <CloudOff size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 space-y-1.5">
            <h1 className="font-display text-lg font-black uppercase tracking-tight text-signal-amber">
              {t("offline_mode")}
            </h1>
            <p className="text-xs leading-relaxed text-muted-foreground">{t("offline_desc")}</p>
          </div>
        </div>
      </Panel>

      {vehicles === undefined ? (
        <div className="grid gap-5 md:grid-cols-3">
          <SkeletonPanel className="p-0 md:col-span-2">
            <Skeleton className="h-52 w-full rounded-b-none" />
            <div className="space-y-3 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </SkeletonPanel>
          <SkeletonPanel>
            <Skeleton className="mb-4 h-3 w-28" />
            <Skeleton className="h-14 w-full" />
          </SkeletonPanel>
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={<Bike size={48} strokeWidth={1.5} />}
          title={t("cache_empty")}
          description={t("cache_empty_desc")}
          action={<AddVehicleForm />}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-5 md:col-span-2">
            {activeVehicle && (
              <Panel padding="none" className="overflow-hidden">
                <div className="relative h-52 w-full">
                  {activeVehicle.photoUrl ? (
                    <img
                      src={activeVehicle.photoUrl}
                      alt={activeVehicle.model}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-grid-fine bg-grid">
                      <Bike size={64} strokeWidth={1} className="text-foreground/10" />
                    </div>
                  )}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent"
                  />
                  <div className="absolute bottom-4 left-5 right-5">
                    <h2 className="font-display text-xl font-black uppercase leading-none tracking-tight">
                      {activeVehicle.make}{" "}
                      <span className="text-primary">{activeVehicle.model}</span>
                    </h2>
                    <p className="num mt-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {activeVehicle.year} · {activeVehicle.engineDisplacement ?? "—"} cc
                    </p>
                  </div>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                  <div>
                    <PanelTitle>{t("quick_actions")}</PanelTitle>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AddRefuelForm vehicleId={activeVehicle.id} />
                      <AddMaintenanceForm vehicleId={activeVehicle.id} />
                    </div>
                  </div>

                  <div>
                    <PanelTitle icon={<Fuel size={13} strokeWidth={2.6} />}>
                      {t("last_refuels")}
                    </PanelTitle>

                    {activeVehicle.refuelingLogs && activeVehicle.refuelingLogs.length > 0 ? (
                      <div className="space-y-2">
                        {activeVehicle.refuelingLogs.map((log: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 rounded-md bg-foreground/[0.04] px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-semibold">
                                {log.stationName || t("refuel")}
                              </p>
                              <p className="num text-[10px] text-muted-foreground">
                                {log.odometer.toLocaleString()} km
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="num text-sm font-black text-primary">{log.cost}</p>
                              <p className="num text-[10px] text-muted-foreground">
                                {log.liters} L
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground [border-color:hsl(var(--hairline))]">
                        {t("no_cached_refuels")}
                      </p>
                    )}
                  </div>
                </div>
              </Panel>
            )}
          </div>

          <Panel>
            <PanelTitle action={<AddVehicleForm />}>{t("your_vehicles")}</PanelTitle>

            <div className="space-y-2">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-all duration-200",
                    activeVehicle?.id === v.id
                      ? "border-primary/40 bg-primary/[0.07]"
                      : "text-muted-foreground hover:text-foreground [border-color:hsl(var(--hairline))]",
                  )}
                >
                  <Bike
                    size={18}
                    strokeWidth={2.2}
                    className={activeVehicle?.id === v.id ? "text-primary" : ""}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-sm font-bold uppercase tracking-tight">
                      {v.make} {v.model}
                    </span>
                    <span className="num block text-[10px] text-muted-foreground">{v.year}</span>
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </PageShell>
  );
}
