"use server";

import { revalidatePath } from "next/cache";
import { assertVehicleOwnership, getAuthUser } from "@/server/auth/guards";
import { refuelRepository } from "@/server/repositories/logRepository";
import { type ActionResult, fail, ok, runAction } from "@/server/actions/result";
import { refuelSchema } from "./validation";

function revalidateFuel(vehicleId: string) {
  revalidatePath("/");
  revalidatePath("/garage");
  revalidatePath(`/garage/${vehicleId}`);
  revalidatePath("/dashboard");
}

export async function addRefuelLog(
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult> {
  return runAction("addRefuelLog", async () => {
    const user = await getAuthUser();
    await assertVehicleOwnership(vehicleId, user.id);

    const validation = refuelSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validation.success) return fail(validation.error.issues[0].message);

    await refuelRepository.create(vehicleId, validation.data);

    revalidateFuel(vehicleId);
    return ok();
  });
}

export async function deleteRefuelLog(logId: string): Promise<ActionResult> {
  return runAction("deleteRefuelLog", async () => {
    const user = await getAuthUser();

    const log = await refuelRepository.findOwned(logId, user.id);
    if (!log) return fail("Log not found or access denied");

    await refuelRepository.deleteById(logId);

    revalidateFuel(log.vehicleId);
    return ok();
  });
}

export async function toggleRefuelPublic(
  logId: string,
  isPublic: boolean,
): Promise<ActionResult> {
  return runAction("toggleRefuelPublic", async () => {
    const user = await getAuthUser();

    const log = await refuelRepository.findOwned(logId, user.id);
    if (!log) return fail("Log not found or access denied");

    await refuelRepository.setPublic(logId, isPublic);

    revalidatePath(`/garage/${log.vehicleId}`);
    return ok();
  });
}
