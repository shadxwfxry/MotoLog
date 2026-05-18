"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { getSyncQueue, clearSyncItem } from "@/lib/offlineSync";
import { addRefuelLog } from "@/lib/actions/refuel";
import { addMaintenanceLog } from "@/lib/actions/maintenance";

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const [syncing, setSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function handleSync() {
      if (!navigator.onLine) return;
      const queue = await getSyncQueue();
      if (queue.length === 0) return;

      setSyncing(true);
      
      for (const item of queue) {
        try {
          const formData = new FormData();
          Object.entries(item.payload).forEach(([k, v]) => {
            formData.append(k, v);
          });

          const vehicleId = item.payload.vehicleId;
          if (!vehicleId) continue;

          if (item.actionType === "REFUEL") {
            await addRefuelLog(vehicleId, formData);
          } else if (item.actionType === "MAINTENANCE") {
            await addMaintenanceLog(vehicleId, formData);
          }

          await clearSyncItem(item.id);
        } catch (err) {
          console.error("Failed to sync offline item:", err);
        }
      }

      setSyncing(false);
      setSyncComplete(true);
      setTimeout(() => setSyncComplete(false), 4000);
    }

    // Listener for browser coming back online
    window.addEventListener("online", handleSync);
    
    // Run an initial sync attempt when mounting
    handleSync();

    return () => {
      window.removeEventListener("online", handleSync);
    };
  }, []);

  return (
    <>
      {children}

      {/* Floating Sync Notification Banners */}
      {syncing && (
        <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2.5 p-3.5 px-4 rounded-2xl border border-blue-500/20 bg-card/90 backdrop-blur-md shadow-lg shadow-blue-500/5 animate-pulse">
          <svg className="animate-spin h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs font-black uppercase tracking-wider text-blue-400">
            {lang === "uk" ? "Синхронізація даних..." : lang === "ru" ? "Синхронизация данных..." : "Syncing offline logs..."}
          </span>
        </div>
      )}

      {syncComplete && (
        <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2.5 p-3.5 px-4 rounded-2xl border border-green-500/20 bg-card/90 backdrop-blur-md shadow-lg shadow-green-500/5 animate-bounce">
          <span className="text-sm">✅</span>
          <span className="text-xs font-black uppercase tracking-wider text-green-400">
            {lang === "uk" ? "Дані синхронізовано!" : lang === "ru" ? "Данные синхронизированы!" : "Logs fully synced!"}
          </span>
        </div>
      )}
    </>
  );
}
