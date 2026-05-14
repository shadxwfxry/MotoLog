import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GarageClient } from "./GarageClient";

export const dynamic = "force-dynamic";

export default async function GaragePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    include: {
      refuelingLogs: { orderBy: { odometer: "desc" }, take: 1 },
    },
  });

  return <GarageClient vehicles={vehicles} />;
}
