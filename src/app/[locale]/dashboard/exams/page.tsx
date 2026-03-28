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
}

interface ExamHistoryEntry {
  id: string;
  formatId: string;
  formatName: string;
  score: number | null;
  passed: boolean | null;
  status: string;
  startedAt: string;
  submittedAt: string | null;
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
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

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
      fetch(`/api/${selectedDomain}/exam/start`).then((r) => r.json()),
      fetch(`/api/${selectedDomain}/exam/history`).then((r) => r.json()),
    ])
      .then(([fmtData, histData]) => {
        setFormats(fmtData.formats || []);
        setHistory(histData.sessions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDomain]);

  const startExam = async (formatId: string) => {
    setStarting(true);
    try {
      const res = await fetch(`/api/${selectedDomain}/exam/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formatId, mode: "PRACTICE" }),
      });
      const data = await res.json();
      if (data.sessionId) {
        localStorage.setItem(
          `exam_${data.sessionId}`,
          JSON.stringify({ ...data, domainSlug: selectedDomain })
        );
        router.push(`/dashboard/practice/${data.sessionId}`);
      }
    } catch {
      // ignore
    } finally {
      setStarting(false);
    }
  };

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

      {/* Exam Formats */}
      {formats.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">Available Exams</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {formats.map((fmt) => (
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
                <button
                  onClick={() => startExam(fmt.id)}
                  disabled={starting}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {starting ? "Starting..." : "Start Exam"}
                </button>
              </div>
            ))}
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
          <h2 className="mb-3 text-lg font-semibold text-white">Exam History</h2>
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{entry.formatName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(entry.startedAt).toLocaleDateString()}
                  </p>
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
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
