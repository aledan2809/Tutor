"use client";

import { useState } from "react";

interface DailyChallengeQuestion {
  id: string;
  content: string;
  type: string;
  options: string[] | null;
  difficulty: number;
  subject: string;
  topic: string;
}

interface DailyChallengeData {
  available: boolean;
  attempted?: boolean;
  doubleXp?: boolean;
  question?: DailyChallengeQuestion;
  result?: {
    isCorrect: boolean;
    xpAwarded: number;
    correctAnswer: string;
    explanation: string | null;
  };
}

export function DailyChallengeWidget({
  data,
  domainSlug,
  onComplete,
}: {
  data: DailyChallengeData;
  domainSlug: string;
  onComplete?: () => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    xpAwarded: number;
  } | null>(null);

  if (!data.available) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
        <p className="text-sm text-gray-500">No daily challenge available today.</p>
      </div>
    );
  }

  if (data.attempted || result) {
    const isCorrect = result ? result.correct : data.result?.isCorrect ?? false;
    const xpEarned = result ? result.xpAwarded : data.result?.xpAwarded ?? 0;

    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Daily Challenge</h3>
          <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
            Completed
          </span>
        </div>
        <div
          className={`rounded-lg p-4 ${
            isCorrect
              ? "border border-green-800/50 bg-green-900/10"
              : "border border-red-800/50 bg-red-900/10"
          }`}
        >
          <p className="text-sm font-medium text-white">
            {isCorrect ? "Correct!" : "Incorrect"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            XP earned: <span className="text-purple-400">+{xpEarned}</span>
          </p>
        </div>
      </div>
    );
  }

  const question = data.question!;
  const options = question.options as string[] | null;

  const handleSubmit = async () => {
    if (!selectedAnswer) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/${domainSlug}/daily-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: selectedAnswer }),
      });
      const json = await res.json();
      setResult({ correct: json.correct, xpAwarded: json.xpAwarded });
      onComplete?.();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-orange-600/30 bg-orange-900/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Daily Challenge</h3>
        <span className="rounded-full bg-orange-600/20 px-2 py-0.5 text-xs font-medium text-orange-400">
          2x XP
        </span>
      </div>

      <div className="mb-1 text-[10px] text-gray-500">
        {question.subject} &middot; {question.topic}
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
        onClick={handleSubmit}
        disabled={!selectedAnswer || submitting}
        className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Answer"}
      </button>
    </div>
  );
}
