"use client";

interface AchievementInfo {
  slug: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const BADGE_ICONS: Record<string, string> = {
  first_blood: "\u{1F3AF}",
  perfect_score: "\u{1F4AF}",
  marathon_7: "\u{1F525}",
  exam_ready: "\u{1F393}",
  speed_demon: "\u26A1",
  milestone_10: "\u{1F4D6}",
  milestone_50: "\u{1F4DA}",
  milestone_100: "\u{1F3C6}",
};

export function AchievementCard({ achievement }: { achievement: AchievementInfo }) {
  const icon = BADGE_ICONS[achievement.slug] || "\u{1F3C5}";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
        achievement.unlocked
          ? "border-yellow-600/50 bg-yellow-900/10"
          : "border-gray-800 bg-gray-900 opacity-50 grayscale"
      }`}
    >
      {achievement.unlocked && (
        <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-yellow-500/20 blur-lg" />
      )}
      <div className="mb-2 text-3xl">{icon}</div>
      <p className="text-sm font-semibold text-white">{achievement.name}</p>
      <p className="mt-1 text-xs text-gray-400">{achievement.description}</p>
      {achievement.unlocked && achievement.unlockedAt && (
        <p className="mt-2 text-[10px] text-yellow-500">
          {new Date(achievement.unlockedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export function AchievementGrid({ achievements }: { achievements: AchievementInfo[] }) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Achievements</h3>
        <span className="text-sm text-gray-500">
          {unlocked.length}/{achievements.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...unlocked, ...locked].map((a) => (
          <AchievementCard key={a.slug} achievement={a} />
        ))}
      </div>
    </div>
  );
}
