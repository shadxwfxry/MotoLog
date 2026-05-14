import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    include: { vehicles: true },
  });

  const vehicleIds = user?.vehicles.map((v) => v.id) ?? [];

  const [refuels, maintenance] = await Promise.all([
    prisma.refuelingLog.findMany({
      where: { vehicleId: { in: vehicleIds } },
      orderBy: { date: "desc" },
      include: { vehicle: true },
    }),
    prisma.maintenanceLog.findMany({
      where: { vehicleId: { in: vehicleIds } },
      orderBy: { date: "desc" },
      include: { 
        vehicle: true,
        parts: true 
      },
    }),
  ]);

  return <DashboardClient refuels={refuels} maintenance={maintenance} />;
}
