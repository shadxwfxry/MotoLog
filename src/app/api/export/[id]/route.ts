import { NextResponse } from "next/server";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";

/**
 * Escapes a CSV cell and defuses formula injection: a value starting with
 * =, +, - or @ is executed as a formula when the file is opened in Excel or
 * Sheets, so it is prefixed with an apostrophe.
 */
const sanitizeCSV = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const stringified = String(value).replace(/"/g, '""');
  return /^[=+\-@]/.test(stringified) ? `'${stringified}` : stringified;
};

/** Strips characters that would break out of the Content-Disposition filename. */
const sanitizeFilename = (value: string) => value.replace(/[^\w.-]+/g, "_");

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getOptionalAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicle = await vehicleRepository.findOwnedForExport(params.id, user.id);
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const logs = [
    ...vehicle.refuelingLogs.map((l) => ({
      date: l.date,
      type: "Refuel",
      odometer: l.odometer,
      description: `${l.liters}L at ${l.stationName || "Unknown"}`,
      cost: l.cost,
    })),
    ...vehicle.maintenanceLogs.map((l) => ({
      date: l.date,
      type: `Service: ${l.type}`,
      odometer: l.odometer,
      description: l.description || "",
      cost: l.cost,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const rows = logs.map(
    (l) =>
      `"${l.date.toISOString().slice(0, 10)}","${sanitizeCSV(l.type)}","${l.odometer}","${sanitizeCSV(l.description)}","${l.cost}"`,
  );

  const csv = ["Date,Type,Odometer,Description,Cost", ...rows].join("\n");
  const filename = sanitizeFilename(`motolog_${vehicle.make}_${vehicle.model}_export`);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
