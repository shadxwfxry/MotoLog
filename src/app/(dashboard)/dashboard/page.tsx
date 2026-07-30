import { redirect } from "next/navigation";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";
import { statsRepository } from "@/server/repositories/statsRepository";
import { userRepository } from "@/server/repositories/userRepository";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getOptionalAuthUser();
  if (!user) redirect("/login");

  const vehicles = await vehicleRepository.listForGarage(user.id);

  // Statistics are aggregated in Postgres. This page previously downloaded
  // every refuel and maintenance row — each with its vehicle joined on — and
  // summed them in the browser.
  const [stats, prefs] = await Promise.all([
    statsRepository.getFleetStats(vehicles.map((v) => v.id)),
    userRepository.findFormatPrefs(user.id),
  ]);

  const vehicleNames = Object.fromEntries(vehicles.map((v) => [v.id, `${v.make} ${v.model}`]));

  return <DashboardClient stats={stats} vehicleNames={vehicleNames} prefs={prefs} />;
}
