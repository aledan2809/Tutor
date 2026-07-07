"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface DashboardData {
  stats: {
    totalStudents: number;
    totalGroups: number;
    activeGoals: number;
    unreadMessages: number;
  };
  recentActivity: {
    id: string;
    studentName: string | null;
    studentId: string;
    type: string;
    score: number | null;
    startedAt: string;
    endedAt: string | null;
  }[];
}

interface AtRiskStudent {
  id: string;
  name: string | null;
  email: string | null;
  domain?: { name: string } | null;
  risk?: {
    failureProbability: number;
    factors: string[];
    recommendation: string;
  } | null;
}

export default function InstructorDashboardPage() {
  const t = useTranslations("instructor");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/instructor")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    // Daily triage: the students who need attention today, by failure risk.
    // Best-effort — the hub renders fine without it.
    fetch("/api/dashboard/instructor/students?limit=50")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const students: AtRiskStudent[] = d?.students ?? [];
        const top = students
          .filter((s) => (s.risk?.failureProbability ?? 0) >= 60)
          .sort((a, b) => (b.risk?.failureProbability ?? 0) - (a.risk?.failureProbability ?? 0))
          .slice(0, 3);
        setAtRisk(top);
      })
      .catch(() => {});
  }, []);

  if (loading) return <p className="text-gray-500">{t("loading")}</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("title")}</h1>

      {/* Daily triage — who needs you today (risk-first, one action per student).
          Rule-based on the existing per-student failure risk; hidden when clear. */}
      {atRisk.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-300">
            {atRisk.length === 1
              ? "1 elev are nevoie de atenție azi:"
              : `${atRisk.length} elevi au nevoie de atenție azi:`}
          </h2>
          <div className="space-y-2">
            {atRisk.map((s) => {
              const p = s.risk?.failureProbability ?? 0;
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/instructor/students/${s.id}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 hover:border-blue-600/50 hover:bg-gray-800"
                >
                  <span
                    className={`h-9 w-1.5 shrink-0 rounded-full ${p >= 75 ? "bg-red-500" : "bg-yellow-500"}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {s.name ?? s.email}
                    </span>
                    <span className="block truncate text-xs text-gray-400">
                      {s.risk?.factors?.[0] ?? s.risk?.recommendation ?? s.domain?.name ?? ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-blue-400">
                    Vezi profilul →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("totalStudents")}
          value={data?.stats.totalStudents ?? 0}
          href="/dashboard/instructor/students"
          accent="blue"
        />
        <StatCard
          label={t("totalGroups")}
          value={data?.stats.totalGroups ?? 0}
          href="/dashboard/instructor/groups"
          accent="green"
        />
        <StatCard
          label={t("activeGoals")}
          value={data?.stats.activeGoals ?? 0}
          accent="yellow"
        />
        <StatCard
          label={t("unreadMessages")}
          value={data?.stats.unreadMessages ?? 0}
          accent="purple"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard/instructor/students"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t("viewStudents")}
        </Link>
        <Link
          href="/dashboard/instructor/groups/new"
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          {t("createGroup")}
        </Link>
        <Link
          href="/dashboard/instructor/analytics"
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          {t("viewAnalytics")}
        </Link>
        <Link
          href="/dashboard/instructor/reports"
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          {t("generateReport")}
        </Link>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {t("recentActivity")}
        </h2>
        {!data?.recentActivity?.length ? (
          <p className="text-sm text-gray-500">{t("noActivity")}</p>
        ) : (
          <div className="space-y-2">
            {data.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded bg-gray-800 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/dashboard/instructor/students/${activity.studentId}`}
                    className="text-sm font-medium text-white hover:text-blue-400"
                  >
                    {activity.studentName ?? "Unknown"}
                  </Link>
                  <span className="ml-2 text-sm text-gray-400 capitalize">
                    {activity.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {activity.score !== null && (
                    <span className="text-sm text-gray-300">{activity.score}%</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(activity.startedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number;
  href?: string;
  accent: string;
}) {
  const colors: Record<string, string> = {
    blue: "border-blue-600",
    green: "border-green-600",
    yellow: "border-yellow-600",
    purple: "border-purple-600",
  };

  const content = (
    <div className={`rounded-xl border ${colors[accent]} bg-gray-900 p-5`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
