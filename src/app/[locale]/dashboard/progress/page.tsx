"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface ProgressData {
  overall: {
    totalAttempts: number;
    accuracy: number;
    topicsStudied: number;
    sessionsCompleted: number;
  };
  subjects: {
    subject: string;
    accuracy: number;
    totalAttempts: number;
    topicCount: number;
  }[];
  topics: {
    subject: string;
    topic: string;
    accuracy: number;
    totalAttempts: number;
    masteryLevel: number;
    nextReview: string | null;
    status: "not_enough_data" | "weak" | "good";
  }[];
  weakAreas: {
    subject: string;
    topic: string;
    errorRate: number;
    suggestion: string | null;
  }[];
  recentSessions: {
    id: string;
    type: string;
    score: number | null;
    startedAt: string;
    endedAt: string | null;
    questionsAnswered: number;
  }[];
}

export default function ProgressPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState(searchParams?.get("domain") || "aviation");
  const [domains, setDomains] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        if (d.enrolled) {
          const list = d.enrolled.map((e: { slug: string; name: string }) => ({
            slug: e.slug,
            name: e.name,
          }));
          setDomains(list);
          if (list.length > 0 && !list.find((l: { slug: string }) => l.slug === domain)) {
            setDomain(list[0].slug);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    fetch(`/api/${domain}/progress`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [domain]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-gray-500">
        Could not load progress data.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        {domains.length > 1 && (
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            {domains.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Attempts" value={data.overall.totalAttempts} />
        <StatCard label="Accuracy" value={`${data.overall.accuracy}%`} />
        <StatCard label="Topics Studied" value={data.overall.topicsStudied} />
        <StatCard
          label="Sessions"
          value={data.overall.sessionsCompleted}
        />
      </div>

      {/* Weak Areas */}
      {data.weakAreas.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-red-400">
            Weak Areas
          </h2>
          <div className="space-y-2">
            {data.weakAreas.map((w) => (
              <div
                key={`${w.subject}-${w.topic}`}
                className="flex items-center justify-between rounded-lg border border-red-900/50 bg-red-900/10 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-white">
                    {w.topic}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {w.subject}
                  </span>
                </div>
                <span className="text-sm font-semibold text-red-400">
                  {w.errorRate}% errors
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Subject Breakdown */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">By Subject</h2>
        <div className="space-y-2">
          {data.subjects.map((s) => (
            <div
              key={s.subject}
              className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {s.subject}
                </span>
                <span className="text-sm text-gray-400">
                  {s.accuracy}% accuracy
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-700">
                <div
                  className={`h-full rounded-full ${
                    s.accuracy >= 80
                      ? "bg-green-500"
                      : s.accuracy >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${s.accuracy}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {s.totalAttempts} attempts · {s.topicCount} topics
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Topics */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">
          Topic Details
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="pb-2 font-medium">Topic</th>
                <th className="pb-2 font-medium">Subject</th>
                <th className="pb-2 font-medium">Accuracy</th>
                <th className="pb-2 font-medium">Attempts</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.topics.map((t) => (
                <tr
                  key={`${t.subject}-${t.topic}`}
                  className="border-b border-gray-800/50"
                >
                  <td className="py-2 text-white">{t.topic}</td>
                  <td className="py-2 text-gray-400">{t.subject}</td>
                  <td className="py-2 text-gray-300">{t.accuracy}%</td>
                  <td className="py-2 text-gray-400">{t.totalAttempts}</td>
                  <td className="py-2">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Sessions */}
      {data.recentSessions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            Recent Sessions
          </h2>
          <div className="space-y-2">
            {data.recentSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium capitalize text-white">
                    {s.type}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {new Date(s.startedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">
                    {s.questionsAnswered} questions
                  </span>
                  {s.score !== null ? (
                    <span
                      className={`font-semibold ${
                        s.score >= 80
                          ? "text-green-400"
                          : s.score >= 60
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {s.score}%
                    </span>
                  ) : (
                    <span className="text-gray-500">In progress</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "not_enough_data" | "weak" | "good";
}) {
  const styles = {
    not_enough_data: "bg-gray-800 text-gray-400",
    weak: "bg-red-900/30 text-red-400",
    good: "bg-green-900/30 text-green-400",
  };
  const labels = {
    not_enough_data: "Not enough data",
    weak: "Weak",
    good: "Good",
  };

  return (
    <span className={`rounded px-2 py-0.5 text-xs ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
