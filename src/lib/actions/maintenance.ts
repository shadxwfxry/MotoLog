"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser, verifyVehicleOwnership } from "./utils";
import { maintenanceSchema, plannedMaintenanceSchema } from "@/lib/validations";

export async function addMaintenanceLog(vehicleId: string, formData: FormData) {
  const user = await getAuthUser();
  await verifyVehicleOwnership(vehicleId, user.id);

  const data = Object.fromEntries(formData.entries());
  const validation = maintenanceSchema.safeParse(data);

  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  await prisma.maintenanceLog.create({
    data: {
      ...validation.data,
      vehicleId,
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
  revalidatePath("/dashboard");
}

export async function deleteMaintenanceLog(logId: string) {
  const user = await getAuthUser();
  
  const log = await prisma.maintenanceLog.findFirst({
    where: {
      id: logId,
      vehicle: { userId: user.id }
    }
  });

  if (!log) throw new Error("Log not found or access denied");

  await prisma.maintenanceLog.delete({
    where: { id: logId }
  });

  revalidatePath("/garage");
  revalidatePath(`/garage/${log.vehicleId}`);
  revalidatePath("/dashboard");
}

export async function toggleMaintenancePublic(logId: string, isPublic: boolean) {
  const user = await getAuthUser();
  
  const log = await prisma.maintenanceLog.findFirst({
    where: {
      id: logId,
      vehicle: { userId: user.id }
    }
  });

  if (!log) throw new Error("Log not found or access denied");

  await prisma.maintenanceLog.update({
    where: { id: logId },
    data: { isPublic }
  });

  revalidatePath(`/garage/${log.vehicleId}`);
}

export async function addPlannedMaintenance(vehicleId: string, formData: FormData) {
  const user = await getAuthUser();
  await verifyVehicleOwnership(vehicleId, user.id);

  const data = Object.fromEntries(formData.entries());
  const validation = plannedMaintenanceSchema.safeParse(data);

  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  await prisma.plannedMaintenance.create({
    data: {
      ...validation.data,
      vehicleId,
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
}

export async function completePlannedMaintenance(id: string) {
  const user = await getAuthUser();
  
  const result = await prisma.plannedMaintenance.updateMany({
    where: { 
      id,
      vehicle: { userId: user.id } 
    },
    data: { isCompleted: true },
  });

  if (result.count === 0) throw new Error("Not found");

  const item = await prisma.plannedMaintenance.findUnique({ where: { id } });

  revalidatePath("/garage");
  revalidatePath(`/garage/${item?.vehicleId}`);
}

export async function deletePlannedMaintenance(id: string) {
  const user = await getAuthUser();
  
  const deleted = await prisma.plannedMaintenance.findFirst({ 
    where: { 
      id,
      vehicle: { userId: user.id } 
    } 
  });

  if (!deleted) throw new Error("Not found");

  await prisma.plannedMaintenance.delete({
    where: { id }
  });

  revalidatePath("/garage");
  revalidatePath(`/garage/${deleted.vehicleId}`);
}
