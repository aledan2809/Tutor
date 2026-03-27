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

export default function InstructorDashboardPage() {
  const t = useTranslations("instructor");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/instructor")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">{t("loading")}</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("title")}</h1>

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
