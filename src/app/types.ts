import type { Serialized } from "@/shared/lib/serialize";
import type { vehicleRepository } from "@/server/repositories/vehicleRepository";

/**
 * View models for the client components, derived from what the repositories
 * actually return. Deriving them means a changed `select` is a compile error at
 * the component rather than an `undefined` at runtime — the previous `any[]`
 * props hid exactly that class of mistake.
 */

type Unwrap<T> = T extends Promise<infer U> ? U : T;

export type HomeVehicle = Serialized<
  Unwrap<ReturnType<typeof vehicleRepository.listWithReminders>>[number]
>;

export type GarageVehicle = Serialized<
  Unwrap<ReturnType<typeof vehicleRepository.listForGarage>>[number]
>;
