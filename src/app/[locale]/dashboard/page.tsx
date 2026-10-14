"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/navigation";
import { DomainSwitcher } from "@/components/domain-switcher";
import { DemoQuizCard } from "@/components/demo-quiz-card";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";

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
  /** The subject has official papers (Simulări) — api/student/dashboard. */
  hasSimulations?: boolean;
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
  /** The subject this answer is about (api/student/dashboard). */
  activeDomainId?: string | null;
  /** A parent's children (api/student/dashboard). */
  children?: { id: string; name: string | null }[];
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
  /** Drumul pe curs al materiei active (`course-path.ts`); null = materia n-are curs. */
  course?: {
    total: number;
    done: number;
    current: {
      n: number;
      moduleTitle: string;
      step: "read" | "test";
      lessonId: string;
      lessonTitle: string;
      questionTopic: string | null;
    } | null;
    next: { n: number; moduleTitle: string; lessonTitle: string } | null;
  } | null;
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

  // One request per subject on screen (audit S9/S10): an error answer is never taken for data, and a
  // late answer for an earlier request doesn't overwrite the subject just picked.
  // The switcher moves at once; the text and the buttons follow the answer that arrived, and a failed
  // switch goes back to the subject still on screen.
  const lastRequest = useRef(0);
  const shownDomainId = useRef<string | null>(null);
  const fetchDashboard = useCallback((domainId?: string) => {
    const id = ++lastRequest.current;
    setLoading(true);
    const params = domainId ? `?domainId=${encodeURIComponent(domainId)}` : "";
    fetch(`/api/student/dashboard${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`dashboard ${r.status}`))))
      .then((d: DashboardData) => {
        if (id !== lastRequest.current) return;
        const shown = d.activeDomainId ?? d.domains?.[0]?.domainId ?? null;
        shownDomainId.current = shown;
        setData(d);
        setActiveDomainId(shown);
      })
      .catch(() => {
        if (id === lastRequest.current && shownDomainId.current) setActiveDomainId(shownDomainId.current);
      })
      .finally(() => {
        if (id === lastRequest.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleDomainSwitch = (domainId: string) => {
    setActiveDomainId(domainId);
    fetchDashboard(domainId);
  };

  // Resume the in-progress session or fall back to starting practice. Shared by
  // the Today hero CTA and the full-dashboard quick action.
  // Of the subject on screen (audit S12): the hero names that subject. With nothing to resume, the hero
  // starts a test on it; the full dashboard's „Continuă” opens the practice page, as before.
  const continueSession = useCallback(
    async (opts?: { startIfNone?: boolean }) => {
      // The subject of the answer on screen — the one the hero's text is about.
      const shownId = data?.activeDomainId ?? activeDomainId;
      const dom = data?.domains.find((d) => d.domainId === shownId) ?? data?.domains[0];
      const resume = async (domainId?: string) => {
        const res = await fetch("/api/student/sessions/continue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(domainId ? { domainId } : {}),
        });
        const result = await res.json();
        if (!result.sessionId) return false;
        localStorage.setItem(`session_${result.sessionId}`, JSON.stringify(result));
        router.push(`/dashboard/practice/${result.sessionId}`);
        return true;
      };
      try {
        if (await resume(dom?.domainId)) return;
        // The full dashboard's „Continuă” names no subject: an unfinished test of another one counts too.
        if (!opts?.startIfNone && dom && (await resume())) return;
      } catch {}
      router.push(
        opts?.startIfNone && dom
          ? `/dashboard/practice?start=quick&domain=${encodeURIComponent(dom.domainSlug)}`
          : "/dashboard/practice",
      );
    },
    [router, data, activeDomainId],
  );

  if (loading && !data) {
    return <div className="py-12 text-center text-gray-400">{t("common.loading")}</div>;
  }

  if (!data) {
    return <div className="py-12 text-center text-gray-400">{t("dashboard.couldNotLoad")}</div>;
  }

  // Text and actions from the subject of the answer on screen (not yet from a switch still loading).
  const activeDomain =
    data.domains.find((d) => d.domainId === (data.activeDomainId ?? activeDomainId)) || data.domains[0];
  // A parent who learns nothing themselves: once a child has a subject the parent follows it (WATCHER), and
  // the learner's home then offered the parent a test of their own. Their home is their children instead.
  const isParentHome =
    session?.user?.accountRole === "PARENT" && !data.domains.some((d) => d.roles.includes("STUDENT"));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header: view toggle (Today / Full dashboard) + domain switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{t("dashboard.title")}</h1>
          {!isParentHome && (
          <div className="flex rounded-lg border border-gray-700 p-0.5" role="group" aria-label={t("dashboard.viewToday") + " / " + t("dashboard.viewFull")}>
            <button
              onClick={() => setView("today")}
              aria-pressed={view === "today"}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold min-h-[44px] ${
                view === "today" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t("dashboard.viewToday")}
            </button>
            <button
              onClick={() => setView("full")}
              aria-pressed={view === "full"}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold min-h-[44px] ${
                view === "full" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t("dashboard.viewFull")}
            </button>
          </div>
          )}
        </div>
        {!isParentHome && <DomainSwitcher activeDomainId={activeDomainId} onSwitch={handleDomainSwitch} />}
      </div>

      {/* Lazy-save: surface a demo quiz claimed at signup (renders nothing otherwise) */}
      <DemoQuizCard />

      {/* No enrollments → guided learning onboarding (subject → calibration test).
          The old "browse domains" list stays reachable from inside the wizard. */}
      {data.domains.length === 0 && session?.user?.accountRole !== "PARENT" && (
        <OnboardingWizard />
      )}

      {/* A parent with nothing linked yet: the student wizard would have enrolled
          them in a subject as a LEARNER, which is how parents ended up with the
          student menu in the first place. */}
      {/* A parent whose child is already linked: to the child, not „link your child” (audit B5). */}
      {isParentHome && (data.children?.length ?? 0) > 0 && (
        <div className="mb-6 rounded-xl border border-blue-800 bg-blue-950/20 p-4">
          <h3 className="text-sm font-medium text-white">
            {data.children!.length === 1 ? `Copilul tău: ${data.children![0].name ?? "copilul"}` : "Copiii tăi"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">Vezi ce lucrează, alege-i materiile și primește alerte.</p>
          <div className="mt-1 flex flex-col">
            {data.children!.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/watcher?child=${encodeURIComponent(c.id)}`}
                className="inline-flex min-h-[44px] items-center text-sm text-blue-400 hover:text-blue-300"
              >
                Vezi ce face {c.name ?? "copilul"} →
              </Link>
            ))}
          </div>
        </div>
      )}

      {isParentHome && (data.children?.length ?? 0) === 0 && (
        <div className="mb-6 rounded-xl border border-blue-800 bg-blue-950/20 p-4">
          <h3 className="text-sm font-medium text-white">Leagă contul copilului</h3>
          <p className="mt-1 text-sm text-gray-400">
            Ca să-i vezi progresul și să primești alerte, adaugă-l din Familia mea.
          </p>
          <Link
            href="/dashboard/family"
            className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300"
          >
            Familia mea →
          </Link>
        </div>
      )}

      {/* TODAY view — one clear next action + guided path (proactive default) */}
      {data.domains.length > 0 && !isParentHome && view === "today" && (
        <TodayView
          data={data}
          activeDomain={activeDomain}
          userName={session?.user?.name ?? null}
          onContinue={() => void continueSession({ startIfNone: true })}
          // Its own papers, or no step at all when the subject has none (audit S14).
          onSimulate={
            activeDomain?.hasSimulations
              ? () => router.push(`/dashboard/exam-bank?domain=${encodeURIComponent(activeDomain.domainSlug)}`)
              : null
          }
          onOpenLesson={(id) => router.push(`/dashboard/lessons/${id}`)}
          onCourseTest={() => {
            const topic = data.course?.current?.questionTopic;
            router.push(
              `/dashboard/practice?start=quick${activeDomain ? `&domain=${encodeURIComponent(activeDomain.domainSlug)}` : ""}${
                topic ? `&topic=${encodeURIComponent(topic)}` : ""
              }`
            );
          }}
          t={t}
        />
      )}

      {/* FULL dashboard — the classic stats view, kept as an option */}
      {data.domains.length > 0 && !isParentHome && view === "full" && (
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
              onClick={() => void continueSession()}
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
                className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
  onOpenLesson,
  onCourseTest,
  t,
}: {
  data: DashboardData;
  activeDomain: DomainProgress | undefined;
  userName: string | null;
  onContinue: () => void;
  onSimulate: (() => void) | null;
  onOpenLesson: (lessonId: string) => void;
  onCourseTest: () => void;
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

  // Pe o materie cu curs (firmă: Agent imobiliar, Poșta), drumul e al cursului: lecția, apoi testul
  // ei. Până e parcurs tot, panoul nu propune grile generale — poarta le-ar refuza oricum.
  const course = data.course?.current ? data.course : null;
  if (course && course.current) {
    const cur = course.current;
    const isTest = cur.step === "test";
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-300">{greeting}</p>
        <div className="relative overflow-hidden rounded-2xl border border-blue-700/60 bg-gradient-to-br from-blue-950 to-gray-950 p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-300">
            {t("dashboard.todayAction")}
          </p>
          <p className="mt-1.5 text-xs font-semibold text-blue-200/80">
            {isTest
              ? t("dashboard.courseTestLabel", { n: cur.n, total: course.total })
              : t("dashboard.courseLessonLabel", { n: cur.n, total: course.total })}
          </p>
          <h2 className="mt-1 text-lg font-extrabold text-white">{isTest ? cur.moduleTitle : cur.lessonTitle}</h2>
          <p className="mt-1 text-sm text-blue-200/80">
            {isTest ? t("dashboard.courseTestWhy") : t("dashboard.courseReadWhy")}
          </p>
          <button
            onClick={isTest ? onCourseTest : () => onOpenLesson(cur.lessonId)}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 sm:w-auto sm:px-8"
          >
            {isTest ? t("dashboard.courseStartTest") : t("dashboard.courseStartLesson")} ▶
          </button>
        </div>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-400">{t("dashboard.todayPathTitle")}</h3>
          <div className="space-y-2">
            <PathStep
              state={isTest ? "done" : "now"}
              n={1}
              label={t("dashboard.courseStepRead", { n: cur.n })}
              onClick={isTest ? undefined : () => onOpenLesson(cur.lessonId)}
            />
            <PathStep
              state={isTest ? "now" : "next"}
              n={2}
              label={t("dashboard.courseStepTest", { n: cur.n })}
              onClick={isTest ? onCourseTest : undefined}
            />
            {course.next && (
              <PathStep
                state="next"
                n={3}
                label={t("dashboard.courseStepNext", { n: course.next.n, title: course.next.moduleTitle })}
              />
            )}
          </div>
        </section>

        <p className="text-sm text-gray-400">
          {t("dashboard.courseProgress", { done: course.done, total: course.total })}
        </p>
      </div>
    );
  }

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
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 sm:w-auto sm:px-8 min-h-[44px]"
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
          {onSimulate && <PathStep state="next" n={3} label={t("dashboard.todayStep3")} onClick={onSimulate} />}
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
