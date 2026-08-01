"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, RefreshCw } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { countFailed, drainSyncQueue } from "@/features/sync/syncQueue";
import type { Tone } from "@/shared/ui";
import { cn } from "@/lib/utils";

/**
 * Drains the offline queue when connectivity returns and reports progress.
 *
 * The sync logic itself lives in `features/sync` — this component only renders
 * the banners and owns the lifecycle.
 */
export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
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

      {/* Sits above the floating dock, right-aligned, so it never covers the
          navigation the way a bottom-centred toast would. */}
      <div className="pointer-events-none fixed bottom-28 right-4 z-50 flex flex-col items-end gap-2">
        {syncing && (
          <Toast tone="cyan">
            <RefreshCw size={14} strokeWidth={2.6} className="animate-spin" />
            {t("syncing")}…
          </Toast>
        )}

        {syncedCount > 0 && (
          <Toast tone="lime">
            <Check size={14} strokeWidth={3} />
            {t("synced")}: {syncedCount}
          </Toast>
        )}

        {/*
          Entries that exhausted their retries stay in the queue and are surfaced
          here — previously a permanently failing item just logged to the console
          on every reconnect and the user never learned their entry was lost.
        */}
        {!syncing && failedCount > 0 && (
          <Toast tone="rose">
            <AlertTriangle size={14} strokeWidth={2.6} />
            {t("sync_failed")}: {failedCount}
          </Toast>
        )}
      </div>
    </>
  );
}

function Toast({ tone, children }: { tone: Extract<Tone, "cyan" | "lime" | "rose">; children: React.ReactNode }) {
  const style = {
    cyan: "border-signal-cyan/30 text-signal-cyan",
    lime: "border-signal-lime/30 text-signal-lime",
    rose: "border-destructive/30 text-destructive",
  }[tone];

  return (
    <div
      className={cn(
        "glass pointer-events-auto flex animate-rise-in items-center gap-2.5 rounded-md border px-4 py-3",
        "text-[11px] font-bold uppercase tracking-[0.14em]",
        style,
      )}
    >
      {children}
    </div>
  );
}
