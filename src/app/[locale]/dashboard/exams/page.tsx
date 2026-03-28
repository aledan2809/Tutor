"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

interface ExamFormat {
  id: string;
  name: string;
  description: string | null;
  timeLimit: number | null;
  questionCount: number;
  passingScore: number;
  format: unknown;
}

interface ExamHistoryEntry {
  id: string;
  formatName: string;
  mode: string;
  score: number | null;
  passed: boolean | null;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  timeTaken: number | null;
  totalQuestions: number | null;
  correct: number | null;
  passingScore: number;
  certificateUrl: string | null;
}

interface Trends {
  totalAttempts: number;
  averageScore: number | null;
  passRate: number | null;
  bestScore: number | null;
}

interface EnrolledDomain {
  id: string;
  name: string;
  slug: string;
}

export default function ExamsPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<EnrolledDomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [formats, setFormats] = useState<ExamFormat[]>([]);
  const [history, setHistory] = useState<ExamHistoryEntry[]>([]);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<Record<string, "PRACTICE" | "REAL">>({});
  const [historyTab, setHistoryTab] = useState<"all" | "passed" | "failed">("all");

  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        if (d.enrolled?.length) {
          setDomains(d.enrolled);
          setSelectedDomain(d.enrolled[0].slug);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDomain) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/${selectedDomain}/exam/formats`).then((r) => r.json()),
      fetch(`/api/${selectedDomain}/exam/history`).then((r) => r.json()),
    ])
      .then(([fmtData, histData]) => {
        setFormats(fmtData.formats || []);
        setHistory(histData.history || []);
        setTrends(histData.trends || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDomain]);

  const startExam = async (formatId: string) => {
    const mode = selectedMode[formatId] || "PRACTICE";
    setStarting(formatId);
    try {
      const res = await fetch(`/api/${selectedDomain}/exam/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formatId, mode }),
      });
      const data = await res.json();
      if (data.sessionId) {
        localStorage.setItem(
          `exam_${data.sessionId}`,
          JSON.stringify({ ...data, domainSlug: selectedDomain })
        );
        router.push(`/dashboard/exams/${data.sessionId}`);
      }
    } catch {
      // ignore
    } finally {
      setStarting(null);
    }
  };

  const filteredHistory = history.filter((entry) => {
    if (historyTab === "passed") return entry.passed === true;
    if (historyTab === "failed") return entry.passed === false;
    return true;
  });

  if (loading && domains.length === 0) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Exam Simulator</h1>
        {domains.length > 1 && (
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            {domains.map((d) => (
              <option key={d.slug} value={d.slug}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {domains.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
          Enroll in a domain to access exam simulations.
        </div>
      )}

      {/* Trends Overview */}
      {trends && trends.totalAttempts > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-2xl font-bold text-white">{trends.totalAttempts}</p>
            <p className="text-xs text-gray-500">Total Attempts</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {trends.averageScore !== null ? `${Math.round(trends.averageScore)}%` : "-"}
            </p>
            <p className="text-xs text-gray-500">Average Score</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {trends.passRate !== null ? `${Math.round(trends.passRate)}%` : "-"}
            </p>
            <p className="text-xs text-gray-500">Pass Rate</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {trends.bestScore !== null ? `${Math.round(trends.bestScore)}%` : "-"}
            </p>
            <p className="text-xs text-gray-500">Best Score</p>
          </div>
        </div>
      )}

      {/* Score Trend Mini-Chart */}
      {history.length >= 2 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-400">Score Trend</h3>
          <div className="flex h-24 items-end gap-1">
            {history
              .slice(0, 20)
              .reverse()
              .map((entry, i) => {
                const score = entry.score ?? 0;
                const height = Math.max(4, (score / 100) * 100);
                return (
                  <div
                    key={entry.id}
                    className="group relative flex-1"
                    title={`${Math.round(score)}% - ${new Date(entry.startedAt).toLocaleDateString()}`}
                  >
                    <div
                      className={`w-full rounded-t transition-colors ${
                        entry.passed ? "bg-green-600 group-hover:bg-green-500" : "bg-red-600 group-hover:bg-red-500"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    {/* Passing threshold line */}
                    {i === 0 && (
                      <div
                        className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-yellow-500/50"
                        style={{ bottom: `${entry.passingScore}%` }}
                      />
                    )}
                  </div>
                );
              })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-600">
            <span>Oldest</span>
            <span>Latest</span>
          </div>
        </div>
      )}

      {/* Exam Formats */}
      {formats.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">Available Exams</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {formats.map((fmt) => {
              const mode = selectedMode[fmt.id] || "PRACTICE";
              return (
                <div
                  key={fmt.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-5"
                >
                  <h3 className="mb-1 text-base font-semibold text-white">{fmt.name}</h3>
                  {fmt.description && (
                    <p className="mb-3 text-sm text-gray-400">{fmt.description}</p>
                  )}
                  <div className="mb-4 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>{fmt.questionCount} questions</span>
                    {fmt.timeLimit && <span>{fmt.timeLimit} min</span>}
                    <span>Pass: {fmt.passingScore}%</span>
                  </div>

                  {/* Mode Toggle */}
                  <div className="mb-3 flex rounded-lg border border-gray-700 p-0.5">
                    <button
                      onClick={() => setSelectedMode((prev) => ({ ...prev, [fmt.id]: "PRACTICE" }))}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        mode === "PRACTICE"
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Practice
                    </button>
                    <button
                      onClick={() => setSelectedMode((prev) => ({ ...prev, [fmt.id]: "REAL" }))}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        mode === "REAL"
                          ? "bg-red-600 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Real Exam
                    </button>
                  </div>

                  {mode === "PRACTICE" && (
                    <p className="mb-3 text-xs text-blue-400/70">
                      Hints enabled. Explanations shown after each answer.
                    </p>
                  )}
                  {mode === "REAL" && (
                    <p className="mb-3 text-xs text-red-400/70">
                      Timed. No hints or explanations. Simulates real exam conditions.
                    </p>
                  )}

                  <button
                    onClick={() => startExam(fmt.id)}
                    disabled={starting === fmt.id}
                    className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                      mode === "REAL"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {starting === fmt.id
                      ? "Starting..."
                      : mode === "REAL"
                        ? "Start Real Exam"
                        : "Start Practice"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {formats.length === 0 && domains.length > 0 && !loading && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
          No exam formats configured for this domain yet.
        </div>
      )}

      {/* Exam History */}
      {history.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Exam History</h2>
            <div className="flex rounded-lg border border-gray-700 p-0.5">
              {(["all", "passed", "failed"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHistoryTab(tab)}
                  className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    historyTab === tab
                      ? "bg-gray-700 text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{entry.formatName}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      entry.mode === "REAL"
                        ? "bg-red-900/30 text-red-400"
                        : "bg-blue-900/30 text-blue-400"
                    }`}>
                      {entry.mode}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>{new Date(entry.startedAt).toLocaleDateString()}</span>
                    {entry.timeTaken !== null && (
                      <span>{Math.round(entry.timeTaken)} min</span>
                    )}
                    {entry.correct !== null && entry.totalQuestions !== null && (
                      <span>{entry.correct}/{entry.totalQuestions} correct</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {entry.score !== null ? (
                    <>
                      <span
                        className={`text-sm font-semibold ${
                          entry.passed ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {Math.round(entry.score)}%
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          entry.passed
                            ? "bg-green-900/30 text-green-400"
                            : "bg-red-900/30 text-red-400"
                        }`}
                      >
                        {entry.passed ? "PASSED" : "FAILED"}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">{entry.status}</span>
                  )}
                  {entry.certificateUrl && (
                    <a
                      href={entry.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-green-900/30 px-2 py-0.5 text-xs text-green-400 hover:bg-green-900/50"
                    >
                      Cert
                    </a>
                  )}
                </div>
              </div>
            ))}
            {filteredHistory.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500">
                No {historyTab === "all" ? "" : historyTab} exams found.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
