"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  domainId: string;
  config: {
    questionTypes: string[];
    timeLimit: number | null;
    questionCount: number;
    passingScore: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
  } | null;
}

export function ExamConfigForm({ domainId, config }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    questionTypes: config?.questionTypes || ["MULTIPLE_CHOICE"],
    timeLimit: config?.timeLimit || null,
    questionCount: config?.questionCount || 20,
    passingScore: config?.passingScore || 75,
    shuffleQuestions: config?.shuffleQuestions ?? true,
    shuffleOptions: config?.shuffleOptions ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggleType(type: string) {
    setForm((prev) => {
      const types = prev.questionTypes.includes(type)
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type];
      return { ...prev, questionTypes: types.length > 0 ? types : prev.questionTypes };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/domains/${domainId}/exam-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-3 text-sm text-green-400">
          Exam configuration saved.
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm text-gray-400">Question Types</label>
        <div className="flex gap-3">
          {["MULTIPLE_CHOICE", "OPEN"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                form.questionTypes.includes(type)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {type === "MULTIPLE_CHOICE" ? "Multiple Choice" : "Open Questions"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Time Limit (minutes)</label>
          <input
            type="number"
            min={0}
            value={form.timeLimit || ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, timeLimit: e.target.value ? parseInt(e.target.value) : null }))
            }
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="No limit"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Question Count</label>
          <input
            type="number"
            min={1}
            max={200}
            value={form.questionCount}
            onChange={(e) => setForm((p) => ({ ...p, questionCount: parseInt(e.target.value) || 20 }))}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Passing Score (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.passingScore}
            onChange={(e) => setForm((p) => ({ ...p, passingScore: parseFloat(e.target.value) || 75 }))}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="shuffleQuestions"
            checked={form.shuffleQuestions}
            onChange={(e) => setForm((p) => ({ ...p, shuffleQuestions: e.target.checked }))}
            className="rounded border-gray-700 bg-gray-800"
          />
          <label htmlFor="shuffleQuestions" className="text-sm text-gray-400">
            Shuffle question order
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="shuffleOptions"
            checked={form.shuffleOptions}
            onChange={(e) => setForm((p) => ({ ...p, shuffleOptions: e.target.checked }))}
            className="rounded border-gray-700 bg-gray-800"
          />
          <label htmlFor="shuffleOptions" className="text-sm text-gray-400">
            Shuffle answer options
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Exam Config"}
      </button>
    </form>
  );
}
