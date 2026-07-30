import { redirect } from "next/navigation";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { userRepository } from "@/server/repositories/userRepository";
import { fetchMotoNews } from "@/lib/rss";
import { NewsClient } from "./NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const user = await getOptionalAuthUser();
  if (!user) redirect("/login");

  const settings = await userRepository.findSettings(user.id);
  const news = await fetchMotoNews(settings?.newsPreferences || "Global");

  return <NewsClient news={news} />;
}
