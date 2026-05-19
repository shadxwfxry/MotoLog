import React from "react";
import type { Metadata } from "next";
import { Inter, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navigation } from "@/components/Navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const session = await getServerSession(authOptions);
  
  let theme = "dark";
  let accent = "theme-orange";

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true }
    });
    if (user?.settings) {
      theme = user.settings.theme;
      accent = user.settings.accentColor;
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
