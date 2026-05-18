# 🏍️ MotoLog v1.5

MotoLog is a premium, high-performance Progressive Web Application (PWA) designed for motorcycle enthusiasts to track maintenance logs, fuel expenses, garage specs, and tournament integrations. Supercharged with Google Gemini AI for smart diagnostics and equipped with a full Offline-First background sync architecture.

---

## 🌍 Languages / Языки / Мови
[English](#english) | [Русский](#русский) | [Українська](#українська)

---

<a name="english"></a>
## 🇬🇧 English

### ⚡ Key Features
- **Offline-First Sync Engine (IndexedDB)**: Add refueling and maintenance logs completely offline. Data is securely saved to local storage and synchronized automatically in the background using Next.js Server Actions the moment network connectivity returns.
- **Smart Garage & Torque Memo Sheet**: Manage multiple bikes. Store custom key-value specifications, torque settings, or part numbers (e.g. `"Oil Filter": "HF204"`, `"Rear Axle Torque": "110 Nm"`) directly in a flexible, PostgreSQL-powered JSON field.
- **Active Ride & Smart Alerts Widget**: Interactive, tactile home dashboard displaying your active motorcycle, a large-font high-contrast odometer readout, and prioritized service reminders (color-coded red/yellow/green).
- **Tournaments Integration & CORS API**: Includes a secure, CORS-enabled external vehicle endpoint (`/api/external/vehicle/[id]`) for tournament QR-code scanning, alongside a dedicated tournament board switcher with `/admin.html` routing.
- **PWA Hot-Reload & Route Caching**:
  - Pre-cached client-side Next.js App Router client routing (requests containing `_rsc` parameters) for seamless transitions in offline mode.
  - Interactive browser Service Worker update controller (`PwaUpdater`) notifications for graceful, user-triggered full-app reload when new features deploy.
- **MotoAssistant**: AI powered by Google Gemini (Flash) with real-time web-search integration for technical diagnostics.
- **Fuel Economy**: Advanced full-to-full consumption and expense statistics.

### 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Prisma ORM)
- **Client Storage**: IndexedDB (`idb`)
- **AI**: Google Generative AI (Gemini Flash)
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS & Glassmorphic Custom Theme
- **PWA Configuration**: `next-pwa` with custom `runtimeCaching`

### 🚀 Installation & Launch
1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy environment variables: `cp .env.example .env` and fill in database credentials and Gemini API keys.
4. Sync database schemas:
   ```bash
   npx prisma db push
   ```
5. Launch the local developer server:
   ```bash
   pnpm run dev
   ```

---

<a name="русский"></a>
## 🇷🇺 Русский

### ⚡ Ключевые Возможности
- **Офлайн-режим и фоновая синхронизация (IndexedDB)**: Вносите данные о заправках и ТО на подземных парковках или в глухих гаражах. Все записи сохраняются в локальное IndexedDB хранилище и автоматически синхронизируются с сервером через Next.js Server Actions при восстановлении связи.
- **Умный гараж и Памятка ТТХ**: Храните любые произвольные характеристики, моменты затяжки или парт-номера запчастей (например: `"Масляный фильтр": "HF204"`, `"Момент задней оси": "110 Nm"`) прямо в карточке мотоцикла с использованием гибкого JSON-поля в PostgreSQL.
- **Виджет «Активный байк» и Умные Напоминания**: Главный экран теперь оснащен интерактивной сводкой: активный мотоцикл, крупный высококонтрастный одометр для чтения грязными руками и приоритетный список сервисных задач с цветовым кодированием (красный/желтый/зеленый).
- **Интеграция с Турнирами и CORS API**: Включает открытый эндпоинт (`/api/external/vehicle/[id]`) с поддержкой CORS-заголовков для интеграции со сторонними турнирными сетками по QR-коду, а также удобный переключатель режима администратора с роутингом `/admin.html`.
- **PWA Кэширование и Автообновление**:
  - Кэширование клиентских переходов Next.js App Router (запросы с `_rsc`) для плавной работы в офлайне без сетевых ошибок.
  - Компонент автообновления `PwaUpdater`, который отслеживает установку нового Service Worker'а и выводит тактильную плашку «Доступно обновление!» с кнопкой перезапуска для мгновенного применения свежего кэша.
- **MotoAssistant**: Умный ИИ-помощник Google Gemini (Flash) с доступом к веб-поиску в реальном времени.

### 🚀 Установка и Запуск
1. Клонируйте репозиторий.
2. Установите зависимости:
   ```bash
   pnpm install
   ```
3. Настройте файл переменных окружения: `cp .env.example .env` (заполните подключение к БД и API ключи).
4. Настройте базу данных:
   ```bash
   npx prisma db push
   ```
5. Запустите dev-сервер:
   ```bash
   pnpm run dev
   ```

---

<a name="українська"></a>
## 🇺🇦 Українська

### ⚡ Ключові Можливості
- **Офлайн-режим та фонова синхронізація (IndexedDB)**: Додавайте записи про заправки та ТО навіть за відсутності інтернету. Всі дані надійно консервуються в локальну IndexedDB та синхронізуються з сервером через Next.js Server Actions автоматично, щойно з'явиться зв'язок.
- **Розумний гараж та Пам'ятка ТТХ**: Додавайте будь-які довільні характеристики, моменти затяжки болтів або номери запчастин (наприклад: `"Фільтр мастила": "HF204"`, `"Момент задньої осі": "110 Nm"`) безпосередньо у картці байка завдяки гнучкому JSON-полю в PostgreSQL.
- **Віджет «Активний байк» та Розумні Нагадування**: Головний екран відображає інтерактивну панель: ваш активний мотоцикл, одометр з великим жирним шрифтом (зручно натискати в гаражі) та пріоритетний список сервісних нагадувань (червоний/жовтий/зелений).
- **Інтеграція з Турнірами та CORS API**: Наявність відкритого API-маршруту (`/api/external/vehicle/[id]`) з підтримкою CORS для миттєвого зчитування даних байка через QR-код, а також перемикач режиму адміністратора з роутингом `/admin.html`.
- **Оптимізоване PWA-кэшування та Автооновлення**:
  - Надійне офлайн-кешування переходів Next.js App Router (запитів з параметром `_rsc`) для роботи без мережі.
  - Компонент `PwaUpdater`, який відстежує завантаження свіжої версії Service Worker'а та показує банер «Доступне оновлення!» з кнопкою перезавантаження для миттєвого та безпечного оновлення клієнтського кэшу.
- **MotoAssistant**: ШІ-асистент на базі Google Gemini (Flash) з інтеграцією веб-пошуку для точної діагностики.

---
Developed with ❤️ for the motorcycle community.
