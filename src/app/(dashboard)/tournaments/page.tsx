import { redirect } from "next/navigation";
import { Eye, Settings2, Trophy } from "lucide-react";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { Badge, Panel } from "@/shared/ui";
import { T } from "@/components/T";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ mode?: string }> | { mode?: string } | any;
}

export default async function TournamentsPage({ searchParams }: PageProps) {
  const user = await getOptionalAuthUser();
  if (!user) redirect("/login");

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
    <div className="mx-auto w-full max-w-screen-lg space-y-4 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            <Trophy size={18} strokeWidth={2.4} />
          </span>
          <div>
            <h1 className="font-display text-xl font-black uppercase leading-none tracking-tight">
              <T k="tournaments" />
            </h1>
            <div className="mt-1.5">
              <Badge tone={isAdminMode ? "amber" : "cyan"} dot>
                <T k={isAdminMode ? "organiser_mode" : "spectator_mode"} />
              </Badge>
            </div>
          </div>
        </div>

        <a
          href={isAdminMode ? "/tournaments" : "/tournaments?mode=admin"}
          className="btn-ghost h-11 px-5"
        >
          {isAdminMode ? (
            <>
              <Eye size={15} strokeWidth={2.6} />
              <T k="spectator" />
            </>
          ) : (
            <>
              <Settings2 size={15} strokeWidth={2.6} />
              <T k="organiser" />
            </>
          )}
        </a>
      </div>

      {/* The bracket app is an external site, so the frame is treated as a
          panel of its own rather than bled to the window edges — that way the
          page still reads as part of MotoLog. */}
      <Panel padding="none" corners className="overflow-hidden">
        <iframe
          src={finalUrl}
          className="h-[70vh] min-h-[520px] w-full border-0 bg-background"
          title="Tournaments"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </Panel>
    </div>
  );
}
