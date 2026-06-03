"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import SubjectQuizDemo from "@/components/SubjectQuizDemo";
import { SiteHeader } from "@/components/SiteHeader";

export default function TryPage() {
  const locale = useLocale();
  const ro = locale === "ro";
  const backHome = ro ? "← Acasă" : "← Home";

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <SiteHeader locale={locale} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <span className="inline-block rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
          {ro ? "Demo gratuit · fără cont" : "Free demo · no account"}
        </span>
        <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
          {ro ? "Alege o materie și exersează pe grile reale" : "Pick a subject and practice on real questions"}
        </h1>
        <p className="mt-3 text-gray-400">
          {ro
            ? "Grile reale din materia aleasă — fără cont. Îți salvezi progresul și streak-urile când îți faci cont."
            : "Real questions from the subject you pick — no account. Save your progress and streaks when you sign up."}
        </p>

        <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/60 p-5 shadow-xl sm:p-6">
          <SubjectQuizDemo locale={locale} />
        </div>

        <div className="mt-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">
            {backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
