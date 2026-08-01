"use client";

import { useLanguage } from "./LanguageProvider";
import type { TranslationKey } from "@/shared/i18n";

/**
 * Renders one translated string inside a server component.
 *
 * The language lives in localStorage and is therefore only knowable on the
 * client, so RSC pages cannot call `t()`. Several of them — the vehicle detail
 * page most visibly — had their section labels hardcoded in English as a
 * result. This is the smallest thing that fixes that without turning whole
 * pages into client components.
 */
export function T({ k }: { k: TranslationKey }) {
  const { t } = useLanguage();
  return <>{t(k)}</>;
}
