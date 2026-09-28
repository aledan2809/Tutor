"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setSent(true);
      } else {
        // The server's own messages are English; the page shows its own words.
        setError(res.status === 400 ? t("invalidEmail") : t("genericError"));
      }
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-900/30">
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">{t("checkEmailTitle")}</h2>
          <p className="mb-6 text-sm text-gray-400">
            {t.rich("checkEmailBody", { email, b: (c) => <strong className="text-gray-300">{c}</strong> })}
          </p>
          <Link
            href="/auth/signin"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {t("backToSignIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-8">
        <h2 className="mb-2 text-center text-xl font-bold text-white">
          {t("forgotTitle")}
        </h2>
        <p className="mb-6 text-center text-sm text-gray-400">
          {t("forgotIntro")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-gray-400">{t("emailLabel")}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder={t("emailPlaceholder")}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? t("sending") : t("sendLink")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/auth/recuperare" className="text-blue-400 hover:text-blue-300">
            {t("noEmailHint")}
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-gray-500">
          <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">
            {t("backToSignIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
