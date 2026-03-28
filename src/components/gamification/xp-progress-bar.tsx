"use client";

interface XpProgressBarProps {
  xp: number;
  level: string;
  progressToNext: number;
  nextLevel: string | null;
  xpToNextLevel: number;
}

export function XpProgressBar({
  xp,
  level,
  progressToNext,
  nextLevel,
  xpToNextLevel,
}: XpProgressBarProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Current Level</p>
          <p className="text-xl font-bold text-yellow-400">{level}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-400">{xp.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total XP</p>
        </div>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-gray-700">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-700 ease-out"
          style={{ width: `${Math.min(progressToNext, 100)}%` }}
        />
      </div>

      {nextLevel && (
        <p className="mt-2 text-xs text-gray-500">
          {xpToNextLevel.toLocaleString()} XP to <span className="text-white">{nextLevel}</span>
        </p>
      )}
      {!nextLevel && (
        <p className="mt-2 text-xs text-yellow-400">Max level reached!</p>
      )}
    </div>
  );
}
