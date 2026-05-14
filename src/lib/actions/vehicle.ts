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
    throw new Error(validation.error.errors[0].message);
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
    throw new Error(validation.error.errors[0].message);
  }

  await prisma.vehicle.update({
    where: { 
      id: vehicleId,
      userId: user.id 
    },
    data: validation.data,
  });
  
  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
}

export async function deleteVehicle(vehicleId: string) {
  const user = await getAuthUser();
  
  await prisma.vehicle.delete({
    where: {
      id: vehicleId,
      userId: user.id
    }
  });
  
  revalidatePath("/garage");
  redirect("/garage");
}

export async function clearVehicleStats(vehicleId: string) {
  const user = await getAuthUser();
  
  // Verify ownership first since we're deleting related records manually or via cascade
  // Actually deleteMany with where is safe if we include userId in the relation check
  
  await prisma.refuelingLog.deleteMany({
    where: {
      vehicleId,
      vehicle: { userId: user.id }
    }
  });
  
  await prisma.maintenanceLog.deleteMany({
    where: {
      vehicleId,
      vehicle: { userId: user.id }
    }
  });
  
  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
  revalidatePath("/dashboard");
}
