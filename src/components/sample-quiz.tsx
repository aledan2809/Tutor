"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { SampleQuestion } from "@/lib/seo-subjects";

// Static sample quiz for SEO landings — client-side scoring, no AI call, no cost.
// The conversion path is the CTA into the live Magic Quiz demo (/try).
export function SampleQuiz({
  questions,
  ro,
}: {
  questions: SampleQuestion[];
  ro: boolean;
}) {
  const [answers, setAnswers] = useState<number[]>(() => new Array(questions.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const allAnswered = answers.every((a) => a >= 0);

  const T = ro
    ? { see: "Vezi rezultatul", answerAll: "Răspunde la toate", scored: "Ai răspuns corect la", of: "din", cta: "Generează propriul test din materialul tău ✨" }
    : { see: "See result", answerAll: "Answer all", scored: "You got", of: "of", cta: "Generate your own quiz from your material ✨" };

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="mb-3 font-medium text-gray-100">
            {qi + 1}. {q.content}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const isChosen = answers[qi] === oi;
              const isCorrect = oi === q.correctIndex;
              const cls = submitted
                ? isCorrect
                  ? "border-green-500 bg-green-500/10 text-green-300"
                  : isChosen
                  ? "border-red-500 bg-red-500/10 text-red-300"
                  : "border-gray-700 text-gray-300"
                : isChosen
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-700 hover:border-gray-600";
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={submitted}
                  onClick={() => {
                    const next = [...answers];
                    next[qi] = oi;
                    setAnswers(next);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${cls}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {submitted && q.explanation && (
            <p className="mt-2 text-xs text-gray-400">{q.explanation}</p>
          )}
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
          className="min-h-[44px] w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {allAnswered ? T.see : T.answerAll}
        </button>
      ) : (
        <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-5 text-center">
          <p className="text-2xl font-bold text-white">
            {T.scored} {score} {T.of} {questions.length} 🎯
          </p>
          <Link
            href="/try"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            {T.cta}
          </Link>
        </div>
      )}
    </div>
  );
}
