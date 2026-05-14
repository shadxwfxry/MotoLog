"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ── Vehicle ──────────────────────────────────────────────────────────────────

export async function updateVehicleCharacteristics(vehicleId: string, formData: FormData) {
  await prisma.vehicle.update({
    where: { id: vehicleId },
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
}

// ── Refueling ─────────────────────────────────────────────────────────────────

export async function addRefuelLog(vehicleId: string, formData: FormData) {
  const liters = parseFloat(formData.get("liters")?.toString() || "0");
  const pricePerLiter = formData.get("pricePerLiter")
    ? parseFloat(formData.get("pricePerLiter")!.toString())
    : null;
  // If cost was auto-calculated client-side it comes as "cost", else compute
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
  revalidatePath("/dashboard");
}

// ── Maintenance / Repair / Consumable ─────────────────────────────────────────

export async function addMaintenanceLog(vehicleId: string, formData: FormData) {
  await prisma.maintenanceLog.create({
    data: {
      vehicleId,
      odometer: parseInt(formData.get("odometer")?.toString() || "0", 10),
      category: formData.get("category")?.toString() || "service",
      type: formData.get("type")?.toString() || "Other",
      cost: parseFloat(formData.get("cost")?.toString() || "0"),
      description: formData.get("description")?.toString() || null,
      parts: formData.get("parts")?.toString() || null,
    },
  });

  revalidatePath("/garage");
  revalidatePath("/dashboard");
}

// ── Planned Reminders ─────────────────────────────────────────────────────────

export async function addPlannedMaintenance(vehicleId: string, formData: FormData) {
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
}

export async function completePlannedMaintenance(id: string) {
  await prisma.plannedMaintenance.update({
    where: { id },
    data: { isCompleted: true },
  });
  revalidatePath("/garage");
}

export async function deletePlannedMaintenance(id: string) {
  await prisma.plannedMaintenance.delete({ where: { id } });
  revalidatePath("/garage");
}
