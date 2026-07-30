# Migrations

The project previously used `prisma db push`, so there is no migration history in
the database. These files were generated with `prisma migrate diff` and are
**not applied yet** — the database was unreachable at the time they were written
(`FATAL: (ENOTFOUND) tenant/user postgres.… not found`, i.e. a paused Supabase
project or rotated credentials).

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
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
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
