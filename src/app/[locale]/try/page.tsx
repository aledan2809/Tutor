"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import MagicQuizDemo from "@/components/MagicQuizDemo";

export default function TryPage() {
  const locale = useLocale();
  const ro = locale === "ro";
  const signupLabel = ro ? "Fă-ți cont gratuit" : "Create a free account";
  const backHome = ro ? "← Acasă" : "← Home";

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-blue-500">
            Tutor
          </Link>
          <Link
            href="/auth/signin"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {signupLabel}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <MagicQuizDemo variant="full" />

        <div className="mt-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">
            {backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
