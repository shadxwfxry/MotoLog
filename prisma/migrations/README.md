# Migrations

The project previously used `prisma db push`, so there was no migration history
in the database. `0_init` adopts the pre-refactor schema as a baseline and
`20260731000000_indexes_trips_and_group_rides` adds everything this refactor
needs.

**Both have been applied to the development database** (31 Jul 2026): 4 tables
and 13 indexes created, with the existing 6 users / 6 vehicles / 12 refuels /
6 service logs untouched. The steps below are the record of how, and what to
run against any other environment.

## What the pending migration does

`20260731000000_indexes_trips_and_group_rides` is **purely additive** — it
creates tables and indexes and drops nothing:

- indexes on the columns every query already filters and sorts by
  (`Vehicle.userId`, `RefuelingLog(vehicleId, date)` / `(vehicleId, odometer)`,
  the same pair on `MaintenanceLog`, `Part.maintenanceLogId`,
  `PlannedMaintenance(vehicleId, isCompleted)`);
- `Trip` for GPS tracking;
- `RideGroup`, `RideGroupMember` and `Friendship` for group rides.

## Applying it

Take a backup first — this is the production database.

```bash
# 1. Restore connectivity: unpause the Supabase project, or refresh
#    DATABASE_URL / DIRECT_URL in .env.
npx prisma db pull --print          # smoke-test the connection

# 2. Adopt the existing schema as the migration baseline. Without this,
#    `migrate deploy` would try to create tables that already exist.
#
#    The baseline must describe what is ALREADY in the database — the schema as
#    it was before this refactor — not the current schema.prisma. Generating it
#    from the current file would record Trip and the group-ride tables as
#    already present and leave the history permanently out of step with reality.
git show c638355~1:prisma/schema.prisma > /tmp/baseline.prisma
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel /tmp/baseline.prisma \
  --script > prisma/migrations/0_init/migration.sql
npx prisma migrate resolve --applied 0_init

# 3. Apply the pending migration.
npx prisma migrate deploy
```

From then on, `prisma migrate dev` works normally and `db push` should not be
used again.

## Defensive RLS

`rls.sql` is applied separately — see the comments in that file for why it is
defence in depth rather than the app's actual authorization mechanism.
