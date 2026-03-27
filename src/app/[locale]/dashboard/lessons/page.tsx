"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";

interface Lesson {
  id: string;
  name: string;
  type: string;
  subject: string;
  topic: string;
  description: string | null;
  difficulty: number | null;
  estimatedMinutes: number | null;
  progress: {
    mastery: number;
    accuracy: number;
    lastPracticed: string | null;
  } | null;
}

interface LessonsResponse {
  lessons: Lesson[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    subjects: string[];
    topics: string[];
  };
}

interface EnrolledDomain {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export default function LessonsPage() {
  const [domains, setDomains] = useState<EnrolledDomain[]>([]);
  const [activeDomainId, setActiveDomainId] = useState<string>("");
  const [data, setData] = useState<LessonsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        if (d.enrolled?.length) {
          setDomains(d.enrolled);
          setActiveDomainId(d.enrolled[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchLessons = useCallback(() => {
    if (!activeDomainId) return;
    setLoading(true);
    const params = new URLSearchParams({ domainId: activeDomainId, page: String(page), limit: "20" });
    if (subject) params.set("subject", subject);
    if (topic) params.set("topic", topic);

    fetch(`/api/student/lessons?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeDomainId, subject, topic, page]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Lessons</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {domains.length > 1 && (
          <select
            value={activeDomainId}
            onChange={(e) => { setActiveDomainId(e.target.value); setPage(1); setSubject(""); setTopic(""); }}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}

        {data?.filters.subjects && data.filters.subjects.length > 0 && (
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            <option value="">All Subjects</option>
            {data.filters.subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {data?.filters.topics && data.filters.topics.length > 0 && (
          <select
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            <option value="">All Topics</option>
            {data.filters.topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Lessons grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : !data || data.lessons.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No lessons available.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/dashboard/lessons/${lesson.id}`}
                className="group rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-gray-700"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-sm font-medium text-white group-hover:text-blue-400">
                    {lesson.name}
                  </h3>
                  {lesson.difficulty && (
                    <span className="ml-2 shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                      Lv.{lesson.difficulty}
                    </span>
                  )}
                </div>
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  {lesson.subject && <span className="rounded bg-gray-800 px-1.5 py-0.5">{lesson.subject}</span>}
                  {lesson.topic && <span className="rounded bg-gray-800 px-1.5 py-0.5">{lesson.topic}</span>}
                  {lesson.estimatedMinutes && <span>{lesson.estimatedMinutes} min</span>}
                </div>
                {lesson.description && (
                  <p className="mb-3 line-clamp-2 text-xs text-gray-400">{lesson.description}</p>
                )}
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-gray-700">
                  <div
                    className={`h-full rounded-full ${
                      (lesson.progress?.mastery ?? 0) >= 80
                        ? "bg-green-500"
                        : (lesson.progress?.mastery ?? 0) >= 40
                          ? "bg-yellow-500"
                          : "bg-gray-600"
                    }`}
                    style={{ width: `${lesson.progress?.mastery ?? 0}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>{lesson.progress?.mastery ?? 0}% mastery</span>
                  {lesson.progress?.accuracy !== undefined && (
                    <span>{lesson.progress.accuracy}% accuracy</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                {data.page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
