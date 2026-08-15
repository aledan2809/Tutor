"use client";

import { useState } from "react";
import type { DifficultyAnswer, TimeAnswer } from "@/lib/sprint-adapt";

interface SprintFeedbackFormProps {
  sessionId: string;
  domainSlug: string;
  /** Called with the server's adaptation notes once the answers are accepted. */
  onDone: (notes: string[]) => void;
}

const DIFFICULTY_OPTIONS: { value: DifficultyAnswer; emoji: string; label: string }[] = [
  { value: "easy", emoji: "😌", label: "Prea ușor" },
  { value: "ok", emoji: "👍", label: "Cam bine" },
  { value: "hard", emoji: "😰", label: "Prea greu" },
];

const TIME_OPTIONS: { value: TimeAnswer; emoji: string; label: string }[] = [
  { value: "loose", emoji: "🐢", label: "Prea mult timp" },
  { value: "ok", emoji: "👍", label: "Cam bine" },
  { value: "tight", emoji: "⚡", label: "Prea puțin timp" },
];

/**
 * The mandatory debrief. Two taps, no free text, no skip button — the answers
 * are what set the next session's difficulty and clock, so the results are held
 * behind it rather than offered alongside it.
 */
export function SprintFeedbackForm({ sessionId, domainSlug, onDone }: SprintFeedbackFormProps) {
  const [difficulty, setDifficulty] = useState<DifficultyAnswer | null>(null);
  const [time, setTime] = useState<TimeAnswer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = difficulty !== null && time !== null;

  const submit = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/${domainSlug}/session/sprint-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, difficulty, time }),
      });
      if (!res.ok) {
        setError("Nu am putut trimite răspunsul. Mai încearcă o dată.");
        return;
      }
      const data = await res.json();
      onDone(Array.isArray(data.notes) ? data.notes : []);
    } catch {
      setError("Conexiune întreruptă. Mai încearcă o dată.");
    } finally {
      setSubmitting(false);
    }
  };

  const rowClass =
    "grid grid-cols-3 gap-2";
  const btnClass = (selected: boolean) =>
    `flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center text-xs font-medium transition-colors ${
      selected
        ? "border-blue-500 bg-blue-600/20 text-white"
        : "border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-700"
    }`;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-white">Cum a fost?</h1>
        <p className="mt-1 text-sm text-gray-400">
          Două întrebări — după ele reglăm dificultatea și timpul pentru data viitoare.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-300">Dificultatea exercițiilor</legend>
        <div className={rowClass}>
          {DIFFICULTY_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={difficulty === o.value}
              onClick={() => setDifficulty(o.value)}
              className={btnClass(difficulty === o.value)}
            >
              <span className="text-2xl" aria-hidden="true">
                {o.emoji}
              </span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-300">Timpul la fiecare exercițiu</legend>
        <div className={rowClass}>
          {TIME_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={time === o.value}
              onClick={() => setTime(o.value)}
              className={btnClass(time === o.value)}
            >
              <span className="text-2xl" aria-hidden="true">
                {o.emoji}
              </span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="rounded-lg border border-red-700 bg-red-900/20 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={!ready || submitting}
        className="min-h-[48px] w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Se trimite…" : ready ? "Vezi rezultatele" : "Alege ambele răspunsuri"}
      </button>
    </div>
  );
}
