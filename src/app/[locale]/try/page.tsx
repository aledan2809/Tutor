"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

interface MagicQuestion {
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const SAMPLE_RO = `Fotosinteza este procesul prin care plantele, algele și unele bacterii transformă energia luminoasă în energie chimică. Are loc în cloroplaste, organite care conțin clorofilă, pigmentul verde ce absoarbe lumina. Procesul folosește dioxid de carbon din aer și apă din sol și produce glucoză și oxigen. Faza de lumină are loc în tilacoide și produce ATP și NADPH, iar faza independentă de lumină (ciclul Calvin) are loc în stromă și fixează carbonul în glucoză. Oxigenul eliberat provine din molecula de apă, prin fotoliză.`;

const SAMPLE_EN = `Photosynthesis is the process by which plants, algae and some bacteria convert light energy into chemical energy. It takes place in chloroplasts, organelles that contain chlorophyll, the green pigment that absorbs light. The process uses carbon dioxide from the air and water from the soil, and produces glucose and oxygen. The light-dependent reactions occur in the thylakoids and produce ATP and NADPH, while the light-independent reactions (Calvin cycle) occur in the stroma and fix carbon into glucose. The oxygen released comes from water molecules, through photolysis.`;

type Phase = "input" | "quiz" | "result";

// Mirrors MAGIC_MAX_CHARS in lib/magic-quiz (not imported — that lib pulls in
// prisma/server code which must not land in this client bundle).
const MAX_CHARS = 6000;

export default function TryPage() {
  const locale = useLocale();
  const ro = locale === "ro";
  const T = ro
    ? {
        badge: "Demo gratuit · fără cont",
        title: "Transformă orice text într-un test în 10 secunde",
        subtitle:
          "Lipește o pagină din manual, un curs sau orice material. AI-ul generează grile pe care le dai chiar aici. Asta facem pentru elevii noștri, în fiecare zi.",
        placeholder: "Lipește aici teoria din care vrei test (min. 50 de caractere)…",
        sample: "Încearcă cu un exemplu",
        generate: "Generează testul ✨",
        generating: "Generez întrebările…",
        quizTitle: "Testul tău",
        seeResult: "Vezi rezultatul",
        answerAll: "Răspunde la toate întrebările",
        scorePrefix: "Ai răspuns corect la",
        of: "din",
        correct: "Corect",
        yourAnswer: "Răspunsul tău",
        again: "Generează alt test",
        share: "Distribuie pe WhatsApp",
        challenge: "Provoacă un prieten 🎯",
        ctaTitle: "Ți-a plăcut? Asta e doar începutul.",
        ctaText:
          "Cu cont gratuit: salvezi progresul, primești streak-uri zilnice, 1400+ grile reale și învățare adaptivă care se mulează pe tine.",
        ctaButton: "Fă-ți cont gratuit",
        errGeneric: "Ceva n-a mers. Încearcă cu alt text.",
        backHome: "← Acasă",
      }
    : {
        badge: "Free demo · no account",
        title: "Turn any text into a quiz in 10 seconds",
        subtitle:
          "Paste a page from a textbook, lecture notes or any material. The AI generates a quiz you take right here. This is what we do for our students, every day.",
        placeholder: "Paste the theory you want a quiz from (min. 50 characters)…",
        sample: "Try an example",
        generate: "Generate quiz ✨",
        generating: "Generating questions…",
        quizTitle: "Your quiz",
        seeResult: "See result",
        answerAll: "Answer all questions",
        scorePrefix: "You got",
        of: "of",
        correct: "Correct",
        yourAnswer: "Your answer",
        again: "Generate another quiz",
        share: "Share on WhatsApp",
        challenge: "Challenge a friend 🎯",
        ctaTitle: "Liked it? This is just the start.",
        ctaText:
          "With a free account: save your progress, daily streaks, 1400+ real questions and adaptive learning that fits you.",
        ctaButton: "Create a free account",
        errGeneric: "Something went wrong. Try another text.",
        backHome: "← Home",
      };

  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<MagicQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0
  );

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/magic-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: ro ? "ro" : "en" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || T.errGeneric);
        return;
      }
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(-1));
      setSubmitted(false);
      setPhase("quiz");
    } catch {
      setError(T.errGeneric);
    } finally {
      setLoading(false);
    }
  }

  function selectOption(qi: number, oi: number) {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  }

  const allAnswered = answers.length > 0 && answers.every((a) => a >= 0);

  function shareUrl() {
    // Link to the OG-rich /scor page so the WhatsApp/social preview shows a
    // branded score card (not a bare link). That card is the viral artifact.
    const link = `https://etutor.ro/${ro ? "ro" : "en"}/scor?s=${score}&t=${questions.length}`;
    const msg = ro
      ? `Am luat ${score}/${questions.length} la un test generat de AI pe etutor.ro. Bați? 🎯`
      : `I scored ${score}/${questions.length} on an AI-generated quiz at etutor.ro. Can you beat me? 🎯`;
    return `https://wa.me/?text=${encodeURIComponent(msg + " " + link)}`;
  }

  // Persist the quiz once (idempotent per session). The save response also sets
  // the lazy-save cookie so the quiz is claimed if the visitor signs up.
  async function ensureSaved(): Promise<string | null> {
    if (savedId) return savedId;
    try {
      const res = await fetch("/api/magic-quiz/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, language: ro ? "ro" : "en", score }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setSavedId(data.id);
      return data.id;
    } catch {
      return null;
    }
  }

  async function challengeFriend() {
    setBusy(true);
    const id = await ensureSaved();
    setBusy(false);
    if (!id) {
      window.open(shareUrl(), "_blank"); // graceful fallback to the score card
      return;
    }
    const link = `https://etutor.ro/${ro ? "ro" : "en"}/duel/${id}`;
    const msg = ro
      ? `Te provoc la un quiz AI pe etutor.ro. Bați scorul meu de ${score}/${questions.length}? 🎯`
      : `I challenge you to an AI quiz on etutor.ro. Beat my ${score}/${questions.length}? 🎯`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg + " " + link)}`, "_blank");
  }

  async function goSignup() {
    setBusy(true);
    await ensureSaved(); // sets the lazy-save cookie before leaving
    setBusy(false);
    router.push("/auth/register");
  }

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
            {T.ctaButton}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {phase === "input" && (
          <>
            <span className="inline-block rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
              {T.badge}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {T.title}
            </h1>
            <p className="mt-3 text-base text-gray-300">{T.subtitle}</p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder={T.placeholder}
              rows={9}
              maxLength={MAX_CHARS}
              className="mt-6 w-full rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-right text-xs text-gray-500">
              {text.length}/{MAX_CHARS}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() => setText(ro ? SAMPLE_RO : SAMPLE_EN)}
                className="inline-flex min-h-[44px] items-center text-sm text-blue-400 hover:text-blue-300"
              >
                {T.sample}
              </button>
              <span className="text-xs text-gray-500">{text.length} / 6000</span>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading || text.trim().length < 50}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-lg font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? T.generating : T.generate}
            </button>
          </>
        )}

        {phase !== "input" && (
          <>
            <h1 className="text-2xl font-bold text-white">{T.quizTitle}</h1>
            <div className="mt-6 space-y-6">
              {questions.map((q, qi) => (
                <div
                  key={qi}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-5"
                >
                  <p className="font-medium text-white">
                    {qi + 1}. {q.content}
                  </p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, oi) => {
                      const chosen = answers[qi] === oi;
                      const isCorrect = q.correctIndex === oi;
                      let cls =
                        "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ";
                      if (!submitted) {
                        cls += chosen
                          ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-600";
                      } else if (isCorrect) {
                        cls += "border-green-500 bg-green-500/10 text-green-200";
                      } else if (chosen) {
                        cls += "border-red-500 bg-red-500/10 text-red-200";
                      } else {
                        cls += "border-gray-700 bg-gray-800 text-gray-400";
                      }
                      return (
                        <button
                          key={oi}
                          onClick={() => selectOption(qi, oi)}
                          disabled={submitted}
                          className={cls}
                        >
                          <span className="font-semibold">
                            {String.fromCharCode(65 + oi)}.
                          </span>
                          <span>{opt}</span>
                          {submitted && isCorrect && (
                            <span className="ml-auto text-xs font-semibold text-green-300">
                              {T.correct}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && q.explanation && (
                    <p className="mt-3 rounded-lg bg-gray-800 p-3 text-sm text-gray-300">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {!submitted ? (
              <button
                onClick={() => setSubmitted(true)}
                disabled={!allAnswered}
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-lg font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {allAnswered ? T.seeResult : T.answerAll}
              </button>
            ) : (
              <div className="mt-6 rounded-xl border border-blue-500/40 bg-blue-500/10 p-6 text-center">
                <p className="text-3xl font-bold text-white">
                  {T.scorePrefix} {score} {T.of} {questions.length} 🎯
                </p>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <button
                    onClick={challengeFriend}
                    disabled={busy}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 sm:w-auto"
                  >
                    {T.challenge}
                  </button>
                  <a
                    href={shareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-200 hover:border-gray-500 transition-colors"
                  >
                    📲 {T.share}
                  </a>
                </div>

                <div className="mt-6 border-t border-blue-500/30 pt-5">
                  <p className="text-lg font-semibold text-white">{T.ctaTitle}</p>
                  <p className="mt-1 text-sm text-gray-300">{T.ctaText}</p>
                  <button
                    onClick={goSignup}
                    disabled={busy}
                    className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {T.ctaButton}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setPhase("input");
                setQuestions([]);
                setAnswers([]);
                setSubmitted(false);
              }}
              className="mt-4 flex min-h-[44px] w-full items-center justify-center text-sm text-gray-400 hover:text-gray-200"
            >
              {T.again}
            </button>
          </>
        )}

        <div className="mt-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">
            {T.backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
