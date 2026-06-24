"use client";

import { useState } from "react";

/**
 * Per-question 👍/👎 + optional comment. A 👎 reveals a comment box so the user
 * can say what's wrong — the review agent reads it. Resets per question (keyed by
 * questionId at the call site).
 */
export function QuestionFeedback({
  questionId,
  sessionId,
}: {
  questionId: string;
  sessionId?: string;
}) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [showComment, setShowComment] = useState(false);

  const send = async (r: "up" | "down", c?: string) => {
    setRating(r);
    try {
      await fetch(`/api/questions/${questionId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: r, comment: c, sessionId }),
      });
      if (r === "up" || c !== undefined) setSent(true);
    } catch {
      /* best-effort */
    }
  };

  if (sent) {
    return <p className="text-center text-xs text-gray-500">Mulțumim pentru feedback!</p>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Întrebarea e ok?</span>
        <button
          onClick={() => send("up")}
          className={`rounded-lg border px-2 py-1 transition-colors ${
            rating === "up" ? "border-green-500 bg-green-600/20 text-green-400" : "border-gray-700 hover:bg-gray-800"
          }`}
          aria-label="Întrebare bună"
        >
          👍
        </button>
        <button
          onClick={() => {
            setRating("down");
            setShowComment(true);
          }}
          className={`rounded-lg border px-2 py-1 transition-colors ${
            rating === "down" ? "border-red-500 bg-red-600/20 text-red-400" : "border-gray-700 hover:bg-gray-800"
          }`}
          aria-label="Problemă la întrebare"
        >
          👎
        </button>
      </div>

      {showComment && (
        <div className="w-full max-w-sm space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ce e în neregulă? (răspuns greșit, neclar, etc.)"
            rows={2}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
          />
          <button
            onClick={() => send("down", comment.trim())}
            className="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Trimite feedback
          </button>
        </div>
      )}
    </div>
  );
}
