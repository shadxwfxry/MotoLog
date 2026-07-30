# MotoLog architecture

Written during the refactor of 31 Jul 2026. Records the layering and the
decisions that are not obvious from the code.

## Layers

```
src/
  app/         Routes only. Thin RSC pages: auth guard → repository → client component.
  features/    Domain logic, server actions, validation and feature components.
    fuel/          consumption maths, refuel actions
    maintenance/   reminder urgency, service log actions
    garage/        vehicle actions
    trips/         GPS recording, geo maths, polyline codec, map
    multiplayer/   transport abstraction, group ride actions
    search/        log search
    sync/          offline queue drain and backoff
  server/      Server-only.
    db.ts          Prisma singleton — the ONLY file that constructs a client
    repositories/  the only place `prisma.*` is called
    auth/          NextAuth options, guards, Supabase JWT bridge
    actions/       ActionResult contract
  store/       Zustand slices: activeVehicle, ride
  shared/      i18n, formatting, serialization, logger — no domain knowledge
```

The layering is enforced, not just documented: `.eslintrc.json` fails the build
if anything outside `src/server/repositories/**` imports `@/server/db`.

## Decisions worth knowing

**Prisma stays; Supabase is used only for Realtime.** The database is already
Supabase Postgres, but reached through Prisma with an owner-role connection.
Authorization therefore lives in `server/auth/guards.ts` and the repositories,
not in RLS — an owner connection bypasses RLS entirely. `prisma/rls.sql` still
enables it as defence in depth, because the same project exposes a PostgREST
endpoint reachable with the public anon key.

**RSC for server data, Zustand for client state.** App Router already delivers
server data through Server Components and Server Actions. Adding React Query on
top would duplicate that cache and push pages back to client-side fetching.
Zustand holds only what is genuinely client-side and ephemeral: which bike is
active, and the in-progress ride.

**Statistics are aggregated in Postgres.** The home page and dashboard used to
load every refuel and maintenance row for every vehicle and sum them in the
browser. `statsRepository` issues five GROUP BY queries whose result size
depends on vehicle and category counts, not on how long the user has owned the
bike.

**Log lists use cursor pagination on `(date, id)`.** Offset pagination is wrong
here because logs are routinely back-filled with past dates, which shifts an
offset under the reader mid-scroll.

**A trip's GPS track is one encoded polyline, not a row per point.** Two hours
at 1 Hz is ~7000 points. As rows they would dwarf the rest of the database and
turn the trip list into a join over millions of rows. Individual points stop
being SQL-queryable, which nothing in the product needs, and the whole track
fits in a single IndexedDB record for offline use.

**The group-ride relay is never torn down.** `HybridTransport` keeps Supabase
Realtime running as the floor and layers WebRTC on top per peer. Both paths
carry the same updates; the receiver keeps whichever copy arrives first, keyed
on a per-sender sequence number. A peer whose direct connection never
establishes, or drops mid-ride, simply keeps being served by the relay. This is
what makes the fallback transparent — there is no moment of "switching over"
during which data could be lost. It costs duplicate traffic on upgraded links:
tens of bytes at 1 Hz.

**Every server action returns `ActionResult`.** Actions previously mixed
returning `{ error }` with throwing, so callers could not tell success from
failure without knowing which action they were calling. Several UI paths
silently swallowed failures as a result.

## Outstanding

- **The pending migration has not been applied.** The database was unreachable
  during the refactor (paused project or rotated credentials). See
  `prisma/migrations/README.md`; it is purely additive.
- **Group rides need three Supabase values** — see `.env.example`. The page
  states which are missing rather than failing opaquely.
- **`next@14.1.0` has a published security advisory.** Upgrading was out of
  scope for this refactor but should be scheduled.
- Geolocation and `DeviceOrientationEvent` require HTTPS, so testing the
  recorder on a phone needs a tunnel or a deploy, not a LAN address.

## Commands

```bash
pnpm install
pnpm dev
pnpm test          # 155 unit tests, no database or network needed
pnpm typecheck
pnpm lint
pnpm build
```
