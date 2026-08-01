import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Fuel, History, Wrench, Zap } from "lucide-react";
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
import { T } from "@/components/T";
import { Badge, EmptyState, Panel, PanelTitle, PageShell, StatTile } from "@/shared/ui";

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
    <PageShell>
      {/* ── Masthead ── */}
      <div className="space-y-5">
        <Link
          href="/garage"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft size={14} strokeWidth={2.8} />
          <T k="garage" />
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
              {vehicle.make} <span className="text-primary text-glow">{vehicle.model}</span>
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="cyan">{vehicle.year}</Badge>
              {vehicle.engineDisplacement && (
                <Badge tone="primary">{vehicle.engineDisplacement} cc</Badge>
              )}
              {vehicle.power && <Badge tone="lime">{vehicle.power} hp</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Headline readouts ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatTile
          label={<T k="odometer" />}
          value={formatDistance(currentOdometer, prefs)}
          tone="primary"
        />
        <StatTile
          label={<T k="consumption" />}
          value={consumption.per100 !== null ? formatConsumption(consumption.per100, prefs) : "—"}
          tone="lime"
        />
        <StatTile
          label={<T k="maintenance" />}
          value={formatCurrency(maintenanceTotal, prefs)}
          tone="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Left rail ── */}
        <div className="space-y-5 lg:col-span-1">
          <Panel>
            <PanelTitle icon={<Zap size={13} strokeWidth={2.6} />}>
              <T k="quick_actions" />
            </PanelTitle>
            {/* Both forms open on the bike's current odometer, so the ±100/±1k
                steppers move from the real reading instead of from zero. */}
            <div className="space-y-2">
              <AddRefuelForm vehicleId={vehicle.id} currentOdometer={currentOdometer} />
              <AddMaintenanceForm vehicleId={vehicle.id} currentOdometer={currentOdometer} />
            </div>
          </Panel>

          <Panel>
            <PanelTitle icon={<Wrench size={13} strokeWidth={2.6} />}>
              <T k="manage" />
            </PanelTitle>
            {/* Destructive actions come last. Previously "Danger zone" sat in
                the middle of the rail with Export and QR below it, which read
                as though those two were also destructive. */}
            <div className="space-y-2">
              <EditVehicleForm vehicleId={vehicle.id} defaultValues={vehicle} />
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
              <QrCodeButton
                vehicleId={vehicle.id}
                vehicleName={`${vehicle.make} ${vehicle.model}`}
              />
              <VehicleActions vehicleId={vehicle.id} />
            </div>
          </Panel>

          <SpecsSection vehicleId={vehicle.id} initialSpecs={vehicle.specs} />
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-5 lg:col-span-2">
          <Panel>
            <RemindersSection
              vehicleId={vehicle.id}
              reminders={vehicle.plannedMaintenances}
              currentOdometer={currentOdometer}
            />
          </Panel>

          <Panel padding="none">
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
              <PanelTitle icon={<History size={13} strokeWidth={2.6} />}>
                <T k="recent_history" />
              </PanelTitle>
            </div>

            {history.length === 0 ? (
              <div className="px-6 pb-8">
                <EmptyState
                  icon={<History size={40} strokeWidth={1.5} />}
                  title={<T k="no_records_yet" />}
                  description={<T k="no_records_desc" />}
                />
              </div>
            ) : (
              <ul className="divide-y [&>li]:border-[hsl(var(--hairline))]">
                {/*
                  One chronological feed. `kind` is a discriminated union, so
                  each branch is narrowed properly — the previous version cast
                  every field access to `any` to read type-specific columns.
                */}
                {history.map((log) => {
                  const isRefuel = log.kind === "refuel";

                  return (
                    <li
                      key={log.id}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-foreground/[0.03] sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                            isRefuel
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-signal-cyan/30 bg-signal-cyan/10 text-signal-cyan"
                          }`}
                        >
                          {isRefuel ? (
                            <Fuel size={15} strokeWidth={2.4} />
                          ) : (
                            <Wrench size={15} strokeWidth={2.4} />
                          )}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">
                              {log.kind === "refuel"
                                ? (log.stationName ?? "Fuel station")
                                : log.type}
                            </span>
                            {log.kind === "refuel" && log.fuelGrade && (
                              <Badge tone="default" className="px-2 py-0.5">
                                {log.fuelGrade}
                              </Badge>
                            )}
                            {log.kind === "maintenance" && (
                              <Badge
                                tone={log.category === "repair" ? "rose" : "cyan"}
                                className="px-2 py-0.5"
                              >
                                {log.category}
                              </Badge>
                            )}
                          </div>
                          <p
                            suppressHydrationWarning
                            className="num mt-0.5 truncate text-[11px] text-muted-foreground"
                          >
                            {formatDate(log.date, prefs)} · {formatDistance(log.odometer, prefs)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p
                            className={`num text-sm font-bold ${isRefuel ? "text-primary" : ""}`}
                          >
                            {formatCurrency(log.cost, prefs)}
                          </p>
                          {log.kind === "refuel" && (
                            <p className="num text-[10px] text-muted-foreground">
                              {log.liters} L · {log.pricePerLiter ?? "—"}
                            </p>
                          )}
                        </div>
                        <LogActions logId={log.id} type={log.kind} isPublic={log.isPublic} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
