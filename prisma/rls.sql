-- Defensive Row Level Security.
--
-- This is NOT the application's authorization mechanism. The app reaches
-- Postgres through Prisma using the connection in DATABASE_URL, which is an
-- owner-role connection; owners bypass RLS entirely. Authorization is enforced
-- in src/server/auth/guards.ts and the repository layer, where every query is
-- scoped to the signed-in user.
--
-- What this buys us: the project is hosted on Supabase, so it also exposes a
-- PostgREST endpoint reachable with the public anon key. Enabling RLS with no
-- permissive policies means that endpoint returns nothing for these tables,
-- rather than the entire database, if the anon key is ever published (it is
-- designed to be public — it ships in client bundles).
--
-- Apply with:  psql "$DIRECT_URL" -f prisma/rls.sql
-- Verify with: node scripts/check-rls.mjs
--
-- This is not optional hardening you can defer. Until it is applied, Supabase's
-- Security Advisor reports every table as "RLS Disabled in Public" and the
-- anon key really does read the whole database through PostgREST.

ALTER TABLE "User"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vehicle"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefuelingLog"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MaintenanceLog"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Part"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlannedMaintenance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideGroup"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideGroupMember"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Friendship"         ENABLE ROW LEVEL SECURITY;

-- Prisma's own bookkeeping table. It holds no user data, but it is in `public`
-- like everything else: the advisor flags it, and it hands out the migration
-- history to anyone with the anon key. Prisma writes it as owner, so RLS here
-- costs nothing.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Belt and braces: revoke the grants Supabase hands the public roles by
-- default, so a future permissive policy cannot silently open these up.
REVOKE ALL ON "User"               FROM anon, authenticated;
REVOKE ALL ON "UserSettings"       FROM anon, authenticated;
REVOKE ALL ON "Vehicle"            FROM anon, authenticated;
REVOKE ALL ON "RefuelingLog"       FROM anon, authenticated;
REVOKE ALL ON "MaintenanceLog"     FROM anon, authenticated;
REVOKE ALL ON "Part"               FROM anon, authenticated;
REVOKE ALL ON "PlannedMaintenance" FROM anon, authenticated;
REVOKE ALL ON "Trip"               FROM anon, authenticated;
REVOKE ALL ON "RideGroup"          FROM anon, authenticated;
REVOKE ALL ON "RideGroupMember"    FROM anon, authenticated;
REVOKE ALL ON "Friendship"         FROM anon, authenticated;
REVOKE ALL ON "_prisma_migrations" FROM anon, authenticated;
