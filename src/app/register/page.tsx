"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError(t("passwords_mismatch"));
      return;
    }
    if (form.password.length < 6) {
      setError(t("password_too_short"));
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || t("register_error"));
      return;
    }

    // Auto sign-in after registration
    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
    } else {
      router.push("/garage");
      router.refresh();
    }
  }

  const field = (key: keyof typeof form, label: string, type: string, placeholder?: string) => (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        required
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-6rem)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🏍</div>
          <h1 className="text-2xl font-bold">MotoLog</h1>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold">{t("create_account")}</h2>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field("name", t("name"), "text")}
            {field("email", t("email"), "email", "you@example.com")}
            {field("password", t("password"), "password")}

            {/* Confirm password */}
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("confirm_password")}</label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition ${
                  form.confirm && form.confirm !== form.password
                    ? "border-red-500/60"
                    : "border-border"
                }`}
              />
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-400">{t("passwords_mismatch")}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition"
            >
              {loading ? "..." : t("register")}
            </button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {t("already_account")}{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
