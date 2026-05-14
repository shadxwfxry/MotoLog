import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditVehicleForm } from "@/components/EditVehicleForm";
import { AddRefuelForm } from "@/components/AddRefuelForm";
import { AddMaintenanceForm } from "@/components/AddMaintenanceForm";
import { RemindersSection } from "@/components/RemindersSection";

export const dynamic = "force-dynamic";

export default async function GaragePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const vehicles = await prisma.vehicle.findMany({
    include: {
      refuelingLogs: { orderBy: { date: "desc" } },
      maintenanceLogs: { orderBy: { date: "desc" } },
      plannedMaintenances: { orderBy: { isCompleted: "asc" } },
    },
  });

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🏍 Garage</h1>
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-6xl mb-4">🏍</div>
          <p>No vehicles yet. Add your first!</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {vehicles.map((vehicle) => {
          // ── Fuel stats ──
          const refuels = vehicle.refuelingLogs;
          let avgConsumption: number | null = null;
          let costPerKm: number | null = null;

          if (refuels.length >= 2) {
            const sorted = [...refuels].sort((a, b) => a.odometer - b.odometer);
            const totalKm = sorted[sorted.length - 1].odometer - sorted[0].odometer;
            const totalLiters = sorted.slice(1).reduce((s, l) => s + l.liters, 0);
            const totalCost = sorted.reduce((s, l) => s + l.cost, 0);
            if (totalKm > 0) {
              avgConsumption = (totalLiters / totalKm) * 100;
              costPerKm = totalCost / totalKm;
            }
          }

          const currentOdometer = refuels[0]?.odometer ?? 0;

          // ── Maintenance cost ──
          const maintTotal = vehicle.maintenanceLogs.reduce((s, l) => s + l.cost, 0);

          return (
            <div key={vehicle.id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

              {/* ── Header ── */}
              <div className="px-6 pt-5 pb-4 border-b border-border">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h2 className="text-lg font-bold">{vehicle.make} {vehicle.model}</h2>
                    <p className="text-sm text-muted-foreground">{vehicle.year}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {vehicle.engineDisplacement && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 font-medium">{vehicle.engineDisplacement} cc</span>
                    )}
                    {vehicle.power && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-medium">{vehicle.power} hp</span>
                    )}
                    {vehicle.weight && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">{vehicle.weight} kg</span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                {(avgConsumption !== null || maintTotal > 0) && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {avgConsumption !== null && (
                      <>
                        <div className="rounded-xl bg-muted/40 p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">L/100km</p>
                          <p className="font-bold text-sm">{avgConsumption.toFixed(1)}</p>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">₴/km</p>
                          <p className="font-bold text-sm">{costPerKm!.toFixed(2)}</p>
                        </div>
                      </>
                    )}
                    <div className="rounded-xl bg-muted/40 p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Odometer</p>
                      <p className="font-bold text-sm">{currentOdometer.toLocaleString()} km</p>
                    </div>
                    {maintTotal > 0 && (
                      <div className="rounded-xl bg-orange-500/10 p-2.5 text-center">
                        <p className="text-xs text-muted-foreground">Maint. cost</p>
                        <p className="font-bold text-sm text-orange-400">{maintTotal.toLocaleString()} ₴</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Last service entries ── */}
              {vehicle.maintenanceLogs.length > 0 && (
                <div className="px-6 py-3 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">🔧 Last Services</p>
                  <ul className="space-y-1">
                    {vehicle.maintenanceLogs.slice(0, 3).map((log) => (
                      <li key={log.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${log.category === "repair" ? "bg-red-400" : log.category === "consumable" ? "bg-yellow-400" : "bg-blue-400"}`} />
                          <span className="text-muted-foreground truncate max-w-[160px]">{log.type}</span>
                        </div>
                        <span className="font-medium text-xs">{log.cost > 0 ? `${log.cost} ₴` : "—"} · {log.odometer.toLocaleString()} km</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Recent refuels ── */}
              {refuels.length > 0 && (
                <div className="px-6 py-3 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">⛽ Last Refuels</p>
                  <ul className="space-y-1">
                    {refuels.slice(0, 3).map((log) => (
                      <li key={log.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[160px]">
                          {log.stationName ?? "—"}{log.fuelGrade ? ` (${log.fuelGrade})` : ""}
                        </span>
                        <span className="font-medium text-xs">
                          {log.liters} L
                          {log.pricePerLiter ? ` · ${log.pricePerLiter} ₴/L` : ""}
                          {" "}· {log.cost} ₴
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Public link ── */}
              {vehicle.isPublic && (
                <div className="px-6 py-2 border-b border-border">
                  <a href={`/public/${vehicle.slug}`} target="_blank" className="text-xs text-primary hover:underline">
                    🔗 /public/{vehicle.slug}
                  </a>
                </div>
              )}

              {/* ── Forms ── */}
              <div className="px-6 pb-6 space-y-1">
                <EditVehicleForm vehicleId={vehicle.id} defaultValues={vehicle} />
                <AddRefuelForm vehicleId={vehicle.id} />
                <AddMaintenanceForm vehicleId={vehicle.id} />
                <RemindersSection
                  vehicleId={vehicle.id}
                  reminders={vehicle.plannedMaintenances}
                  currentOdometer={currentOdometer}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
