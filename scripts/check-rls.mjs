/**
 * Reports which public-schema tables have row level security enabled, and
 * whether the `anon` role can still read them.
 *
 * Supabase's Security Advisor emails about tables in `public` without RLS,
 * because the project also exposes a PostgREST endpoint reachable with the
 * public anon key — so "no RLS" means "the whole database is readable by
 * anyone holding a key that ships in the client bundle".
 *
 * Run after `prisma/rls.sql`:  node scripts/check-rls.mjs
 * Exits non-zero if anything is still exposed, so CI can gate on it.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

// Loaded here rather than via a flag so the script is one command to run.
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/.exec(line);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const prisma = new PrismaClient();

try {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT c.relname AS table_name,
           c.relrowsecurity AS rls_enabled,
           has_table_privilege('anon', c.oid, 'SELECT') AS anon_can_select
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relrowsecurity ASC, c.relname
  `);

  let exposed = 0;

  for (const row of rows) {
    const bad = !row.rls_enabled || row.anon_can_select;
    if (bad) exposed++;
    console.log(
      `${bad ? "!" : " "} ${row.rls_enabled ? "RLS on " : "RLS OFF"}  ` +
        `anon_select=${row.anon_can_select ? "YES" : "no "}  ${row.table_name}`,
    );
  }

  console.log(`\n${rows.length} public tables, ${exposed} exposed`);
  process.exitCode = exposed > 0 ? 1 : 0;
} catch (error) {
  console.error("Could not reach the database:", error.message.split("\n")[0]);
  process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}
