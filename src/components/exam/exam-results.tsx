"use client";

import { Link } from "@/i18n/navigation";
import { useEffect } from "react";
import { showGamificationToast } from "@/components/gamification/gamification-toast";

interface TopicResult {
  correct: number;
  total: number;
}

interface GamificationData {
  xpAwarded: number;
  totalXp: number;
  level: string;
  levelUp: boolean;
  newAchievements: string[];
}

interface ExamResultsProps {
  score: number;
  passed: boolean;
  timedOut: boolean;
  passingScore: number;
  results: {
    correct: number;
    incorrect: number;
    unanswered: number;
    total: number;
    timeTaken: number;
    topics: Record<string, TopicResult>;
  };
  certificateUrl: string | null;
  domainSlug: string;
  mode: string;
  gamification?: GamificationData | null;
}

export function ExamResults({
  score,
  passed,
  timedOut,
  passingScore,
  results,
  certificateUrl,
  domainSlug,
  mode,
  gamification,
}: ExamResultsProps) {
  const scoreDiff = score - passingScore;
  const minutes = Math.floor(results.timeTaken);
  const seconds = Math.round((results.timeTaken - minutes) * 60);

  // Gamification toasts
  useEffect(() => {
    if (!gamification) return;
    if (gamification.levelUp) {
      showGamificationToast({
        type: "level_up",
        title: "Level Up!",
        description: `You reached ${gamification.level}`,
      });
    }
    for (const achievement of gamification.newAchievements) {
      showGamificationToast({
        type: "achievement",
        title: "Achievement Unlocked!",
        description: achievement.replace(/_/g, " "),
      });
    }
    if (gamification.xpAwarded > 0 && !gamification.levelUp) {
      showGamificationToast({
        type: "xp",
        title: `+${gamification.xpAwarded} XP`,
        description: `Total: ${gamification.totalXp.toLocaleString()} XP`,
      });
    }
  }, [gamification]);

  const getStatusMessage = () => {
    if (timedOut) return { text: "Time Expired", color: "text-orange-400", bg: "border-orange-700 bg-orange-900/20" };
    if (passed) {
      if (scoreDiff >= 20) return { text: "Excellent!", color: "text-green-400", bg: "border-green-700 bg-green-900/20" };
      if (scoreDiff >= 10) return { text: "Well Done!", color: "text-green-400", bg: "border-green-700 bg-green-900/20" };
      return { text: "You Passed!", color: "text-green-400", bg: "border-green-700 bg-green-900/20" };
    }
    if (scoreDiff >= -5) return { text: "Almost There!", color: "text-yellow-400", bg: "border-yellow-700 bg-yellow-900/20" };
    return { text: "Keep Practicing", color: "text-red-400", bg: "border-red-700 bg-red-900/20" };
  };

  const status = getStatusMessage();

  // Sort topics by accuracy ascending (weakest first)
  const topicEntries = Object.entries(results.topics).sort(
    (a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total)
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Status Banner */}
      <div className={`rounded-xl border p-6 text-center ${status.bg}`}>
        <h2 className={`mb-2 text-2xl font-bold ${status.color}`}>{status.text}</h2>
        <p className="text-5xl font-bold text-white">{Math.round(score * 10) / 10}%</p>
        <p className="mt-2 text-sm text-gray-400">
          Passing threshold: {passingScore}%
          {!timedOut && (
            <span className={scoreDiff >= 0 ? "text-green-400" : "text-red-400"}>
              {" "}({scoreDiff >= 0 ? "+" : ""}{Math.round(scoreDiff * 10) / 10}%)
            </span>
          )}
        </p>
        {mode === "PRACTICE" && (
          <span className="mt-2 inline-block rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
            Practice Mode
          </span>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-xl font-bold text-green-400">{results.correct}</p>
          <p className="text-xs text-gray-500">Correct</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-xl font-bold text-red-400">{results.incorrect}</p>
          <p className="text-xs text-gray-500">Incorrect</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-xl font-bold text-gray-400">{results.unanswered}</p>
          <p className="text-xs text-gray-500">Unanswered</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-xl font-bold text-white">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
          <p className="text-xs text-gray-500">Time</p>
        </div>
      </div>

      {/* Passing Threshold Bar */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-400">Score vs Threshold</span>
          <span className={passed ? "text-green-400" : "text-red-400"}>
            {Math.round(score)}% / {passingScore}%
          </span>
        </div>
        <div className="relative h-4 overflow-hidden rounded-full bg-gray-700">
          <div
            className={`h-full rounded-full transition-all ${passed ? "bg-green-500" : "bg-red-500"}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
          {/* Threshold marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-yellow-400"
            style={{ left: `${passingScore}%` }}
          />
        </div>
        <div className="mt-1 text-right" style={{ marginRight: `${100 - passingScore}%` }}>
          <span className="text-xs text-yellow-400">{passingScore}%</span>
        </div>
      </div>

      {/* Topic Breakdown */}
      {topicEntries.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-400">Topic Breakdown</h3>
          <div className="space-y-3">
            {topicEntries.map(([topic, data]) => {
              const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              const barColor = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";
              return (
                <div key={topic}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-300">{topic}</span>
                    <span className="text-gray-500">
                      {data.correct}/{data.total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* XP & Gamification */}
      {gamification && gamification.xpAwarded > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-purple-800/50 bg-purple-900/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">+{gamification.xpAwarded}</span>
            <span className="text-sm text-purple-400">XP earned</span>
          </div>
          <span className="text-sm text-gray-400">
            Total: {gamification.totalXp.toLocaleString()} XP
          </span>
        </div>
      )}

      {/* Certificate */}
      {certificateUrl && (
        <div className="rounded-xl border border-green-800 bg-green-900/10 p-4 text-center">
          <p className="mb-2 text-sm font-semibold text-green-400">Certificate Earned!</p>
          <a
            href={certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            View Certificate
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/dashboard/exams"
          className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-center text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
        >
          Back to Exams
        </Link>
        <Link
          href={`/dashboard/progress?domain=${domainSlug}`}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          View Progress
        </Link>
      </div>
    </div>
  );
}
