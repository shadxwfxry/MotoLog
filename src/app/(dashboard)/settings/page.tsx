import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // @ts-ignore - prisma.userSettings might be missing in IDE but present in runtime
  const userSettings = (prisma as any).userSettings;
  
  const settings = userSettings 
    ? await userSettings.findUnique({ where: { userId: session.user.id } })
    : null;

  return <SettingsClient settings={settings} />;
}
