"use client";

import { useState, useMemo } from "react";
import type { LogEntry } from "@/types";

interface UseSmartSearchProps {
  refuels: any[];
  maintenance: any[];
}

interface AiResult {
  aiResponse: string;
}

export function useSmartSearch({ refuels, maintenance }: UseSmartSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [googleSearchOpen, setGoogleSearchOpen] = useState(false);

  // Local entries from refueling and maintenance logs
  const localEntries = useMemo((): LogEntry[] => [
    ...refuels.map(r => ({
      id: r.id,
      date: r.date,
      vehicle: r.vehicle,
      content: `${r.stationName || ""} ${r.notes || ""}`.trim(),
      type: "refuel" as const,
    })),
    ...maintenance.map(m => ({
      id: m.id,
      date: m.date,
      vehicle: m.vehicle,
      content: `${m.type}: ${m.description || ""}`.trim(),
      type: "maintenance" as const,
    })),
  ], [refuels, maintenance]);

  // Filtered local results by query
  const localResults = useMemo((): LogEntry[] => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return localEntries
      .filter(e =>
        e.content.toLowerCase().includes(lower) ||
        `${e.vehicle.make} ${e.vehicle.model}`.toLowerCase().includes(lower)
      )
      .slice(0, 5);
  }, [query, localEntries]);

  const handleAiSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ query }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("AI error");
      const data = await res.json();
      setAiResult(data);
    } catch {
      setAiError("Failed to connect to AI assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleWebSearch = () => {
    if (!query.trim()) return;
    setAiResult(null);
    setAiError(null);
    setGoogleSearchOpen(true);
  };

  const resetSearch = () => {
    setAiResult(null);
    setAiError(null);
    setGoogleSearchOpen(false);
  };

  return {
    query,
    setQuery,
    loading,
    aiResult,
    aiError,
    localResults,
    googleSearchOpen,
    setGoogleSearchOpen,
    handleAiSearch,
    handleWebSearch,
    resetSearch,
  };
}
