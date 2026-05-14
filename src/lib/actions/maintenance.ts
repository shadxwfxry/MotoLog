"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser, verifyVehicleOwnership } from "./utils";

export async function addMaintenanceLog(vehicleId: string, formData: FormData) {
  const user = await getAuthUser();
  await verifyVehicleOwnership(vehicleId, user.id);

  await prisma.maintenanceLog.create({
    data: {
      vehicleId,
      odometer: parseInt(formData.get("odometer")?.toString() || "0", 10),
      category: formData.get("category")?.toString() || "service",
      type: formData.get("type")?.toString() || "Other",
      cost: parseFloat(formData.get("cost")?.toString() || "0"),
      description: formData.get("description")?.toString() || null,
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
  revalidatePath("/dashboard");
}

export async function addPlannedMaintenance(vehicleId: string, formData: FormData) {
  const user = await getAuthUser();
  await verifyVehicleOwnership(vehicleId, user.id);

  const targetDateRaw = formData.get("targetDate")?.toString();
  const targetOdometerRaw = formData.get("targetOdometer")?.toString();
  const intervalKmRaw = formData.get("intervalKm")?.toString();

  await prisma.plannedMaintenance.create({
    data: {
      vehicleId,
      type: formData.get("type")?.toString() || "Reminder",
      category: formData.get("category")?.toString() || "reminder",
      targetOdometer: targetOdometerRaw ? parseInt(targetOdometerRaw, 10) : null,
      targetDate: targetDateRaw ? new Date(targetDateRaw) : null,
      intervalKm: intervalKmRaw ? parseInt(intervalKmRaw, 10) : null,
      description: formData.get("description")?.toString() || null,
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
}

export async function completePlannedMaintenance(id: string) {
  const user = await getAuthUser();
  
  const updated = await prisma.plannedMaintenance.update({
    where: { 
      id,
      vehicle: { userId: user.id } 
    },
    data: { isCompleted: true },
  });
  revalidatePath("/garage");
  revalidatePath(`/garage/${updated.vehicleId}`);
}

export async function deletePlannedMaintenance(id: string) {
  const user = await getAuthUser();
  
  const deleted = await prisma.plannedMaintenance.delete({ 
    where: { 
      id,
      vehicle: { userId: user.id } 
    } 
  });
  revalidatePath("/garage");
  revalidatePath(`/garage/${deleted.vehicleId}`);
}
