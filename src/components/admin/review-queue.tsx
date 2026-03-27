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
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "delete") {
    setProcessing(id);
    try {
      if (action === "approve") {
        await fetch(`/api/admin/questions/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "APPROVED" }),
        });
      } else {
        await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      }
      router.refresh();
    } finally {
      setProcessing(null);
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
      {questions.map((q) => (
        <div
          key={q.id}
          className="rounded-xl border border-gray-800 bg-gray-900 p-4"
        >
          <div className="flex items-start justify-between">
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
              </div>

              <button
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                className="text-left"
              >
                <div className="text-white">
                  {expanded === q.id ? (
                    <MarkdownPreview content={q.content} />
                  ) : (
                    <p className="line-clamp-2">{q.content}</p>
                  )}
                </div>
              </button>

              {expanded === q.id && (
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
                            {opt === q.correctAnswer && " ✓"}
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

            <div className="ml-4 flex flex-col gap-2">
              <button
                onClick={() => handleAction(q.id, "approve")}
                disabled={processing === q.id}
                className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                Approve
              </button>
              <a
                href={`/dashboard/admin/questions/${q.id}/edit`}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-center text-xs text-gray-400 hover:bg-gray-800"
              >
                Edit
              </a>
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
