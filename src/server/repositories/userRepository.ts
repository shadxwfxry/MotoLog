import { prisma } from "@/server/db";
import type { FormatPrefs } from "@/shared/lib/format";
import { toUnitSystem } from "@/shared/lib/format";

/** Locales the app ships; used to resolve a safe Intl tag. */
const LOCALE_BY_LANG: Record<string, string> = {
  en: "en-GB",
  ru: "ru-RU",
  uk: "uk-UA",
};

export const userRepository = {
  /**
   * Only the credentials provider may call this — it is the one place the
   * password hash leaves the database.
   */
  findByEmailWithPassword(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true },
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, currency: true, unitSystem: true },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, currency: true, unitSystem: true },
    });
  },

  exists(email: string) {
    return prisma.user.findUnique({ where: { email }, select: { id: true } });
  },

  create(data: { name?: string | null; email: string; passwordHash: string }) {
    return prisma.user.create({
      data: { name: data.name ?? null, email: data.email, password: data.passwordHash },
      select: { id: true, name: true, email: true },
    });
  },

  findSettings(userId: string) {
    return prisma.userSettings.findUnique({ where: { userId } });
  },

  upsertSettings(
    userId: string,
    settings: { theme: string; accentColor: string; newsPreferences: string },
  ) {
    return prisma.userSettings.upsert({
      where: { userId },
      update: settings,
      create: { userId, ...settings },
    });
  },

  /**
   * Formatting preferences for a user, falling back to the metric/₴ defaults.
   * `lang` comes from the client-side language picker, not the database.
   */
  async findFormatPrefs(userId: string, lang = "en"): Promise<FormatPrefs> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true, unitSystem: true },
    });

    return {
      currency: user?.currency ?? "₴",
      unitSystem: toUnitSystem(user?.unitSystem),
      locale: LOCALE_BY_LANG[lang] ?? LOCALE_BY_LANG.en,
    };
  },
};
