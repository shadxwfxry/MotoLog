# 🏍️ MotoLog v1.0

<div align="center">

[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](https://github.com/shadxwfxry/MotoLog/releases)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/DB-Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[🇺🇦 Українська](#-українська) · [🇷🇺 Русский](#-русский) · [🇬🇧 English](#-english)**

</div>

---

## 🇺🇦 Українська

### Що це?
**MotoLog** — це персональний щоденник для мотоциклістів. Ведіть облік заправок, ремонтів та витрат на своїх байках в одному місці. Підтримується кілька мотоциклів, є AI-асистент та пошук у Google прямо в додатку.

### ✨ Можливості
- 🛠️ **Гараж** — кілька мотоциклів, фото, характеристики (об'єм двигуна, потужність, вага)
- ⛽ **Облік заправок** — літри, ціна, одометр, назва АЗС
- 🔧 **Журнал ТО** — заміна масла, ремонти, запчастини з цінами
- 🔔 **Нагадування** — за пробігом або датою (наступне ТО, заміна масла тощо)
- 🤖 **AI-асистент** — питайте «Коли я міняв масло?» або «Скільки я заправив останній раз?»
- 🔍 **Пошук** — Google Search прямо в додатку
- 📊 **Статистика** — середня витрата, загальні витрати по категоріях
- 📄 **Експорт** — PDF та CSV звіти для продажу або архіву
- 📰 **Новини** — мотоновини для вашого регіону
- 🌙 **Теми** — темна/світла тема + 5 акцентних кольорів
- 📱 **PWA** — встановлюється на телефон як повноцінний застосунок

### 🚀 Запуск локально

**Вимоги:** Node.js 18+, pnpm

```bash
# 1. Клонуйте репозиторій
git clone https://github.com/shadxwfxry/MotoLog.git
cd MotoLog

# 2. Встановіть залежності
pnpm install

# 3. Налаштуйте змінні середовища
cp .env.example .env
# Відредагуйте .env (дивіться секцію нижче)

# 4. Синхронізуйте базу даних
npx prisma db push

# 5. Запустіть сервер
pnpm dev
```

Відкрийте [http://localhost:3000](http://localhost:3000).

### ⚙️ Змінні середовища (`.env`)

```env
# Supabase — Transaction Pooler (порт 6543)
DATABASE_URL="postgresql://..."

# Supabase — пряме з'єднання для міграцій (порт 5432)
DIRECT_URL="postgresql://..."

# Секрет для NextAuth (будь-який довгий рядок)
NEXTAUTH_SECRET="your-secret-here"

# URL вашого сайту
NEXTAUTH_URL="https://your-app.vercel.app"

# Ключ Google Gemini AI
AI_API_KEY="AIza..."
```

### 🌐 Деплой на Vercel

1. Форкніть або запуште репозиторій на GitHub
2. Підключіть проект у [vercel.com](https://vercel.com)
3. Додайте всі змінні з `.env` у **Settings → Environment Variables**
4. Готово — Vercel автоматично збере проект

---

## 🇷🇺 Русский

### Что это?
**MotoLog** — персональный дневник мотоциклиста. Ведите учёт заправок, ТО и расходов по всем своим байкам в одном месте. Поддерживается несколько мотоциклов, встроен AI-ассистент и поиск Google прямо в приложении.

### ✨ Возможности
- 🛠️ **Гараж** — несколько мотоциклов, фото, характеристики (объём двигателя, мощность, вес)
- ⛽ **Учёт заправок** — литры, цена, одометр, название АЗС
- 🔧 **Журнал ТО** — замена масла, ремонты, запчасти с ценами
- 🔔 **Напоминания** — по пробегу или дате (следующее ТО, замена масла и т.д.)
- 🤖 **AI-ассистент** — спрашивайте «Когда я менял масло?» или «Сколько я залил в прошлый раз?»
- 🔍 **Поиск** — Google Search прямо в приложении
- 📊 **Статистика** — средний расход, общие затраты по категориям
- 📄 **Экспорт** — PDF и CSV отчёты для продажи или архива
- 📰 **Новости** — мото-новости для вашего региона
- 🌙 **Темы** — тёмная/светлая тема + 5 акцентных цветов
- 📱 **PWA** — устанавливается на телефон как полноценное приложение

### 🚀 Запуск локально

**Требования:** Node.js 18+, pnpm

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/shadxwfxry/MotoLog.git
cd MotoLog

# 2. Установите зависимости
pnpm install

# 3. Настройте переменные окружения
cp .env.example .env
# Отредактируйте .env (смотрите секцию ниже)

# 4. Синхронизируйте базу данных
npx prisma db push

# 5. Запустите сервер
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### ⚙️ Переменные окружения (`.env`)

```env
# Supabase — Transaction Pooler (порт 6543)
DATABASE_URL="postgresql://..."

# Supabase — прямое соединение для миграций (порт 5432)
DIRECT_URL="postgresql://..."

# Секрет для NextAuth (любая длинная строка)
NEXTAUTH_SECRET="your-secret-here"

# URL вашего сайта
NEXTAUTH_URL="https://your-app.vercel.app"

# Ключ Google Gemini AI
AI_API_KEY="AIza..."
```

### 🌐 Деплой на Vercel

1. Форкните или запушьте репозиторий на GitHub
2. Подключите проект на [vercel.com](https://vercel.com)
3. Добавьте все переменные из `.env` в **Settings → Environment Variables**
4. Готово — Vercel автоматически соберёт проект

---

## 🇬🇧 English

### What is it?
**MotoLog** is a personal diary for motorcyclists. Track your refueling, maintenance, and expenses across all your bikes in one place. Supports multiple vehicles, includes an AI assistant, and features Google Search embedded directly in the app.

### ✨ Features
- 🛠️ **Garage** — multiple bikes, photos, specs (engine displacement, power, weight)
- ⛽ **Fuel Tracking** — liters, price, odometer, station name
- 🔧 **Maintenance Log** — oil changes, repairs, parts with prices
- 🔔 **Reminders** — by mileage or date (next service, oil change, etc.)
- 🤖 **AI Assistant** — ask *"When did I last change my oil?"* or *"How much did I fill up last time?"*
- 🔍 **Search** — Google Search embedded directly in the app
- 📊 **Statistics** — average consumption, total costs by category
- 📄 **Export** — PDF and CSV reports for sale or archiving
- 📰 **News** — moto news for your region
- 🌙 **Themes** — dark/light mode + 5 accent colors
- 📱 **PWA** — installs on your phone as a native-like app

### 🚀 Running Locally

**Requirements:** Node.js 18+, pnpm

```bash
# 1. Clone the repository
git clone https://github.com/shadxwfxry/MotoLog.git
cd MotoLog

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env (see section below)

# 4. Sync the database
npx prisma db push

# 5. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### ⚙️ Environment Variables (`.env`)

```env
# Supabase — Transaction Pooler (port 6543)
DATABASE_URL="postgresql://..."

# Supabase — Direct connection for migrations (port 5432)
DIRECT_URL="postgresql://..."

# NextAuth secret (any long random string)
NEXTAUTH_SECRET="your-secret-here"

# Your site URL
NEXTAUTH_URL="https://your-app.vercel.app"

# Google Gemini AI key
AI_API_KEY="AIza..."
```

### 🌐 Deploy to Vercel

1. Fork or push the repository to GitHub
2. Connect the project at [vercel.com](https://vercel.com)
3. Add all variables from `.env` in **Settings → Environment Variables**
4. Done — Vercel will build and deploy automatically

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| ORM | [Prisma](https://www.prisma.io/) |
| Auth | [NextAuth.js](https://next-auth.js.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| AI | [Google Gemini](https://ai.google.dev/) |
| Search | [Google CSE](https://programmablesearchengine.google.com/) |
| Hosting | [Vercel](https://vercel.com/) |

---

## 📄 License

MIT © [shadxwfxry](https://github.com/shadxwfxry)

---

<div align="center">
  <em>Made with ❤️ for the moto community · 🏍️ Ride safe</em>
</div>
