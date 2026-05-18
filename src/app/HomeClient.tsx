"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { SmartSearch } from "@/components/SmartSearch";

interface Props {
  refuels: any[];
  maintenance: any[];
}

export function HomeClient({ refuels, maintenance }: Props) {
  const { t } = useLanguage();

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("home") || "Home"}</h1>
        <p className="text-sm text-muted-foreground">{t("welcome_back") || "Track your rides and maintenance in one place."}</p>
      </div>

      <SmartSearch refuels={refuels} maintenance={maintenance} />
    </div>
  );
}
