"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser, verifyVehicleOwnership } from "./utils";

export async function addRefuelLog(vehicleId: string, formData: FormData) {
  const user = await getAuthUser();
  await verifyVehicleOwnership(vehicleId, user.id);

  const liters = parseFloat(formData.get("liters")?.toString() || "0");
  const pricePerLiter = formData.get("pricePerLiter")
    ? parseFloat(formData.get("pricePerLiter")!.toString())
    : null;
  
  const costRaw = formData.get("cost")?.toString();
  const cost = costRaw
    ? parseFloat(costRaw)
    : pricePerLiter
    ? liters * pricePerLiter
    : 0;

  await prisma.refuelingLog.create({
    data: {
      vehicleId,
      odometer: parseInt(formData.get("odometer")?.toString() || "0", 10),
      liters,
      pricePerLiter,
      cost,
      stationName: formData.get("stationName")?.toString() || null,
      fuelGrade: formData.get("fuelGrade")?.toString() || null,
      notes: formData.get("notes")?.toString() || null,
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
  revalidatePath("/dashboard");
}
