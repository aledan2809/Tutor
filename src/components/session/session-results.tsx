"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { showGamificationToast } from "@/components/gamification/gamification-toast";

interface GamificationData {
  xpAwarded: number;
  totalXp: number;
  level: string;
  levelUp: boolean;
  newAchievements: string[];
}

interface SessionResultsProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  duration: number;
  domainSlug: string;
  gamification?: GamificationData | null;
}

export function SessionResults({
  score,
  totalQuestions,
  correctAnswers,
  duration,
  domainSlug,
  gamification,
}: SessionResultsProps) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  // Show visual reward toasts
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

  const getScoreColor = () => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Session Complete</h2>
        <p className={`text-5xl font-bold ${getScoreColor()}`}>
          {Math.round(score)}%
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-xl font-bold text-white">{correctAnswers}</p>
          <p className="text-xs text-gray-500">Correct</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-xl font-bold text-white">
            {totalQuestions - correctAnswers}
          </p>
          <p className="text-xs text-gray-500">Incorrect</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-xl font-bold text-white">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
          <p className="text-xs text-gray-500">Duration</p>
        </div>
      </div>

      {/* Gamification Results */}
      {gamification && (
        <div className="space-y-3">
          {/* XP Awarded */}
          <div className="flex items-center justify-between rounded-xl border border-purple-800/50 bg-purple-900/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">+{gamification.xpAwarded}</span>
              <span className="text-sm text-purple-400">XP earned</span>
            </div>
            <span className="text-sm text-gray-400">
              Total: {gamification.totalXp.toLocaleString()} XP
            </span>
          </div>

          {/* Level Up */}
          {gamification.levelUp && (
            <div className="rounded-xl border border-yellow-600/50 bg-yellow-900/10 p-4 text-center">
              <p className="text-lg font-bold text-yellow-400">Level Up!</p>
              <p className="text-sm text-gray-300">
                You reached <span className="font-semibold text-white">{gamification.level}</span>
              </p>
            </div>
          )}

          {/* New Achievements */}
          {gamification.newAchievements.length > 0 && (
            <div className="rounded-xl border border-green-800/50 bg-green-900/10 p-4">
              <p className="mb-2 text-sm font-semibold text-green-400">
                New Achievement{gamification.newAchievements.length > 1 ? "s" : ""}!
              </p>
              <div className="space-y-1">
                {gamification.newAchievements.map((a) => (
                  <p key={a} className="text-sm capitalize text-white">
                    {a.replace(/_/g, " ")}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/dashboard/practice"
          className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-center text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
        >
          Back to Practice
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
