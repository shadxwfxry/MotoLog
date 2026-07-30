import { redirect } from "next/navigation";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { userRepository } from "@/server/repositories/userRepository";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getOptionalAuthUser();
  if (!user) redirect("/login");

  const settings = await userRepository.findSettings(user.id);

  return <SettingsClient settings={settings} />;
}
