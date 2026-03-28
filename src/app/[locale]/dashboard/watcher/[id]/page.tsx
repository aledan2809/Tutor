"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface DomainSummary {
  domain: { id: string; name: string; slug: string; icon: string | null };
  sessions: { id: string; type: string; score: number | null; startedAt: string }[];
  progress: { totalAttempts: number; accuracy: number; topicsStudied: number; correctAttempts: number };
  weakAreas: { subject: string; topic: string; errorRate: number; suggestion: string | null }[];
  gamification: { totalXp: number; currentStreak: number; longestStreak: number; level: string };
  examHistory: { score: number | null; passed: boolean | null; submittedAt: string | null }[];
}

interface StudentInfo {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  domains: { id: string; name: string; slug: string; icon: string | null }[];
}

interface ApiResponse {
  student: StudentInfo;
  domainSummaries: DomainSummary[];
}

export default function WatcherStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("watcher");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/watcher/${id}`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((resp) => {
        if (resp?.student) {
          setData(resp);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">{t("loading")}</p>;
  if (!data) return <p className="text-red-400">{t("studentNotFound")}</p>;

  const { student, domainSummaries } = data;

  return (
    <div>
      <Link
        href="/dashboard/watcher"
        className="mb-4 inline-block text-sm text-blue-400 hover:text-blue-300"
      >
        ← {t("backToList")}
      </Link>

      {/* Student header */}
      <div className="mb-6 flex items-center gap-4">
        {student.image ? (
          <Image src={student.image} alt="" width={64} height={64} className="h-16 w-16 rounded-full" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-xl font-bold">
            {(student.name ?? "?")[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{student.name}</h1>
          <p className="text-sm text-gray-400">{student.email}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {student.domains.map((d) => (
              <span key={d.id} className="rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">
                {d.icon} {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Per-domain summaries */}
      {domainSummaries.map((ds) => {
        const streakColor =
          ds.gamification.currentStreak >= 7
            ? "text-green-400"
            : ds.gamification.currentStreak >= 3
              ? "text-yellow-400"
              : "text-red-400";

        return (
          <div key={ds.domain.id} className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">
              {ds.domain.icon} {ds.domain.name}
            </h2>

            {/* Stats overview */}
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatCard label={t("accuracy")} value={`${ds.progress.accuracy}%`} />
              <StatCard label={t("streak")} value={String(ds.gamification.currentStreak)} valueClass={streakColor} />
              <StatCard label="XP" value={String(ds.gamification.totalXp)} />
              <StatCard label={t("topics")} value={String(ds.progress.topicsStudied)} />
              <StatCard label={t("level")} value={ds.gamification.level} />
            </div>

            {/* Weak Areas */}
            {ds.weakAreas.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-gray-400">{t("weakAreas")}</h3>
                <div className="space-y-1">
                  {ds.weakAreas.map((w) => (
                    <div
                      key={`${w.subject}-${w.topic}`}
                      className="flex items-center justify-between rounded bg-gray-800 px-3 py-2"
                    >
                      <span className="text-sm text-white">
                        {w.subject} / {w.topic}
                      </span>
                      <span className="text-sm text-red-400">{w.errorRate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sessions */}
            {ds.sessions.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-gray-400">{t("recentSessions")}</h3>
                <div className="space-y-1">
                  {ds.sessions.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded bg-gray-800 px-3 py-2"
                    >
                      <span className="text-sm text-white capitalize">{s.type}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-300">
                          {s.score !== null ? `${s.score}%` : "-"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(s.startedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam History */}
            {ds.examHistory.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-400">{t("examHistory")}</h3>
                <div className="space-y-1">
                  {ds.examHistory.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded bg-gray-800 px-3 py-2"
                    >
                      <span className={`text-sm font-medium ${e.passed ? "text-green-400" : "text-red-400"}`}>
                        {e.passed ? t("passed") : t("failed")}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white">
                          {e.score !== null ? `${e.score}%` : "-"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {e.submittedAt ? new Date(e.submittedAt).toLocaleDateString() : "-"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {domainSummaries.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-gray-500">{t("noSessions")}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg bg-gray-800 p-3 text-center">
      <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
