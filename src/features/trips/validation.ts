import { z } from "zod";

/**
 * A finished trip submitted by the recorder.
 *
 * Bounded on every axis: the payload is client-generated and can also arrive
 * from the offline queue hours later, so nothing here is trusted. The caps are
 * generous enough for a full day's riding and small enough that a malformed or
 * malicious payload cannot bloat the row.
 */
export const finishTripSchema = z.object({
  vehicleId: z.string().min(1),
  title: z.string().trim().max(120).nullable().optional(),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date(),
  distanceM: z.number().int().min(0).max(10_000_000), // 10 000 km
  durationS: z.number().int().min(0).max(86_400), // 24 h
  avgSpeedKph: z.number().min(0).max(600).nullable(),
  maxSpeedKph: z.number().min(0).max(600).nullable(),
  maxLeanAngleDeg: z.number().min(0).max(90).nullable(),
  trackEncoded: z.string().max(500_000),
  samples: z.object({
    t: z.array(z.number()).max(50_000),
    speed: z.array(z.number()).max(50_000),
    lean: z.array(z.number().nullable()).max(50_000).optional(),
  }),
})
  .refine((trip) => trip.endedAt >= trip.startedAt, {
    message: "A trip cannot end before it starts",
    path: ["endedAt"],
  })
  .refine((trip) => trip.samples.speed.length === trip.samples.t.length, {
    message: "Sample series must be the same length",
    path: ["samples"],
  });

export type FinishTripInput = z.infer<typeof finishTripSchema>;
