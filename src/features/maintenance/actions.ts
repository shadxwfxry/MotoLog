"use server";

import { revalidatePath } from "next/cache";
import { assertVehicleOwnership, getAuthUser } from "@/server/auth/guards";
import {
  maintenanceRepository,
  plannedMaintenanceRepository,
} from "@/server/repositories/logRepository";
import { type ActionResult, fail, ok, runAction } from "@/server/actions/result";
import { maintenanceSchema, plannedMaintenanceSchema } from "./validation";

function revalidateMaintenance(vehicleId: string) {
  revalidatePath("/");
  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
  revalidatePath("/dashboard");
}

export async function addMaintenanceLog(
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult> {
  return runAction("addMaintenanceLog", async () => {
    const user = await getAuthUser();
    await assertVehicleOwnership(vehicleId, user.id);

    const validation = maintenanceSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validation.success) return fail(validation.error.issues[0].message);

    await maintenanceRepository.create(vehicleId, validation.data);

    revalidateMaintenance(vehicleId);
    return ok();
  });
}

export async function deleteMaintenanceLog(logId: string): Promise<ActionResult> {
  return runAction("deleteMaintenanceLog", async () => {
    const user = await getAuthUser();

    const log = await maintenanceRepository.findOwned(logId, user.id);
    if (!log) return fail("Log not found or access denied");

    await maintenanceRepository.deleteById(logId);

    revalidateMaintenance(log.vehicleId);
    return ok();
  });
}

export async function toggleMaintenancePublic(
  logId: string,
  isPublic: boolean,
): Promise<ActionResult> {
  return runAction("toggleMaintenancePublic", async () => {
    const user = await getAuthUser();

    const log = await maintenanceRepository.findOwned(logId, user.id);
    if (!log) return fail("Log not found or access denied");

    await maintenanceRepository.setPublic(logId, isPublic);

    revalidatePath(`/garage/${log.vehicleId}`);
    return ok();
  });
}

export async function addPlannedMaintenance(
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult> {
  return runAction("addPlannedMaintenance", async () => {
    const user = await getAuthUser();
    await assertVehicleOwnership(vehicleId, user.id);

    const validation = plannedMaintenanceSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validation.success) return fail(validation.error.issues[0].message);

    await plannedMaintenanceRepository.create(vehicleId, validation.data);

    revalidateMaintenance(vehicleId);
    return ok();
  });
}

export async function completePlannedMaintenance(id: string): Promise<ActionResult> {
  return runAction("completePlannedMaintenance", async () => {
    const user = await getAuthUser();

    const reminder = await plannedMaintenanceRepository.findOwned(id, user.id);
    if (!reminder) return fail("Reminder not found or access denied");

    await plannedMaintenanceRepository.markCompleted(id);

    revalidateMaintenance(reminder.vehicleId);
    return ok();
  });
}

export async function deletePlannedMaintenance(id: string): Promise<ActionResult> {
  return runAction("deletePlannedMaintenance", async () => {
    const user = await getAuthUser();

    const reminder = await plannedMaintenanceRepository.findOwned(id, user.id);
    if (!reminder) return fail("Reminder not found or access denied");

    await plannedMaintenanceRepository.deleteById(id);

    revalidateMaintenance(reminder.vehicleId);
    return ok();
  });
}
