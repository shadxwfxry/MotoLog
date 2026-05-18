"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { formatDate } from "@/lib/utils";
import type { MotoNews } from "@/types";

interface Props {
  news: MotoNews[];
}

export function NewsClient({ news }: Props) {
  const { t } = useLanguage();

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          📰 {t("moto_news") || "Moto News"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("news_description") || "Stay up to date with the latest motorcycle world news and events."}
        </p>
      </div>

      <div className="space-y-4">
        {news.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {news.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 bg-card border border-border rounded-3xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group shadow-sm bg-gradient-to-br from-card to-card/50"
              >
                <div className="flex justify-between items-center mb-2">
                  <p suppressHydrationWarning className="text-[10px] font-black text-primary uppercase tracking-wider">
                    {item.source}
                  </p>
                  <p suppressHydrationWarning className="text-[10px] text-muted-foreground font-semibold">
                    {formatDate(item.pubDate)}
                  </p>
                </div>
                <h3 className="text-base font-extrabold mb-2 group-hover:text-primary transition-colors leading-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {item.contentSnippet}
                </p>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground text-sm border border-border rounded-3xl bg-card/40 backdrop-blur-sm shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-muted-foreground/50">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
              <path d="M18 14h-8"/>
              <path d="M15 18h-5"/>
              <path d="M10 6h8v4h-8V6Z"/>
            </svg>
            <p className="font-semibold">No news found for your region.</p>
          </div>
        )}
      </div>
    </div>
  );
}
