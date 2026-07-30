"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  detectLanguage,
  isLanguage,
  LOCALE_BY_LANGUAGE,
  translations,
  type Language,
  type TranslationKey,
} from "@/shared/i18n";
import { DEFAULT_PREFS, type FormatPrefs } from "@/shared/lib/format";

const STORAGE_KEY = "motolog_lang";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  /** Keys are checked at compile time; see shared/i18n/en.ts. */
  t: (key: TranslationKey) => string;
  /** Locale-aware formatting preferences for the current language. */
  prefs: FormatPrefs;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always starts at "en" so the server and first client render agree; the
  // stored or detected language is applied after hydration.
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setLang(isLanguage(saved) ? saved : detectLanguage(navigator.language));
  }, []);

  const handleSetLang = useCallback((next: Language) => {
    setLang(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  // Falls back to English for a key a translator has not filled in yet, rather
  // than rendering the raw key to the user.
  const t = useCallback(
    (key: TranslationKey) => translations[lang][key] || translations.en[key] || key,
    [lang],
  );

  const prefs = useMemo<FormatPrefs>(
    () => ({ ...DEFAULT_PREFS, locale: LOCALE_BY_LANGUAGE[lang] }),
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang: handleSetLang, t, prefs }),
    [lang, handleSetLang, t, prefs],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
