import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sanitizeCSV = (str: string | number | null) => {
  if (str === null || str === undefined) return "";
  const stringified = String(str).replace(/"/g, '""');
  // If starts with dangerous characters (=, +, -, @), prepend an apostrophe for safety against CSV Injection
  return /^[=+\-@]/.test(stringified) ? `'${stringified}` : stringified;
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: {
      refuelingLogs: { orderBy: { date: "asc" } },
      maintenanceLogs: { orderBy: { date: "asc" }, include: { parts: true } }
    }
  });

  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  let csv = "Date,Type,Odometer,Description,Cost\n";

  // Combine and sort logs
  const logs = [
    ...vehicle.refuelingLogs.map(l => ({
      date: l.date,
      type: "Refuel",
      odo: l.odometer,
      desc: `${l.liters}L at ${l.stationName || "Unknown"}`,
      cost: l.cost
    })),
    ...vehicle.maintenanceLogs.map(l => ({
      date: l.date,
      type: `Service: ${l.type}`,
      odo: l.odometer,
      desc: l.description || "",
      cost: l.cost
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  logs.forEach(l => {
    csv += `"${l.date.toLocaleDateString()}","${sanitizeCSV(l.type)}","${l.odo}","${sanitizeCSV(l.desc)}","${l.cost}"\n`;
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="motolog_${vehicle.make}_${vehicle.model}_export.csv"`
    }
  });
}
