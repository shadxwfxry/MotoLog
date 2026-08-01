import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Fuel, Wrench } from "lucide-react";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";
import { formatDate } from "@/shared/lib/format";
import { Badge, EmptyState, Panel, PanelTitle, PageShell } from "@/shared/ui";

const PUBLIC_LOG_LIMIT = 10;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const vehicle = await vehicleRepository.findPublicBySlug(params.slug, PUBLIC_LOG_LIMIT);
  if (!vehicle) return { title: "Vehicle Not Found" };

  return {
    title: `${vehicle.make} ${vehicle.model} (${vehicle.year}) | MotoLog`,
    description: `Public maintenance and fuel log for ${vehicle.make} ${vehicle.model}.`,
  };
}

export default async function PublicVehiclePage({ params }: { params: { slug: string } }) {
  // The repository filters on isPublic for both the vehicle and its logs, so a
  // private bike or a private entry can never reach this page.
  const vehicle = await vehicleRepository.findPublicBySlug(params.slug, PUBLIC_LOG_LIMIT);
  if (!vehicle) notFound();

  return (
    <PageShell width="md">
      {/* This is the page strangers see when a link is shared, so it leads with
          the machine rather than with a list of rows. */}
      <header className="space-y-4 text-center">
        <p className="eyebrow justify-center">Public log</p>
        <h1 className="font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">
          {vehicle.make} <span className="text-primary text-glow">{vehicle.model}</span>
        </h1>
        <div className="flex justify-center">
          <Badge tone="cyan">{vehicle.year}</Badge>
        </div>
      </header>

      <Panel corners>
        <PanelTitle icon={<Wrench size={13} strokeWidth={2.6} />}>Recent maintenance</PanelTitle>

        {vehicle.maintenanceLogs.length > 0 ? (
          <ul className="divide-y [&>li]:border-[hsl(var(--hairline))] [&>li]:py-3 first:[&>li]:pt-0 last:[&>li]:pb-0">
            {vehicle.maintenanceLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold">{log.type}</span>
                <span
                  suppressHydrationWarning
                  className="num shrink-0 text-[11px] text-muted-foreground"
                >
                  {formatDate(log.date)} · {log.odometer.toLocaleString()} km
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No maintenance logs.</p>
        )}
      </Panel>

      <Panel>
        <PanelTitle icon={<Fuel size={13} strokeWidth={2.6} />}>Recent refuels</PanelTitle>

        {vehicle.refuelingLogs.length > 0 ? (
          <ul className="divide-y [&>li]:border-[hsl(var(--hairline))] [&>li]:py-3 first:[&>li]:pt-0 last:[&>li]:pb-0">
            {vehicle.refuelingLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3">
                <span className="num text-sm font-semibold">
                  {log.liters} L
                  <span className="ml-2 text-primary">{log.cost}</span>
                </span>
                <span
                  suppressHydrationWarning
                  className="num shrink-0 text-[11px] text-muted-foreground"
                >
                  {formatDate(log.date)} · {log.odometer.toLocaleString()} km
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No refueling logs.</p>
        )}
      </Panel>

      {vehicle.maintenanceLogs.length === 0 && vehicle.refuelingLogs.length === 0 && (
        <EmptyState
          title="Nothing published yet"
          description="The owner has not made any log entries public."
        />
      )}
    </PageShell>
  );
}
