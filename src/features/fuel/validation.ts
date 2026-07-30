import { z } from "zod";
import {
  booleanField,
  floatField,
  intField,
  optionalNumberField,
  optionalTextField,
} from "@/shared/lib/formData";

export const refuelSchema = z.object({
  odometer: intField(0),
  liters: floatField(0).pipe(z.number().positive("Litres must be greater than zero")),
  pricePerLiter: optionalNumberField("float"),
  cost: floatField(0),
  stationName: optionalTextField(),
  fuelGrade: optionalTextField(),
  notes: optionalTextField(),
  isPublic: booleanField().optional(),
});

export type RefuelInput = z.infer<typeof refuelSchema>;
