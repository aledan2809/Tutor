"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { StudentProgressCard } from "@/components/watcher/student-progress-card";

interface StudentEntry {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  domain: { id: string; name: string; slug: string };
  enrolledAt: string;
  sessions: unknown[];
  progress: { totalAttempts: number; accuracy: number; topicsStudied: number; correctAttempts: number };
  weakAreas: { subject: string; topic: string; errorRate: number; suggestion: string | null }[];
  gamification: { totalXp: number; currentStreak: number; longestStreak: number; level: string };
  examHistory: { score: number | null; passed: boolean | null; submittedAt: string | null }[];
  risk: { failureProbability: number; trend: string; factors: string[]; recommendation: string };
}

export default function InstructorStudentsPage() {
  const t = useTranslations("instructor");
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "risk" | "accuracy">("risk");

  useEffect(() => {
    fetch("/api/dashboard/instructor/students")
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students
    .filter(
      (s) =>
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "risk") return b.risk.failureProbability - a.risk.failureProbability;
      if (sortBy === "accuracy") return b.progress.accuracy - a.progress.accuracy;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("students")}</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchStudents")}
          className="max-w-md rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "risk" | "accuracy")}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="risk">{t("sortByRisk")}</option>
          <option value="accuracy">{t("sortByAccuracy")}</option>
          <option value="name">{t("sortByName")}</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">{t("loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">{t("noStudents")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((student) => (
            <div key={`${student.id}-${student.domain.id}`}>
              <StudentProgressCard
                student={{
                  ...student,
                  domains: [{ ...student.domain, icon: null }],
                }}
                linkBase="/dashboard/instructor/students"
              />
              {/* Risk badge */}
              <div className="mt-1 flex items-center gap-2 px-1">
                <span
                  className={`text-xs font-medium ${
                    student.risk.failureProbability > 60
                      ? "text-red-400"
                      : student.risk.failureProbability > 30
                        ? "text-yellow-400"
                        : "text-green-400"
                  }`}
                >
                  {t("failureRisk")}: {student.risk.failureProbability}%
                </span>
                <span className="text-xs text-gray-500">
                  {student.risk.trend === "declining"
                    ? "↓"
                    : student.risk.trend === "improving"
                      ? "↑"
                      : "→"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
