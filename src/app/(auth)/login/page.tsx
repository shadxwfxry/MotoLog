"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { AuthShell, Field } from "../AuthShell";

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
    <AuthShell
      title={t("login")}
      subtitle={t("welcome_desc")}
      error={error}
      footer={
        <div className="space-y-3">
          <p>
            {t("no_account")}{" "}
            <Link href="/register" className="font-bold text-primary hover:underline">
              {t("register")}
            </Link>
          </p>
          {/* Kept from the previous design — this is the shared demo account. */}
          <p className="num text-[11px] text-muted-foreground/70">
            demo · test@example.com / password123
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label={t("email")}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Field
          label={t("password")}
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <button type="submit" disabled={loading} className="btn-primary h-12 w-full">
          {loading ? `${t("loading")}…` : t("login")}
        </button>
      </form>
    </AuthShell>
  );
}
