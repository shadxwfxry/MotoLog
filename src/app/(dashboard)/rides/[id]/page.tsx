import { notFound, redirect } from "next/navigation";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { tripRepository } from "@/server/repositories/tripRepository";
import { userRepository } from "@/server/repositories/userRepository";
import { TripDetailClient } from "./TripDetailClient";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const user = await getOptionalAuthUser();
  if (!user) redirect("/login");

  const trip = await tripRepository.findOwnedById(params.id, user.id);
  if (!trip) notFound();

  const prefs = await userRepository.findFormatPrefs(user.id);

  return (
    <TripDetailClient
      trip={{
        id: trip.id,
        title: trip.title,
        vehicleName: `${trip.vehicle.make} ${trip.vehicle.model}`,
        startedAt: trip.startedAt.toISOString(),
        distanceM: trip.distanceM,
        durationS: trip.durationS,
        avgSpeedKph: trip.avgSpeedKph,
        maxSpeedKph: trip.maxSpeedKph,
        maxLeanAngleDeg: trip.maxLeanAngleDeg,
        trackEncoded: trip.trackEncoded,
        samples: trip.samples as { t: number[]; speed: number[] } | null,
      }}
      prefs={prefs}
    />
  );
}
