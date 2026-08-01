"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { cn } from "@/lib/utils";

const LANGS = ["en", "ru", "uk"] as const;

export function Header() {
  const { t, lang, setLang } = useLanguage();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40">
      {/* Hairline of accent light along the very top edge — the one piece of
          chrome that is pure decoration, and the cheapest signal that this is
          an instrument panel and not a document. */}
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-transparent via-primary/70 to-transparent"
      />

      <div className="glass border-b [border-color:hsl(var(--hairline))]">
        <div className="mx-auto flex max-w-screen-lg items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 ring-1 ring-inset ring-primary/30 transition-all group-hover:bg-primary/20 group-hover:shadow-glow">
              <img
                src="/icon-192x192.png"
                alt=""
                className="h-6 w-6 rounded-[5px] object-cover"
              />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-base font-black uppercase tracking-[0.16em] transition-colors group-hover:text-primary">
                Moto<span className="text-primary">Log</span>
              </span>
              <span className="mt-1 hidden text-[8px] font-bold uppercase tracking-[0.34em] text-muted-foreground sm:block">
                Ride telemetry
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-full border p-0.5 [border-color:hsl(var(--hairline))]">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-all",
                    lang === l
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>

            {status === "loading" ? (
              <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
            ) : session ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/settings"
                  title={t("settings")}
                  className="flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition-all hover:border-primary/50 hover:text-primary [border-color:hsl(var(--hairline))]"
                >
                  <Settings size={16} strokeWidth={2.4} />
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title={t("logout")}
                  className="flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition-all hover:border-destructive/50 hover:text-destructive [border-color:hsl(var(--hairline))]"
                >
                  <LogOut size={16} strokeWidth={2.4} />
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary px-4 py-2.5">
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
