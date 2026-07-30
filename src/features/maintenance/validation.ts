import { z } from "zod";
import {
  booleanField,
  floatField,
  intField,
  optionalDateField,
  optionalNumberField,
  optionalTextField,
} from "@/shared/lib/formData";

export const MAINTENANCE_CATEGORIES = ["service", "repair", "consumable"] as const;
export const REMINDER_CATEGORIES = ["reminder", "service", "consumable"] as const;

export const maintenanceSchema = z.object({
  odometer: intField(0),
  category: z.enum(MAINTENANCE_CATEGORIES),
  type: z.string().trim().min(1, "Type is required"),
  cost: floatField(0),
  description: optionalTextField(),
  isPublic: booleanField().optional(),
});

export const plannedMaintenanceSchema = z
  .object({
    type: z.string().trim().min(1, "Type is required"),
    category: z.enum(REMINDER_CATEGORIES).default("reminder"),
    targetOdometer: optionalNumberField("int"),
    targetDate: optionalDateField(),
    intervalKm: optionalNumberField("int"),
    description: optionalTextField(),
  })
  // A reminder with neither target can never come due, so it would sit in the
  // list forever showing "ok". The previous schema accepted it silently.
  .refine((data) => data.targetOdometer != null || data.targetDate != null, {
    message: "Set a target odometer or a target date",
    path: ["targetOdometer"],
  });

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
export type PlannedMaintenanceInput = z.infer<typeof plannedMaintenanceSchema>;
