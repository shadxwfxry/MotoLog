import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  if (session.user.id) return session.user;

  // Fallback if ID is missing from session but email exists
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true }
  });

  if (!dbUser) throw new Error("Unauthorized");
  return dbUser;
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
