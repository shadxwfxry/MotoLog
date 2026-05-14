"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser, verifyVehicleOwnership } from "./utils";
import { refuelSchema } from "@/lib/validations";

export async function addRefuelLog(vehicleId: string, formData: FormData) {
  const user = await getAuthUser();
  await verifyVehicleOwnership(vehicleId, user.id);

  const data = Object.fromEntries(formData.entries());
  const validation = refuelSchema.safeParse(data);

  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  await prisma.refuelingLog.create({
    data: {
      ...validation.data,
      vehicleId,
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
  revalidatePath("/dashboard");
}

export async function deleteRefuelLog(logId: string) {
  const user = await getAuthUser();
  
  // Fetch to get vehicleId for revalidation, also verifies ownership
  const log = await prisma.refuelingLog.findFirst({
    where: {
      id: logId,
      vehicle: { userId: user.id }
    }
  });

  if (!log) throw new Error("Log not found or access denied");

  await prisma.refuelingLog.delete({
    where: { id: logId }
  });

  revalidatePath("/garage");
  revalidatePath(`/garage/${log.vehicleId}`);
  revalidatePath("/dashboard");
}

export async function toggleRefuelPublic(logId: string, isPublic: boolean) {
  const user = await getAuthUser();
  
  const log = await prisma.refuelingLog.findFirst({
    where: {
      id: logId,
      vehicle: { userId: user.id }
    }
  });

  if (!log) throw new Error("Log not found or access denied");

  await prisma.refuelingLog.update({
    where: { id: logId },
    data: { isPublic }
  });

  revalidatePath(`/garage/${log.vehicleId}`);
}
