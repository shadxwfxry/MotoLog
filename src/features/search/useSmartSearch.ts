"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchLogs, type LogSearchResult } from "./actions";

interface AiResult {
  aiResponse: string;
}

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

/**
 * Search over the user's logs, plus an on-demand AI answer.
 *
 * Log matching runs in Postgres rather than over an in-memory copy of every
 * row, so typing is debounced and results can arrive out of order — a request
 * id guards against a slow early response overwriting a fast later one.
 */
export function useSmartSearch() {
  const [query, setQuery] = useState("");
  const [localResults, setLocalResults] = useState<LogSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const requestId = useRef(0);

  useEffect(() => {
    const term = query.trim();

    if (term.length < MIN_QUERY_LENGTH) {
      setLocalResults([]);
      return;
    }

    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const result = await searchLogs(term);
      // Ignore a response that a newer keystroke has already superseded.
      if (id !== requestId.current) return;
      setLocalResults(result.ok ? result.data : []);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAiSearch = useCallback(async () => {
    const term = query.trim();
    if (!term) return;

    setLoading(true);
    setAiResult(null);
    setAiError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ query: term }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
      setAiResult(await res.json());
    } catch {
      setAiError("Failed to connect to AI assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const resetSearch = useCallback(() => {
    setAiResult(null);
    setAiError(null);
    setLocalResults([]);
  }, []);

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
