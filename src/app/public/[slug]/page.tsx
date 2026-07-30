import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";
import { formatDate } from "@/shared/lib/format";

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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">
        {vehicle.make} {vehicle.model}
      </h1>
      <p className="text-xl text-muted-foreground mb-8">Year: {vehicle.year}</p>

      <h2 className="text-2xl font-semibold mb-4">Recent Maintenance</h2>
      <ul className="mb-8 space-y-4">
        {vehicle.maintenanceLogs.map((log) => (
          <li key={log.id} className="border p-4 rounded-lg bg-card">
            <p className="font-medium">{log.type}</p>
            <p suppressHydrationWarning className="text-sm text-muted-foreground">
              {formatDate(log.date)} at {log.odometer} km
            </p>
          </li>
        ))}
        {vehicle.maintenanceLogs.length === 0 && <p>No maintenance logs.</p>}
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Recent Refuels</h2>
      <ul className="space-y-4">
        {vehicle.refuelingLogs.map((log) => (
          <li key={log.id} className="border p-4 rounded-lg bg-card">
            <p className="font-medium">
              {log.liters} L — {log.cost}
            </p>
            <p suppressHydrationWarning className="text-sm text-muted-foreground">
              {formatDate(log.date)} at {log.odometer} km
            </p>
          </li>
        ))}
        {vehicle.refuelingLogs.length === 0 && <p>No refueling logs.</p>}
      </ul>
    </div>
  );
}
