import { redirect } from "next/navigation";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";
import { serializeForClient } from "@/shared/lib/serialize";
import { GarageClient } from "./GarageClient";

export const dynamic = "force-dynamic";

export default async function GaragePage() {
  const user = await getOptionalAuthUser();
  if (!user) redirect("/login");

  const vehicles = await vehicleRepository.listForGarage(user.id);

  return <GarageClient vehicles={serializeForClient(vehicles)} />;
}
