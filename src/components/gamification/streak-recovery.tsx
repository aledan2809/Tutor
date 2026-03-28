"use client";

import { useState, useEffect, useCallback } from "react";

interface RecoveryQuestion {
  id: string;
  content: string;
  type: string;
  options: string[] | null;
  difficulty: number;
}

export function StreakRecovery({
  domainSlug,
  onComplete,
}: {
  domainSlug: string;
  onComplete?: (success: boolean) => void;
}) {
  const [stage, setStage] = useState<"idle" | "loading" | "quiz" | "result">("idle");
  const [questions, setQuestions] = useState<RecoveryQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; answer: string }[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [startedAtMs, setStartedAtMs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [result, setResult] = useState<{
    success: boolean;
    streak: number;
    correctCount: number;
    totalCount: number;
  } | null>(null);

  // Timer
  useEffect(() => {
    if (stage !== "quiz") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAll();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const startRecovery = async () => {
    setStage("loading");
    try {
      const res = await fetch(`/api/${domainSlug}/streak/recover`);
      const data = await res.json();
      if (!data.canRecover) {
        setResult({ success: false, streak: 0, correctCount: 0, totalCount: 0 });
        setStage("result");
        return;
      }
      setQuestions(data.questions);
      setStartedAtMs(Date.now());
      setTimeLeft(120);
      setCurrentIdx(0);
      setAnswers([]);
      setStage("quiz");
    } catch {
      setStage("idle");
    }
  };

  const handleNext = () => {
    if (!selectedAnswer) return;
    const newAnswers = [...answers, { questionId: questions[currentIdx].id, answer: selectedAnswer }];
    setAnswers(newAnswers);
    setSelectedAnswer("");

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitAnswers(newAnswers);
    }
  };

  const handleSubmitAll = useCallback(() => {
    const finalAnswers = [...answers];
    if (selectedAnswer && currentIdx < questions.length) {
      finalAnswers.push({ questionId: questions[currentIdx].id, answer: selectedAnswer });
    }
    submitAnswers(finalAnswers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, selectedAnswer, currentIdx, questions]);

  const submitAnswers = async (finalAnswers: { questionId: string; answer: string }[]) => {
    setStage("loading");
    try {
      const res = await fetch(`/api/${domainSlug}/streak/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, startedAtMs }),
      });
      const data = await res.json();
      setResult(data);
      setStage("result");
      onComplete?.(data.success);
    } catch {
      setStage("idle");
    }
  };

  if (stage === "idle") {
    return (
      <button
        onClick={startRecovery}
        className="w-full rounded-lg border border-orange-600/50 bg-orange-600/10 px-4 py-3 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-600/20"
      >
        Start Recovery Session (2 min, 5 questions)
      </button>
    );
  }

  if (stage === "loading") {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (stage === "result" && result) {
    return (
      <div
        className={`rounded-xl border p-5 ${
          result.success
            ? "border-green-600/50 bg-green-900/10"
            : "border-red-600/50 bg-red-900/10"
        }`}
      >
        <p className="text-lg font-bold text-white">
          {result.success ? "Streak Recovered!" : "Recovery Failed"}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {result.correctCount}/{result.totalCount} correct
        </p>
        {result.success && (
          <p className="mt-2 text-sm text-green-400">
            Your streak is now {result.streak} days
          </p>
        )}
        {!result.success && (
          <p className="mt-2 text-sm text-red-400">
            You need at least 3 correct answers. Try again tomorrow.
          </p>
        )}
      </div>
    );
  }

  // Quiz stage
  const question = questions[currentIdx];
  const options = question?.options as string[] | null;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="rounded-xl border border-orange-600/30 bg-gray-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Recovery: {currentIdx + 1}/{questions.length}
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-mono ${
            timeLeft <= 30
              ? "bg-red-600/20 text-red-400"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>

      <p className="mb-4 text-sm text-gray-200">{question.content}</p>

      {question.type === "MULTIPLE_CHOICE" && options ? (
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedAnswer(opt)}
              className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                selectedAnswer === opt
                  ? "border-blue-500 bg-blue-600/10 text-white"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={selectedAnswer}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      )}

      <button
        onClick={handleNext}
        disabled={!selectedAnswer}
        className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {currentIdx < questions.length - 1 ? "Next" : "Submit"}
      </button>
    </div>
  );
}
