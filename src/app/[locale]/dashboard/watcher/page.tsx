"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChildChapter } from "@/components/watcher/child-chapter";
import { ReportsManager } from "@/components/watcher/reports-manager";

interface StudentSummary {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  domains: { id: string; name: string; slug: string; icon: string | null }[];
  progress: { totalAttempts: number; accuracy: number; topicsStudied: number; correctAttempts: number };
  gamification: { totalXp: number; currentStreak: number; longestStreak: number; level: string };
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
      <h1 className="mb-1 text-2xl font-bold text-white">{t("title")}</h1>
      <p className="mb-6 text-sm text-gray-400">
        Fiecare copil are un capitol. Deschide-l pentru program, sesiuni și remindere.
      </p>

      <ReportsManager />

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
        <div className="space-y-3">
          {filtered.map((student) => (
            <ChildChapter key={student.id} child={student} />
          ))}
        </div>
      )}
    </div>
  );
}
