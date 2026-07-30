import { en, type TranslationKey } from "./en";
import { ru } from "./ru";
import { uk } from "./uk";

export type { TranslationKey };

export const LANGUAGES = ["en", "ru", "uk"] as const;
export type Language = (typeof LANGUAGES)[number];

export const translations: Record<Language, Record<TranslationKey, string>> = { en, ru, uk };

/** BCP 47 tags for Intl, used by the formatting helpers. */
export const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: "en-GB",
  ru: "ru-RU",
  uk: "uk-UA",
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

/**
 * Best language for a browser, falling back to English.
 * `navigator.language` is a full tag like "uk-UA", so only the primary subtag
 * is compared.
 */
export function detectLanguage(navigatorLanguage: string | undefined): Language {
  const primary = navigatorLanguage?.split("-")[0]?.toLowerCase();
  return isLanguage(primary) ? primary : "en";
}
