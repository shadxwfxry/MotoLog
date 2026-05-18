import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { SmartSearch } from "@/components/SmartSearch";

interface Props {
  refuels: any[];
  maintenance: any[];
  vehicles: any[];
}

export function HomeClient({ refuels, maintenance, vehicles }: Props) {
  const { t, lang } = useLanguage();

  // 1. Active Ride selection (take first vehicle)
  const activeVehicle = vehicles[0];

  // 2. Current odometer calculation for active ride
  const maxRefuelOdo = activeVehicle?.refuelingLogs[0]?.odometer || 0;
  const maxMaintOdo = activeVehicle?.maintenanceLogs[0]?.odometer || 0;
  const currentOdometer = Math.max(maxRefuelOdo, maxMaintOdo, 0);

  // 3. Reminder checks for active ride
  const activeReminders = activeVehicle?.plannedMaintenances || [];
  const overdueReminders = activeReminders.filter((r: any) => {
    const odoOverdue = r.targetOdometer !== null && currentOdometer >= r.targetOdometer;
    const dateOverdue = r.targetDate !== null && new Date() >= new Date(r.targetDate);
    return odoOverdue || dateOverdue;
  });
  const hasOverdue = overdueReminders.length > 0;

  // Active status text & badges
  let statusBadge = (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
      ● {lang === "uk" ? "Готовий до сезону" : lang === "ru" ? "Готов к сезону" : "Ready for Season"}
    </span>
  );
  if (hasOverdue) {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
        ● {lang === "uk" ? "Потребує ТО" : lang === "ru" ? "Требует ТО" : "Needs Service"}
      </span>
    );
  } else if (activeReminders.length > 0) {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
        ● {lang === "uk" ? "Заплановано ТО" : lang === "ru" ? "Запланировано ТО" : "Scheduled"}
      </span>
    );
  }

  // 4. Global Smart Reminders (aggregate across all vehicles)
  const allReminders = vehicles.flatMap(v => {
    const vMaxRefuel = v.refuelingLogs[0]?.odometer || 0;
    const vMaxMaint = v.maintenanceLogs[0]?.odometer || 0;
    const vOdo = Math.max(vMaxRefuel, vMaxMaint, 0);

    return v.plannedMaintenances.map((r: any) => {
      let isOverdue = false;
      let isApproaching = false;

      if (r.targetOdometer !== null) {
        const diff = r.targetOdometer - vOdo;
        if (diff <= 0) isOverdue = true;
        else if (diff <= 1000) isApproaching = true;
      }

      if (r.targetDate !== null) {
        const diffMs = new Date(r.targetDate).getTime() - new Date().getTime();
        if (diffMs <= 0) isOverdue = true;
        else if (diffMs <= 14 * 24 * 60 * 60 * 1000) isApproaching = true;
      }

      return {
        ...r,
        vehicleName: `${v.make} ${v.model}`,
        vOdo,
        isOverdue,
        isApproaching,
        priority: isOverdue ? 3 : isApproaching ? 2 : 1
      };
    });
  });

  const urgentReminders = [...allReminders]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Welcome header */}
      <div className="space-y-1">
        <h1 suppressHydrationWarning className="text-2xl font-bold tracking-tight">
          {t("welcome_back") || "Welcome back!"}
        </h1>
        <p className="text-xs text-muted-foreground">
          {lang === "uk"
            ? "Контролюйте обслуговування та витрати вашого байка в реальному часі."
            : lang === "ru"
            ? "Контролируйте обслуживание и расходы вашего байка в реальном времени."
            : "Monitor your motorcycle maintenance and expenses in real-time."}
        </p>
      </div>

      <SmartSearch refuels={refuels} maintenance={maintenance} />

      {/* Widgets Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Ride Widget */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                🏍️ {lang === "uk" ? "Активний байк" : lang === "ru" ? "Активный байк" : "Active Ride"}
              </h3>
              {activeVehicle && statusBadge}
            </div>

            {activeVehicle ? (
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-4">
                  {activeVehicle.photoUrl ? (
                    <img
                      src={activeVehicle.photoUrl}
                      alt={activeVehicle.model}
                      className="w-16 h-16 rounded-2xl object-cover border border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-orange-500/10 border border-border flex items-center justify-center text-2xl">
                      🏍️
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-black text-foreground leading-tight">
                      {activeVehicle.make} {activeVehicle.model}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {activeVehicle.year} · {activeVehicle.engineDisplacement || "—"} cc
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 border border-border/60 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                    {lang === "uk" ? "Поточний пробіг" : lang === "ru" ? "Текущий пробег" : "Odometer"}
                  </span>
                  <span className="text-lg font-black text-primary">
                    {currentOdometer.toLocaleString()} km
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                {lang === "uk" ? "Байків немає в гаражі" : lang === "ru" ? "Байков нет в гараже" : "No vehicles in your garage."}
              </div>
            )}
          </div>

          {activeVehicle ? (
            <Link
              href={`/garage/${activeVehicle.id}`}
              className="w-full h-11 text-xs font-black uppercase tracking-wider rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground border border-border flex items-center justify-center transition active:scale-95"
            >
              {lang === "uk" ? "До гаражу" : lang === "ru" ? "В гараж" : "Go to Garage"} →
            </Link>
          ) : (
            <Link
              href="/garage"
              className="w-full h-11 text-xs font-black uppercase tracking-wider rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition active:scale-95 shadow-md shadow-primary/20"
            >
              ➕ {lang === "uk" ? "Додати байк" : lang === "ru" ? "Добавить байк" : "Add Vehicle"}
            </Link>
          )}
        </div>

        {/* Smart Reminders / Urgent Alerts Widget */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3 w-full">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              🔔 {lang === "uk" ? "Smart-Нагадування" : lang === "ru" ? "Smart-Напоминания" : "Urgent Alerts"}
            </h3>

            <div className="space-y-2 pt-2">
              {urgentReminders.length > 0 ? (
                urgentReminders.map((r, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                      r.isOverdue
                        ? "bg-red-500/5 border-red-500/20"
                        : r.isApproaching
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-muted/40 border-border/60"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          r.isOverdue ? "bg-red-500" : r.isApproaching ? "bg-amber-500" : "bg-muted-foreground"
                        }`} />
                        <span className="text-xs font-extrabold text-foreground truncate block max-w-[150px]">
                          {r.type}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mt-0.5 block truncate">
                        {r.vehicleName}
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        r.isOverdue
                          ? "bg-red-500/10 text-red-400"
                          : r.isApproaching
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {r.isOverdue
                          ? (lang === "uk" ? "Терміново" : lang === "ru" ? "Срочно" : "Urgent")
                          : (lang === "uk" ? "Наближається" : lang === "ru" ? "Подходит" : "Soon")}
                      </span>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                        {r.targetOdometer ? `${r.targetOdometer.toLocaleString()} km` : ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 bg-green-500/5 border border-green-500/20 rounded-2xl">
                  <span className="text-2xl mb-1">✅</span>
                  <p className="text-xs font-black text-green-400 uppercase tracking-wider">
                    {lang === "uk" ? "Всі системи в нормі" : lang === "ru" ? "Все системы в норме" : "All systems nominal"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {lang === "uk" ? "Немає запланованих робіт" : lang === "ru" ? "Нет запланированных работ" : "No maintenance alerts."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/garage"
            className="w-full h-11 text-xs font-black uppercase tracking-wider rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground border border-border flex items-center justify-center transition active:scale-95"
          >
            {lang === "uk" ? "Переглянути все" : lang === "ru" ? "Посмотреть все" : "View All"} →
          </Link>
        </div>
      </div>
    </div>
  );
}
