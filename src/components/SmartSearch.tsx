"use client";

import { Bot, XCircle, Fuel, Search, Sparkles, Wrench } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { useSmartSearch } from "@/features/search/useSmartSearch";
import { formatDate } from "@/shared/lib/format";
import { Panel } from "@/shared/ui";

export function SmartSearch() {
  const { t } = useLanguage();
  const {
    query,
    setQuery,
    loading,
    aiResult,
    aiError,
    localResults,
    handleAiSearch,
    resetSearch,
  } = useSmartSearch();

  const hasContent = query.trim().length > 0 || !!aiResult || !!aiError;

  return (
    <div className="space-y-3">
      {/* The search bar is the widest single element on the home screen, so it
          carries an accent ring on focus rather than the usual hairline. */}
      <div className="group relative">
        <Search
          size={17}
          strokeWidth={2.4}
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
        />

        <input
          id="smart-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value.trim()) resetSearch();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAiSearch();
            }
          }}
          placeholder={t("ask_ai_placeholder")}
          className="field h-14 rounded-lg pr-16 text-sm font-medium"
          // Tailwind has no spacing step at this size and the icon well needs
          // to line up with the 17px glyph exactly.
          style={{ paddingLeft: "3.25rem" }}
        />

        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {loading && (
            <span className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}

          {query.trim() && (
            <button
              type="button"
              id="ai-search-btn"
              onClick={handleAiSearch}
              disabled={loading}
              title="Ask AI"
              className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
            >
              <Sparkles size={17} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {hasContent && (
        <Panel className="animate-rise-in space-y-5">
          {aiResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                  <Bot size={16} strokeWidth={2.4} />
                </span>
                <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em]">
                  MotoAssistant
                </h3>
              </div>
              <p className="whitespace-pre-wrap pl-[2.625rem] text-sm leading-relaxed">
                {aiResult.aiResponse}
              </p>
            </div>
          )}

          {aiError && (
            <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5">
              <XCircle size={16} strokeWidth={2.4} className="shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{aiError}</p>
            </div>
          )}

          {!aiResult && !aiError && (
            <div className="space-y-2">
              <p className="label-micro">{t("local_results")}</p>

              {localResults.length > 0 ? (
                <div className="grid gap-2">
                  {localResults.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md bg-foreground/[0.04] p-3 transition-colors hover:bg-foreground/[0.07]"
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                          {item.type === "refuel" ? (
                            <Fuel size={11} strokeWidth={2.8} />
                          ) : (
                            <Wrench size={11} strokeWidth={2.8} />
                          )}
                          {item.type === "refuel" ? t("refuel") : t("maintenance")}
                        </span>
                        <span
                          suppressHydrationWarning
                          className="num shrink-0 text-[10px] text-muted-foreground"
                        >
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <p className="text-xs font-medium">
                        {item.vehicle.make} {item.vehicle.model}: {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">
                  No matches in your logs.{" "}
                  <button
                    onClick={handleAiSearch}
                    className="font-bold text-primary hover:underline"
                  >
                    Ask AI
                  </button>{" "}
                  to search the web.
                </p>
              )}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
