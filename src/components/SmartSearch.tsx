"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { useSmartSearch } from "@/hooks/useSmartSearch";
import { formatDate } from "@/lib/utils";

interface SmartSearchProps {
  refuels: any[];
  maintenance: any[];
}

export function SmartSearch({ refuels, maintenance }: SmartSearchProps) {
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
  } = useSmartSearch({ refuels, maintenance });

  const hasContent = query.trim().length > 0 || !!aiResult || !!aiError;

  return (
    <div className="space-y-4">
      {/* ── Search Input ── */}
      <div className="relative">
        <input
          id="smart-search-input"
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            if (!e.target.value.trim()) resetSearch();
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAiSearch();
            }
          }}
          placeholder={t("ask_ai_placeholder") || "Ask AI or search logs..."}
          className="w-full bg-card border-border border-2 rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:border-primary transition-all shadow-xl font-medium text-sm"
        />

        {/* Buttons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
          )}

          {query.trim() ? (
            <button
              type="button"
              id="ai-search-btn"
              onClick={handleAiSearch}
              disabled={loading}
              className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors disabled:opacity-50"
              title="Ask AI Assistant"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </button>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mr-3">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          )}
        </div>
      </div>

      {/* ── Results panel ── */}
      {hasContent && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">

          {/* AI Result */}
          {aiResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/>
                    <path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
                  </svg>
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wider">MotoAssistant</h3>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap pl-9">{aiResult.aiResponse}</p>
            </div>
          )}

          {/* AI Error */}
          {aiError && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive shrink-0">
                <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
              </svg>
              <p className="text-sm text-destructive">{aiError}</p>
            </div>
          )}

          {/* Local results (only when no AI result) */}
          {!aiResult && !aiError && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("local_results") || "From your logs"}
              </h4>
              {localResults.length > 0 ? (
                <div className="grid gap-2">
                  {localResults.map(item => (
                    <div
                      key={item.id}
                      className="text-xs bg-muted/50 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-primary uppercase text-[9px] tracking-wider">
                          {item.type === "refuel" ? "⛽ Refuel" : "🔧 Maintenance"}
                        </span>
                        <span suppressHydrationWarning className="text-muted-foreground">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">
                        {item.vehicle.make} {item.vehicle.model}: {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  No matches in your logs. Press{" "}
                  <button
                    onClick={handleAiSearch}
                    className="text-primary font-bold hover:underline"
                  >
                    Ask AI ✦
                  </button>
                  {" "}to search the web.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
