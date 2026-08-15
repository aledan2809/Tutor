"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { SessionTimer } from "@/components/session/session-timer";
import { QuestionTimer } from "@/components/session/question-timer";
import { SprintFeedbackForm } from "@/components/session/sprint-feedback-form";
import { SPRINT_DOMAIN_SLUG, SPRINT_TIMEOUT_ANSWER } from "@/lib/mental-chain";
import { QuestionRenderer } from "@/components/session/question-renderer";
import { FeedbackDisplay } from "@/components/session/feedback-display";
import { bumpAnswered } from "@/lib/engagement";
import { QuestionFeedback } from "@/components/session/question-feedback";
import { SessionResults } from "@/components/session/session-results";
import { TtsCalibration } from "@/components/session/tts-calibration";
import { countAudioQuestions } from "@/components/session/tts";
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
  /** Sprint only: per-question budget, index-aligned with `questions`. */
  questionSeconds?: number[];
  /**
   * Sprint only: questions arrive one at a time, because each one's difficulty
   * and clock depend on how the previous answers went.
   */
  adaptive?: boolean;
}

interface SprintNextPayload {
  done: boolean;
  answered?: number;
  total?: number;
  index?: number;
  seconds?: number;
  signal?: string | null;
  question?: QuestionData;
}

interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string | null;
  source?: string | null;
  sourceQuote?: string | null;
  xpAwarded?: number;
  /** Sprint only: the next question, delivered with this answer's result. */
  sprintNext?: SprintNextPayload;
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
  /** Sprint only: results are withheld until the two-question debrief is in. */
  sprintFeedbackRequired?: boolean;
  timedOut?: number;
}

type Phase =
  | "loading"
  | "calibrate"
  | "answering"
  | "feedback"
  | "sprint_feedback"
  | "completed"
  | "not_found";

export default function ActiveSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params?.sessionId ?? "";
  // Deep link from the sprint card: the student owes a debrief on THIS session.
  const feedbackOnly = searchParams?.get("feedback") === "1";
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
  // Sprint: adaptation notes returned by the debrief, shown above the score.
  const [sprintNotes, setSprintNotes] = useState<string[]>([]);
  // Sprint: one-line nudge when the live adaptation just changed gear.
  const [liveSignal, setLiveSignal] = useState<string | null>(null);
  const [fetchingNext, setFetchingNext] = useState(false);
  // The answer response usually carries the next question already — using it
  // avoids a visible stall when he taps "next" straight after the tick.
  const prefetchedNext = useRef<SprintNextPayload | null>(null);
  // Guards a timeout auto-submit from racing a manual answer on the same question.
  const answeredKey = useRef<string | null>(null);

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
    // Arriving straight at the debrief (the sprint card's "answer 2 questions"):
    // the session is already finished, so there is nothing to load or resume.
    if (feedbackOnly) {
      // This view returns early, before any of the paths that resolve the slug
      // from the session payload — so set it explicitly. The debrief only ever
      // belongs to a sprint, and sprints only exist in this one domain; leaving
      // the default here made every submit POST to the wrong domain and 400.
      setDomainSlug(SPRINT_DOMAIN_SLUG);
      setPhase("sprint_feedback");
      return;
    }
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
      // If this session has read-aloud (TTS) questions, gate on a calibration
      // screen BEFORE the timer — unless already calibrated for this session.
      const audioN = countAudioQuestions(data.questions);
      let calibrated = false;
      try {
        calibrated = localStorage.getItem(`calibrated_${sessionId}`) === "1";
      } catch {}
      setPhase(audioN > 0 && !calibrated ? "calibrate" : "answering");
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
            // Present only for sprints — keeps the per-question clock on resume.
            questionSeconds: Array.isArray(d.questionSeconds) ? d.questionSeconds : undefined,
            adaptive: d.type === "sprint",
          });
          if (d.domainSlug) setDomainSlug(d.domainSlug);
          setAnsweredBase(d.answeredQuestions ?? 0);
          setPhase("answering");
        } else {
          setPhase("not_found");
        }
      })
      .catch(() => setPhase("not_found"));
  }, [sessionId, feedbackOnly]);

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (!sessionData || submitting) return;
      const question = sessionData.questions[currentIndex];
      // One submission per question: a manual tap and an expiring clock can
      // otherwise both fire and record two attempts for the same item.
      if (!question || answeredKey.current === question.id) return;
      answeredKey.current = question.id;
      setSubmitting(true);
      const responseTime = Date.now() - questionStartTime.current;

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
          answeredKey.current = null;
          setAnswerError("Nu am putut trimite răspunsul. Încearcă din nou.");
          return;
        }
        const result = await res.json();
        setAnswerError(null);
        prefetchedNext.current = result.sprintNext ?? null;
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
        answeredKey.current = null;
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
      setPhase(result.sprintFeedbackRequired ? "sprint_feedback" : "completed");
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
        body: JSON.stringify({ type: sessionData?.type === "sprint" ? "sprint" : "quick" }),
      });
      const s = await res.json();
      if (res.status === 409 && s.pendingFeedbackSessionId) {
        router.push(`/dashboard/practice/${s.pendingFeedbackSessionId}?feedback=1`);
        return;
      }
      if (s.sessionId) {
        localStorage.setItem(`session_${s.sessionId}`, JSON.stringify({ ...s, domainSlug }));
        router.push(`/dashboard/practice/${s.sessionId}`);
      } else {
        setContinuing(false);
      }
    } catch {
      setContinuing(false);
    }
  }, [domainSlug, router, continuing, sessionData?.type]);

  const handleNext = useCallback(async () => {
    if (!sessionData) return;

    const advanceTo = (index: number) => {
      setCurrentIndex(index);
      setFeedback(null);
      setPhase("answering");
      answeredKey.current = null;
      questionStartTime.current = Date.now();
    };

    // Adaptive sprint: the next question does not exist yet — the server builds
    // it from how this session has gone so far. Asking for it here (while the
    // student is reading the explanation) keeps the wait invisible.
    if (sessionData.adaptive) {
      if (fetchingNext) return;

      const applyNext = (data: SprintNextPayload) => {
        setLiveSignal(typeof data.signal === "string" ? data.signal : null);
        setSessionData((prev) =>
          prev && data.question
            ? {
                ...prev,
                questions: [...prev.questions, data.question],
                questionSeconds: [...(prev.questionSeconds ?? []), data.seconds as number],
              }
            : prev
        );
        setAnswerError(null);
        advanceTo(currentIndex + 1);
      };

      // Already in hand from the answer response — no round trip, no stall.
      // Consumed under the same guard as the fetch path so a double invocation
      // can't take the prefetch AND fire the fallback, appending twice.
      setFetchingNext(true);
      const ready = prefetchedNext.current;
      prefetchedNext.current = null;
      if (ready) {
        setFetchingNext(false);
        if (ready.done) {
          await completeSession();
        } else if (ready.question && ready.seconds !== undefined) {
          applyNext(ready);
        }
        return;
      }

      try {
        const res = await fetch(`/api/${domainSlug}/session/sprint-next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAnswerError("Nu am putut încărca exercițiul următor. Încearcă din nou.");
          return;
        }
        if (data.done) {
          await completeSession();
          return;
        }
        applyNext(data);
      } catch {
        setAnswerError("Conexiune întreruptă. Încearcă din nou.");
      } finally {
        setFetchingNext(false);
      }
      return;
    }

    if (currentIndex + 1 >= sessionData.questions.length) {
      await completeSession();
    } else {
      advanceTo(currentIndex + 1);
    }
  }, [sessionData, currentIndex, completeSession, domainSlug, sessionId, fetchingNext]);

  const handleTimeUp = useCallback(() => {
    completeSession();
  }, [completeSession]);

  // Per-question clock ran out → submit the timeout sentinel. The server grades
  // it wrong and returns the correct answer, so the student still sees it before
  // moving on (the behaviour chosen for this drill).
  const handleQuestionTimeout = useCallback(() => {
    handleAnswer(SPRINT_TIMEOUT_ANSWER);
  }, [handleAnswer]);

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

  if (phase === "calibrate" && sessionData) {
    return (
      <TtsCalibration
        audioQuestionCount={countAudioQuestions(sessionData.questions)}
        onStart={() => {
          try {
            localStorage.setItem(`calibrated_${sessionId}`, "1");
          } catch {}
          setPhase("answering");
        }}
      />
    );
  }

  if (phase === "sprint_feedback") {
    return (
      <SprintFeedbackForm
        sessionId={sessionId}
        domainSlug={domainSlug}
        onDone={(notes) => {
          setSprintNotes(notes);
          // A feedback-only visit has no score to show — send them back to pick
          // a session, now unblocked.
          if (!results) {
            router.push("/dashboard/practice");
            return;
          }
          setPhase("completed");
        }}
      />
    );
  }

  if (phase === "completed" && results) {
    return (
      <>
        {sprintNotes.length > 0 && (
          <div className="mx-auto mb-4 max-w-md rounded-lg border border-emerald-700/60 bg-emerald-900/20 p-4">
            <p className="mb-1 text-sm font-medium text-emerald-200">Pentru data viitoare</p>
            <ul className="space-y-1 text-sm text-emerald-100/90">
              {sprintNotes.map((n, i) => (
                <li key={i}>• {n}</li>
              ))}
            </ul>
          </div>
        )}
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
      </>
    );
  }

  if (!sessionData) return null;

  const currentQuestion = sessionData.questions[currentIndex];
  const isSprint =
    sessionData.adaptive === true ||
    (Array.isArray(sessionData.questionSeconds) && sessionData.questionSeconds.length > 0);
  // Fall back to the last known budget if the array is ever shorter than the
  // question list — better a tight clock than a crash or an infinite one.
  const currentSeconds =
    sessionData.questionSeconds?.[currentIndex] ??
    sessionData.questionSeconds?.[sessionData.questionSeconds.length - 1] ??
    30;

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

      {/* Timer — sprints are clocked per question, everything else per session. */}
      {isSprint && currentQuestion ? (
        <QuestionTimer
          // Remount per question: fresh state, no value can survive the advance.
          key={currentQuestion.id}
          seconds={currentSeconds}
          questionKey={currentQuestion.id}
          active={phase === "answering" && !submitting}
          onExpire={handleQuestionTimeout}
        />
      ) : (
        <SessionTimer
          durationSeconds={sessionData.duration}
          onTimeUp={handleTimeUp}
          isPaused={phase === "feedback"}
        />
      )}

      {/* Inline retry — keeps the same question + session (no restart).
          Also shown during "feedback": failing to load the NEXT question leaves
          the student on the feedback screen, and gating this on "answering"
          made that failure completely invisible — a dead button, no message. */}
      {answerError && (phase === "answering" || phase === "feedback") && (
        <div className="rounded-lg border border-red-700 bg-red-900/20 p-3 text-sm text-red-300">
          {answerError}{" "}
          <button
            onClick={() => {
              setAnswerError(null);
              // On the feedback screen the only thing that can have failed is
              // loading the next question — so retry that, don't just dismiss.
              if (phase === "feedback") void handleNext();
            }}
            className="ml-1 underline hover:no-underline"
          >
            Încearcă din nou
          </button>
        </div>
      )}

      {/* Question or Feedback */}
      {/* Live adaptation told us the session just changed gear. */}
      {liveSignal && phase === "answering" && (
        <div className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 px-4 py-2 text-sm text-emerald-200">
          ⚡ {liveSignal}
        </div>
      )}

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
            // Speed drill: one tap answers, so the second tap doesn't eat a
            // meaningful slice of a 12-second budget.
            instantAnswer={isSprint}
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
