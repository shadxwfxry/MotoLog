import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GaragePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    include: {
      refuelingLogs: { orderBy: { odometer: "desc" }, take: 1 },
    },
  });

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">My Garage</h1>
        <button className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/20">
          + Add Vehicle
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border-2 border-dashed border-border/50">
          <div className="text-7xl mb-6 grayscale opacity-20">🏍️</div>
          <p className="text-xl font-medium text-muted-foreground">Your garage is empty.</p>
          <p className="text-sm text-muted-foreground mt-2">Start by adding your first motorcycle!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {vehicles.map((vehicle) => {
            const lastOdo = vehicle.refuelingLogs[0]?.odometer ?? 0;
            return (
              <Link
                key={vehicle.id}
                href={`/garage/${vehicle.id}`}
                className="group relative block rounded-3xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold group-hover:text-primary transition-colors">{vehicle.make} {vehicle.model}</h2>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">{vehicle.year} · {vehicle.engineDisplacement}cc</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-primary transition-colors"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Odometer</p>
                    <p className="text-lg font-black">{lastOdo.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">km</span></p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
                    <p className="text-lg font-black text-green-500">Ready</p>
                  </div>
                </div>

                {/* Decorative element */}
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-4xl">🏍️</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
