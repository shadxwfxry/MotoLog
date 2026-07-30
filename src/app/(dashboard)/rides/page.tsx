import { redirect } from "next/navigation";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";
import { tripRepository } from "@/server/repositories/tripRepository";
import { userRepository } from "@/server/repositories/userRepository";
import { serializeForClient } from "@/shared/lib/serialize";
import { RidesClient } from "./RidesClient";

export const dynamic = "force-dynamic";

export default async function RidesPage() {
  const user = await getOptionalAuthUser();
  if (!user) redirect("/login");

  const [vehicles, trips, prefs] = await Promise.all([
    vehicleRepository.listForGarage(user.id),
    // The list query omits the encoded track — it is tens of kilobytes per ride
    // and nothing on this page draws a route.
    tripRepository.listForUser(user.id),
    userRepository.findFormatPrefs(user.id),
  ]);

  return (
    <RidesClient
      vehicles={vehicles.map((v) => ({ id: v.id, make: v.make, model: v.model }))}
      trips={serializeForClient(trips)}
      prefs={prefs}
    />
  );
}
