"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarkdownPreview } from "./markdown-preview";

interface Question {
  id: string;
  content: string;
  subject: string;
  topic: string;
  difficulty: number;
  type: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  source: string;
  domain: { name: string };
  createdBy: { name: string } | null;
}

export function ReviewQueue({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ content: string; correctAnswer: string; explanation: string }>({
    content: "",
    correctAnswer: "",
    explanation: "",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === questions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(questions.map((q) => q.id)));
    }
  }

  function startEdit(q: Question) {
    setEditing(q.id);
    setExpanded(q.id);
    setEditForm({
      content: q.content,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
    });
  }

  async function saveEdit(id: string) {
    setProcessing(id);
    try {
      await fetch(`/api/admin/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditing(null);
      router.refresh();
    } finally {
      setProcessing(null);
    }
  }

  async function handleAction(id: string, action: "approve" | "publish" | "delete") {
    setProcessing(id);
    try {
      if (action === "delete") {
        await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      } else {
        const status = action === "approve" ? "APPROVED" : "PUBLISHED";
        await fetch(`/api/admin/questions/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      }
      router.refresh();
    } finally {
      setProcessing(null);
    }
  }

  async function batchAction(action: "approve" | "delete") {
    if (selected.size === 0) return;
    const confirmMsg = action === "approve"
      ? `Approve ${selected.size} question(s)?`
      : `Delete ${selected.size} question(s)? This cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    setBatchProcessing(true);
    try {
      const promises = Array.from(selected).map((id) =>
        action === "approve"
          ? fetch(`/api/admin/questions/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "APPROVED" }),
            })
          : fetch(`/api/admin/questions/${id}`, { method: "DELETE" })
      );
      await Promise.all(promises);
      setSelected(new Set());
      router.refresh();
    } finally {
      setBatchProcessing(false);
    }
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
        No draft questions to review. All caught up!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch Actions Bar */}
      <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="rounded border border-gray-600 px-2.5 py-1 text-xs text-gray-400 hover:bg-gray-800"
          >
            {selected.size === questions.length ? "Deselect All" : "Select All"}
          </button>
          {selected.size > 0 && (
            <span className="text-xs text-gray-500">{selected.size} selected</span>
          )}
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => batchAction("approve")}
              disabled={batchProcessing}
              className="rounded-lg bg-green-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
            >
              {batchProcessing ? "Processing..." : `Approve (${selected.size})`}
            </button>
            <button
              onClick={() => batchAction("delete")}
              disabled={batchProcessing}
              className="rounded-lg border border-red-800 px-4 py-1.5 text-xs text-red-400 hover:bg-red-900/20 disabled:opacity-50"
            >
              Delete ({selected.size})
            </button>
          </div>
        )}
      </div>

      {questions.map((q) => (
        <div
          key={q.id}
          className={`rounded-xl border bg-gray-900 p-4 ${
            selected.has(q.id) ? "border-blue-600" : "border-gray-800"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={selected.has(q.id)}
              onChange={() => toggleSelect(q.id)}
              className="mt-1.5 rounded border-gray-600 bg-gray-800"
            />

            <div className="flex-1">
              <div className="mb-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-gray-800 px-2 py-0.5 text-gray-400">
                  {q.domain.name}
                </span>
                <span className="rounded bg-gray-800 px-2 py-0.5 text-gray-400">
                  {q.subject} / {q.topic}
                </span>
                <span className="rounded bg-gray-800 px-2 py-0.5 text-gray-400">
                  Diff: {q.difficulty}/5
                </span>
                <span className="rounded bg-purple-900/50 px-2 py-0.5 text-purple-400">
                  {q.source === "AI_GENERATED" ? "AI Generated" : "Manual"}
                </span>
                {q.createdBy && (
                  <span className="rounded bg-gray-800 px-2 py-0.5 text-gray-500">
                    by {q.createdBy.name}
                  </span>
                )}
              </div>

              <button
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                className="text-left w-full"
              >
                {editing === q.id ? null : (
                  <div className="text-white">
                    {expanded === q.id ? (
                      <MarkdownPreview content={q.content} />
                    ) : (
                      <p className="line-clamp-2">{q.content}</p>
                    )}
                  </div>
                )}
              </button>

              {/* Inline Edit Mode */}
              {editing === q.id && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Content (Markdown)</label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm((p) => ({ ...p, content: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Correct Answer</label>
                    <textarea
                      value={editForm.correctAnswer}
                      onChange={(e) => setEditForm((p) => ({ ...p, correctAnswer: e.target.value }))}
                      rows={2}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Explanation</label>
                    <textarea
                      value={editForm.explanation}
                      onChange={(e) => setEditForm((p) => ({ ...p, explanation: e.target.value }))}
                      rows={2}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(q.id)}
                      disabled={processing === q.id}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800"
                    >
                      Cancel Edit
                    </button>
                  </div>
                </div>
              )}

              {expanded === q.id && editing !== q.id && (
                <div className="mt-3 space-y-2 border-t border-gray-800 pt-3">
                  {q.type === "MULTIPLE_CHOICE" && q.options && (
                    <div>
                      <p className="text-xs text-gray-500">Options:</p>
                      <ul className="mt-1 space-y-1">
                        {(q.options as string[]).map((opt, i) => (
                          <li
                            key={i}
                            className={`text-sm ${
                              opt === q.correctAnswer
                                ? "font-medium text-green-400"
                                : "text-gray-300"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                            {opt === q.correctAnswer && " \u2713"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Correct Answer:</p>
                    <p className="text-sm text-green-400">{q.correctAnswer}</p>
                  </div>
                  {q.explanation && (
                    <div>
                      <p className="text-xs text-gray-500">Explanation:</p>
                      <p className="text-sm text-gray-300">{q.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="ml-2 flex flex-col gap-2">
              <button
                onClick={() => handleAction(q.id, "approve")}
                disabled={processing === q.id}
                className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => startEdit(q)}
                disabled={processing === q.id}
                className="rounded-lg border border-blue-700 px-3 py-1.5 text-center text-xs text-blue-400 hover:bg-blue-900/20 disabled:opacity-50"
              >
                {editing === q.id ? "Editing..." : "Edit"}
              </button>
              <button
                onClick={() => handleAction(q.id, "delete")}
                disabled={processing === q.id}
                className="rounded-lg border border-red-800 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
