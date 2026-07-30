"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { countFailed, drainSyncQueue } from "@/features/sync/syncQueue";

/**
 * Drains the offline queue when connectivity returns and reports progress.
 *
 * The sync logic itself lives in `features/sync` — this component only renders
 * the banners and owns the lifecycle.
 */
export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const [syncing, setSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const runSync = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return;

    setSyncing(true);
    try {
      const outcome = await drainSyncQueue();
      if (outcome.synced > 0) {
        setSyncedCount(outcome.synced);
        setTimeout(() => setSyncedCount(0), 4000);
      }
      setFailedCount(await countFailed());
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void runSync();

    window.addEventListener("online", runSync);
    return () => window.removeEventListener("online", runSync);
  }, [runSync]);

  return (
    <>
      {children}

      {syncing && (
        <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2.5 p-3.5 px-4 rounded-2xl border border-blue-500/20 bg-card/90 backdrop-blur-md shadow-lg shadow-blue-500/5 animate-pulse">
          <svg
            className="animate-spin h-4 w-4 text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs font-black uppercase tracking-wider text-blue-400">
            {lang === "uk"
              ? "Синхронізація даних..."
              : lang === "ru"
              ? "Синхронизация данных..."
              : "Syncing offline logs..."}
          </span>
        </div>
      )}

      {syncedCount > 0 && (
        <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2.5 p-3.5 px-4 rounded-2xl border border-green-500/20 bg-card/90 backdrop-blur-md shadow-lg shadow-green-500/5 animate-bounce">
          <span className="text-sm">✅</span>
          <span className="text-xs font-black uppercase tracking-wider text-green-400">
            {lang === "uk"
              ? `Синхронізовано: ${syncedCount}`
              : lang === "ru"
              ? `Синхронизировано: ${syncedCount}`
              : `Synced ${syncedCount} log${syncedCount === 1 ? "" : "s"}`}
          </span>
        </div>
      )}

      {/*
        Entries that exhausted their retries stay in the queue and are surfaced
        here — previously a permanently failing item just logged to the console
        on every reconnect and the user never learned their entry was lost.
      */}
      {!syncing && failedCount > 0 && (
        <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2.5 p-3.5 px-4 rounded-2xl border border-red-500/20 bg-card/90 backdrop-blur-md shadow-lg shadow-red-500/5">
          <span className="text-sm">⚠️</span>
          <span className="text-xs font-black uppercase tracking-wider text-red-400">
            {lang === "uk"
              ? `Не вдалося синхронізувати: ${failedCount}`
              : lang === "ru"
              ? `Не удалось синхронизировать: ${failedCount}`
              : `${failedCount} entr${failedCount === 1 ? "y" : "ies"} failed to sync`}
          </span>
        </div>
      )}
    </>
  );
}
