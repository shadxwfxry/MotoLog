import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";
import { statsRepository } from "@/server/repositories/statsRepository";
import { userRepository } from "@/server/repositories/userRepository";
import {
  maintenanceRepository,
  refuelRepository,
} from "@/server/repositories/logRepository";
import { formatConsumption, formatCurrency, formatDate, formatDistance } from "@/shared/lib/format";
import { serializeForClient } from "@/shared/lib/serialize";
import { EditVehicleForm } from "@/components/EditVehicleForm";
import { AddRefuelForm } from "@/components/AddRefuelForm";
import { AddMaintenanceForm } from "@/components/AddMaintenanceForm";
import { RemindersSection } from "@/components/RemindersSection";
import { VehicleActions } from "@/components/VehicleActions";
import { LogActions } from "@/components/LogActions";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { QrCodeButton } from "@/components/QrCodeButton";

import { SpecsSection } from "@/components/SpecsSection";

export const dynamic = "force-dynamic";

const LOG_PAGE_SIZE = 15;

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const user = await getOptionalAuthUser();
  if (!user) redirect("/login");

  const vehicle = await vehicleRepository.findOwnedById(params.id, user.id);
  if (!vehicle) notFound();

  const [refuelPage, maintenancePage, stats, prefs] = await Promise.all([
    refuelRepository.listByVehicle(vehicle.id, { limit: LOG_PAGE_SIZE }),
    maintenanceRepository.listByVehicle(vehicle.id, { limit: LOG_PAGE_SIZE }),
    // Consumption now comes from the same shared rule the dashboard uses, so
    // the two pages can no longer disagree about the same bike.
    statsRepository.getVehicleStats(vehicle.id),
    userRepository.findFormatPrefs(user.id),
  ]);

  const { maintenanceTotal, fuelTotal, consumption, currentOdometer } = stats;

  // Both log types render in one chronological feed.
  const history = [
    ...refuelPage.items.map((l) => ({ ...l, kind: "refuel" as const })),
    ...maintenancePage.items.map((l) => ({ ...l, kind: "maintenance" as const })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, LOG_PAGE_SIZE);

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/garage" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{vehicle.make} {vehicle.model}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Info & Forms */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 font-medium">{vehicle.year}</span>
              {vehicle.engineDisplacement && <span className="text-sm px-3 py-1 rounded-full bg-primary/15 text-primary font-medium">{vehicle.engineDisplacement} cc</span>}
              {vehicle.power && <span className="text-sm px-3 py-1 rounded-full bg-green-500/15 text-green-400 font-medium">{vehicle.power} hp</span>}
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Odometer</span>
                <span className="font-bold">{formatDistance(currentOdometer, prefs)}</span>
              </div>
              {consumption.per100 !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consumption</span>
                  <span className="font-bold text-primary">
                    {formatConsumption(consumption.per100, prefs)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Maintenance</span>
                <span className="font-bold text-orange-400">
                  {formatCurrency(maintenanceTotal, prefs)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <EditVehicleForm vehicleId={vehicle.id} defaultValues={vehicle} />
              <VehicleActions vehicleId={vehicle.id} />

              <ExportPdfButton
                vehicle={vehicle}
                refuels={serializeForClient(refuelPage.items)}
                maintenance={serializeForClient(maintenancePage.items)}
                stats={{
                  totalFuel: fuelTotal,
                  totalMaint: maintenanceTotal,
                  avgCons: consumption.per100,
                }}
              />

              <QrCodeButton vehicleId={vehicle.id} vehicleName={`${vehicle.make} ${vehicle.model}`} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <AddRefuelForm vehicleId={vehicle.id} />
              <AddMaintenanceForm vehicleId={vehicle.id} />
            </div>
          </div>

          <SpecsSection vehicleId={vehicle.id} initialSpecs={vehicle.specs} />
        </div>

        {/* Right Column: Logs & Reminders */}
        <div className="md:col-span-2 space-y-6">
          <RemindersSection
            vehicleId={vehicle.id}
            reminders={vehicle.plannedMaintenances}
            currentOdometer={currentOdometer}
          />

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="font-bold">Recent History</h3>
            </div>
            <div className="p-0">
              <div className="divide-y divide-border">
                {/*
                  One chronological feed. `kind` is a discriminated union, so
                  each branch is narrowed properly — the previous version cast
                  every field access to `any` to read type-specific columns.
                */}
                {history.map((log) => (
                  <div
                    key={log.id}
                    className={`px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between hover:bg-muted/10 transition ${
                      log.kind === "maintenance" ? "border-l-4 border-l-orange-500/50" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{log.kind === "refuel" ? "⛽" : "🔧"}</span>
                        <span className="font-medium text-sm">
                          {log.kind === "refuel" ? (log.stationName ?? "Fuel Station") : log.type}
                        </span>
                        {log.kind === "refuel" && log.fuelGrade && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted uppercase">
                            {log.fuelGrade}
                          </span>
                        )}
                        {log.kind === "maintenance" && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                              log.category === "repair"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {log.category}
                          </span>
                        )}
                      </div>
                      <p suppressHydrationWarning className="text-xs text-muted-foreground ml-7">
                        {formatDate(log.date, prefs)} · {formatDistance(log.odometer, prefs)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className={`font-bold text-sm ${log.kind === "refuel" ? "text-primary" : ""}`}>
                          {formatCurrency(log.cost, prefs)}
                        </p>
                        {log.kind === "refuel" && (
                          <p className="text-[10px] text-muted-foreground">
                            {log.liters} L · {log.pricePerLiter ?? "—"}
                          </p>
                        )}
                      </div>
                      <LogActions logId={log.id} type={log.kind} isPublic={log.isPublic} />
                    </div>
                  </div>
                ))}

                {history.length === 0 && (
                  <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                    No history records yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
