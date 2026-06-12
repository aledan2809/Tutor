"use client";

import { signIn } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [mode, setMode] = useState<"credentials" | "magic">("credentials");

  // Honors ?callbackUrl= (set by middleware and campaign flows). Only same-site
  // relative paths are accepted — anything else falls back to the dashboard.
  const postLoginUrl = () => {
    const cb = new URLSearchParams(window.location.search).get("callbackUrl");
    if (cb && cb.startsWith("/") && !cb.startsWith("//") && !cb.startsWith("/\\")) {
      return cb.match(/^\/(en|ro)\//) ? cb : `/${locale}${cb}`;
    }
    return `/${locale}/dashboard`;
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError(t("invalidCredentials") || "Invalid email or password");
    } else {
      router.push(postLoginUrl());
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("resend", { email, redirect: false });
    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-white">
            {t("checkEmail")}
          </h2>
          <p className="text-sm text-gray-400">{t("checkEmailDescription")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-8">
        <h2 className="mb-1 text-2xl font-bold text-white">
          {t("signInTitle")}
        </h2>
        <p className="mb-6 text-sm text-gray-400">{t("signInDescription")}</p>

        {/* Google OAuth */}
        <button
          onClick={() => signIn("google", { callbackUrl: postLoginUrl() })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t("continueWithGoogle")}
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-700" />
          <span className="text-xs text-gray-400">{t("orContinueWith")}</span>
          <div className="h-px flex-1 bg-gray-700" />
        </div>

        {mode === "credentials" ? (
          <>
            {/* Email + Password */}
            <form onSubmit={handleCredentialsSignIn}>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                {t("emailLabel")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                title="Enter your email address"
                required
                className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                {t("passwordLabel") || "Password"}
              </label>
              <div className="relative mb-4">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  title="Enter your password"
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? (locale === "ro" ? "Ascunde parola" : "Hide password") : (locale === "ro" ? "Arată parola" : "Show password")}
                  title={showPassword ? (locale === "ro" ? "Ascunde parola" : "Hide password") : (locale === "ro" ? "Arată parola" : "Show password")}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <p className="mb-3 text-sm text-red-400">{error}</p>
              )}
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {t("signInButton") || "Sign In"}
              </button>
            </form>
            <div className="mt-1 flex items-center justify-between">
              <Link
                href="/auth/forgot-password"
                className="inline-flex min-h-[44px] items-center text-xs text-blue-400 hover:text-blue-300"
              >
                Forgot password?
              </Link>
              <button
                onClick={() => setMode("magic")}
                className="inline-flex min-h-[44px] items-center text-xs text-gray-400 hover:text-gray-200"
              >
                {t("useMagicLink") || "Use magic link instead"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Magic Link */}
            <form onSubmit={handleEmailSignIn}>
              <label
                htmlFor="email-magic"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                {t("emailLabel")}
              </label>
              <input
                id="email-magic"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                title="Enter your email address"
                required
                className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {t("continueWithEmail")}
              </button>
            </form>
            <button
              onClick={() => setMode("credentials")}
              className="mt-2 flex min-h-[44px] w-full items-center justify-center text-center text-xs text-gray-400 hover:text-gray-200"
            >
              {t("usePassword") || "Use password instead"}
            </button>
          </>
        )}

        <p className="mt-4 text-center text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="inline-block py-1 text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-gray-400">
          {locale === "ro" ? "Sau " : "Or "}
          <Link href="/try" className="inline-block py-1 text-blue-400 hover:text-blue-300">
            {locale === "ro" ? "încearcă fără cont ✨" : "try without an account ✨"}
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          {t("agreePrefix")}{" "}
          <Link href="/terms" className="inline-block py-1 text-blue-400 hover:text-blue-300 underline">
            {t("termsOfService")}
          </Link>{" "}
          &amp;{" "}
          <Link href="/privacy" className="inline-block py-1 text-blue-400 hover:text-blue-300 underline">
            {t("privacyPolicy")}
          </Link>
        </p>
      </div>
    </div>
  );
}
