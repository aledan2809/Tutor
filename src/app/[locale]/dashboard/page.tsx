"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { DomainSwitcher } from "@/components/domain-switcher";
import { DemoQuizCard } from "@/components/demo-quiz-card";

// Home view mode: "today" (proactive — one next action + guided path) or "full"
// (the classic stats dashboard, kept as an option per product decision).
type HomeView = "today" | "full";
const HOME_VIEW_KEY = "tutor-home-view";

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
  const t = useTranslations();
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);

  // "today" is the default; the classic dashboard stays one tap away. SSR-safe:
  // start with "today" and sync the stored preference after mount.
  const [view, setViewState] = useState<HomeView>("today");
  useEffect(() => {
    try {
      const v = localStorage.getItem(HOME_VIEW_KEY);
      if (v === "full" || v === "today") setViewState(v);
    } catch {}
  }, []);
  const setView = (v: HomeView) => {
    setViewState(v);
    try {
      localStorage.setItem(HOME_VIEW_KEY, v);
    } catch {}
  };

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

  // Resume the in-progress session or fall back to starting practice. Shared by
  // the Today hero CTA and the full-dashboard quick action.
  const continueSession = useCallback(async () => {
    try {
      const res = await fetch("/api/student/sessions/continue", { method: "POST" });
      const result = await res.json();
      if (result.sessionId) {
        localStorage.setItem(`session_${result.sessionId}`, JSON.stringify(result));
        router.push(`/dashboard/practice/${result.sessionId}`);
        return;
      }
    } catch {}
    router.push("/dashboard/practice");
  }, [router]);

  if (loading && !data) {
    return <div className="py-12 text-center text-gray-400">{t("common.loading")}</div>;
  }

  if (!data) {
    return <div className="py-12 text-center text-gray-400">{t("dashboard.couldNotLoad")}</div>;
  }

  const activeDomain = data.domains.find((d) => d.domainId === activeDomainId) || data.domains[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header: view toggle (Today / Full dashboard) + domain switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{t("dashboard.title")}</h1>
          <div className="flex rounded-lg border border-gray-700 p-0.5" role="group" aria-label={t("dashboard.viewToday") + " / " + t("dashboard.viewFull")}>
            <button
              onClick={() => setView("today")}
              aria-pressed={view === "today"}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold min-h-[32px] ${
                view === "today" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t("dashboard.viewToday")}
            </button>
            <button
              onClick={() => setView("full")}
              aria-pressed={view === "full"}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold min-h-[32px] ${
                view === "full" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t("dashboard.viewFull")}
            </button>
          </div>
        </div>
        <DomainSwitcher activeDomainId={activeDomainId} onSwitch={handleDomainSwitch} />
      </div>

      {/* Lazy-save: surface a demo quiz claimed at signup (renders nothing otherwise) */}
      <DemoQuizCard />

      {/* No enrollments */}
      {data.domains.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="mb-4 text-gray-400">{t("dashboard.noDomains")}</p>
          <button
            onClick={() => router.push("/dashboard/domains")}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 min-h-[44px]"
          >
            {t("dashboard.browseDomains")}
          </button>
        </div>
      )}

      {/* TODAY view — one clear next action + guided path (proactive default) */}
      {data.domains.length > 0 && view === "today" && (
        <TodayView
          data={data}
          activeDomain={activeDomain}
          userName={session?.user?.name ?? null}
          onContinue={continueSession}
          onSimulate={() => router.push("/dashboard/exam-bank")}
          t={t}
        />
      )}

      {/* FULL dashboard — the classic stats view, kept as an option */}
      {data.domains.length > 0 && view === "full" && (
        <>
          {/* Top stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label={t("dashboard.currentStreak")}
              value={`${data.streak.current} ${t("dashboard.days")}`}
              accent={data.streak.isDecayed ? "red" : data.streak.current >= 7 ? "green" : "blue"}
              sub={data.streak.canRecover ? t("dashboard.recoverable") : t("dashboard.best", { n: data.streak.longest })}
            />
            <StatCard
              label={t("dashboard.totalXp")}
              value={data.xp.total.toLocaleString()}
              accent="purple"
              sub={data.xp.nextLevel ? t("dashboard.toNextLevel", { n: data.xp.xpToNextLevel, level: data.xp.nextLevel }) : t("dashboard.maxLevel")}
            />
            <StatCard
              label={t("dashboard.level")}
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
              label={t("dashboard.accuracy")}
              value={`${activeDomain?.accuracy ?? 0}%`}
              accent={
                (activeDomain?.accuracy ?? 0) >= 80
                  ? "green"
                  : (activeDomain?.accuracy ?? 0) >= 60
                    ? "yellow"
                    : "red"
              }
              sub={t("dashboard.sessionsCount", { n: activeDomain?.sessionsCompleted ?? 0 })}
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
                <p className="text-sm font-medium text-white">{t("dashboard.quickSession")}</p>
                <p className="text-xs text-gray-400">
                  {data.recommendation ? data.recommendation.label : t("dashboard.startPracticing")}
                </p>
              </div>
            </button>
            <button
              onClick={continueSession}
              className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 text-left transition-colors hover:border-green-600/50 hover:bg-gray-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-lg">
                &#9654;
              </div>
              <div>
                <p className="text-sm font-medium text-white">{t("dashboard.continue")}</p>
                <p className="text-xs text-gray-400">{t("dashboard.resumeWhereLeft")}</p>
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
                <p className="text-sm font-medium text-white">{t("dashboard.assessment")}</p>
                <p className="text-xs text-gray-400">{t("dashboard.determineLevel")}</p>
              </div>
            </button>
          </div>

          {/* Domain Progress Cards */}
          {data.domains.length > 1 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">{t("dashboard.yourDomains")}</h2>
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
                        <p className="text-gray-400">{t("dashboard.xp")}</p>
                      </div>
                      <div>
                        <p className="font-bold text-white">{d.level}</p>
                        <p className="text-gray-400">{t("dashboard.level")}</p>
                      </div>
                      <div>
                        <p className="font-bold text-white">{d.accuracy}%</p>
                        <p className="text-gray-400">{t("dashboard.accuracy")}</p>
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
              <h2 className="mb-3 text-lg font-semibold text-white">{t("dashboard.weakAreas")}</h2>
              {data.weakAreas.length === 0 ? (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-400">
                  {t("dashboard.noWeakAreas")}
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
                        <p className="text-xs text-gray-400">{w.subject}</p>
                      </div>
                      <span className="text-sm font-semibold text-red-400">{w.errorRate}%</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Sessions */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">{t("dashboard.recentSessions")}</h2>
              {data.recentSessions.length === 0 ? (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-400">
                  {t("dashboard.noSessions")}
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
                        <p className="text-xs text-gray-400">
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
              <p className="text-xs font-semibold uppercase text-blue-400">{t("dashboard.nextRecommended")}</p>
              <p className="mt-1 text-sm text-white">{data.recommendation.label}</p>
              <p className="text-xs text-gray-400">{data.recommendation.reason}</p>
              <button
                onClick={() => router.push("/dashboard/practice")}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t("dashboard.startNow")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * "Astăzi" — the proactive home. One hero action (derived from the student's
 * weakest area, or the generic recommendation), a 3-step guided path, and just
 * two supporting stats. Everything here reuses data the dashboard API already
 * returns; the classic stats view stays available via the header toggle.
 */
function TodayView({
  data,
  activeDomain,
  userName,
  onContinue,
  onSimulate,
  t,
}: {
  data: DashboardData;
  activeDomain: DomainProgress | undefined;
  userName: string | null;
  onContinue: () => void;
  onSimulate: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const weak = data.weakAreas[0] ?? null;
  const streak = data.streak.current;
  // Greeting: personal if we have a first name; the {name} slot carries the
  // leading comma-space so the no-name case reads naturally.
  const firstName = userName?.trim().split(/\s+/)[0] ?? "";
  const nameSlot = firstName ? `, ${firstName}` : "";
  const greeting =
    streak > 0
      ? t("dashboard.todayGreeting", { name: nameSlot })
      : t("dashboard.todayGreetingNoStreak", { name: nameSlot });

  // Hero action: weakest area first (specific + motivating), else the API's
  // generic recommendation, else a plain short session.
  const heroTitle = weak
    ? t("dashboard.todayWeakAction", { topic: weak.topic })
    : data.recommendation?.label ?? t("dashboard.todayDefaultAction");
  const heroWhy = weak
    ? t("dashboard.todayWeakWhy", { rate: weak.errorRate })
    : data.recommendation?.reason ?? t("dashboard.todayDefaultWhy");

  // Guided path. Step 1 counts done when there's a session today.
  const today = new Date().toDateString();
  const step1Done = data.recentSessions.some(
    (s) => new Date(s.startedAt).toDateString() === today
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-300">{greeting}</p>
        {streak > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-green-400">
            🔥 <span>{t("dashboard.todayStreakDays", { n: streak })}</span>
          </span>
        )}
      </div>

      {/* Hero: today's one action */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-700/60 bg-gradient-to-br from-blue-950 to-gray-950 p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-300">
          {t("dashboard.todayAction")}
        </p>
        <h2 className="mt-1.5 text-lg font-extrabold text-white">{heroTitle}</h2>
        <p className="mt-1 text-sm text-blue-200/80">{heroWhy}</p>
        <button
          onClick={onContinue}
          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 sm:w-auto sm:px-8 min-h-[44px]"
        >
          {t("dashboard.todayStart")} ▶
        </button>
      </div>

      {/* Guided path */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-400">{t("dashboard.todayPathTitle")}</h3>
        <div className="space-y-2">
          <PathStep
            state={step1Done ? "done" : "now"}
            n={1}
            label={t("dashboard.todayStep1")}
            onClick={step1Done ? undefined : onContinue}
          />
          <PathStep
            state={step1Done ? "now" : "next"}
            n={2}
            label={
              weak
                ? t("dashboard.todayStep2", { topic: weak.topic })
                : t("dashboard.todayStep2Generic")
            }
            onClick={step1Done ? onContinue : undefined}
          />
          <PathStep state="next" n={3} label={t("dashboard.todayStep3")} onClick={onSimulate} />
        </div>
      </section>

      {/* Two supporting stats — the rest lives in the full dashboard */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label={t("dashboard.accuracy")}
          value={`${activeDomain?.accuracy ?? 0}%`}
          accent={
            (activeDomain?.accuracy ?? 0) >= 80
              ? "green"
              : (activeDomain?.accuracy ?? 0) >= 60
                ? "yellow"
                : "red"
          }
          sub={t("dashboard.sessionsCount", { n: activeDomain?.sessionsCompleted ?? 0 })}
        />
        <StatCard
          label={t("dashboard.totalXp")}
          value={data.xp.total.toLocaleString()}
          accent="purple"
          sub={
            data.xp.nextLevel
              ? t("dashboard.toNextLevel", { n: data.xp.xpToNextLevel, level: data.xp.nextLevel })
              : t("dashboard.maxLevel")
          }
        />
      </div>
    </div>
  );
}

function PathStep({
  state,
  n,
  label,
  onClick,
}: {
  state: "done" | "now" | "next";
  n: number;
  label: string;
  onClick?: () => void;
}) {
  const badge =
    state === "done"
      ? "bg-green-500 text-gray-950"
      : state === "now"
        ? "bg-blue-600 text-white"
        : "bg-gray-700 text-gray-400";
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      {...(onClick ? { onClick, type: "button" as const } : {})}
      className={`flex w-full items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-left ${
        state === "next" ? "opacity-60" : ""
      } ${onClick ? "hover:border-blue-600/50 hover:bg-gray-800 min-h-[44px]" : ""}`}
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${badge}`}>
        {state === "done" ? "✓" : n}
      </span>
      <span className={`text-sm ${state === "done" ? "text-gray-400" : "font-medium text-white"}`}>
        {label}
      </span>
    </Wrapper>
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
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colors[accent]}`}>{value}</p>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}
