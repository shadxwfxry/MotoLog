import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

/**
 * Prisma singleton.
 *
 * Query logging is gated on the environment — it used to be unconditional,
 * which meant every production request wrote its full SQL to the logs.
 *
 * Import this only from `src/server/repositories/**`; everything else goes
 * through a repository (enforced by the `no-restricted-imports` ESLint rule).
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
