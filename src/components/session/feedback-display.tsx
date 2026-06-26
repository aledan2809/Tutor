"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { StreakFlame } from "@/components/gamification/streak-flame";
import {
  DEFAULT_TONE,
  pickRemarkKey,
  pickTrigger,
  type RemarkTone,
} from "@/lib/remarks";

interface FeedbackDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string | null;
  source?: string | null;
  sourceQuote?: string | null;
  /** Consecutive correct answers in this session — drives the momentum chip. */
  streak?: number;
  /** True when this correct answer follows a wrong one (drives the "comeback" remark). */
  cameBackFromWrong?: boolean;
  /** Resolved encouragement tone (student pref clamped by parent restriction). */
  remarkTone?: RemarkTone;
  /** Remark keys the student disliked — excluded from selection. */
  dislikedRemarks?: string[];
  /** Stable per-question seed so the remark doesn't reshuffle on re-render. */
  remarkSeed?: number;
  /** Persist a like/dislike on the shown remark. */
  onRemarkVote?: (key: string, signal: "like" | "dislike") => void;
  onNext: () => void;
}

export function FeedbackDisplay({
  isCorrect,
  correctAnswer,
  explanation,
  source,
  sourceQuote,
  streak = 0,
  cameBackFromWrong = false,
  remarkTone,
  dislikedRemarks,
  remarkSeed,
  onRemarkVote,
  onNext,
}: FeedbackDisplayProps) {
  const t = useTranslations("feedback");
  const tr = useTranslations("remarks");
  const [votedKey, setVotedKey] = useState<string | null>(null);

  const remarkKey = useMemo(() => {
    if (!isCorrect) return null;
    return pickRemarkKey({
      tone: remarkTone ?? DEFAULT_TONE,
      trigger: pickTrigger({ streak, cameBackFromWrong }),
      disliked: dislikedRemarks,
      seed: remarkSeed ?? streak,
    });
  }, [isCorrect, remarkTone, streak, cameBackFromWrong, dislikedRemarks, remarkSeed]);

  const vote = (signal: "like" | "dislike") => {
    if (!remarkKey) return;
    setVotedKey(remarkKey);
    onRemarkVote?.(remarkKey, signal);
  };
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
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-300">
            <StreakFlame streak={streak} />
            {streak} la rând
          </span>
        )}
      </div>

      {isCorrect && remarkKey && (
        <div className="mb-4 flex items-center gap-2">
          <p className="text-sm font-medium text-orange-200">{tr(`lines.${remarkKey}`)}</p>
          {onRemarkVote && (
            votedKey === remarkKey ? (
              <span className="ml-auto text-xs text-gray-500">{tr("saved")}</span>
            ) : (
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => vote("like")}
                  className="flex h-9 min-w-9 items-center justify-center rounded text-sm opacity-60 transition-opacity hover:opacity-100"
                  aria-label="👍"
                >
                  👍
                </button>
                <button
                  type="button"
                  onClick={() => vote("dislike")}
                  className="flex h-9 min-w-9 items-center justify-center rounded text-sm opacity-60 transition-opacity hover:opacity-100"
                  title={tr("dislike")}
                  aria-label={tr("dislike")}
                >
                  👎
                </button>
              </span>
            )
          )}
        </div>
      )}

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
