"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface StudentData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  domains: { id: string; name: string; slug: string; icon: string | null }[];
  sessions: { id: string; type: string; score: number | null; startedAt: string }[];
  progress: { totalAttempts: number; accuracy: number; topicsStudied: number };
  weakAreas: { subject: string; topic: string; errorRate: number; suggestion: string | null }[];
  gamification: { totalXp: number; currentStreak: number; longestStreak: number; level: string };
  examHistory: { score: number | null; passed: boolean | null; submittedAt: string | null }[];
}

export default function WatcherStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("watcher");
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reuse watcher endpoint and find specific student
    fetch("/api/dashboard/watcher")
      .then((r) => r.json())
      .then((data) => {
        const found = data.students?.find((s: StudentData) => s.id === id);
        setStudent(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">{t("loading")}</p>;
  if (!student) return <p className="text-red-400">{t("studentNotFound")}</p>;

  const streakColor =
    student.gamification.currentStreak >= 7
      ? "text-green-400"
      : student.gamification.currentStreak >= 3
        ? "text-yellow-400"
        : "text-red-400";

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
        </div>
      </div>

      {/* Stats overview */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label={t("accuracy")} value={`${student.progress.accuracy}%`} />
        <StatCard label={t("streak")} value={String(student.gamification.currentStreak)} valueClass={streakColor} />
        <StatCard label="XP" value={String(student.gamification.totalXp)} />
        <StatCard label={t("topics")} value={String(student.progress.topicsStudied)} />
        <StatCard label={t("level")} value={student.gamification.level} />
      </div>

      {/* Domains */}
      <div className="mb-6 flex flex-wrap gap-2">
        {student.domains.map((d) => (
          <span key={d.id} className="rounded bg-blue-600/20 px-3 py-1 text-sm text-blue-400">
            {d.icon} {d.name}
          </span>
        ))}
      </div>

      {/* Weak Areas */}
      {student.weakAreas.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">{t("weakAreas")}</h2>
          <div className="space-y-2">
            {student.weakAreas.map((w) => (
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
      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-lg font-semibold text-white">{t("recentSessions")}</h2>
        {student.sessions.length === 0 ? (
          <p className="text-sm text-gray-500">{t("noSessions")}</p>
        ) : (
          <div className="space-y-2">
            {student.sessions.map((s) => (
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
        )}
      </div>

      {/* Exam History */}
      {student.examHistory.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">{t("examHistory")}</h2>
          <div className="space-y-2">
            {student.examHistory.map((e, i) => (
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
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
