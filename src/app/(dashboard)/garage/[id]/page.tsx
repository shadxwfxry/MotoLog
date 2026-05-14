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
import { ExportPdfButton } from "@/components/ExportPdfButton";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const vehicle = await prisma.vehicle.findUnique({
    where: { 
      id: params.id,
      userId: session.user.id 
    },
    include: {
      refuelingLogs: { orderBy: { date: "desc" }, take: 15 },
      maintenanceLogs: { orderBy: { date: "desc" }, take: 15 },
      plannedMaintenances: { orderBy: { isCompleted: "asc" } },
    },
  });

  if (!vehicle) notFound();

  const [maintStats, fuelStats, firstRefuel] = await Promise.all([
    prisma.maintenanceLog.aggregate({
      where: { vehicleId: vehicle.id },
      _sum: { cost: true }
    }),
    prisma.refuelingLog.aggregate({
      where: { vehicleId: vehicle.id },
      _sum: { cost: true, liters: true },
      _min: { odometer: true },
      _max: { odometer: true },
      _count: true
    }),
    prisma.refuelingLog.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { odometer: "asc" },
      select: { liters: true }
    })
  ]);

  const maintTotal = maintStats._sum.cost || 0;
  const fuelTotal = fuelStats._sum.cost || 0;

  let avgConsumption: number | null = null;
  if (fuelStats._count >= 2) {
    const totalKm = (fuelStats._max.odometer || 0) - (fuelStats._min.odometer || 0);
    const totalLiters = (fuelStats._sum.liters || 0) - (firstRefuel?.liters || 0);
    if (totalKm > 0) {
      avgConsumption = (totalLiters / totalKm) * 100;
    }
  }

  const currentOdometer = fuelStats._max.odometer || 0;

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
                <span className="font-bold">{currentOdometer.toLocaleString()} km</span>
              </div>
              {avgConsumption !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consumption</span>
                  <span className="font-bold text-primary">{avgConsumption.toFixed(1)} L/100km</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Maintenance</span>
                <span className="font-bold text-orange-400">{maintTotal.toLocaleString()} ₴</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <EditVehicleForm vehicleId={vehicle.id} defaultValues={vehicle} />
              <VehicleActions vehicleId={vehicle.id} />
              
              <ExportPdfButton 
                vehicle={vehicle} 
                refuels={vehicle.refuelingLogs} 
                maintenance={vehicle.maintenanceLogs}
                stats={{
                  totalFuel: fuelTotal,
                  totalMaint: maintTotal,
                  avgCons: avgConsumption
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
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
                {/* Combined logs - show latest 10 for UI performance */}
                {[
                  ...vehicle.refuelingLogs.map(l => ({ ...l, type_group: 'refuel' })),
                  ...vehicle.maintenanceLogs.map(l => ({ ...l, type_group: 'maintenance' }))
                ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 15)
                .map(log => (
                  <div key={log.id} className={`px-6 py-4 flex items-center justify-between hover:bg-muted/10 transition ${log.type_group === 'maintenance' ? 'border-l-4 border-l-orange-500/50' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{log.type_group === 'refuel' ? '⛽' : '🔧'}</span>
                        <span className="font-medium text-sm">
                          {log.type_group === 'refuel' ? ((log as any).stationName ?? "Fuel Station") : (log as any).type}
                        </span>
                        {log.type_group === 'refuel' && (log as any).fuelGrade && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted uppercase">{(log as any).fuelGrade}</span>}
                        {log.type_group === 'maintenance' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${(log as any).category === 'repair' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {(log as any).category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground ml-7">{new Date(log.date).toLocaleDateString()} · {log.odometer.toLocaleString()} km</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className={`font-bold text-sm ${log.type_group === 'refuel' ? 'text-primary' : ''}`}>{log.cost} ₴</p>
                        {log.type_group === 'refuel' && (
                          <p className="text-[10px] text-muted-foreground">{(log as any).liters} L · {(log as any).pricePerLiter} ₴/L</p>
                        )}
                      </div>
                      <LogActions logId={log.id} type={log.type_group as any} isPublic={log.isPublic} />
                    </div>
                  </div>
                ))}

                {(vehicle.refuelingLogs.length === 0 && vehicle.maintenanceLogs.length === 0) && (
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
