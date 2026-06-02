"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// MarkdownPreview removed — showing plain text for faster review

interface MeshFlag {
  lens: string;
  defectClass: string;
  confidence: number;
  details: string;
}

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
  sourceReference: string | null;
  source: string;
  meshConfidence: number | null;
  meshFlags: MeshFlag[] | null;
  domain: { name: string };
  createdBy: { name: string } | null;
}

export function ReviewQueue({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [fixing, setFixing] = useState<string | null>(null);
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

  async function handleMeshFix(id: string) {
    setFixing(id);
    try {
      const res = await fetch(`/api/admin/questions/${id}/mesh-fix`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setFixing(null);
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

      {questions.map((q) => {
        const isExpanded = expanded === q.id;
        const isEditing = editing === q.id;
        // Match correctAnswer to option: correctAnswer has "a) text", options are just "text"
        const correctLetter = q.correctAnswer?.match(/^([abcd])\)/)?.[1] || null;
        const correctIndex = correctLetter ? correctLetter.charCodeAt(0) - 97 : -1;

        return (
        <div
          key={q.id}
          className={`rounded-xl border bg-gray-900 ${
            selected.has(q.id) ? "border-blue-600" : "border-gray-800"
          }`}
        >
          {/* Header row: checkbox + tags + mesh confidence */}
          <div className="flex items-center gap-2 border-b border-gray-800/50 px-4 py-2">
            <input
              type="checkbox"
              checked={selected.has(q.id)}
              onChange={() => toggleSelect(q.id)}
              className="rounded border-gray-600 bg-gray-800"
            />
            <div className="flex flex-1 flex-wrap gap-1.5 text-xs">
              <span className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-400">{q.subject} / {q.topic}</span>
              <span className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-500">Diff: {q.difficulty}/5</span>
              {q.meshConfidence !== null && q.meshConfidence !== undefined && (
                <span className={`rounded px-1.5 py-0.5 font-medium ${
                  q.meshConfidence >= 0.85 ? "bg-green-900/30 text-green-400" :
                  q.meshConfidence >= 0.5 ? "bg-yellow-900/30 text-yellow-400" :
                  "bg-red-900/30 text-red-400"
                }`}>
                  Mesh: {Math.round(q.meshConfidence * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Mesh flags + recommendation (if any) */}
          {q.meshFlags && (q.meshFlags as MeshFlag[]).length > 0 && (
            <div className="border-b border-gray-800/50 px-4 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {q.meshConfidence !== null && q.meshConfidence < 0.5 && (
                  <span className="rounded bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-300">
                    ⚠ Escalate
                  </span>
                )}
                {q.meshConfidence !== null && q.meshConfidence >= 0.5 && q.meshConfidence < 0.85 && (
                  <span className="rounded bg-yellow-900/40 px-2 py-0.5 text-xs font-medium text-yellow-300">
                    Review Prioritized
                  </span>
                )}
                {(q.meshFlags as MeshFlag[]).map((flag, fi) => (
                  <span
                    key={fi}
                    title={flag.details}
                    className={`cursor-help rounded px-2 py-0.5 text-xs ${
                      flag.defectClass === "grounding-hallucination" || flag.defectClass === "no-correct"
                        ? "bg-red-900/30 text-red-300"
                        : flag.defectClass === "accidentally-true-distractor" || flag.defectClass === "named-entity-thin"
                        ? "bg-orange-900/30 text-orange-300"
                        : "bg-yellow-900/30 text-yellow-300"
                    }`}
                  >
                    {flag.lens}: {flag.defectClass} ({Math.round(flag.confidence * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content — always show full question + options */}
          <div className="px-4 py-3">
            {!isEditing && (
              <>
                <p className="text-sm text-white">{q.content}</p>

                {/* Options — always visible */}
                {q.type === "MULTIPLE_CHOICE" && q.options && (
                  <ul className="mt-2 space-y-1">
                    {(q.options as string[]).map((opt, i) => {
                      const isCorrect = i === correctIndex;
                      return (
                        <li key={i} className={`rounded px-2 py-1 text-sm ${
                          isCorrect
                            ? "bg-green-900/20 font-medium text-green-400"
                            : "text-gray-300"
                        }`}>
                          {String.fromCharCode(97 + i)}) {opt}
                          {isCorrect && " \u2713"}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Correct answer if no options match */}
                {correctIndex === -1 && q.correctAnswer && q.correctAnswer !== "To be determined" && (
                  <p className="mt-2 text-sm text-green-400">Answer: {q.correctAnswer}</p>
                )}
                {q.correctAnswer === "To be determined" && (
                  <p className="mt-2 text-xs text-amber-400">Answer not yet mapped</p>
                )}

                {/* Source Reference */}
                {q.sourceReference && (
                  <p className="mt-2 text-xs text-amber-500/70">{q.sourceReference}</p>
                )}

                {/* Explanation (collapsible) */}
                {q.explanation && isExpanded && (
                  <div className="mt-2 border-t border-gray-800 pt-2">
                    <p className="text-xs text-gray-500">Explanation:</p>
                    <p className="text-sm text-gray-300">{q.explanation}</p>
                  </div>
                )}
              </>
            )}

            {/* Inline Edit Mode */}
            {isEditing && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Content</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm((p) => ({ ...p, content: e.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
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
                  <button onClick={() => saveEdit(q.id)} disabled={processing === q.id}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                    Save
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons — bottom bar, full width on mobile */}
          <div className="flex items-center gap-2 border-t border-gray-800/50 px-4 py-2">
            <button onClick={() => handleAction(q.id, "approve")} disabled={processing === q.id}
              className="flex-1 rounded-lg bg-green-700 py-1.5 text-center text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50 sm:flex-none sm:px-4">
              Approve
            </button>
            <button onClick={() => handleAction(q.id, "publish")} disabled={processing === q.id}
              className="flex-1 rounded-lg bg-blue-700 py-1.5 text-center text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50 sm:flex-none sm:px-4">
              Publish
            </button>
            <button onClick={() => startEdit(q)} disabled={processing === q.id}
              className="flex-1 rounded-lg border border-gray-700 py-1.5 text-center text-xs text-gray-400 hover:bg-gray-800 disabled:opacity-50 sm:flex-none sm:px-4">
              Edit
            </button>
            {q.meshFlags && (q.meshFlags as MeshFlag[]).length > 0 && q.meshConfidence !== null && q.meshConfidence < 0.85 && (
              <button onClick={() => handleMeshFix(q.id)} disabled={fixing === q.id || processing === q.id}
                className="flex-1 rounded-lg border border-purple-700 py-1.5 text-center text-xs text-purple-300 hover:bg-purple-900/20 disabled:opacity-50 sm:flex-none sm:px-4">
                {fixing === q.id ? "Fixing..." : "Auto-Fix"}
              </button>
            )}
            <button onClick={() => handleAction(q.id, "delete")} disabled={processing === q.id}
              className="rounded-lg border border-red-800 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 disabled:opacity-50">
              Del
            </button>
          </div>
        </div>
        );
      })}
    </div>
  );
}
