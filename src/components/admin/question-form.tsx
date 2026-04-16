"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarkdownPreview } from "./markdown-preview";

interface Props {
  domains: { id: string; name: string }[];
  question?: {
    id: string;
    domainId: string;
    subject: string;
    topic: string;
    difficulty: number;
    type: string;
    content: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string | null;
    sourceReference: string | null;
    status: string;
    tags: { id: string; name: string }[];
  };
}

export function QuestionForm({ domains, question }: Props) {
  const router = useRouter();
  const isEdit = !!question;

  const [form, setForm] = useState({
    domainId: question?.domainId || domains[0]?.id || "",
    subject: question?.subject || "",
    topic: question?.topic || "",
    difficulty: question?.difficulty || 3,
    type: question?.type || "MULTIPLE_CHOICE",
    content: question?.content || "",
    options: question?.options || ["", "", "", ""],
    correctAnswer: question?.correctAnswer || "",
    explanation: question?.explanation || "",
    sourceReference: question?.sourceReference || "",
    tags: question?.tags?.map((t) => t.name).join(", ") || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm((prev) => ({ ...prev, options: newOptions }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      ...form,
      options: form.type === "MULTIPLE_CHOICE" ? form.options.filter(Boolean) : undefined,
      tags: tags.length > 0 ? tags : undefined,
      source: "MANUAL",
    };

    try {
      const url = isEdit
        ? `/api/admin/questions/${question.id}`
        : "/api/admin/questions";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.fieldErrors ? JSON.stringify(data.error.fieldErrors) : data.error || "Failed to save");
        return;
      }

      router.push("/dashboard/admin/questions");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !confirm("Delete this question?")) return;
    await fetch(`/api/admin/questions/${question.id}`, { method: "DELETE" });
    router.push("/dashboard/admin/questions");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Domain</label>
          <select
            value={form.domainId}
            onChange={(e) => updateField("domainId", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            required
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Type</label>
          <select
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="OPEN">Open Question</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Subject</label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => updateField("subject", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Aviation Safety"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Topic</label>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => updateField("topic", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Emergency Procedures"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Difficulty (1-5)</label>
          <input
            type="range"
            min={1}
            max={5}
            value={form.difficulty}
            onChange={(e) => updateField("difficulty", parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 - Very Easy</span>
            <span className="text-white font-medium">{form.difficulty}</span>
            <span>5 - Expert</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Tags (comma separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => updateField("tags", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="safety, procedures, ATPL"
          />
        </div>
      </div>

      {/* Content with markdown */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm text-gray-400">Question Content (Markdown)</label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>
        {showPreview ? (
          <div className="min-h-[150px] rounded-lg border border-gray-700 bg-gray-800 p-4">
            <MarkdownPreview content={form.content} />
          </div>
        ) : (
          <textarea
            value={form.content}
            onChange={(e) => updateField("content", e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="Write your question in markdown. Supports **bold**, `code`, ```code blocks```"
            required
          />
        )}
      </div>

      {/* Options for multiple choice */}
      {form.type === "MULTIPLE_CHOICE" && (
        <div>
          <label className="mb-2 block text-sm text-gray-400">Answer Options</label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-sm text-gray-500">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, options: [...p.options, ""] }))}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300"
          >
            + Add option
          </button>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-gray-400">Correct Answer</label>
        <textarea
          value={form.correctAnswer}
          onChange={(e) => updateField("correctAnswer", e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          placeholder="The correct answer or expected response"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-400">Explanation (optional)</label>
        <textarea
          value={form.explanation}
          onChange={(e) => updateField("explanation", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          placeholder="Explain why this is the correct answer"
        />
      </div>

      {/* Source Reference — editable, visible only on edit */}
      {isEdit && (
        <div>
          <label className="mb-1 block text-xs text-amber-400">
            Source Reference (book page, Q number, answer page — visible only to Admin/Instructor)
          </label>
          <input
            type="text"
            value={form.sourceReference}
            onChange={(e) => updateField("sourceReference", e.target.value)}
            placeholder="e.g., Udroiu, Teste grila Drept Penal ed.4, 2023, p.3-4, Q11 / Answers p.8-9"
            className="w-full rounded-lg border border-amber-800/50 bg-amber-900/10 px-3 py-2 text-sm text-amber-200 placeholder-amber-700 focus:border-amber-500 focus:outline-none"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : isEdit ? "Update Question" : "Create Question"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
          >
            Delete
          </button>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
