"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ru" | "uk";

type Translations = {
  [key in Language]: Record<string, string>;
};

const translations: Translations = {
  en: {
    home: "Home",
    garage: "Garage",
    stats: "Statistics",
    add_vehicle: "Add Vehicle",
    refuels: "Refuels",
    services: "Services",
    characteristics: "Characteristics",
    engine_cc: "Engine (cc)",
    power_hp: "Power (hp)",
    weight_kg: "Weight (kg)",
    save_changes: "Save Changes",
    add_refuel: "Add Refuel",
    odometer_km: "Odometer (km)",
    cost: "Cost",
    liters: "Liters",
    fuel_grade: "Fuel Grade",
    station_name: "Gas Station",
    fuel_grade_placeholder: "e.g. 95",
    station_placeholder: "e.g. WOG, OKKO",
    notes: "Notes",
    cancel: "Cancel",
    save: "Save",
    fuel_calc: "Fuel Calculator",
    price_per_liter: "Price / L",
    add_service: "Add Service / Repair",
    maint_service: "Service",
    maint_repair: "Repair",
    maint_consumable: "Consumable",
    custom_type: "Custom name",
    custom_type_placeholder: "e.g. Chain & Sprocket",
    parts_replaced: "Parts replaced",
    parts_placeholder: "e.g. oil, filter",
    description: "Description",
    reminders: "Reminders",
    add_reminder: "Add Reminder",
    no_reminders: "No active reminders.",
    reminder: "Reminder",
    target_odometer: "Target odometer (km)",
    target_date: "Target date",
    interval_km: "Repeat every (km)",
    optional: "optional",
    year: "Year",
    public_link: "Public Link",
    no_vehicles: "No vehicles yet. Add your first!",
    total_fuel_cost: "Total Fuel Cost",
    total_liters: "Total Liters",
    no_refuels: "No refueling logs.",
    welcome: "Welcome to MotoLog",
    welcome_desc: "Your personal motorcycle maintenance & expenses diary.",
    go_garage: "My Garage",
    view_stats: "View Statistics",
    register: "Register",
    login: "Sign In",
    name: "Name",
    email: "Email",
    password: "Password",
    already_account: "Already have an account?",
    no_account: "Don't have an account?",
    create_account: "Create MotoLog Account",
    confirm_password: "Confirm password",
    passwords_mismatch: "Passwords do not match",
    password_too_short: "Password must be at least 6 characters",
    invalid_credentials: "Invalid email or password",
    register_error: "Registration failed. Try again.",
    logout: "Sign out",
    avg_price_l: "Avg price / L",
    total_maint_cost: "Maintenance costs",
    spending_breakdown: "Spending breakdown",
    fuel: "Fuel",
    maintenance: "Maintenance",
    by_station: "By gas station",
    by_vehicle: "By vehicle",
    visits: "Visits",
    by_category: "By category",
    no_maintenance: "No maintenance logs yet.",
    unknown: "Unknown",
  },
  ru: {
    home: "Главная",
    garage: "Гараж",
    stats: "Статистика",
    add_vehicle: "Добавить технику",
    refuels: "Заправки",
    services: "Сервис",
    characteristics: "Характеристики",
    engine_cc: "Объём (куб.см)",
    power_hp: "Мощность (л.с.)",
    weight_kg: "Вес (кг)",
    save_changes: "Сохранить",
    add_refuel: "Добавить заправку",
    odometer_km: "Пробег (км)",
    cost: "Стоимость",
    liters: "Литры",
    fuel_grade: "Марка топлива",
    station_name: "Заправка",
    fuel_grade_placeholder: "напр. 95",
    station_placeholder: "напр. ОККО, WOG",
    notes: "Заметки",
    cancel: "Отмена",
    save: "Сохранить",
    fuel_calc: "Калькулятор заправки",
    price_per_liter: "Цена / Л",
    add_service: "Добавить сервис / ремонт",
    maint_service: "Сервис",
    maint_repair: "Ремонт",
    maint_consumable: "Расходники",
    custom_type: "Своё название",
    custom_type_placeholder: "напр. Замена цепи",
    parts_replaced: "Заменённые запчасти",
    parts_placeholder: "напр. масло, фильтр",
    description: "Описание",
    reminders: "Напоминания",
    add_reminder: "Добавить напоминание",
    no_reminders: "Нет активных напоминаний.",
    reminder: "Напоминание",
    target_odometer: "Целевой пробег (км)",
    target_date: "Дата напоминания",
    interval_km: "Повторять каждые (км)",
    optional: "необязательно",
    year: "Год",
    public_link: "Публичная ссылка",
    no_vehicles: "Мотоциклов нет. Добавьте первый!",
    total_fuel_cost: "Всего за топливо",
    total_liters: "Всего литров",
    no_refuels: "Заправок нет.",
    welcome: "Добро пожаловать в MotoLog",
    welcome_desc: "Личный дневник расходов и обслуживания мотоцикла.",
    go_garage: "Мой Гараж",
    view_stats: "Статистика",
    register: "Регистрация",
    login: "Войти",
    name: "Имя",
    email: "Email",
    password: "Пароль",
    already_account: "Уже есть аккаунт?",
    no_account: "Нет аккаунта?",
    create_account: "Создать аккаунт MotoLog",
    confirm_password: "Подтвердите пароль",
    passwords_mismatch: "Пароли не совпадают",
    password_too_short: "Пароль должен быть не менее 6 символов",
    invalid_credentials: "Неверный email или пароль",
    register_error: "Ошибка регистрации. Попробуйте ещё раз.",
    logout: "Выйти",
    avg_price_l: "Ср. цена / Л",
    total_maint_cost: "Расходы на обслуживание",
    spending_breakdown: "Структура расходов",
    fuel: "Топливо",
    maintenance: "Обслуживание",
    by_station: "По заправкам",
    by_vehicle: "По технике",
    visits: "Заездов",
    by_category: "По категориям",
    no_maintenance: "Записей об обслуживании нет.",
    unknown: "Неизвестно",
  },
  uk: {
    home: "Головна",
    garage: "Гараж",
    stats: "Статистика",
    add_vehicle: "Додати техніку",
    refuels: "Заправки",
    services: "Сервіс",
    characteristics: "Характеристики",
    engine_cc: "Об'єм (куб.см)",
    power_hp: "Потужність (к.с.)",
    weight_kg: "Вага (кг)",
    save_changes: "Зберегти",
    add_refuel: "Додати заправку",
    odometer_km: "Пробіг (км)",
    cost: "Вартість",
    liters: "Літри",
    fuel_grade: "Марка палива",
    station_name: "Заправка",
    fuel_grade_placeholder: "напр. 95",
    station_placeholder: "напр. ОККО, WOG",
    notes: "Нотатки",
    cancel: "Скасувати",
    save: "Зберегти",
    fuel_calc: "Калькулятор заправки",
    price_per_liter: "Ціна / Л",
    add_service: "Додати сервіс / ремонт",
    maint_service: "Сервіс",
    maint_repair: "Ремонт",
    maint_consumable: "Витратники",
    custom_type: "Своя назва",
    custom_type_placeholder: "напр. Заміна ланцюга",
    parts_replaced: "Замінені запчастини",
    parts_placeholder: "напр. олія, фільтр",
    description: "Опис",
    reminders: "Нагадування",
    add_reminder: "Додати нагадування",
    no_reminders: "Немає активних нагадувань.",
    reminder: "Нагадування",
    target_odometer: "Цільовий пробіг (км)",
    target_date: "Дата нагадування",
    interval_km: "Повторювати кожні (км)",
    optional: "необов'язково",
    year: "Рік",
    public_link: "Публічне посилання",
    no_vehicles: "Немає мотоциклів. Додайте перший!",
    total_fuel_cost: "Всього за паливо",
    total_liters: "Всього літрів",
    no_refuels: "Заправок немає.",
    welcome: "Ласкаво просимо до MotoLog",
    welcome_desc: "Особистий щоденник витрат та обслуговування мотоцикла.",
    go_garage: "Мій Гараж",
    view_stats: "Статистика",
    register: "Реєстрація",
    login: "Увійти",
    name: "Ім'я",
    email: "Email",
    password: "Пароль",
    already_account: "Вже є акаунт?",
    no_account: "Немає акаунту?",
    create_account: "Створити акаунт MotoLog",
    confirm_password: "Підтвердіть пароль",
    passwords_mismatch: "Паролі не збігаються",
    password_too_short: "Пароль має бути не менше 6 символів",
    invalid_credentials: "Невірний email або пароль",
    register_error: "Помилка реєстрації. Спробуйте ще раз.",
    logout: "Вийти",
    avg_price_l: "Сер. ціна / Л",
    total_maint_cost: "Витрати на обслуг",
    spending_breakdown: "Структура витрат",
    fuel: "Паливо",
    maintenance: "Обслуговування",
    by_station: "По заправках",
    by_vehicle: "По техніці",
    visits: "Візитів",
    by_category: "По категоріях",
    no_maintenance: "Записів про обслуговування немає.",
    unknown: "Невідомо",
  },
};

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("motolog_lang") as Language;
    if (saved && translations[saved]) {
      setLang(saved);
    } else {
      const browserLang = navigator.language.slice(0, 2) as Language;
      if (translations[browserLang]) setLang(browserLang);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("motolog_lang", newLang);
  };

  const t = (key: string): string => {
    return translations[lang][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
