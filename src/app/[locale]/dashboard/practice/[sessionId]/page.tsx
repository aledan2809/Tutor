"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { SessionTimer } from "@/components/session/session-timer";
import { QuestionRenderer } from "@/components/session/question-renderer";
import { FeedbackDisplay } from "@/components/session/feedback-display";
import { bumpAnswered } from "@/lib/engagement";
import { QuestionFeedback } from "@/components/session/question-feedback";
import { SessionResults } from "@/components/session/session-results";
import { DEFAULT_TONE, type RemarkTone } from "@/lib/remarks";

interface QuestionData {
  id: string;
  content: string;
  type: "MULTIPLE_CHOICE" | "OPEN";
  options?: { label: string; value: string }[] | null;
  subject: string;
  topic: string;
  difficulty: number;
  imageUrl?: string | null;
  passage?: string | null;
}

interface SessionData {
  sessionId: string;
  type: string;
  duration: number;
  questions: QuestionData[];
  totalQuestions: number;
  domainSlug?: string;
  domainId?: string;
}

interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string | null;
  source?: string | null;
  sourceQuote?: string | null;
  xpAwarded?: number;
}

interface GamificationData {
  xpAwarded: number;
  totalXp: number;
  level: string;
  levelUp: boolean;
  newAchievements: string[];
}

interface CompletionResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  duration: number;
  gamification?: GamificationData | null;
}

type Phase = "loading" | "answering" | "feedback" | "completed" | "not_found";

export default function ActiveSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params?.sessionId ?? "";
  const [domainSlug, setDomainSlug] = useState("aviation");
  const [continuing, setContinuing] = useState(false);

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Questions already answered before this view loaded (resume case) — used so
  // the progress counter is correct when we resume mid-session.
  const [answeredBase, setAnsweredBase] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [results, setResults] = useState<CompletionResult | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  // Consecutive correct answers in this session — drives the momentum chip.
  const [correctStreak, setCorrectStreak] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  // A5: a single contextual coachmark on the very first question (no manual/tour).
  const [coachmarkSeen, setCoachmarkSeen] = useState(true);
  const questionStartTime = useRef<number>(Date.now());
  // Adaptive-remarks config (tone resolved server-side: student pref ∩ parent restriction).
  const [remarkTone, setRemarkTone] = useState<RemarkTone>(DEFAULT_TONE);
  const [dislikedRemarks, setDislikedRemarks] = useState<string[]>([]);
  // Whether this correct answer follows a wrong one — drives the "comeback" remark.
  const lastWrong = useRef(false);
  const [cameBack, setCameBack] = useState(false);

  // Load the student's remark config once (best-effort; defaults stay if it fails).
  useEffect(() => {
    fetch("/api/student/remarks")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        if (d.tone) setRemarkTone(d.tone as RemarkTone);
        if (Array.isArray(d.disliked)) setDislikedRemarks(d.disliked);
      })
      .catch(() => {});
  }, []);

  const handleRemarkVote = useCallback((key: string, signal: "like" | "dislike") => {
    if (signal === "dislike") setDislikedRemarks((prev) => (prev.includes(key) ? prev : [...prev, key]));
    fetch("/api/student/remarks/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, signal }),
    }).catch(() => {});
  }, []);

  // Coachmark shows once, ever (read client-side to avoid an SSR flash).
  useEffect(() => {
    try {
      setCoachmarkSeen(localStorage.getItem("tutor_coachmark_seen") === "1");
    } catch {}
  }, []);

  // Load session from localStorage (saved during start). On a miss (cache
  // cleared / new device / crash) resume the in-progress session from the
  // server at the next unanswered question — never force a restart.
  useEffect(() => {
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (stored) {
      const data = JSON.parse(stored) as SessionData;
      setSessionData(data);
      if (data.domainSlug) {
        setDomainSlug(data.domainSlug);
      } else if (data.domainId) {
        // Resolve domainId to slug via API
        fetch("/api/student/domains")
          .then((r) => r.json())
          .then((d) => {
            const match = d.enrolled?.find(
              (e: { id: string }) => e.id === data.domainId
            );
            if (match) setDomainSlug(match.slug);
          })
          .catch(() => {});
      }
      setPhase("answering");
      return;
    }
    fetch("/api/student/sessions/continue", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.sessionId === sessionId && Array.isArray(d.questions) && d.questions.length) {
          setSessionData({
            sessionId: d.sessionId,
            type: d.type,
            duration: d.duration ?? 0,
            questions: d.questions,
            totalQuestions: d.totalQuestions ?? d.questions.length,
            domainSlug: d.domainSlug ?? undefined,
            domainId: d.domainId ?? undefined,
          });
          if (d.domainSlug) setDomainSlug(d.domainSlug);
          setAnsweredBase(d.answeredQuestions ?? 0);
          setPhase("answering");
        } else {
          setPhase("not_found");
        }
      })
      .catch(() => setPhase("not_found"));
  }, [sessionId]);

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (!sessionData || submitting) return;
      setSubmitting(true);
      const responseTime = Date.now() - questionStartTime.current;
      const question = sessionData.questions[currentIndex];

      try {
        const res = await fetch(`/api/${domainSlug}/session/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionId: question.id,
            answer,
            responseTime,
          }),
        });
        if (!res.ok) {
          // Don't lose the session — let the student re-submit this same question.
          setAnswerError("Nu am putut trimite răspunsul. Încearcă din nou.");
          return;
        }
        const result = await res.json();
        setAnswerError(null);
        setFeedback(result);
        setPhase("feedback");
        setAnsweredCount((c) => c + 1);
        setCorrectStreak((s) => (result.isCorrect ? s + 1 : 0));
        setCameBack(result.isCorrect && lastWrong.current);
        lastWrong.current = !result.isCorrect;
        bumpAnswered(); // first-value signal (gates the install/notifications banner)
        try {
          localStorage.setItem("tutor_coachmark_seen", "1");
        } catch {}
        setCoachmarkSeen(true);
      } catch {
        setAnswerError("Conexiune întreruptă — răspunsul nu s-a pierdut. Încearcă din nou.");
      } finally {
        setSubmitting(false);
      }
    },
    [sessionData, currentIndex, sessionId, domainSlug, submitting]
  );

  const completeSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/${domainSlug}/session/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const result = await res.json();
      setResults(result);
      setPhase("completed");
      localStorage.removeItem(`session_${sessionId}`);
    } catch {
      // retry
    }
  }, [sessionId, domainSlug]);

  // B (feed): "never ends" — start a fresh quick series in the same subject
  // straight from the results screen, no trip back to a menu.
  const startNext = useCallback(async () => {
    if (continuing) return;
    setContinuing(true);
    try {
      const res = await fetch(`/api/${domainSlug}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quick" }),
      });
      const s = await res.json();
      if (s.sessionId) {
        localStorage.setItem(`session_${s.sessionId}`, JSON.stringify({ ...s, domainSlug }));
        router.push(`/dashboard/practice/${s.sessionId}`);
      } else {
        setContinuing(false);
      }
    } catch {
      setContinuing(false);
    }
  }, [domainSlug, router, continuing]);

  const handleNext = useCallback(async () => {
    if (!sessionData) return;

    if (currentIndex + 1 >= sessionData.questions.length) {
      await completeSession();
    } else {
      setCurrentIndex((i) => i + 1);
      setFeedback(null);
      setPhase("answering");
      questionStartTime.current = Date.now();
    }
  }, [sessionData, currentIndex, completeSession]);

  const handleTimeUp = useCallback(() => {
    completeSession();
  }, [completeSession]);

  if (phase === "loading") {
    return (
      <div className="py-12 text-center text-gray-500">Se încarcă sesiunea…</div>
    );
  }

  if (phase === "not_found") {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="mb-4 text-gray-400">Sesiunea nu a fost găsită sau a expirat.</p>
        <Link
          href="/dashboard/practice"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Începe o sesiune nouă
        </Link>
      </div>
    );
  }

  if (phase === "completed" && results) {
    return (
      <SessionResults
        score={results.score}
        totalQuestions={results.totalQuestions}
        correctAnswers={results.correctAnswers}
        duration={results.duration}
        domainSlug={domainSlug}
        gamification={results.gamification}
        onContinue={startNext}
        continuing={continuing}
      />
    );
  }

  if (!sessionData) return null;

  const currentQuestion = sessionData.questions[currentIndex];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">
          Întrebarea {answeredBase + currentIndex + 1} din {sessionData.totalQuestions}
        </h1>
        <span className="text-sm text-gray-500">
          {answeredBase + answeredCount} rezolvate
        </span>
      </div>

      {/* Timer */}
      <SessionTimer
        durationSeconds={sessionData.duration}
        onTimeUp={handleTimeUp}
        isPaused={phase === "feedback"}
      />

      {/* Inline retry — keeps the same question + session (no restart). */}
      {answerError && phase === "answering" && (
        <div className="rounded-lg border border-red-700 bg-red-900/20 p-3 text-sm text-red-300">
          {answerError}{" "}
          <button onClick={() => setAnswerError(null)} className="ml-1 underline hover:no-underline">
            Încearcă din nou
          </button>
        </div>
      )}

      {/* Question or Feedback */}
      {phase === "answering" && currentQuestion && (
        <>
          {!coachmarkSeen && answeredCount === 0 && (
            <div className="mb-3 rounded-lg border border-blue-700/50 bg-blue-900/20 px-4 py-2 text-sm text-blue-200">
              👆 Atinge un răspuns ca să vezi pe loc dacă e corect.
            </div>
          )}
          <QuestionRenderer
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={submitting}
          />
        </>
      )}

      {phase === "feedback" && feedback && (
        <>
          <FeedbackDisplay
            isCorrect={feedback.isCorrect}
            correctAnswer={feedback.correctAnswer}
            explanation={feedback.explanation}
            source={feedback.source}
            sourceQuote={feedback.sourceQuote}
            streak={correctStreak}
            cameBackFromWrong={cameBack}
            remarkTone={remarkTone}
            dislikedRemarks={dislikedRemarks}
            remarkSeed={answeredCount}
            onRemarkVote={handleRemarkVote}
            onNext={handleNext}
          />
          {feedback.xpAwarded !== undefined && feedback.xpAwarded > 0 && (
            <div className="text-center text-sm text-purple-400">
              +{feedback.xpAwarded} XP
            </div>
          )}
          {currentQuestion && (
            <QuestionFeedback key={currentQuestion.id} questionId={currentQuestion.id} sessionId={sessionId} />
          )}
        </>
      )}
    </div>
  );
}
