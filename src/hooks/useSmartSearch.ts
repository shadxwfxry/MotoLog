"use client";

import { useState, useMemo } from "react";
import type { LogEntry, RefuelingLog, MaintenanceLog } from "@/types";

type RefuelWithVehicle = RefuelingLog & { vehicle: { make: string; model: string } };
type MaintWithVehicle = MaintenanceLog & { vehicle: { make: string; model: string } };

interface UseSmartSearchProps {
  refuels: RefuelWithVehicle[];
  maintenance: MaintWithVehicle[];
}

interface AiResult {
  aiResponse: string;
}

export function useSmartSearch({ refuels, maintenance }: UseSmartSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

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

  const resetSearch = () => {
    setAiResult(null);
    setAiError(null);
  };

  return {
    query,
    setQuery,
    loading,
    aiResult,
    aiError,
    localResults,
    handleAiSearch,
    resetSearch,
  };
}
