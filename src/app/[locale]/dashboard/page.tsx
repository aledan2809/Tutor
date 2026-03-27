"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { DomainSwitcher } from "@/components/domain-switcher";

interface DomainProgress {
  domainId: string;
  domainName: string;
  domainSlug: string;
  domainIcon: string | null;
  roles: string[];
  xp: number;
  level: string;
  streak: number;
  accuracy: number;
  sessionsCompleted: number;
  topicsStudied: number;
}

interface RecentSession {
  id: string;
  type: string;
  domainId: string;
  score: number | null;
  startedAt: string;
  endedAt: string | null;
  questionsAnswered: number;
}

interface WeakArea {
  subject: string;
  topic: string;
  errorRate: number;
  suggestion: string | null;
}

interface DashboardData {
  streak: {
    current: number;
    longest: number;
    isDecayed: boolean;
    canRecover: boolean;
  };
  xp: {
    total: number;
    level: string;
    progressToNext: number;
    nextLevel: string | null;
    xpToNextLevel: number;
  };
  domains: DomainProgress[];
  recentSessions: RecentSession[];
  weakAreas: WeakArea[];
  recommendation: { type: string; reason: string; label: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);

  const fetchDashboard = useCallback((domainId?: string) => {
    setLoading(true);
    const params = domainId ? `?domainId=${domainId}` : "";
    fetch(`/api/student/dashboard${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (!activeDomainId && d.domains?.length > 0) {
          setActiveDomainId(d.domains[0].domainId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeDomainId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleDomainSwitch = (domainId: string) => {
    setActiveDomainId(domainId);
    fetchDashboard(domainId);
  };

  if (loading && !data) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  if (!data) {
    return <div className="py-12 text-center text-gray-500">Could not load dashboard.</div>;
  }

  const activeDomain = data.domains.find((d) => d.domainId === activeDomainId) || data.domains[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header with domain switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <DomainSwitcher activeDomainId={activeDomainId} onSwitch={handleDomainSwitch} />
      </div>

      {/* No enrollments */}
      {data.domains.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="mb-4 text-gray-400">You are not enrolled in any domains yet.</p>
          <button
            onClick={() => router.push("/dashboard/domains")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse Domains
          </button>
        </div>
      )}

      {data.domains.length > 0 && (
        <>
          {/* Top stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Current Streak"
              value={`${data.streak.current} days`}
              accent={data.streak.isDecayed ? "red" : data.streak.current >= 7 ? "green" : "blue"}
              sub={data.streak.canRecover ? "Recoverable!" : `Best: ${data.streak.longest}`}
            />
            <StatCard
              label="Total XP"
              value={data.xp.total.toLocaleString()}
              accent="purple"
              sub={data.xp.nextLevel ? `${data.xp.xpToNextLevel} to ${data.xp.nextLevel}` : "Max level"}
            />
            <StatCard
              label="Level"
              value={data.xp.level}
              accent="yellow"
              sub={
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full bg-yellow-500"
                    style={{ width: `${Math.min(data.xp.progressToNext, 100)}%` }}
                  />
                </div>
              }
            />
            <StatCard
              label="Accuracy"
              value={`${activeDomain?.accuracy ?? 0}%`}
              accent={
                (activeDomain?.accuracy ?? 0) >= 80
                  ? "green"
                  : (activeDomain?.accuracy ?? 0) >= 60
                    ? "yellow"
                    : "red"
              }
              sub={`${activeDomain?.sessionsCompleted ?? 0} sessions`}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              onClick={() => router.push("/dashboard/practice")}
              className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 text-left transition-colors hover:border-blue-600/50 hover:bg-gray-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-lg">
                &#9889;
              </div>
              <div>
                <p className="text-sm font-medium text-white">Quick Session</p>
                <p className="text-xs text-gray-500">
                  {data.recommendation ? data.recommendation.label : "Start practicing"}
                </p>
              </div>
            </button>
            <button
              onClick={async () => {
                const res = await fetch("/api/student/sessions/continue", { method: "POST" });
                const result = await res.json();
                if (result.sessionId) {
                  localStorage.setItem(
                    `session_${result.sessionId}`,
                    JSON.stringify(result)
                  );
                  router.push(`/dashboard/practice/${result.sessionId}`);
                } else {
                  router.push("/dashboard/practice");
                }
              }}
              className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 text-left transition-colors hover:border-green-600/50 hover:bg-gray-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-lg">
                &#9654;
              </div>
              <div>
                <p className="text-sm font-medium text-white">Continue</p>
                <p className="text-xs text-gray-500">Resume where you left off</p>
              </div>
            </button>
            <button
              onClick={() => router.push("/dashboard/assessment")}
              className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 text-left transition-colors hover:border-purple-600/50 hover:bg-gray-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/10 text-lg">
                &#128200;
              </div>
              <div>
                <p className="text-sm font-medium text-white">Assessment</p>
                <p className="text-xs text-gray-500">Determine your level</p>
              </div>
            </button>
          </div>

          {/* Domain Progress Cards */}
          {data.domains.length > 1 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">Your Domains</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.domains.map((d) => (
                  <div
                    key={d.domainId}
                    className={`rounded-xl border p-4 transition-colors ${
                      d.domainId === activeDomainId
                        ? "border-blue-600/50 bg-blue-600/5"
                        : "border-gray-800 bg-gray-900"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      {d.domainIcon && <span className="text-lg">{d.domainIcon}</span>}
                      <h3 className="font-medium text-white">{d.domainName}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="font-bold text-white">{d.xp}</p>
                        <p className="text-gray-500">XP</p>
                      </div>
                      <div>
                        <p className="font-bold text-white">{d.level}</p>
                        <p className="text-gray-500">Level</p>
                      </div>
                      <div>
                        <p className="font-bold text-white">{d.accuracy}%</p>
                        <p className="text-gray-500">Accuracy</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${Math.min(d.accuracy, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Weak Areas + Recent Sessions side-by-side */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Weak Areas */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">Weak Areas</h2>
              {data.weakAreas.length === 0 ? (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-500">
                  No weak areas detected yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.weakAreas.map((w) => (
                    <div
                      key={`${w.subject}-${w.topic}`}
                      className="flex items-center justify-between rounded-lg border border-red-900/30 bg-red-900/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{w.topic}</p>
                        <p className="text-xs text-gray-500">{w.subject}</p>
                      </div>
                      <span className="text-sm font-semibold text-red-400">{w.errorRate}%</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Sessions */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">Recent Sessions</h2>
              {data.recentSessions.length === 0 ? (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-500">
                  No sessions yet. Start practicing!
                </div>
              ) : (
                <div className="space-y-2">
                  {data.recentSessions.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize text-white">{s.type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(s.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">{s.questionsAnswered}q</span>
                        {s.score !== null ? (
                          <span
                            className={`font-semibold ${
                              s.score >= 80
                                ? "text-green-400"
                                : s.score >= 60
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {s.score}%
                          </span>
                        ) : (
                          <span className="text-gray-500">--</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Recommendation */}
          {data.recommendation && (
            <div className="rounded-xl border border-blue-600/30 bg-blue-600/5 p-4">
              <p className="text-xs font-semibold uppercase text-blue-400">Next Recommended</p>
              <p className="mt-1 text-sm text-white">{data.recommendation.label}</p>
              <p className="text-xs text-gray-400">{data.recommendation.reason}</p>
              <button
                onClick={() => router.push("/dashboard/practice")}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Start Now
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string | number;
  accent: "blue" | "green" | "red" | "yellow" | "purple";
  sub?: React.ReactNode;
}) {
  const colors = {
    blue: "text-blue-400",
    green: "text-green-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    purple: "text-purple-400",
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colors[accent]}`}>{value}</p>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
