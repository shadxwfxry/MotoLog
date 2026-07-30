import "server-only";

import jwt from "jsonwebtoken";

/**
 * Bridges a NextAuth session into a Supabase Realtime credential.
 *
 * The app authenticates with NextAuth and reads data through Prisma, so there
 * is no Supabase session to reuse. Supabase Realtime authorizes channels from a
 * JWT signed with the project's JWT secret, so one is minted here from the
 * already-verified NextAuth session.
 *
 * The secret never leaves the server; the client receives only the short-lived
 * token. Scope is carried in a custom claim so an RLS policy on
 * `realtime.messages` can check membership rather than trusting the topic name
 * the client asks for.
 */

const TOKEN_TTL_SECONDS = 60 * 60; // One hour — comfortably longer than a ride leg.

export interface SupabaseRealtimeToken {
  token: string;
  /** Epoch seconds; the client refreshes before this. */
  expiresAt: number;
}

export class SupabaseConfigError extends Error {}

export function mintRealtimeToken(userId: string, groupIds: string[]): SupabaseRealtimeToken {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new SupabaseConfigError(
      "SUPABASE_JWT_SECRET is not set — group rides cannot authorize a realtime channel.",
    );
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + TOKEN_TTL_SECONDS;

  const token = jwt.sign(
    {
      sub: userId,
      // Supabase maps this to the Postgres role the connection runs as.
      role: "authenticated",
      iat: issuedAt,
      exp: expiresAt,
      // Read by the RLS policy on realtime.messages.
      app_metadata: { ride_groups: groupIds },
    },
    secret,
    { algorithm: "HS256" },
  );

  return { token, expiresAt };
}

/** Whether the environment is configured for realtime at all. */
export function isRealtimeConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_JWT_SECRET &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
