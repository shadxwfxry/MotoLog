"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";

interface LogEntry {
  id: string;
  date: Date | string;
  vehicle: { make: string; model: string };
  content: string;
  type: string;
}

interface WebResult {
  title: string;
  link: string;
  snippet: string;
}

interface SmartSearchProps {
  refuels: any[];
  maintenance: any[];
}

const AI_TRIGGER_WORDS = ["сколько", "я", "заправил", "литров", "бензин", "когда", "потратил", "последний раз", "масло", "цена", "стоило"];

export function SmartSearch({ refuels, maintenance }: SmartSearchProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ aiResponse: string } | null>(null);
  const [webResults, setWebResults] = useState<WebResult[] | null>(null);

  const localEntries = useMemo(() => {
    const entries: LogEntry[] = [
      ...refuels.map(r => ({
        id: r.id,
        date: r.date,
        vehicle: r.vehicle,
        content: `${r.stationName || ""} ${r.notes || ""}`,
        type: "refuel"
      })),
      ...maintenance.map(m => ({
        id: m.id,
        date: m.date,
        vehicle: m.vehicle,
        content: `${m.type}: ${m.description || ""}`,
        type: "maintenance"
      }))
    ];
    return entries;
  }, [refuels, maintenance]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return localEntries.filter(e => 
      e.content.toLowerCase().includes(lowerQuery) || 
      `${e.vehicle.make} ${e.vehicle.model}`.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }, [query, localEntries]);

  const handleAiSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAiResult(null);
    setWebResults(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ query }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setAiResult(data);
    } catch (error) {
      console.error("AI Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWebSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAiResult(null);
    setWebResults(null);
    try {
      const res = await fetch("/api/websearch", {
        method: "POST",
        body: JSON.stringify({ query }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setWebResults(data.results || []);
    } catch (error) {
      console.error("Web Search error:", error);
      setWebResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartAction = () => {
    if (!query.trim()) return;
    const lowerQ = query.toLowerCase();
    const shouldTriggerAi = AI_TRIGGER_WORDS.some(word => lowerQ.includes(word));
    
    if (shouldTriggerAi) {
      handleAiSearch();
    } else {
      handleWebSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { 
            setQuery(e.target.value); 
            setAiResult(null); 
            setWebResults(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSmartAction();
            }
          }}
          placeholder={t("ask_ai_placeholder") || "Search logs, web, or ask AI..."}
          className="w-full bg-card border-border border-2 rounded-2xl pl-6 pr-28 py-4 focus:outline-none focus:border-primary transition-all shadow-xl font-medium"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />}
          
          {query.trim() ? (
            <>
              {/* Web/Smart Search Button */}
              <button 
                type="button"
                onClick={handleSmartAction}
                className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-colors"
                title="Search Web"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
              
              {/* AI Search Button */}
              <button 
                type="button"
                onClick={handleAiSearch}
                className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                title="Force Ask AI"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              </button>
            </>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mr-3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          )}
        </div>
      </div>

      {(query.trim().length > 0 || aiResult || webResults) && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
          
          {aiResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wider">MotoAssistant</h3>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiResult.aiResponse}</p>
            </div>
          )}

          {webResults && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">🌐 Web Results</h4>
              {webResults.length > 0 ? (
                <div className="grid gap-3">
                  {webResults.map((item, idx) => (
                    <a key={idx} href={item.link} target="_blank" className="block p-3 bg-muted/30 border border-border/50 rounded-xl hover:border-primary/50 transition-colors group">
                      <h5 className="font-bold text-sm text-primary group-hover:underline mb-1">{item.title}</h5>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.snippet}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">No results found on the web.</p>
              )}
            </div>
          )}

          {!aiResult && !webResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("local_results")}</h4>
              </div>
              
              {filteredResults.length > 0 ? (
                <div className="grid gap-2">
                  {filteredResults.map((item) => (
                    <div key={item.id} className="text-xs bg-muted/50 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-primary uppercase text-[9px]">{item.type}</span>
                        <span className="text-muted-foreground">{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <p className="font-medium">{item.vehicle.make} {item.vehicle.model}: {item.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No matches in your garage history.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
