import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fetchMotoNews } from "@/lib/rss";
import { NewsClient } from "./NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    include: { settings: true },
  });

  const regionPref = user?.settings?.newsPreferences || "Global";
  const news = await fetchMotoNews(regionPref);

  return <NewsClient news={news} />;
}
