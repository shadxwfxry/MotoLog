"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function VisualThemeProvider({ 
  children,
  initialTheme = "dark",
  initialAccent = "theme-orange"
}: { 
  children: React.ReactNode,
  initialTheme?: string,
  initialAccent?: string
}) {
  const { data: session } = useSession();
  const [theme, setThemeState] = useState(initialTheme);
  const [accentColor, setAccentColorState] = useState(initialAccent);

  // When initial props change (e.g. user logs in/out), update state
  useEffect(() => {
    setThemeState(initialTheme);
    setAccentColorState(initialAccent);
  }, [initialTheme, initialAccent]);

  const applyTheme = (t: string, a: string) => {
    const html = document.documentElement;
    // Safe reset of old accent classes to prevent split crashes on empty className
    if (html.className) {
      html.className.split(' ').forEach(cls => {
        if (cls.startsWith("theme-")) html.classList.remove(cls);
      });
    }
    
    // Add new accent class
    if (a) {
      html.classList.add(a);
    }
    
    // Set theme (dark/light)
    if (t === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };

  const setTheme = (t: string) => {
    setThemeState(t);
    applyTheme(t, accentColor);
  };

  const setAccentColor = (a: string) => {
    setAccentColorState(a);
    applyTheme(theme, a);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useVisualTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useVisualTheme must be used within VisualThemeProvider");
  return context;
};
