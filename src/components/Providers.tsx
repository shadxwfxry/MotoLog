"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "./LanguageProvider";
import { VisualThemeProvider } from "./VisualThemeProvider";

export function Providers({ 
  children, 
  initialTheme, 
  initialAccent 
}: { 
  children: React.ReactNode, 
  initialTheme?: string, 
  initialAccent?: string 
}) {
  return (
    <SessionProvider>
      <VisualThemeProvider initialTheme={initialTheme} initialAccent={initialAccent}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </VisualThemeProvider>
    </SessionProvider>
  );
}
