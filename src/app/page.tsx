import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    const user = await prisma.user.findUnique({
      where: { email: session.user!.email! },
      include: {
        vehicles: {
          include: {
            refuelingLogs: { orderBy: { odometer: "desc" }, take: 1 },
            maintenanceLogs: { orderBy: { odometer: "desc" }, take: 1 },
            plannedMaintenances: {
              where: { isCompleted: false },
              orderBy: [
                { targetOdometer: "asc" },
                { targetDate: "asc" }
              ]
            }
          }
        },
        settings: true
      },
    });

    const vehicleIds = user?.vehicles.map((v) => v.id) ?? [];

    const [refuels, maintenance] = await Promise.all([
      prisma.refuelingLog.findMany({
        where: { vehicleId: { in: vehicleIds } },
        orderBy: { date: "desc" },
        include: { vehicle: true },
      }),
      prisma.maintenanceLog.findMany({
        where: { vehicleId: { in: vehicleIds } },
        orderBy: { date: "desc" },
        include: { 
          vehicle: true,
          parts: true 
        },
      }),
    ]);

    return (
      <HomeClient
        refuels={refuels}
        maintenance={maintenance}
        vehicles={user?.vehicles || []}
      />
    );
  }

  // Not Authenticated: Show Landing Page
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-6 text-center">
      {/* Hero */}
      <div className="mb-6 text-6xl">🏍</div>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
        MotoLog
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Your personal motorcycle maintenance & expenses diary.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm">
        <Link
          href="/garage"
          className="flex-1 py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm text-center hover:bg-primary/90 transition-colors shadow-lg"
        >
          🏍 My Garage
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 py-3 px-6 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm text-center hover:bg-secondary/80 transition-colors"
        >
          📊 Statistics
        </Link>
      </div>

      <div className="mt-4">
        <Link href="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
          Create a free account →
        </Link>
      </div>
    </div>
  );
}
