import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutor - AI-Powered Adaptive Learning Platform",
  description:
    "Master any subject with personalized AI-driven learning paths, spaced repetition, and intelligent practice sessions. Start learning smarter today.",
};

export default function LandingPage() {
  const t = useTranslations("landing");
  const tAuth = useTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <span className="text-xl font-bold text-blue-500">Tutor</span>
          <Link
            href="/auth/signin"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {tAuth("signIn")}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white">
          {t("hero")}
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-gray-400">
          {t("subtitle")}
        </p>
        <Link
          href="/auth/signin"
          className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {t("getStarted")}
        </Link>

        {/* Features */}
        <div className="mt-20 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
            <h3 className="mb-2 text-lg font-semibold text-white">
              {t("adaptiveLearning")}
            </h3>
            <p className="text-sm text-gray-400">{t("adaptiveDesc")}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
            <h3 className="mb-2 text-lg font-semibold text-white">
              {t("examSimulator")}
            </h3>
            <p className="text-sm text-gray-400">{t("examDesc")}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
            <h3 className="mb-2 text-lg font-semibold text-white">
              {t("multiDomain")}
            </h3>
            <p className="text-sm text-gray-400">{t("multiDomainDesc")}</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Tutor. All rights reserved.
      </footer>
    </div>
  );
}
