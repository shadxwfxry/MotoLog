"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Bike, Gauge, Route } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Panel } from "@/shared/ui";

/**
 * What a signed-out visitor sees. It was the one screen the redesign missed —
 * still the old centred stack with English hardcoded past the language switch.
 */
export function LandingClient() {
  const { t } = useLanguage();

  const features = [
    { Icon: Gauge, label: t("odometer"), value: t("consumption") },
    { Icon: Route, label: t("rides"), value: t("telemetry") },
    { Icon: BarChart3, label: t("stats"), value: t("spending_breakdown") },
  ];

  return (
    <div className="mx-auto flex w-full max-w-screen-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <span className="eyebrow mb-6">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />
        {t("telemetry")}
      </span>

      <h1 className="animate-rise-in font-display text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl">
        Moto<span className="text-primary text-glow">Log</span>
      </h1>

      <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg">
        {t("welcome_desc")}
      </p>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
        <Link href="/garage" className="btn-primary flex-1 py-4">
          <Bike size={16} strokeWidth={2.6} />
          {t("go_garage")}
        </Link>
        <Link href="/dashboard" className="btn-ghost flex-1 py-4">
          <BarChart3 size={16} strokeWidth={2.6} />
          {t("view_stats")}
        </Link>
      </div>

      <Link
        href="/register"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
      >
        {t("landing_cta_account")}
        <ArrowRight size={14} strokeWidth={2.6} />
      </Link>

      <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
        {features.map(({ Icon, label, value }, i) => (
          <Panel
            key={label}
            className="animate-rise-in text-left"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <Icon size={20} strokeWidth={2.2} className="mb-3 text-primary" />
            <p className="font-display text-sm font-bold uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{value}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
