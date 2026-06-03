"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PublicQuiz = {
  questions: { content: string; options: string[] }[];
  language: string;
  creatorName: string | null;
  sharerScore: number;
  total: number;
};

type ScoreResult = {
  score: number;
  total: number;
  sharerScore: number;
  creatorName: string | null;
  results: { correctIndex: number; chosen: number; isCorrect: boolean; explanation: string }[];
};

const COPY = {
  ro: {
    loading: "Se încarcă provocarea…",
    notFound: "Provocarea nu există sau a expirat.",
    makeOwn: "Fă-ți propriul quiz",
    intro: (who: string, s: number, t: number) => `${who} a luat ${s}/${t}. Bați?`,
    submit: "Vezi scorul",
    answerAll: "Răspunde la toate întrebările.",
    you: "Tu",
    them: (who: string) => who,
    win: "🏆 Ai câștigat! Felicitări!",
    tie: "🤝 Egalitate!",
    lose: "😬 Aproape! Mai exersează.",
    shareBack: "📲 Provoacă pe altcineva",
    cta: "Învață cu un tutor — creează cont",
    correct: "Corect",
    wrong: "Greșit",
  },
  en: {
    loading: "Loading the challenge…",
    notFound: "Challenge not found or expired.",
    makeOwn: "Make your own quiz",
    intro: (who: string, s: number, t: number) => `${who} scored ${s}/${t}. Can you beat it?`,
    submit: "See my score",
    answerAll: "Answer all questions.",
    you: "You",
    them: (who: string) => who,
    win: "🏆 You won! Nice.",
    tie: "🤝 It's a tie!",
    lose: "😬 So close! Keep practicing.",
    shareBack: "📲 Challenge someone else",
    cta: "Learn with a tutor — sign up",
    correct: "Correct",
    wrong: "Wrong",
  },
};

export function DuelClient({ quizId, locale }: { quizId: string; locale: string }) {
  const ro = locale !== "en";
  const T = COPY[ro ? "ro" : "en"];
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/magic-quiz/${quizId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: PublicQuiz) => {
        if (active) {
          setQuiz(data);
          setAnswers(new Array(data.questions.length).fill(-1));
        }
      })
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [quizId]);

  async function submit() {
    if (!quiz) return;
    if (answers.some((a) => a < 0)) {
      setError(T.answerAll);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/magic-quiz/${quizId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setError(ro ? "A apărut o eroare. Încearcă din nou." : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function shareUrl(): string {
    const link = `https://etutor.ro/${ro ? "ro" : "en"}/duel/${quizId}`;
    const msg = ro
      ? `Te provoc la un quiz pe etutor.ro. Bați scorul meu? 🎯`
      : `I challenge you to a quiz on etutor.ro. Beat my score? 🎯`;
    return `https://wa.me/?text=${encodeURIComponent(msg + " " + link)}`;
  }

  const who = quiz?.creatorName || (ro ? "Cineva" : "Someone");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-blue-500">
          etutor.ro
        </Link>
        <Link href={`/${ro ? "ro" : "en"}/try`} className="text-sm text-gray-400 hover:text-gray-200">
          {T.makeOwn}
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        {loadError && (
          <div className="mt-16 text-center">
            <p className="text-lg text-gray-300">{T.notFound}</p>
            <Link
              href={`/${ro ? "ro" : "en"}/try`}
              className="mt-4 inline-block rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-500"
            >
              {T.makeOwn}
            </Link>
          </div>
        )}

        {quiz && !result && (
          <div className="mt-6 space-y-6">
            <p className="text-center text-lg font-medium text-amber-300">
              {T.intro(who, quiz.sharerScore, quiz.total)}
            </p>
            {quiz.questions.map((q, qi) => (
              <div key={qi} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <p className="mb-3 font-medium">
                  {qi + 1}. {q.content}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                        answers[qi] === oi
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${qi}`}
                        checked={answers[qi] === oi}
                        onChange={() => {
                          const next = [...answers];
                          next[qi] = oi;
                          setAnswers(next);
                        }}
                        className="accent-blue-500"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={submit}
              disabled={submitting}
              className="min-h-[44px] w-full rounded-md bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {T.submit}
            </button>
          </div>
        )}

        {result && (
          <div className="mt-10 space-y-6 text-center">
            <div className="flex items-center justify-center gap-6">
              <Score label={T.you} value={`${result.score}/${result.total}`} accent />
              <span className="text-2xl text-gray-600">vs</span>
              <Score label={T.them(who)} value={`${result.sharerScore}/${result.total}`} />
            </div>
            <p className="text-xl font-semibold">
              {result.score > result.sharerScore ? T.win : result.score === result.sharerScore ? T.tie : T.lose}
            </p>
            <div className="flex flex-col items-center gap-2">
              <a
                href={shareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-md bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-500"
              >
                {T.shareBack}
              </a>
              <Link
                href={`/${ro ? "ro" : "en"}/auth/register`}
                className="inline-flex min-h-[44px] items-center rounded-md border border-blue-500 px-5 py-3 font-medium text-blue-300 hover:bg-blue-500/10"
              >
                {T.cta}
              </Link>
            </div>

            {/* Per-question review */}
            <div className="mt-6 space-y-2 text-left">
              {quiz?.questions.map((q, qi) => {
                const r = result.results[qi];
                return (
                  <div key={qi} className="rounded-md border border-gray-800 bg-gray-900 p-3 text-sm">
                    <p className="font-medium">
                      {qi + 1}. {q.content}
                    </p>
                    <p className={r?.isCorrect ? "text-green-400" : "text-red-400"}>
                      {r?.isCorrect ? `✓ ${T.correct}` : `✗ ${T.wrong}`} — {q.options[r?.correctIndex ?? 0]}
                    </p>
                    {r?.explanation && <p className="mt-1 text-gray-400">{r.explanation}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!quiz && !loadError && <p className="mt-16 text-center text-gray-500">{T.loading}</p>}
      </main>
    </div>
  );
}

function Score({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-blue-400" : "text-gray-200"}`}>{value}</p>
    </div>
  );
}
