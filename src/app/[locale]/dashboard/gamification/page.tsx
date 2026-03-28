"use client";

import { useState, useEffect, useCallback } from "react";
import { DomainSwitcher } from "@/components/domain-switcher";
import { XpProgressBar } from "@/components/gamification/xp-progress-bar";
import { AchievementGrid } from "@/components/gamification/achievement-card";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";
import { DailyChallengeWidget } from "@/components/gamification/daily-challenge-widget";
import { StreakRecovery } from "@/components/gamification/streak-recovery";

interface XpData {
  xp: number;
  level: string;
  progressToNext: number;
  nextLevel: string | null;
  xpToNextLevel: number;
}

interface StreakData {
  streak: number;
  longestStreak: number;
  lastUpdate: string | null;
  isDecayed: boolean;
  canRecover: boolean;
}

interface AchievementInfo {
  slug: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface LeaderboardData {
  rank: number | null;
  userXp: number;
  top10: { rank: number; userId: string; name: string | null; image: string | null; xp: number }[];
  week: number;
  year: number;
}

interface DailyChallengeData {
  available: boolean;
  attempted?: boolean;
  doubleXp?: boolean;
  question?: {
    id: string;
    content: string;
    type: string;
    options: string[] | null;
    difficulty: number;
    subject: string;
    topic: string;
  };
  result?: {
    isCorrect: boolean;
    xpAwarded: number;
    correctAnswer: string;
    explanation: string | null;
  };
}

export default function GamificationPage() {
  const [activeDomainSlug, setActiveDomainSlug] = useState<string | null>(null);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [xpData, setXpData] = useState<XpData | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<AchievementInfo[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallengeData | null>(null);
  const [loading, setLoading] = useState(true);

  // First get domains to know slug
  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((data) => {
        const enrolled = data.enrolled || data.domains || [];
        if (enrolled.length > 0) {
          setActiveDomainSlug(enrolled[0].slug || enrolled[0].domainSlug);
          setActiveDomainId(enrolled[0].id || enrolled[0].domainId);
        }
      })
      .catch(() => {});
  }, []);

  // Get user ID from dashboard
  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.userId) setUserId(data.userId);
      })
      .catch(() => {});
  }, []);

  const fetchAll = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const [xpRes, streakRes, achRes, lbRes, dcRes] = await Promise.all([
        fetch(`/api/${slug}/xp`),
        fetch(`/api/${slug}/streak`),
        fetch(`/api/${slug}/achievements`),
        fetch(`/api/${slug}/leaderboard`),
        fetch(`/api/${slug}/daily-challenge`),
      ]);

      const [xp, streak, ach, lb, dc] = await Promise.all([
        xpRes.json(),
        streakRes.json(),
        achRes.json(),
        lbRes.json(),
        dcRes.json(),
      ]);

      setXpData(xp);
      setStreakData(streak);
      setAchievements(ach.available || []);
      setLeaderboard(lb);
      setDailyChallenge(dc);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeDomainSlug) {
      fetchAll(activeDomainSlug);
    }
  }, [activeDomainSlug, fetchAll]);

  const handleDomainSwitch = (domainId: string) => {
    setActiveDomainId(domainId);
    // Refetch domains to get slug
    fetch(`/api/student/domains/${domainId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.slug || data.domainSlug) {
          setActiveDomainSlug(data.slug || data.domainSlug);
        }
      })
      .catch(() => {});
  };

  const refresh = () => {
    if (activeDomainSlug) fetchAll(activeDomainSlug);
  };

  if (loading && !xpData) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Gamification</h1>
        <DomainSwitcher activeDomainId={activeDomainId} onSwitch={handleDomainSwitch} />
      </div>

      {!activeDomainSlug && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-sm text-gray-500">
          No domains enrolled. Enroll in a domain to start earning XP!
        </div>
      )}

      {activeDomainSlug && (
        <>
          {/* XP + Streak row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {xpData && <XpProgressBar {...xpData} />}

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Streak</p>
                  <p className="text-3xl font-bold text-orange-400">
                    {streakData?.streak || 0}
                    <span className="ml-1 text-sm font-normal text-gray-500">days</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Longest</p>
                  <p className="text-lg font-semibold text-white">
                    {streakData?.longestStreak || 0} days
                  </p>
                </div>
              </div>

              {streakData?.isDecayed && (
                <div className="mt-3 rounded-lg border border-red-800/50 bg-red-900/10 p-3">
                  <p className="mb-2 text-xs text-red-400">
                    Your streak has decayed!
                    {streakData.canRecover && " You can recover it."}
                  </p>
                  {streakData.canRecover && (
                    <StreakRecovery
                      domainSlug={activeDomainSlug}
                      onComplete={refresh}
                    />
                  )}
                </div>
              )}

              {!streakData?.isDecayed && streakData && streakData.streak > 0 && (
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: Math.min(streakData.streak, 7) }).map((_, i) => (
                    <div
                      key={i}
                      className="h-2 flex-1 rounded-full bg-orange-500"
                    />
                  ))}
                  {streakData.streak < 7 &&
                    Array.from({ length: 7 - Math.min(streakData.streak, 7) }).map((_, i) => (
                      <div
                        key={`e-${i}`}
                        className="h-2 flex-1 rounded-full bg-gray-700"
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Daily Challenge + Leaderboard */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {dailyChallenge && (
              <DailyChallengeWidget
                data={dailyChallenge}
                domainSlug={activeDomainSlug}
                onComplete={refresh}
              />
            )}
            {leaderboard && (
              <LeaderboardTable data={leaderboard} currentUserId={userId} />
            )}
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <AchievementGrid achievements={achievements} />
          )}
        </>
      )}
    </div>
  );
}
