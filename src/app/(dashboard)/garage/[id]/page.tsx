import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EditVehicleForm } from "@/components/EditVehicleForm";
import { AddRefuelForm } from "@/components/AddRefuelForm";
import { AddMaintenanceForm } from "@/components/AddMaintenanceForm";
import { RemindersSection } from "@/components/RemindersSection";
import { VehicleActions } from "@/components/VehicleActions";
import { LogActions } from "@/components/LogActions";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // 1. Fetch basic info and LATEST 10 logs for display (Optimized take)
  const vehicle = await prisma.vehicle.findUnique({
    where: { 
      id: params.id,
      userId: session.user.id 
    },
    include: {
      refuelingLogs: { orderBy: { date: "desc" }, take: 10 },
      maintenanceLogs: { orderBy: { date: "desc" }, take: 10 },
      plannedMaintenances: { orderBy: { isCompleted: "asc" } },
    },
  });

  if (!vehicle) notFound();

  // 2. Aggregate stats directly in DB (Memory efficient)
  const [maintStats, allRefuels] = await Promise.all([
    prisma.maintenanceLog.aggregate({
      where: { vehicleId: vehicle.id },
      _sum: { cost: true }
    }),
    prisma.refuelingLog.findMany({
      where: { vehicleId: vehicle.id },
      select: { odometer: true, liters: true, cost: true },
      orderBy: { odometer: "asc" }
    })
  ]);

  const maintTotal = maintStats._sum.cost || 0;

  // 3. Calculate consumption
  let avgConsumption: number | null = null;
  let costPerKm: number | null = null;

  if (allRefuels.length >= 2) {
    const totalKm = allRefuels[allRefuels.length - 1].odometer - allRefuels[0].odometer;
    const totalLiters = allRefuels.slice(1).reduce((s, l) => s + l.liters, 0);
    const totalCost = allRefuels.reduce((s, l) => s + l.cost, 0);
    if (totalKm > 0) {
      avgConsumption = (totalLiters / totalKm) * 100;
      costPerKm = totalCost / totalKm;
    }
  }

  const currentOdometer = allRefuels.length > 0 
    ? allRefuels[allRefuels.length - 1].odometer 
    : 0;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/garage" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h1>
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
                <span className="font-bold">{currentOdometer.toLocaleString()} km</span>
              </div>
              {avgConsumption !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consumption</span>
                  <span className="font-bold text-primary">{avgConsumption.toFixed(1)} L/100km</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Maintenance</span>
                <span className="font-bold text-orange-400">{maintTotal.toLocaleString()} ₴</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <EditVehicleForm vehicleId={vehicle.id} defaultValues={vehicle} />
              {vehicle.isPublic && (
                <a href={`/public/${vehicle.slug}`} target="_blank" className="block text-center text-xs text-primary hover:underline py-2 bg-primary/5 rounded-xl border border-primary/20">
                  🔗 Public Page
                </a>
              )}
              <VehicleActions vehicleId={vehicle.id} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <AddRefuelForm vehicleId={vehicle.id} />
              <AddMaintenanceForm vehicleId={vehicle.id} />
            </div>
          </div>
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
                {/* Refuels */}
                {vehicle.refuelingLogs.map(log => (
                  <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/10 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⛽</span>
                        <span className="font-medium text-sm">{log.stationName ?? "Fuel Station"}</span>
                        {log.fuelGrade && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted uppercase">{log.fuelGrade}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground ml-7">{new Date(log.date).toLocaleDateString()} · {log.odometer.toLocaleString()} km</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="font-bold text-sm text-primary">{log.cost} ₴</p>
                        <p className="text-[10px] text-muted-foreground">{log.liters} L · {log.pricePerLiter} ₴/L</p>
                      </div>
                      <LogActions logId={log.id} type="refuel" isPublic={log.isPublic} />
                    </div>
                  </div>
                ))}
                
                {/* Maintenance */}
                {vehicle.maintenanceLogs.map(log => (
                  <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/10 transition border-l-4 border-l-orange-500/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔧</span>
                        <span className="font-medium text-sm">{log.type}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${log.category === 'repair' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {log.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-7">{new Date(log.date).toLocaleDateString()} · {log.odometer.toLocaleString()} km</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="font-bold text-sm">{log.cost} ₴</p>
                      </div>
                      <LogActions logId={log.id} type="maintenance" isPublic={log.isPublic} />
                    </div>
                  </div>
                ))}

                {(vehicle.refuelingLogs.length === 0 && vehicle.maintenanceLogs.length === 0) && (
                  <div className="px-6 py-12 text-center text-muted-foreground italic text-sm">
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
