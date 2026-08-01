import { getOptionalAuthUser } from "@/server/auth/guards";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";
import { serializeForClient } from "@/shared/lib/serialize";
import { HomeClient } from "./HomeClient";
import { LandingClient } from "./LandingClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getOptionalAuthUser();

  if (user) {
    // Vehicles, their latest odometer readings and open reminders. The page
    // used to additionally load every refuel and maintenance row for every
    // bike — thousands of rows to render a status badge and two reminders.
    const vehicles = await vehicleRepository.listWithReminders(user.id);

    return <HomeClient vehicles={serializeForClient(vehicles)} />;
  }

  // Signed out: the marketing landing, which needs the client-side language.
  return <LandingClient />;
}
