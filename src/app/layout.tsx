import React from "react";
import type { Metadata } from "next";
import { Inter, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navigation } from "@/components/Navigation";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { userRepository } from "@/server/repositories/userRepository";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "MotoLog",
  description: "Personal motorcycle maintenance and expenses diary",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MotoLog",
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Header } from "@/components/Header";
import { OfflineSyncProvider } from "@/components/OfflineSyncProvider";

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
    <html lang="en" className={`${theme} ${accent} ${isJournal ? "theme-journal" : ""}`}>
      <body className={`${inter.className} ${bebasNeue.variable} ${jetbrainsMono.variable}`}>
        <Providers initialTheme={theme} initialAccent={accent}>
          <OfflineSyncProvider>
            <div className="flex flex-col min-h-screen pb-20">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Navigation />
            </div>
          </OfflineSyncProvider>
        </Providers>
      </body>
    </html>
  );
}
