"use client";

import { useState } from "react";

interface ExamFormat {
  id: string;
  name: string;
  description: string | null;
  timeLimit: number | null;
  questionCount: number;
  passingScore: number;
  format: unknown;
  isActive: boolean;
  _count: { examSessions: number };
}

export function ExamFormatManager({
  domainId,
  initialFormats,
}: {
  domainId: string;
  initialFormats: ExamFormat[];
}) {
  const [formats, setFormats] = useState(initialFormats);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    timeLimit: 60,
    questionCount: 30,
    passingScore: 70,
    subjects: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/exam-formats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId,
          name: form.name,
          description: form.description,
          timeLimit: form.timeLimit,
          questionCount: form.questionCount,
          passingScore: form.passingScore,
          format: {
            type: "multiple_choice",
            optionsCount: 4,
            shuffleOptions: true,
            shuffleQuestions: true,
            showExplanation: false,
            subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
          },
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setFormats([...formats, { ...created, _count: { examSessions: 0 } }]);
        setIsCreating(false);
        setForm({ name: "", description: "", timeLimit: 60, questionCount: 30, passingScore: 70, subjects: "" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch("/api/admin/exam-formats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    setFormats(formats.map((f) => (f.id === id ? { ...f, isActive: !f.isActive } : f)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{formats.length} exam formats configured</p>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {isCreating ? "Cancel" : "Create New Format"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-gray-700 bg-gray-900 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Subjects (comma-separated)</label>
              <input
                value={form.subjects}
                onChange={(e) => setForm({ ...form, subjects: e.target.value })}
                placeholder="Math, Physics, Psychology"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Time (min)</label>
                <input
                  type="number"
                  value={form.timeLimit}
                  onChange={(e) => setForm({ ...form, timeLimit: +e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Questions</label>
                <input
                  type="number"
                  value={form.questionCount}
                  onChange={(e) => setForm({ ...form, questionCount: +e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Pass %</label>
                <input
                  type="number"
                  value={form.passingScore}
                  onChange={(e) => setForm({ ...form, passingScore: +e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Format"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {formats.map((fmt) => (
          <div
            key={fmt.id}
            className={`rounded-lg border p-4 ${fmt.isActive ? "border-gray-700 bg-gray-900" : "border-gray-800 bg-gray-950 opacity-60"}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{fmt.name}</h3>
                {fmt.description && <p className="mt-1 text-sm text-gray-400">{fmt.description}</p>}
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>{fmt.timeLimit} min</span>
                  <span>{fmt.questionCount} questions</span>
                  <span>Pass: {fmt.passingScore}%</span>
                  <span>{fmt._count.examSessions} sessions</span>
                  {(fmt.format as { subjects?: string[] })?.subjects && (
                    <span>Subjects: {((fmt.format as { subjects?: string[] }).subjects || []).join(", ")}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleActive(fmt.id, fmt.isActive)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  fmt.isActive ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-500"
                }`}
              >
                {fmt.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
