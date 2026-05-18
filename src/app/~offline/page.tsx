"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function OfflinePage() {
  const { lang } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-6 text-center">
      <div className="relative mb-6">
        <span className="text-8xl filter drop-shadow-[0_0_20px_rgba(239,68,68,0.2)]">🔌</span>
        <span className="absolute -bottom-2 -right-2 text-3xl">📴</span>
      </div>
      
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
        {lang === "uk" ? "Зв'язок втрачено" : lang === "ru" ? "Связь потеряна" : "Connection Lost"}
      </h1>
      
      <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md leading-relaxed font-medium">
        {lang === "uk"
          ? "Ви перебуваєте в автономному режимі. Перегляньте збережені дані або дочекайтеся відновлення мережі для автоматичної синхронізації логів."
          : lang === "ru"
          ? "Вы находитесь в автономном режиме. Просмотрите сохраненные данные или дождитесь восстановления сети для автоматической синхронизации логов."
          : "You are currently offline. Browse cached data or wait for network recovery to automatically sync queued logs."}
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-6 h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-wider hover:bg-primary/90 transition shadow-md shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
      >
        🔄 {lang === "uk" ? "Перевірити з'єднання" : lang === "ru" ? "Проверить соединение" : "Check Connection"}
      </button>
    </div>
  );
}
