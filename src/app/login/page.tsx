"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(t("invalid_credentials"));
    } else {
      router.push("/garage");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-6rem)] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🏍</div>
          <h1 className="text-2xl font-bold">MotoLog</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("welcome_desc")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold">{t("login")}</h2>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("email")}</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="test@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("password")}</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition"
            >
              {loading ? "..." : t("login")}
            </button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {t("no_account")}{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              {t("register")}
            </Link>
          </p>

          <div className="pt-1 border-t border-border text-xs text-center text-muted-foreground">
            Demo: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">test@example.com</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">password123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
