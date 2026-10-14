"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChildChapter } from "@/components/watcher/child-chapter";
import { ReportsManager } from "@/components/watcher/reports-manager";
import { HowItWorks } from "@/components/ui/how-it-works";
import { HOW_IT_WORKS } from "@/content/help";
import { useLocale } from "next-intl";

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
  const locale = useLocale();
  const t = useTranslations("watcher");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState("");

  // An error (e.g. 429) is said as one — it used to read „no students to watch” (audit B1).
  const load = () => {
    setLoading(true);
    setLoadFailed(false);
    fetch("/api/dashboard/watcher")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => setStudents(data.students ?? []))
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

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

      <HowItWorks storageKey="watcher" steps={HOW_IT_WORKS.watcher[locale as "ro" | "en"].steps} moreHref={`/dashboard/ajutor#${HOW_IT_WORKS.watcher[locale as "ro" | "en"].more}`} />

      {/* Reports are about progress in subjects: none yet (a parent whose child has no subject) = no panel. */}
      {students.some((s) => s.domains.length > 0) && <ReportsManager />}

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
      ) : loadFailed ? (
        <div className="rounded-lg border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          {t("loadError")}{" "}
          <button type="button" onClick={load} className="ml-1 inline-flex min-h-[44px] items-center underline hover:no-underline">
            {t("retry")}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">{t("noStudents")}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => (
            <ChildChapter key={student.id} child={student} onSubjectsChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
