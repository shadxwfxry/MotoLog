"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "./utils";

export async function updateVehicleCharacteristics(vehicleId: string, formData: FormData) {
  const user = await getAuthUser();
  
  await prisma.vehicle.update({
    where: { 
      id: vehicleId,
      userId: user.id 
    },
    data: {
      engineDisplacement: formData.get("engineDisplacement")
        ? parseInt(formData.get("engineDisplacement")!.toString(), 10)
        : null,
      power: formData.get("power")
        ? parseInt(formData.get("power")!.toString(), 10)
        : null,
      weight: formData.get("weight")
        ? parseInt(formData.get("weight")!.toString(), 10)
        : null,
    },
  });
  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
}
