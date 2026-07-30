import { z } from "zod";
import {
  booleanField,
  intField,
  optionalNumberField,
  optionalTextField,
} from "@/shared/lib/formData";

export const vehicleSchema = z.object({
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  year: intField(1900).pipe(z.number().max(new Date().getFullYear() + 1, "Year is too far ahead")),
  brandName: optionalTextField(),
  photoUrl: optionalTextField(),
  engineDisplacement: optionalNumberField("int"),
  power: optionalNumberField("int"),
  weight: optionalNumberField("int"),
  type: z.string().trim().min(1).optional(),
  isPublic: booleanField().optional(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

/** Optional starting odometer, recorded as a seed refuel row when provided. */
export const initialOdometerSchema = optionalNumberField("int");

export const userSettingsSchema = z.object({
  theme: z.string().trim().min(1),
  accentColor: z.string().trim().min(1),
  newsPreferences: z.string().trim().default("all"),
});

/** Free-form spec sheet: torque values, part numbers, tyre pressures. */
export const specsSchema = z.record(z.string(), z.string());
