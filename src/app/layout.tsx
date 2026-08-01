import React from "react";
import type { Metadata } from "next";
import { Inter, Unbounded, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { OfflineSyncProvider } from "@/components/OfflineSyncProvider";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { userRepository } from "@/server/repositories/userRepository";

// Every face here carries Cyrillic: the app ships English, Russian and
// Ukrainian, and a display font without Cyrillic would silently fall back
// mid-heading and break the look on two of the three locales.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MotoLog — ride telemetry & garage",
  description: "Personal motorcycle maintenance, expenses and ride telemetry",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MotoLog",
  },
};

export const viewport = {
  themeColor: "#05070B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getOptionalAuthUser();

  let theme = "dark";
  let accent = "theme-orange";

  if (user) {
    const settings = await userRepository.findSettings(user.id);
    if (settings) {
      theme = settings.theme;
      accent = settings.accentColor;
    }
  }

  const isJournal = theme === "journal";

  return (
    <html
      lang="en"
      className={`${theme} ${accent} ${isJournal ? "theme-journal" : ""}`}
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${unbounded.variable} ${jetbrainsMono.variable} ${bebasNeue.variable} font-sans`}
      >
        <Providers initialTheme={theme} initialAccent={accent}>
          <OfflineSyncProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 pb-28">{children}</main>
              <Navigation />
            </div>
          </OfflineSyncProvider>
        </Providers>
      </body>
    </html>
  );
}
