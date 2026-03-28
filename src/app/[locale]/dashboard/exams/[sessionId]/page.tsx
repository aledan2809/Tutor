"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { SessionTimer } from "@/components/session/session-timer";
import { QuestionRenderer } from "@/components/session/question-renderer";
import { FeedbackDisplay } from "@/components/session/feedback-display";
import { ExamResults } from "@/components/exam/exam-results";
import { ExamQuestionNav } from "@/components/exam/exam-question-nav";
import { Link } from "@/i18n/navigation";

interface QuestionData {
  id: string;
  content: string;
  type: "MULTIPLE_CHOICE" | "OPEN";
  options?: { label: string; value: string }[] | null;
  subject: string;
  topic: string;
  difficulty: number;
  explanation?: string | null;
}

interface ExamSessionData {
  sessionId: string;
  mode: "PRACTICE" | "REAL";
  questions: QuestionData[];
  timeLimit: number | null;
  startedAt: string;
  totalQuestions: number;
  formatName: string;
  passingScore: number;
  domainSlug: string;
}

interface ExamSubmitResult {
  score: number;
  passed: boolean;
  timedOut: boolean;
  results: {
    correct: number;
    incorrect: number;
    unanswered: number;
    total: number;
    timeTaken: number;
    topics: Record<string, { correct: number; total: number }>;
  };
  passingScore: number;
  certificateUrl: string | null;
  gamification?: {
    xpAwarded: number;
    totalXp: number;
    level: string;
    levelUp: boolean;
    newAchievements: string[];
  } | null;
}

type Phase = "loading" | "exam" | "confirm_submit" | "submitting" | "results" | "not_found";

export default function ExamSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "";

  const [examData, setExamData] = useState<ExamSessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [answeredIndices, setAnsweredIndices] = useState<Set<number>>(new Set());
  const [flaggedIndices, setFlaggedIndices] = useState<Set<number>>(new Set());
  const [submitResult, setSubmitResult] = useState<ExamSubmitResult | null>(null);
  const [practiceFeedback, setPracticeFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string | null;
  } | null>(null);
  const [showPracticeFeedback, setShowPracticeFeedback] = useState(false);
  const answersRef = useRef(answers);

  // Keep ref in sync
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Load exam from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`exam_${sessionId}`);
    if (stored) {
      const data = JSON.parse(stored) as ExamSessionData;
      setExamData(data);
      setPhase("exam");
    } else {
      setPhase("not_found");
    }
  }, [sessionId]);

  const submitExam = useCallback(
    async (isTimeout = false) => {
      if (!examData) return;
      setPhase("submitting");

      const currentAnswers = answersRef.current;
      const answerArray = Array.from(currentAnswers.entries()).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      try {
        const res = await fetch(`/api/${examData.domainSlug}/exam/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, answers: answerArray }),
        });
        const result = await res.json();
        setSubmitResult(result);
        setPhase("results");
        localStorage.removeItem(`exam_${sessionId}`);
      } catch {
        // If submit fails, go back to exam to let user retry
        if (!isTimeout) setPhase("exam");
      }
    },
    [examData, sessionId]
  );

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!examData) return;
      const question = examData.questions[currentIndex];

      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(question.id, answer);
        return next;
      });
      setAnsweredIndices((prev) => {
        const next = new Set(prev);
        next.add(currentIndex);
        return next;
      });

      // In PRACTICE mode, show feedback
      if (examData.mode === "PRACTICE" && question.explanation) {
        // We don't have the correct answer on the client for security,
        // but in practice mode we show the explanation as a hint
        setPracticeFeedback({
          isCorrect: true, // We don't know, just show explanation
          correctAnswer: "",
          explanation: question.explanation,
        });
        setShowPracticeFeedback(true);
      } else {
        // Auto-advance to next question in REAL mode
        if (currentIndex < examData.questions.length - 1) {
          setCurrentIndex((i) => i + 1);
        }
      }
    },
    [examData, currentIndex]
  );

  const handleNext = useCallback(() => {
    if (!examData) return;
    setShowPracticeFeedback(false);
    setPracticeFeedback(null);
    if (currentIndex < examData.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [examData, currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setShowPracticeFeedback(false);
      setPracticeFeedback(null);
    }
  }, [currentIndex]);

  const toggleFlag = useCallback(() => {
    setFlaggedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  }, [currentIndex]);

  const handleTimeUp = useCallback(() => {
    submitExam(true);
  }, [submitExam]);

  const handleConfirmSubmit = () => {
    setPhase("confirm_submit");
  };

  const handleCancelSubmit = () => {
    setPhase("exam");
  };

  // ─── Render states ───

  if (phase === "loading") {
    return <div className="py-12 text-center text-gray-500">Loading exam...</div>;
  }

  if (phase === "not_found") {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="mb-4 text-gray-400">Exam session not found or expired.</p>
        <Link
          href="/dashboard/exams"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Exams
        </Link>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-gray-400">Submitting your exam...</p>
      </div>
    );
  }

  if (phase === "results" && submitResult && examData) {
    return (
      <ExamResults
        score={submitResult.score}
        passed={submitResult.passed}
        timedOut={submitResult.timedOut}
        passingScore={submitResult.passingScore}
        results={submitResult.results}
        certificateUrl={submitResult.certificateUrl}
        domainSlug={examData.domainSlug}
        mode={examData.mode}
        gamification={submitResult.gamification}
      />
    );
  }

  if (!examData) return null;

  const currentQuestion = examData.questions[currentIndex];
  const unansweredCount = examData.questions.length - answeredIndices.size;
  const timeLimitSeconds = examData.timeLimit ? examData.timeLimit * 60 : null;

  // Calculate elapsed time for resume scenarios
  const elapsedSeconds = Math.floor(
    (Date.now() - new Date(examData.startedAt).getTime()) / 1000
  );
  const remainingSeconds = timeLimitSeconds
    ? Math.max(0, timeLimitSeconds - elapsedSeconds)
    : null;

  // Confirm submit dialog
  if (phase === "confirm_submit") {
    return (
      <div className="mx-auto max-w-md py-12">
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-6 text-center">
          <h2 className="mb-4 text-xl font-bold text-white">Submit Exam?</h2>
          {unansweredCount > 0 && (
            <p className="mb-4 text-sm text-yellow-400">
              You have {unansweredCount} unanswered question{unansweredCount > 1 ? "s" : ""}.
            </p>
          )}
          {flaggedIndices.size > 0 && (
            <p className="mb-4 text-sm text-yellow-400">
              You have {flaggedIndices.size} flagged question{flaggedIndices.size > 1 ? "s" : ""} to review.
            </p>
          )}
          <p className="mb-6 text-sm text-gray-400">
            Once submitted, you cannot change your answers.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancelSubmit}
              className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800"
            >
              Go Back
            </button>
            <button
              onClick={() => submitExam()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">{examData.formatName}</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`rounded px-2 py-0.5 ${
              examData.mode === "REAL"
                ? "bg-red-900/30 text-red-400"
                : "bg-blue-900/30 text-blue-400"
            }`}>
              {examData.mode === "REAL" ? "Real Exam" : "Practice"}
            </span>
            <span>Pass: {examData.passingScore}%</span>
          </div>
        </div>
        <button
          onClick={handleConfirmSubmit}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Submit Exam ({answeredIndices.size}/{examData.questions.length})
        </button>
      </div>

      {/* Timer */}
      {remainingSeconds !== null && remainingSeconds > 0 && (
        <SessionTimer
          durationSeconds={remainingSeconds}
          onTimeUp={handleTimeUp}
        />
      )}

      {/* Question Navigator */}
      <ExamQuestionNav
        total={examData.questions.length}
        current={currentIndex}
        answered={answeredIndices}
        flagged={flaggedIndices}
        onSelect={(i) => {
          setCurrentIndex(i);
          setShowPracticeFeedback(false);
          setPracticeFeedback(null);
        }}
      />

      {/* Question Area */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400">
            Question {currentIndex + 1} of {examData.questions.length}
          </h2>
          <button
            onClick={toggleFlag}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              flaggedIndices.has(currentIndex)
                ? "bg-yellow-600 text-yellow-100"
                : "bg-gray-800 text-gray-500 hover:bg-gray-700"
            }`}
          >
            {flaggedIndices.has(currentIndex) ? "Flagged" : "Flag for Review"}
          </button>
        </div>

        {/* Show existing answer indicator */}
        {answers.has(currentQuestion.id) && !showPracticeFeedback && (
          <div className="mb-4 rounded-lg border border-green-800 bg-green-900/10 px-3 py-2 text-sm text-green-400">
            Answered: {answers.get(currentQuestion.id)}
          </div>
        )}

        {showPracticeFeedback && practiceFeedback ? (
          <FeedbackDisplay
            isCorrect={practiceFeedback.isCorrect}
            correctAnswer={practiceFeedback.correctAnswer}
            explanation={practiceFeedback.explanation}
            onNext={handleNext}
          />
        ) : (
          <QuestionRenderer
            key={`${currentQuestion.id}-${currentIndex}`}
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={false}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex >= examData.questions.length - 1}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
