"use client";

import { ArrowUpRight, Newspaper } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { formatDate } from "@/shared/lib/format";
import { EmptyState, Panel, PageHeader, PageShell } from "@/shared/ui";
import type { MotoNews } from "@/types";

interface Props {
  news: MotoNews[];
}

export function NewsClient({ news }: Props) {
  const { t } = useLanguage();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Feed"
        title={t("moto_news")}
        description={t("news_description")}
      />

      {news.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {news.map((item, i) => (
            <Panel
              key={i}
              interactive
              padding="none"
              className="animate-rise-in"
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            >
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block h-full p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p
                    suppressHydrationWarning
                    className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-primary"
                  >
                    {item.source}
                  </p>
                  <p
                    suppressHydrationWarning
                    className="num shrink-0 text-[10px] text-muted-foreground"
                  >
                    {formatDate(item.pubDate)}
                  </p>
                </div>

                <h3 className="font-display text-base font-bold leading-snug transition-colors group-hover:text-primary">
                  {item.title}
                </h3>

                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {item.contentSnippet}
                </p>

                <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-primary">
                  Read
                  <ArrowUpRight
                    size={13}
                    strokeWidth={2.8}
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </a>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Newspaper size={44} strokeWidth={1.5} />}
          title="No news for your region"
          description="Pick a different source region in Settings."
        />
      )}
    </PageShell>
  );
}
