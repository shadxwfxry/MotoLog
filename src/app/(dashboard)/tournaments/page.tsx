import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const bracketUrl = process.env.NEXT_PUBLIC_BRACKET_URL || "https://motobracket.com";

  return (
    <div className="w-full h-[calc(100vh-57px-73px)] sm:h-[calc(100vh-57px-73px)] md:h-[calc(100vh-57px-73px)] relative overflow-hidden bg-background">
      <iframe
        src={bracketUrl}
        className="w-full h-full border-0 m-0 p-0 bg-background"
        title="Tournaments"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
