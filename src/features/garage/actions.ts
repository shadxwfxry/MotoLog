"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/server/auth/guards";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";
import { refuelRepository } from "@/server/repositories/logRepository";
import { userRepository } from "@/server/repositories/userRepository";
import { type ActionResult, fail, ok, runAction } from "@/server/actions/result";
import { initialOdometerSchema, specsSchema, userSettingsSchema, vehicleSchema } from "./validation";

function revalidateGarage(vehicleId?: string) {
  revalidatePath("/");
  revalidatePath("/garage");
  if (vehicleId) revalidatePath(`/garage/${vehicleId}`);
  revalidatePath("/dashboard");
}

export interface CreatedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  slug: string;
  brandName: string | null;
  photoUrl: string | null;
  engineDisplacement: number | null;
}

export async function addVehicle(formData: FormData): Promise<ActionResult<CreatedVehicle>> {
  return runAction("addVehicle", async () => {
    const user = await getAuthUser();

    const raw = Object.fromEntries(formData.entries());
    const validation = vehicleSchema.safeParse(raw);
    if (!validation.success) return fail(validation.error.issues[0].message);

    const vehicle = await vehicleRepository.create(user.id, validation.data);

    // A starting odometer is stored as a zero-litre seed refuel. The
    // consumption maths deliberately excludes the earliest tank, so this row
    // establishes the baseline without skewing fuel economy.
    const initialOdometer = initialOdometerSchema.parse(raw.initialOdometer);
    if (initialOdometer != null && initialOdometer > 0) {
      await refuelRepository.create(vehicle.id, {
        odometer: initialOdometer,
        liters: 0,
        cost: 0,
        stationName: "Initial Odometer",
      });
    }

    revalidateGarage();
    return ok({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      slug: vehicle.slug,
      brandName: vehicle.brandName,
      photoUrl: vehicle.photoUrl,
      engineDisplacement: vehicle.engineDisplacement,
    });
  });
}

export async function updateVehicleCharacteristics(
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult> {
  return runAction("updateVehicleCharacteristics", async () => {
    const user = await getAuthUser();

    const validation = vehicleSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validation.success) return fail(validation.error.issues[0].message);

    const updated = await vehicleRepository.updateOwned(vehicleId, user.id, validation.data);
    if (!updated) return fail("Vehicle not found or access denied");

    revalidateGarage(vehicleId);
    return ok();
  });
}

export async function updateVehicleMedia(
  vehicleId: string,
  photoUrl: string,
  brandName: string,
): Promise<ActionResult> {
  return runAction("updateVehicleMedia", async () => {
    const user = await getAuthUser();

    const updated = await vehicleRepository.updateOwned(vehicleId, user.id, {
      photoUrl: photoUrl || null,
      brandName: brandName || null,
    });
    if (!updated) return fail("Vehicle not found or access denied");

    revalidateGarage(vehicleId);
    return ok();
  });
}

export async function updateVehicleSpecs(
  vehicleId: string,
  specs: Record<string, string>,
): Promise<ActionResult> {
  return runAction("updateVehicleSpecs", async () => {
    const user = await getAuthUser();

    const validation = specsSchema.safeParse(specs);
    if (!validation.success) return fail("Specifications must be text values");

    const updated = await vehicleRepository.updateOwned(vehicleId, user.id, {
      specs: validation.data,
    });
    if (!updated) return fail("Vehicle not found or access denied");

    revalidatePath(`/garage/${vehicleId}`);
    return ok();
  });
}

export async function clearVehicleStats(vehicleId: string): Promise<ActionResult> {
  return runAction("clearVehicleStats", async () => {
    const user = await getAuthUser();

    await vehicleRepository.clearLogs(vehicleId, user.id);

    revalidateGarage(vehicleId);
    return ok();
  });
}

export async function deleteVehicle(vehicleId: string): Promise<ActionResult> {
  const result = await runAction("deleteVehicle", async () => {
    const user = await getAuthUser();

    const deleted = await vehicleRepository.deleteOwned(vehicleId, user.id);
    if (!deleted) return fail("Vehicle not found or access denied");

    revalidateGarage();
    return ok();
  });

  // redirect() throws, so it must run outside runAction's try/catch — otherwise
  // the NEXT_REDIRECT signal would be re-thrown from inside error handling.
  if (result.ok) redirect("/garage");
  return result;
}

export async function updateUserSettings(
  theme: string,
  accentColor: string,
  newsPreferences: string,
): Promise<ActionResult> {
  return runAction("updateUserSettings", async () => {
    const user = await getAuthUser();

    const validation = userSettingsSchema.safeParse({ theme, accentColor, newsPreferences });
    if (!validation.success) return fail(validation.error.issues[0].message);

    await userRepository.upsertSettings(user.id, validation.data);

    revalidatePath("/", "layout");
    return ok();
  });
}
