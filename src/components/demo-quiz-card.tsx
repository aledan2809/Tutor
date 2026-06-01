"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

type DemoQuiz = { id: string; sharerScore: number; total: number; language: string };

// Lazy-save surface: if the user's demo quiz was claimed at signup, show a card
// linking to its shareable certificate so the demo work isn't lost. Self-fetches;
// renders nothing if there's no claimed quiz.
export function DemoQuizCard() {
  const ro = useLocale() === "ro";
  const [quiz, setQuiz] = useState<DemoQuiz | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/me/demo-quiz")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setQuiz(d?.quiz ?? null))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!quiz) return null;

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 sm:flex-row sm:items-center">
      <div>
        <p className="font-medium text-white">
          {ro ? "Quiz-ul tău demo a fost salvat 🎯" : "Your demo quiz was saved 🎯"}
        </p>
        <p className="text-sm text-gray-300">
          {ro ? "Scor" : "Score"} {quiz.sharerScore}/{quiz.total} ·{" "}
          {ro ? "vezi certificatul partajabil" : "view the shareable certificate"}
        </p>
      </div>
      <Link
        href={`/certificat/${quiz.id}`}
        className="inline-flex min-h-[44px] items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        {ro ? "Vezi certificatul" : "View certificate"}
      </Link>
    </div>
  );
}
