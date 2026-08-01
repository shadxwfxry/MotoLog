"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, Bell, Bike, Gauge, Plus } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { SmartSearch } from "@/components/SmartSearch";
import { db } from "@/lib/dexie";
import { cacheVehiclesLocally } from "@/lib/offlineSync";
import {
  URGENCY_HORIZON,
  currentOdometerOf,
  hasOverdue as anyOverdue,
  scoreReminders,
} from "@/features/maintenance/reminders";
import { useActiveVehicleStore } from "@/store/activeVehicleStore";
import { Badge, Panel, PanelTitle, PageHeader, PageShell } from "@/shared/ui";
import type { Tone } from "@/shared/ui";
import type { HomeVehicle } from "./types";

interface Props {
  vehicles: HomeVehicle[];
}

export function HomeClient({ vehicles }: Props) {
  const { t } = useLanguage();
  const resolveActiveId = useActiveVehicleStore((s) => s.resolveActiveId);
  const activeVehicleId = useActiveVehicleStore((s) => s.activeVehicleId);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.onLine) {
      cacheVehiclesLocally(vehicles);
    }
  }, [vehicles]);

  const cachedVehicles = useLiveQuery(() => db.vehicles.toArray());
  const displayedVehicles: HomeVehicle[] =
    cachedVehicles && cachedVehicles.length > 0
      ? (cachedVehicles as unknown as HomeVehicle[])
      : vehicles;

  // The user's chosen bike, falling back to the first one. Reading the store
  // during render keeps this in sync after hydration without an extra effect.
  const activeVehicle = useMemo(() => {
    const activeId = activeVehicleId ?? resolveActiveId(displayedVehicles.map((v) => v.id));
    return displayedVehicles.find((v) => v.id === activeId) ?? displayedVehicles[0];
  }, [displayedVehicles, activeVehicleId, resolveActiveId]);

  const currentOdometer = activeVehicle ? currentOdometerOf(activeVehicle) : 0;

  const activeScored = useMemo(
    () =>
      activeVehicle
        ? scoreReminders(
            activeVehicle.plannedMaintenances ?? [],
            currentOdometer,
            URGENCY_HORIZON.overview,
          )
        : [],
    [activeVehicle, currentOdometer],
  );

  const status: { tone: Tone; label: string; pulse: boolean } = anyOverdue(activeScored)
    ? { tone: "rose", label: t("needs_service"), pulse: true }
    : activeScored.length > 0
      ? { tone: "amber", label: t("scheduled_service"), pulse: false }
      : { tone: "lime", label: t("ready_for_season"), pulse: false };

  // Most pressing reminders across the whole garage, not just the active bike.
  const urgentReminders = useMemo(
    () =>
      displayedVehicles
        .flatMap((v) =>
          scoreReminders(
            v.plannedMaintenances ?? [],
            currentOdometerOf(v),
            URGENCY_HORIZON.overview,
          ).map((r) => ({ ...r, vehicleName: `${v.make} ${v.model}` })),
        )
        .sort((a, b) => b.rank - a.rank)
        .slice(0, 3),
    [displayedVehicles],
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("overview")}
        title={t("welcome_back")}
        description={t("home_subtitle")}
      />

      <SmartSearch />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ── Active bike: the hero readout ── */}
        <Panel corners sweep padding="none" className="animate-rise-in lg:col-span-3">
          {/* The bike's own photo, pushed far back and desaturated, so the
              panel is unmistakably about *this* machine without the image
              competing with the numbers on top of it. */}
          {activeVehicle?.photoUrl && (
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center opacity-[0.14] mix-blend-luminosity"
              style={{ backgroundImage: `url(${activeVehicle.photoUrl})` }}
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-card via-card/80 to-transparent"
          />

          <div className="relative flex h-full flex-col justify-between gap-6 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <p className="eyebrow">
                <Bike size={13} strokeWidth={2.6} />
                {t("active_bike")}
              </p>
              {activeVehicle && (
                <Badge tone={status.tone} dot pulse={status.pulse}>
                  {status.label}
                </Badge>
              )}
            </div>

            {activeVehicle ? (
              <>
                <div>
                  <h2 className="font-display text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">
                    {activeVehicle.make}{" "}
                    <span className="text-primary text-glow">{activeVehicle.model}</span>
                  </h2>
                  <p className="num mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {activeVehicle.year} · {activeVehicle.engineDisplacement || "—"} cc
                  </p>
                </div>

                <div className="flex items-end justify-between gap-4 border-t pt-5 [border-color:hsl(var(--hairline))]">
                  <div>
                    <p className="label-micro flex items-center gap-1.5">
                      <Gauge size={12} strokeWidth={2.6} />
                      {t("current_odometer")}
                    </p>
                    <p className="num mt-1 text-4xl font-black leading-none text-primary text-glow sm:text-5xl">
                      {currentOdometer.toLocaleString()}
                      <span className="ml-1.5 text-base font-bold text-muted-foreground">km</span>
                    </p>
                  </div>

                  <Link
                    href={`/garage/${activeVehicle.id}`}
                    className="btn-ghost h-11 px-5"
                  >
                    {t("garage")}
                    <ArrowRight size={14} strokeWidth={2.6} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-5 py-6">
                <p className="text-sm text-muted-foreground">{t("no_vehicles_garage")}</p>
                <Link href="/garage" className="btn-primary h-11 px-6">
                  <Plus size={15} strokeWidth={3} />
                  {t("add_vehicle")}
                </Link>
              </div>
            )}
          </div>
        </Panel>

        {/* ── Alerts ── */}
        <Panel className="flex animate-rise-in flex-col justify-between lg:col-span-2">
          <div>
            <PanelTitle icon={<Bell size={13} strokeWidth={2.6} />}>{t("urgent_alerts")}</PanelTitle>

            {urgentReminders.length > 0 ? (
              <ul className="space-y-2">
                {urgentReminders.map((r) => {
                  const tone: Tone = r.urgency === "overdue" ? "rose" : "amber";
                  return (
                    <li
                      key={r.id}
                      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 ${
                        tone === "rose"
                          ? "border-signal-rose/25 bg-signal-rose/[0.06]"
                          : "border-signal-amber/25 bg-signal-amber/[0.06]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{r.type}</p>
                        <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          {r.vehicleName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge tone={tone}>
                          {r.urgency === "overdue" ? t("urgent") : t("soon")}
                        </Badge>
                        {r.targetOdometer && (
                          <p className="num mt-1 text-[10px] text-muted-foreground">
                            {r.targetOdometer.toLocaleString()} km
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-md border border-signal-lime/25 bg-signal-lime/[0.06] px-4 py-8 text-center">
                <p className="font-display text-sm font-bold uppercase tracking-wide text-signal-lime">
                  {t("all_nominal")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{t("no_maint_alerts")}</p>
              </div>
            )}
          </div>

          <Link href="/garage" className="btn-ghost mt-5 h-11 w-full">
            {t("view_all")}
            <ArrowRight size={14} strokeWidth={2.6} />
          </Link>
        </Panel>
      </div>
    </PageShell>
  );
}
