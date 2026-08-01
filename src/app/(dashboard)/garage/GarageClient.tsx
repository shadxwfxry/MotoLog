"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowUpRight, Bike, Gauge, Share2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { AddVehicleForm } from "@/components/AddVehicleForm";
import { db } from "@/lib/dexie";
import { cacheVehiclesLocally } from "@/lib/offlineSync";
import { currentOdometerOf } from "@/features/maintenance/reminders";
import { Badge, EmptyState, Panel, PageHeader, PageShell } from "@/shared/ui";
import type { GarageVehicle } from "@/app/types";

export function GarageClient({ vehicles }: { vehicles: GarageVehicle[] }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.onLine) {
      cacheVehiclesLocally(vehicles);
    }
  }, [vehicles]);

  const cachedVehicles = useLiveQuery(() => db.vehicles.toArray());
  const displayedVehicles: GarageVehicle[] =
    cachedVehicles && cachedVehicles.length > 0
      ? (cachedVehicles as unknown as GarageVehicle[])
      : vehicles;

  const handleShare = async (slug: string) => {
    const url = `${window.location.origin}/public/${slug}`;
    await navigator.clipboard.writeText(url);
    alert(t("link_copied"));
  };

  return (
    <PageShell>
      <PageHeader
        // The count belongs in the eyebrow, not a sentence: "1 гараж" read as
        // nonsense in Russian and Ukrainian.
        eyebrow={`${t("fleet")} · ${displayedVehicles.length}`}
        title={t("go_garage")}
        action={<AddVehicleForm />}
      />

      {displayedVehicles.length === 0 ? (
        <EmptyState
          icon={<Bike size={48} strokeWidth={1.5} />}
          title={t("garage_empty")}
          description={t("start_adding")}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {displayedVehicles.map((vehicle, index) => {
            const lastOdo = currentOdometerOf(vehicle);

            return (
              <Panel
                key={vehicle.id}
                interactive
                padding="none"
                className="group animate-rise-in overflow-hidden"
                style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                <Link href={`/garage/${vehicle.id}`} className="block">
                  <div className="relative h-52 w-full overflow-hidden">
                    {vehicle.photoUrl ? (
                      <img
                        src={vehicle.photoUrl}
                        alt={vehicle.model}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-grid-fine bg-grid">
                        <Bike size={64} strokeWidth={1} className="text-foreground/10" />
                      </div>
                    )}

                    {/* Two overlays: a dark base so the title stays legible on
                        any photo, plus an accent wash that only appears on
                        hover, tinting the machine in the app's own colour. */}
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-tr from-primary/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />

                    {vehicle.brandName && (
                      <span className="absolute left-4 top-4">
                        <Badge tone="default" className="glass">
                          {vehicle.brandName}
                        </Badge>
                      </span>
                    )}

                    <span className="absolute right-4 top-4 flex h-9 w-9 translate-x-2 items-center justify-center rounded-md border border-primary/40 bg-primary/15 text-primary opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      <ArrowUpRight size={17} strokeWidth={2.6} />
                    </span>

                    <div className="absolute bottom-4 left-5 right-5">
                      <h2 className="font-display text-xl font-black uppercase leading-none tracking-tight">
                        {vehicle.make}{" "}
                        <span className="text-primary">{vehicle.model}</span>
                      </h2>
                      <p className="num mt-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        {vehicle.year} · {vehicle.engineDisplacement ?? "—"} cc
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center justify-between gap-4 border-t px-5 py-4 [border-color:hsl(var(--hairline))]">
                  <div>
                    <p className="label-micro flex items-center gap-1.5">
                      <Gauge size={11} strokeWidth={2.6} />
                      {t("last_odometer")}
                    </p>
                    <p className="num mt-0.5 text-xl font-black">
                      {lastOdo.toLocaleString()}
                      <span className="ml-1 text-[11px] font-bold text-muted-foreground">km</span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      // /public/[slug] looks the vehicle up by slug; passing the
                      // id here produced a 404 on every shared link.
                      void handleShare(vehicle.slug);
                    }}
                    title={t("share")}
                    className="flex h-10 w-10 items-center justify-center rounded-md border text-muted-foreground transition-all hover:border-primary/50 hover:text-primary [border-color:hsl(var(--hairline))]"
                  >
                    <Share2 size={16} strokeWidth={2.2} />
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
