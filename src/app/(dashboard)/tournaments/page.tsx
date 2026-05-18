import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ mode?: string }> | { mode?: string } | any;
}

export default async function TournamentsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  const isAdminMode = resolvedParams?.mode === "admin";

  const bracketUrl = process.env.NEXT_PUBLIC_BRACKET_URL || "https://motobracket.com";
  
  // Format the target URL safely
  let finalUrl = bracketUrl;
  if (isAdminMode) {
    const hasTrailingSlash = finalUrl.endsWith("/");
    finalUrl = hasTrailingSlash ? `${finalUrl}admin.html` : `${finalUrl}/admin.html`;
  }

  return (
    <div className="w-full flex flex-col h-[calc(100vh-57px-73px)] sm:h-[calc(100vh-57px-73px)] md:h-[calc(100vh-57px-73px)] overflow-hidden bg-background">
      {/* Premium Toggle Bar */}
      <div className="w-full bg-card/60 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between gap-4 h-[56px] shadow-sm flex-shrink-0">
        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          🏆 {isAdminMode ? "Режим Организатора" : "Режим Зрителя"}
        </span>
        <a
          href={isAdminMode ? "/tournaments" : "/tournaments?mode=admin"}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm flex items-center gap-1.5 ${
            isAdminMode
              ? "bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
              : "bg-primary hover:bg-primary/80 text-primary-foreground font-extrabold"
          }`}
        >
          {isAdminMode ? "👁️ Режим зрителя" : "⚙️ Режим организатора"}
        </a>
      </div>

      {/* Frame Container */}
      <div className="flex-1 w-full relative overflow-hidden bg-background">
        <iframe
          src={finalUrl}
          className="w-full h-full border-0 m-0 p-0 bg-background"
          title="Tournaments"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
