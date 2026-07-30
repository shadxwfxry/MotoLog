"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useVisualTheme } from "@/components/VisualThemeProvider";
import { updateUserSettings } from "@/features/garage/actions";
import type { UserSettings } from "@prisma/client";

const THEMES = [
  { id: "theme-orange", color: "#f97316", label: "Orange" },
  { id: "theme-blue", color: "#3b82f6", label: "Blue" },
  { id: "theme-green", color: "#16a34a", label: "Green" },
  { id: "theme-red", color: "#dc2626", label: "Red" },
  { id: "theme-purple", color: "#9333ea", label: "Purple" },
  { id: "theme-yellow", color: "#eab308", label: "Yellow" },
];

export function SettingsClient({ settings }: { settings: UserSettings | null }) {
  const { t, lang } = useLanguage();
  const { theme, setTheme, accentColor, setAccentColor } = useVisualTheme();
  
  const [localTheme, setLocalTheme] = useState(settings?.theme || theme);
  const [localAccent, setLocalAccent] = useState(settings?.accentColor || accentColor);
  const [newsPrefs, setNewsPrefs] = useState(settings?.newsPreferences === "all" ? "Global" : (settings?.newsPreferences || "Global"));
  const [saving, setSaving] = useState(false);

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
    alert(t("settings_saved") || "Settings saved!");
  };

  return (
    <div className="max-w-screen-md mx-auto px-4 py-8 space-y-8 pb-24">
      <h1 className="text-2xl font-bold tracking-tight">{t("settings")}</h1>

      <div className="grid gap-6">
        {/* Appearance */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("appearance")}</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <span className="text-sm font-medium">{t("theme")}</span>
               <div className="flex bg-muted rounded-xl p-1">
                  <button 
                    onClick={() => setLocalTheme("light")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${localTheme === 'light' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                  >
                    {t("light")}
                  </button>
                  <button 
                    onClick={() => setLocalTheme("dark")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${localTheme === 'dark' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                  >
                    {t("dark")}
                  </button>
                  <button 
                    onClick={() => setLocalTheme("journal")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${localTheme === 'journal' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                  >
                    {lang === "uk" ? "Журнал" : lang === "ru" ? "Журнал" : "Journal"}
                  </button>
               </div>
            </div>

            <div className="space-y-3">
               <span className="text-sm font-medium block">{t("accent_color")}</span>
               <div className="flex flex-wrap gap-3">
                  {THEMES.map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => setLocalAccent(themeOption.id)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${localAccent === themeOption.id ? 'border-primary scale-110' : 'border-transparent opacity-60'}`}
                      style={{ backgroundColor: themeOption.color }}
                      title={themeOption.label}
                    />
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* News Preferences */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("news_feed")}</h2>
          <div className="space-y-2">
             <label className="text-xs font-bold text-muted-foreground uppercase">{t("source_prefs")}</label>
             <select 
               value={newsPrefs} 
               onChange={(e) => setNewsPrefs(e.target.value)}
               className="w-full bg-muted border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
             >
                <option value="Global">Global (All News)</option>
                <option value="Europe">Europe</option>
                <option value="North America">North America</option>
                <option value="Asia">Asia</option>
                <option value="Ukraine">Ukraine</option>
                <option value="Russia">Russia</option>
             </select>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold uppercase tracking-widest hover:opacity-90 transition shadow-xl shadow-primary/20"
        >
          {saving ? "..." : t("save_settings")}
        </button>
      </div>
    </div>
  );
}
