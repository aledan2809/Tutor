"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { PredictiveCard } from "./predictive-card";

interface StudentDetailProps {
  studentId: string;
}

interface DomainProgress {
  domain: { id: string; name: string; slug: string; icon: string | null };
  sessions: { id: string; type: string; score: number | null; startedAt: string; endedAt: string | null }[];
  progress: { totalAttempts: number; correctAttempts: number; accuracy: number; topicsStudied: number };
  weakAreas: { subject: string; topic: string; errorRate: number; suggestion: string | null }[];
  gamification: { totalXp: number; currentStreak: number; longestStreak: number; level: string };
  examHistory: { score: number | null; passed: boolean | null; submittedAt: string | null }[];
  risk: {
    studentId: string;
    domainId: string;
    failureProbability: number;
    trend: "improving" | "declining" | "stable";
    factors: string[];
    recommendation: string;
  };
}

interface StudentData {
  student: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt: string;
    domains: { id: string; name: string; slug: string; icon: string | null }[];
  };
  domainProgress: DomainProgress[];
  goals: { id: string; title: string; description: string | null; isCompleted: boolean; targetDate: string | null; createdAt: string }[];
  groups: { id: string; name: string; domainId: string }[];
}

export function StudentDetail({ studentId }: StudentDetailProps) {
  const t = useTranslations("instructor");
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/instructor/students/${studentId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return <p className="text-gray-500">{t("loading")}</p>;
  }

  if (!data) {
    return <p className="text-red-400">{t("studentNotFound")}</p>;
  }

  const { student, domainProgress, goals, groups } = data;

  return (
    <div className="space-y-6">
      {/* Student header */}
      <div className="flex items-center gap-4">
        {student.image ? (
          <Image src={student.image} alt="" width={64} height={64} className="h-16 w-16 rounded-full" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-xl font-bold">
            {(student.name ?? "?")[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-white">{student.name}</h2>
          <p className="text-sm text-gray-400">{student.email}</p>
          <div className="mt-1 flex gap-2">
            {student.domains.map((d) => (
              <span key={d.id} className="rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">
                {d.icon} {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Groups */}
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <span key={g.id} className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
              {g.name}
            </span>
          ))}
        </div>
      )}

      {/* Domain progress */}
      {domainProgress.map((dp) => (
        <div key={dp.domain.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">
            {dp.domain.icon} {dp.domain.name}
          </h3>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-4">
            <StatBox label={t("accuracy")} value={`${dp.progress.accuracy}%`} />
            <StatBox label={t("streak")} value={String(dp.gamification.currentStreak)} />
            <StatBox label="XP" value={String(dp.gamification.totalXp)} />
            <StatBox label={t("topics")} value={String(dp.progress.topicsStudied)} />
            <StatBox label={t("level")} value={dp.gamification.level} />
          </div>

          {/* Predictive analytics */}
          <PredictiveCard
            prediction={{
              ...dp.risk,
              studentName: student.name,
              domain: dp.domain,
            }}
          />

          {/* Weak areas */}
          {dp.weakAreas.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">{t("weakAreas")}</h4>
              <div className="space-y-1">
                {dp.weakAreas.map((w) => (
                  <div
                    key={`${w.subject}-${w.topic}`}
                    className="flex items-center justify-between rounded bg-gray-800 px-3 py-2"
                  >
                    <span className="text-sm text-white">
                      {w.subject} / {w.topic}
                    </span>
                    <span className="text-sm text-red-400">{w.errorRate}% errors</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent sessions */}
          {dp.sessions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">{t("recentSessions")}</h4>
              <div className="space-y-1">
                {dp.sessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded bg-gray-800 px-3 py-2"
                  >
                    <span className="text-sm text-white capitalize">{s.type}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">
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

          {/* Exam history */}
          {dp.examHistory.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">{t("examHistory")}</h4>
              <div className="space-y-1">
                {dp.examHistory.map((e, i) => (
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
      ))}

      {/* Goals */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">{t("goals")}</h3>
        {goals.length === 0 ? (
          <p className="text-sm text-gray-500">{t("noGoals")}</p>
        ) : (
          <div className="space-y-2">
            {goals.map((g) => (
              <div
                key={g.id}
                className={`flex items-center justify-between rounded bg-gray-800 px-3 py-2 ${
                  g.isCompleted ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      g.isCompleted ? "bg-green-400" : "bg-yellow-400"
                    }`}
                  />
                  <span className="text-sm text-white">{g.title}</span>
                </div>
                {g.targetDate && (
                  <span className="text-xs text-gray-500">
                    {new Date(g.targetDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-800 p-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
