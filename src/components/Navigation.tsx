"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bike, Home, Newspaper, Route, Trophy } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { cn } from "@/lib/utils";

/**
 * A floating dock rather than a full-width bar: it detaches from the edge, so
 * the ambient background reads underneath it and the app looks like an
 * instrument overlay instead of a website with a footer.
 */
export function Navigation() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const items = [
    { href: "/", label: t("home"), Icon: Home },
    { href: "/garage", label: t("garage"), Icon: Bike },
    { href: "/rides", label: t("rides"), Icon: Route },
    { href: "/dashboard", label: t("stats"), Icon: BarChart3 },
    { href: "/tournaments", label: t("tournaments"), Icon: Trophy },
    // Short label here: the page title ("Motorcycle World News") is three times
    // the width of every other item and stretched the dock off-centre.
    { href: "/news", label: t("news_short"), Icon: Newspaper },
  ];

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="glass pointer-events-auto flex items-center gap-0.5 rounded-full border p-1.5 shadow-[0_24px_48px_-20px_rgb(0_0_0/0.8)] [border-color:hsl(var(--hairline))]">
        {items.map(({ href, label, Icon }) => {
          // `/` must match exactly or it would light up on every route.
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              title={label}
              className={cn(
                "group relative flex items-center gap-2 rounded-full px-3 py-2.5 transition-all duration-300 sm:px-4",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_6px_20px_-6px_hsl(var(--primary))]"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              <Icon size={19} strokeWidth={isActive ? 2.6 : 2} className="shrink-0" />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.12em]",
                  // The label only appears for the active item on small screens,
                  // which keeps six destinations on a phone without crowding.
                  isActive ? "hidden xs:inline lg:inline" : "hidden lg:inline",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
