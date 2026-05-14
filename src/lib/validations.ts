import { z } from "zod";

export const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.preprocess((val) => parseInt(val as string, 10), z.number().min(1900).max(new Date().getFullYear() + 1)),
  brandName: z.string().nullable().optional(),
  photoUrl: z.string().url().nullable().or(z.literal("")).optional(),
  engineDisplacement: z.preprocess((val) => val ? parseInt(val as string, 10) : null, z.number().nullable().optional()),
  power: z.preprocess((val) => val ? parseInt(val as string, 10) : null, z.number().nullable().optional()),
  weight: z.preprocess((val) => val ? parseInt(val as string, 10) : null, z.number().nullable().optional()),
  type: z.string().optional(),
  isPublic: z.preprocess((val) => val === "true" || val === "on" || val === true, z.boolean()).optional(),
});

export const refuelSchema = z.object({
  odometer: z.preprocess((val) => parseInt(val as string, 10), z.number().min(0)),
  liters: z.preprocess((val) => parseFloat(val as string), z.number().positive()),
  pricePerLiter: z.preprocess((val) => val ? parseFloat(val as string) : null, z.number().positive().nullable().optional()),
  cost: z.preprocess((val) => val ? parseFloat(val as string) : 0, z.number().min(0)),
  stationName: z.string().nullable().optional(),
  fuelGrade: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isPublic: z.preprocess((val) => val === "true" || val === "on" || val === true, z.boolean()).optional(),
});

export const maintenanceSchema = z.object({
  odometer: z.preprocess((val) => parseInt(val as string, 10), z.number().min(0)),
  category: z.enum(["service", "repair", "consumable"]),
  type: z.string().min(1, "Type is required"),
  cost: z.preprocess((val) => parseFloat(val as string), z.number().min(0)),
  description: z.string().nullable().optional(),
  isPublic: z.preprocess((val) => val === "true" || val === "on" || val === true, z.boolean()).optional(),
});

export const plannedMaintenanceSchema = z.object({
  type: z.string().min(1),
  category: z.string().optional(),
  targetOdometer: z.preprocess((val) => val ? parseInt(val as string, 10) : null, z.number().nullable().optional()),
  targetDate: z.preprocess((val) => val ? new Date(val as string) : null, z.date().nullable().optional()),
  intervalKm: z.preprocess((val) => val ? parseInt(val as string, 10) : null, z.number().nullable().optional()),
  description: z.string().nullable().optional(),
});
