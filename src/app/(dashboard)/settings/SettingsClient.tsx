"use client";

import { useState } from "react";
import { BookOpen, Check, Globe, Moon, Palette, Sun } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { useVisualTheme } from "@/components/VisualThemeProvider";
import { updateUserSettings } from "@/features/garage/actions";
import { Panel, PanelTitle, PageHeader, PageShell } from "@/shared/ui";
import { cn } from "@/lib/utils";
import type { UserSettings } from "@prisma/client";

const ACCENTS = [
  { id: "theme-orange", color: "#ff6a1a", label: "Orange" },
  { id: "theme-blue", color: "#1a9bff", label: "Blue" },
  { id: "theme-green", color: "#0ad97f", label: "Green" },
  { id: "theme-red", color: "#ff3355", label: "Red" },
  { id: "theme-purple", color: "#9c5cff", label: "Purple" },
  { id: "theme-yellow", color: "#ffc61a", label: "Yellow" },
];

const NEWS_REGIONS = ["Global", "Europe", "North America", "Asia", "Ukraine", "Russia"];

export function SettingsClient({ settings }: { settings: UserSettings | null }) {
  const { t } = useLanguage();
  const { theme, setTheme, accentColor, setAccentColor } = useVisualTheme();

  const [localTheme, setLocalTheme] = useState(settings?.theme || theme);
  const [localAccent, setLocalAccent] = useState(settings?.accentColor || accentColor);
  const [newsPrefs, setNewsPrefs] = useState(
    settings?.newsPreferences === "all" ? "Global" : (settings?.newsPreferences || "Global"),
  );
  const [saving, setSaving] = useState(false);

  const modes = [
    { id: "light", label: t("light"), Icon: Sun },
    { id: "dark", label: t("dark"), Icon: Moon },
    { id: "journal", label: t("journal"), Icon: BookOpen },
  ];

  const handleSave = async () => {
    setSaving(true);

    const result = await updateUserSettings(localTheme, localAccent, newsPrefs);
    setSaving(false);

    if (!result.ok) {
      // Previously the failure was only written to the console, so the user
      // saw nothing at all and assumed the settings had saved.
      alert(result.error);
      return;
    }

    setTheme(localTheme);
    setAccentColor(localAccent);
    alert(t("settings_saved"));
  };

  return (
    <PageShell width="md">
      <PageHeader eyebrow={t("overview")} title={t("settings")} />

      <Panel padding="lg" className="space-y-7">
        <PanelTitle icon={<Palette size={13} strokeWidth={2.6} />} className="mb-0">
          {t("appearance")}
        </PanelTitle>

        <div className="space-y-3">
          <p className="label-micro">{t("theme")}</p>
          <div className="grid grid-cols-3 gap-2">
            {modes.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setLocalTheme(id)}
                aria-pressed={localTheme === id}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-md border py-4 transition-all duration-300",
                  localTheme === id
                    ? "border-primary/60 bg-primary/10 text-primary shadow-glow"
                    : "text-muted-foreground hover:text-foreground [border-color:hsl(var(--hairline))]",
                )}
              >
                <Icon size={20} strokeWidth={2.2} />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="label-micro">{t("accent_color")}</p>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((accent) => (
              <button
                key={accent.id}
                onClick={() => setLocalAccent(accent.id)}
                title={accent.label}
                aria-pressed={localAccent === accent.id}
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300",
                  localAccent === accent.id
                    ? "scale-110 ring-2 ring-offset-4 ring-offset-background"
                    : "opacity-55 hover:opacity-100",
                )}
                style={{
                  backgroundColor: accent.color,
                  boxShadow:
                    localAccent === accent.id ? `0 0 24px -2px ${accent.color}` : undefined,
                  // The ring must match the swatch, and Tailwind cannot generate
                  // a class for a runtime colour.
                  ["--tw-ring-color" as string]: accent.color,
                }}
              >
                {localAccent === accent.id && (
                  <Check size={18} strokeWidth={3.5} className="text-black/70" />
                )}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel padding="lg" className="space-y-5">
        <PanelTitle icon={<Globe size={13} strokeWidth={2.6} />} className="mb-0">
          {t("news_feed")}
        </PanelTitle>

        <div className="space-y-2">
          <label className="label-micro" htmlFor="news-region">
            {t("source_prefs")}
          </label>
          <select
            id="news-region"
            value={newsPrefs}
            onChange={(e) => setNewsPrefs(e.target.value)}
            className="field cursor-pointer appearance-none"
          >
            {NEWS_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      <button onClick={handleSave} disabled={saving} className="btn-primary h-14 w-full text-sm">
        {saving ? `${t("loading")}…` : t("save_settings")}
      </button>
    </PageShell>
  );
}
