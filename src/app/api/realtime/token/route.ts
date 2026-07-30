import { NextResponse } from "next/server";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { SupabaseConfigError, mintRealtimeToken } from "@/server/auth/supabaseJwt";
import { rideGroupRepository } from "@/server/repositories/rideGroupRepository";
import { logger } from "@/shared/lib/logger";

/**
 * Issues a short-lived Supabase Realtime credential for the signed-in user.
 *
 * The group ids are read from the database, never taken from the request: a
 * client cannot widen its own scope by asking for a group it has not joined.
 */
export async function POST() {
  const user = await getOptionalAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const groupIds = await rideGroupRepository.activeGroupIdsFor(user.id);
    const { token, expiresAt } = mintRealtimeToken(user.id, groupIds);

    return NextResponse.json(
      { token, expiresAt, groupIds },
      // A credential must never be cached by a proxy or the browser.
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      logger.warn(error.message);
      return NextResponse.json({ error: "Realtime is not configured" }, { status: 503 });
    }

    logger.error("realtime token minting failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
