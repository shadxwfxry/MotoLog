import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    // `features`, `store` and `shared` were missing, so Tailwind never emitted
    // the classes used by the ride recorder, the map and the group-ride panels.
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Small phones. The previous design faked this with a raw media query in
      // globals.css that also forced `.hidden { display: none !important }`,
      // which broke every responsive `hidden`/`xs:block` pair it touched.
      screens: {
        xs: "400px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Signal colours, named by meaning. A screen should never reach for
        // `text-red-400` when what it means is "overdue".
        signal: {
          cyan: "hsl(var(--signal-cyan))",
          lime: "hsl(var(--signal-lime))",
          amber: "hsl(var(--signal-amber))",
          rose: "hsl(var(--signal-rose))",
          violet: "hsl(var(--signal-violet))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        glow: "0 0 0 1px hsl(var(--primary) / 0.35), 0 0 24px -4px hsl(var(--primary) / 0.45)",
        "glow-lg": "0 0 0 1px hsl(var(--primary) / 0.4), 0 0 60px -10px hsl(var(--primary) / 0.6)",
        hud: "inset 0 1px 0 0 hsl(var(--hairline)), 0 20px 40px -24px rgb(0 0 0 / 0.85)",
      },
      backgroundImage: {
        "grid-fine":
          "linear-gradient(hsl(var(--hairline)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--hairline)) 1px, transparent 1px)",
        sheen:
          "linear-gradient(115deg, transparent 30%, hsl(var(--foreground) / 0.08) 50%, transparent 70%)",
      },
      backgroundSize: {
        grid: "44px 44px",
      },
      keyframes: {
        // One highlight travelling across a panel. Used sparingly, on hero
        // tiles only, so the UI reads as live telemetry rather than wallpaper.
        sweep: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.5)" },
          "70%": { boxShadow: "0 0 0 12px hsl(var(--primary) / 0)" },
          "100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(2%, -3%, 0) scale(1.08)" },
        },
      },
      animation: {
        sweep: "sweep 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "rise-in": "rise-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
        drift: "drift 24s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
