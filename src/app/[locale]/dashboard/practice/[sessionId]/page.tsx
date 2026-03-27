"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { SessionTimer } from "@/components/session/session-timer";
import { QuestionRenderer } from "@/components/session/question-renderer";
import { FeedbackDisplay } from "@/components/session/feedback-display";
import { SessionResults } from "@/components/session/session-results";

interface QuestionData {
  id: string;
  content: string;
  type: "MULTIPLE_CHOICE" | "OPEN";
  options?: { label: string; value: string }[] | null;
  subject: string;
  topic: string;
  difficulty: number;
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

type Phase = "loading" | "answering" | "feedback" | "completed";

export default function ActiveSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "";
  const [domainSlug, setDomainSlug] = useState("aviation");

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [results, setResults] = useState<CompletionResult | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const questionStartTime = useRef<number>(Date.now());

  // Load session from localStorage (saved during start)
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
    }
  }, [sessionId]);

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (!sessionData) return;
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
        const result = await res.json();
        setFeedback(result);
        setPhase("feedback");
        setAnsweredCount((c) => c + 1);
      } catch {
        // Allow retry on error
      }
    },
    [sessionData, currentIndex, sessionId, domainSlug]
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
      <div className="py-12 text-center text-gray-500">Loading session...</div>
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
          Question {currentIndex + 1} of {sessionData.totalQuestions}
        </h1>
        <span className="text-sm text-gray-500">
          {answeredCount} answered
        </span>
      </div>

      {/* Timer */}
      <SessionTimer
        durationSeconds={sessionData.duration}
        onTimeUp={handleTimeUp}
        isPaused={phase === "feedback"}
      />

      {/* Question or Feedback */}
      {phase === "answering" && currentQuestion && (
        <QuestionRenderer question={currentQuestion} onAnswer={handleAnswer} />
      )}

      {phase === "feedback" && feedback && (
        <>
          <FeedbackDisplay
            isCorrect={feedback.isCorrect}
            correctAnswer={feedback.correctAnswer}
            explanation={feedback.explanation}
            onNext={handleNext}
          />
          {feedback.xpAwarded !== undefined && feedback.xpAwarded > 0 && (
            <div className="text-center text-sm text-purple-400">
              +{feedback.xpAwarded} XP
            </div>
          )}
        </>
      )}
    </div>
  );
}
