"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { SmartSearch } from "@/components/SmartSearch";
import { formatDate } from "@/lib/utils";
import type { MotoNews } from "@/types";

interface Props {
  news: MotoNews[];
  refuels: any[];
  maintenance: any[];
}

export function HomeClient({ news, refuels, maintenance }: Props) {
  const { t } = useLanguage();

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("home") || "Home"}</h1>
        <p className="text-sm text-muted-foreground">{t("welcome_back") || "Track your rides and maintenance in one place."}</p>
      </div>

      <SmartSearch refuels={refuels} maintenance={maintenance} />

      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
           {t("moto_news") || "Moto News"}
        </h2>
        
        {news.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
             {news.map((item, i) => (
               <a key={i} href={item.link} target="_blank" className="block p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all group shadow-sm">
                  <p suppressHydrationWarning className="text-[10px] font-bold text-primary uppercase mb-2">{item.source} · {formatDate(item.pubDate)}</p>
                  <h3 className="text-base font-bold mb-2 group-hover:text-primary transition-colors leading-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.contentSnippet}</p>
               </a>
             ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm border border-border rounded-2xl bg-card">
            No news found for your region.
          </div>
        )}
      </div>
    </div>
  );
}
