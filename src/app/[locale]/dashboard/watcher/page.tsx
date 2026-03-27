"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { StudentProgressCard } from "@/components/watcher/student-progress-card";

interface StudentSummary {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  domains: { id: string; name: string; slug: string; icon: string | null }[];
  sessions: unknown[];
  progress: { totalAttempts: number; accuracy: number; topicsStudied: number; correctAttempts: number };
  weakAreas: { subject: string; topic: string; errorRate: number; suggestion: string | null }[];
  gamification: { totalXp: number; currentStreak: number; longestStreak: number; level: string };
  examHistory: { score: number | null; passed: boolean | null; submittedAt: Date | null }[];
}

export default function WatcherDashboardPage() {
  const t = useTranslations("watcher");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/watcher")
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(
    (s) =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("title")}</h1>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchStudents")}
          className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">{t("loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">{t("noStudents")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((student) => (
            <StudentProgressCard
              key={student.id}
              student={student}
              linkBase="/dashboard/watcher"
            />
          ))}
        </div>
      )}
    </div>
  );
}
