"use client";

import { useTranslations } from "next-intl";

interface FeedbackDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string | null;
  source?: string | null;
  sourceQuote?: string | null;
  /** Consecutive correct answers in this session — drives the momentum chip. */
  streak?: number;
  onNext: () => void;
}

export function FeedbackDisplay({
  isCorrect,
  correctAnswer,
  explanation,
  source,
  sourceQuote,
  streak = 0,
  onNext,
}: FeedbackDisplayProps) {
  const t = useTranslations("feedback");
  return (
    <div
      className={`rounded-xl border p-6 ${
        isCorrect
          ? "border-green-700 bg-green-900/20"
          : "border-red-700 bg-red-900/20"
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{isCorrect ? "✓" : "✗"}</span>
        <h3
          className={`text-lg font-semibold ${
            isCorrect ? "text-green-400" : "text-red-400"
          }`}
        >
          {isCorrect ? t("correct") : t("incorrect")}
        </h3>
        {isCorrect && streak >= 2 && (
          <span className="ml-auto rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-300">
            🔥 {streak} la rând
          </span>
        )}
      </div>

      {!isCorrect && (
        <div className="mb-4">
          <p className="text-sm text-gray-400">{t("correctAnswer")}</p>
          <p className="mt-1 text-sm font-medium text-white">
            {correctAnswer.replace(/^\s*[a-dA-D][).]\s+/, "")}
          </p>
        </div>
      )}

      {explanation && (
        <div className="mb-4 rounded-lg bg-gray-800/50 p-4">
          <p className="text-sm text-gray-400">{t("explanation")}</p>
          <p className="mt-1 text-sm text-gray-300">{explanation}</p>
        </div>
      )}

      {sourceQuote && (
        <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/40 p-4">
          <p className="text-sm text-gray-400">{t("sourceQuote")}</p>
          <p className="mt-1 border-l-2 border-gray-600 pl-3 text-sm italic text-gray-300">
            {`„${sourceQuote}”`}
          </p>
        </div>
      )}

      {source && (
        <p className="mb-4 text-xs text-gray-500">
          {t("source")} {source}
        </p>
      )}

      <button
        onClick={onNext}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        {t("next")}
      </button>
    </div>
  );
}
