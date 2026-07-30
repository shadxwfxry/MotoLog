import Link from "next/link";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";
import { serializeForClient } from "@/shared/lib/serialize";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getOptionalAuthUser();

  if (user) {
    // Vehicles, their latest odometer readings and open reminders. The page
    // used to additionally load every refuel and maintenance row for every
    // bike — thousands of rows to render a status badge and two reminders.
    const vehicles = await vehicleRepository.listWithReminders(user.id);

    return <HomeClient vehicles={serializeForClient(vehicles)} />;
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
