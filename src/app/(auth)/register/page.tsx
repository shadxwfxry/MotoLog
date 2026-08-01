"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { AuthShell, Field } from "../AuthShell";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mismatch = form.confirm.length > 0 && form.confirm !== form.password;

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

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <AuthShell
      title={t("create_account")}
      error={error}
      footer={
        <>
          {t("already_account")}{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            {t("login")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("name")} type="text" required value={form.name} onChange={set("name")} />
        <Field
          label={t("email")}
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@example.com"
        />
        <Field
          label={t("password")}
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          placeholder="••••••••"
        />
        <Field
          label={t("confirm_password")}
          type="password"
          required
          autoComplete="new-password"
          value={form.confirm}
          onChange={set("confirm")}
          invalid={mismatch}
          hint={mismatch ? t("passwords_mismatch") : undefined}
        />

        <button type="submit" disabled={loading} className="btn-primary h-12 w-full">
          {loading ? `${t("loading")}…` : t("register")}
        </button>
      </form>
    </AuthShell>
  );
}
