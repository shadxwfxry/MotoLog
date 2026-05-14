"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "./utils";
import { vehicleSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

export async function addVehicle(formData: FormData) {
  const user = await getAuthUser();
  
  const data = Object.fromEntries(formData.entries());
  const validation = vehicleSchema.safeParse(data);
  
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  await prisma.vehicle.create({
    data: {
      ...validation.data,
      userId: user.id,
    },
  });

  revalidatePath("/garage");
}

export async function updateVehicleCharacteristics(vehicleId: string, formData: FormData) {
  const user = await getAuthUser();
  
  const data = Object.fromEntries(formData.entries());
  const validation = vehicleSchema.safeParse(data);
  
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  // Use updateMany to allow filtering by userId without unique constraint on it
  const result = await prisma.vehicle.updateMany({
    where: { 
      id: vehicleId,
      userId: user.id 
    },
    data: validation.data,
  });

  if (result.count === 0) {
    throw new Error("Vehicle not found or access denied");
  }
  
  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
}

export async function deleteVehicle(vehicleId: string) {
  const user = await getAuthUser();
  
  try {
    // deleteMany allows filtering by non-unique fields like userId
    const result = await prisma.vehicle.deleteMany({
      where: {
        id: vehicleId,
        userId: user.id
      }
    });
    if (result.count === 0) {
      throw new Error("Vehicle not found or access denied");
    }
  } catch (error) {
    console.error("Delete vehicle error:", error);
    throw new Error("Failed to delete vehicle.");
  }
  
  revalidatePath("/garage");
  redirect("/garage");
}

export async function clearVehicleStats(vehicleId: string) {
  const user = await getAuthUser();
  
  // Use transaction to ensure atomicity
  await prisma.$transaction([
    prisma.refuelingLog.deleteMany({
      where: {
        vehicleId,
        vehicle: { userId: user.id }
      }
    }),
    prisma.maintenanceLog.deleteMany({
      where: {
        vehicleId,
        vehicle: { userId: user.id }
      }
    })
  ]);
  
  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
  revalidatePath("/dashboard");
}
