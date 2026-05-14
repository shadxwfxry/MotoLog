import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function verifyVehicleOwnership(vehicleId: string, userId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { userId: true },
  });
  if (!vehicle || vehicle.userId !== userId) {
    throw new Error("Forbidden: You do not own this vehicle");
  }
}
