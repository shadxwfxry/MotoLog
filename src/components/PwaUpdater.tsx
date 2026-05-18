"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";

export function PwaUpdater() {
  const { lang } = useLanguage();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      setRegistration(reg);

      // Check if there is already a waiting worker
      if (reg.waiting) {
        setShowBanner(true);
      }

      // Listen for a new service worker being installed/waiting
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && reg.waiting) {
              setShowBanner(true);
            }
          });
        }
      });

      // Poll for updates periodically (every hour)
      const interval = setInterval(() => {
        reg.update().catch((err) => console.log("SW update error:", err));
      }, 60 * 60 * 1000);

      return () => clearInterval(interval);
    });

    // Listen for controllerchange to reload the page when the new worker takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleUpdateApp = () => {
    if (!registration || !registration.waiting) return;
    // Post SKIP_WAITING to let the waiting service worker take over
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 p-4 rounded-3xl border border-primary/20 bg-card/95 backdrop-blur-md shadow-2xl flex flex-col gap-3 animate-bounce">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">🚀</span>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-primary">
            {lang === "uk" ? "Доступне оновлення!" : lang === "ru" ? "Доступно обновление!" : "Update Available!"}
          </h4>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-relaxed">
            {lang === "uk"
              ? "Нова версія MotoLog завантажена. Оновіть додаток, щоб застосувати зміни."
              : lang === "ru"
              ? "Новая версия MotoLog загружена. Обновите приложение, чтобы применить изменения."
              : "A new version of MotoLog has been loaded. Reload to apply updates."}
          </p>
        </div>
      </div>
      <button
        onClick={handleUpdateApp}
        className="w-full h-10 text-xs font-black uppercase tracking-wider rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition active:scale-95 shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
      >
        🔄 {lang === "uk" ? "Оновити додаток" : lang === "ru" ? "Обновить приложение" : "Reload App"}
      </button>
    </div>
  );
}
