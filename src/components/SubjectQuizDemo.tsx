"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

// No-account demo: pick a subject from the real PUBLISHED question bank and take
// a short quiz from it. Mirrors the MagicQuiz take→score loop but sources real
// content instead of generating from pasted text.
type Q = {
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  topic: string | null;
};
type Subject = { subject: string; count: number };
type Phase = "select" | "take" | "score";

export default function SubjectQuizDemo({ locale }: { locale?: string }) {
  const ro = locale !== "en";
  const L = ro
    ? {
        pick: "Alege materia și exersează pe grile reale:",
        loadingSubjects: "Se încarcă materiile…",
        none: "Momentan nu sunt materii cu suficiente grile publicate. Revino curând!",
        start: "Începe testul",
        loadingQuiz: "Se pregătește testul…",
        questions: "întrebări",
        see: "Vezi rezultatul",
        scorePrefix: "Ai răspuns corect la",
        of: "din",
        correct: "Corect",
        yourAnswer: "Răspunsul tău",
        retry: "Altă materie",
        cta: "Fă-ți cont gratuit ca să-ți salvezi progresul",
        answerAll: "Răspunde la toate întrebările ca să vezi rezultatul.",
      }
    : {
        pick: "Pick a subject and practice on real questions:",
        loadingSubjects: "Loading subjects…",
        none: "No subjects with enough published questions yet. Check back soon!",
        start: "Start the quiz",
        loadingQuiz: "Preparing your quiz…",
        questions: "questions",
        see: "See your result",
        scorePrefix: "You got",
        of: "of",
        correct: "Correct",
        yourAnswer: "Your answer",
        retry: "Another subject",
        cta: "Create a free account to save your progress",
        answerAll: "Answer every question to see your result.",
      };

  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [selected, setSelected] = useState("");
  const [phase, setPhase] = useState<Phase>("select");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/public/practice/subjects")
      .then((r) => r.json())
      .then((d) => {
        const s: Subject[] = d.subjects ?? [];
        setSubjects(s);
        if (s.length) setSelected(s[0].subject);
      })
      .catch(() => setSubjects([]));
  }, []);

  async function startQuiz() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/practice/quiz?subject=${encodeURIComponent(selected)}`);
      const data = await res.json();
      const qs: Q[] = data.questions ?? [];
      if (qs.length === 0) return;
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(null));
      setPhase("take");
    } finally {
      setLoading(false);
    }
  }

  const answeredAll = answers.length > 0 && answers.every((a) => a !== null);
  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);

  function reset() {
    setPhase("select");
    setQuestions([]);
    setAnswers([]);
  }

  // ---- Select phase ----
  if (phase === "select") {
    return (
      <div>
        <p className="mb-4 text-center text-sm font-semibold text-blue-300">{L.pick}</p>
        {subjects === null ? (
          <p className="text-center text-sm text-gray-400">{L.loadingSubjects}</p>
        ) : subjects.length === 0 ? (
          <p className="text-center text-sm text-gray-400">{L.none}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.subject} value={s.subject}>
                  {s.subject} ({s.count} {L.questions})
                </option>
              ))}
            </select>
            <button
              onClick={startQuiz}
              disabled={loading || !selected}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? L.loadingQuiz : `${L.start} ✨`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- Score phase ----
  if (phase === "score") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-5 text-center">
          <p className="text-sm text-blue-200">
            {L.scorePrefix}{" "}
            <span className="text-2xl font-bold text-white">
              {score}/{questions.length}
            </span>{" "}
          </p>
        </div>
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {questions.map((q, i) => {
            const ok = answers[i] === q.correctIndex;
            return (
              <div key={i} className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-sm">
                <p className="font-medium text-white">
                  {ok ? "✅" : "❌"} {q.content}
                </p>
                <p className="mt-1 text-green-400">
                  {L.correct}: {String.fromCharCode(65 + q.correctIndex)}. {q.options[q.correctIndex]}
                </p>
                {!ok && answers[i] !== null && (
                  <p className="text-red-400">
                    {L.yourAnswer}: {String.fromCharCode(65 + (answers[i] as number))}. {q.options[answers[i] as number]}
                  </p>
                )}
                {q.explanation && <p className="mt-1 text-xs text-gray-400">{q.explanation}</p>}
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/auth/register"
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-700"
          >
            {L.cta}
          </Link>
          <button
            onClick={reset}
            className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 font-medium text-gray-200 hover:bg-gray-800"
          >
            {L.retry}
          </button>
        </div>
      </div>
    );
  }

  // ---- Take phase ----
  return (
    <div className="space-y-4">
      <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
        {questions.map((q, qi) => (
          <div key={qi} className="rounded-lg border border-gray-800 bg-gray-900 p-3">
            <p className="text-sm font-medium text-white">
              {qi + 1}. {q.content}
            </p>
            <div className="mt-2 space-y-1.5">
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers((prev) => prev.map((a, idx) => (idx === qi ? oi : a)))}
                    className={`flex w-full gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      chosen
                        ? "border-blue-500 bg-blue-600/10 text-blue-300"
                        : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    <span className="font-semibold text-gray-500">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setPhase("score")}
        disabled={!answeredAll}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {answeredAll ? L.see : L.answerAll}
      </button>
    </div>
  );
}
