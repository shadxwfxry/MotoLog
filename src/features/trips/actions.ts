"use server";

import { revalidatePath } from "next/cache";
import { assertVehicleOwnership, getAuthUser } from "@/server/auth/guards";
import { tripRepository } from "@/server/repositories/tripRepository";
import { type ActionResult, fail, ok, runAction } from "@/server/actions/result";
import { finishTripSchema } from "./validation";

export async function saveTrip(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("saveTrip", async () => {
    const user = await getAuthUser();

    const validation = finishTripSchema.safeParse(input);
    if (!validation.success) return fail(validation.error.issues[0].message);

    const trip = validation.data;
    await assertVehicleOwnership(trip.vehicleId, user.id);

    const created = await tripRepository.create(user.id, {
      vehicleId: trip.vehicleId,
      title: trip.title ?? null,
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
      distanceM: trip.distanceM,
      durationS: trip.durationS,
      avgSpeedKph: trip.avgSpeedKph,
      maxSpeedKph: trip.maxSpeedKph,
      maxLeanAngleDeg: trip.maxLeanAngleDeg,
      trackEncoded: trip.trackEncoded,
      samples: trip.samples,
    });

    revalidatePath("/rides");
    revalidatePath(`/garage/${trip.vehicleId}`);
    return ok(created);
  });
}

export async function deleteTrip(tripId: string): Promise<ActionResult> {
  return runAction("deleteTrip", async () => {
    const user = await getAuthUser();

    const deleted = await tripRepository.deleteOwned(tripId, user.id);
    if (!deleted) return fail("Trip not found or access denied");

    revalidatePath("/rides");
    return ok();
  });
}

export async function renameTrip(tripId: string, title: string): Promise<ActionResult> {
  return runAction("renameTrip", async () => {
    const user = await getAuthUser();

    const trimmed = title.trim().slice(0, 120);
    if (!trimmed) return fail("Title cannot be empty");

    const renamed = await tripRepository.renameOwned(tripId, user.id, trimmed);
    if (!renamed) return fail("Trip not found or access denied");

    revalidatePath("/rides");
    revalidatePath(`/rides/${tripId}`);
    return ok();
  });
}
