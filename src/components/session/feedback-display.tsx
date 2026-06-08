"use client";

import { useTranslations } from "next-intl";

interface FeedbackDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string | null;
  source?: string | null;
  onNext: () => void;
}

export function FeedbackDisplay({
  isCorrect,
  correctAnswer,
  explanation,
  source,
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
      </div>

      {!isCorrect && (
        <div className="mb-4">
          <p className="text-sm text-gray-400">{t("correctAnswer")}</p>
          <p className="mt-1 text-sm font-medium text-white">{correctAnswer}</p>
        </div>
      )}

      {explanation && (
        <div className="mb-4 rounded-lg bg-gray-800/50 p-4">
          <p className="text-sm text-gray-400">{t("explanation")}</p>
          <p className="mt-1 text-sm text-gray-300">{explanation}</p>
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
