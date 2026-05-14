# 🏍️ MotoLog v2.0 — Your Ultimate Motorcycle Companion

**MotoLog** is a modern, high-performance Progressive Web Application (PWA) designed for motorcycle enthusiasts to track maintenance, fuel expenses, and garage history with ease. Integrated with AI-powered insights and a regionalized news hub.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black)
![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748)
![Tailwind](https://img.shields.io/badge/CSS-Tailwind-38B2AC)

## 🌟 Key Features

### 🛠️ Smart Garage Management
*   **Multi-Vehicle Support**: Track several bikes in one dashboard.
*   **Detailed Specs**: Log engine displacement (cc), power (hp), and weight.
*   **Photo Integration**: Upload photos of your bikes for a personalized experience.
*   **Maintenance Reminders**: Set upcoming service tasks and get notified based on mileage or date.

### 📊 Expenses & Analytics
*   **Fuel Tracking**: Log every refuel with station name, cost, liters, and odometer readings.
*   **Maintenance Logs**: Keep a full history of oil changes, tire swaps, and repairs.
*   **Automated Statistics**: Visual breakdowns of average consumption (L/100km) and total costs.
*   **PDF Export**: Generate professional PDF reports of your bike's history for yourself or future buyers.

### 🧠 AI MotoAssistant & Smart Search
*   **AI Search**: Ask natural questions like *"When was my last oil change?"* or *"How much have I spent on gas this month?"*.
*   **Built-in Search Hub**: Universal search bar that filters local garage logs AND performs native web searches (embedded results from DuckDuckGo).
*   **Smart Triggers**: Automatically switches between local AI analytics and web search based on your query keywords.

### 🌐 Content & Customization
*   **Regional News Hub**: Stay updated with moto-news tailored for your region (Ukraine, Russia, Europe, USA, Asia).
*   **Multi-Language**: Full support for Russian, Ukrainian, and English.
*   **Theme Engine**: Switch between Light and Dark modes with persistent accent color customization (Orange, Blue, Green, Purple, Red).

---

## 🚀 Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Database**: [SQLite](https://www.sqlite.org/) (Development) / PostgreSQL (Production)
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
*   **AI**: [Google Gemini AI SDK](https://ai.google.dev/)
*   **Parsing**: Native Regex-based Web Scraper (DuckDuckGo HTML)

---

## 🛠️ Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/motolog.git
    cd motolog
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Configure environment variables**:
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="file:./dev.db"
    NEXTAUTH_SECRET="your-random-secret"
    NEXTAUTH_URL="http://localhost:3000"
    AI_API_KEY="your-google-gemini-api-key"
    ```

4.  **Database setup**:
    ```bash
    npx prisma migrate dev --name init
    npx prisma generate
    ```

5.  **Run the development server**:
    ```bash
    npm run dev
    ```

---

## 📱 PWA Support
MotoLog is fully PWA-compatible. On mobile devices, use "Add to Home Screen" to install it as a standalone app with offline support and a native feel.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---

*Made with ❤️ for the moto community.*
