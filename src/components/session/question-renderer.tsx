"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface QuestionOption {
  label: string;
  value: string;
}

interface QuestionData {
  id: string;
  content: string;
  type: "MULTIPLE_CHOICE" | "OPEN";
  options?: (QuestionOption | string)[] | null;
  subject: string;
  topic: string;
  difficulty: number;
  imageUrl?: string | null;
  passage?: string | null;
}

interface QuestionRendererProps {
  question: QuestionData;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function QuestionRenderer({
  question,
  onAnswer,
  disabled = false,
}: QuestionRendererProps) {
  const t = useTranslations("grile");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");
  const [showPassage, setShowPassage] = useState(false);

  const handleSubmit = () => {
    if (question.type === "MULTIPLE_CHOICE" && selectedOption) {
      onAnswer(selectedOption);
    } else if (question.type === "OPEN" && openAnswer.trim()) {
      onAnswer(openAnswer.trim());
    }
  };

  // Options can be string[] or {label, value}[] — normalize to {label, value}[]
  const rawOptions = question.options;
  const options: QuestionOption[] | null = rawOptions
    ? rawOptions.map((opt) =>
        typeof opt === "string"
          ? { label: opt, value: opt }
          : opt
      )
    : null;

  // Some legacy/AI-generated options stored the answer letter inline ("a) 10 ..."),
  // which double-letters with the A./B./C. the renderer adds. Strip a leading
  // single-letter prefix at DISPLAY time only (the submitted `value` is unchanged,
  // so answer matching against the key is unaffected).
  const displayLabel = (s: string) => s.replace(/^\s*[a-dA-D][).]\s+/, "");

  return (
    <div className="space-y-6">
      {/* Question metadata */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="rounded bg-gray-800 px-2 py-0.5">
          {question.subject}
        </span>
        <span className="rounded bg-gray-800 px-2 py-0.5">
          {question.topic}
        </span>
        <span className="rounded bg-gray-800 px-2 py-0.5">
          {"★".repeat(question.difficulty)}
          {"☆".repeat(5 - question.difficulty)}
        </span>
      </div>

      {/* Reading text (passage-dependent grile) — collapsible drawer */}
      {question.passage && (
        <div className="rounded-lg border border-gray-700 bg-gray-900/60">
          <button
            type="button"
            onClick={() => setShowPassage((v) => !v)}
            aria-expanded={showPassage}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            <span aria-hidden="true">📖</span>
            {showPassage ? t("hideText") : t("showText")}
            <span aria-hidden="true" className="ml-auto text-gray-500">{showPassage ? "▲" : "▼"}</span>
          </button>
          {showPassage && (
            <div className="max-h-72 overflow-y-auto whitespace-pre-line border-t border-gray-700 px-4 py-3 text-sm leading-relaxed text-gray-300">
              {question.passage}
            </div>
          )}
        </div>
      )}

      {/* Question content */}
      <p className="text-lg text-white">{question.content}</p>

      {/* Figure (geometry / chart items) — rendered on a white card so the black line
          drawings stay legible on the dark theme */}
      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt="Figura exercițiului"
          className="mx-auto max-h-[420px] w-auto max-w-full rounded-lg border border-gray-700 bg-white p-2"
        />
      )}

      {/* Multiple choice options */}
      {question.type === "MULTIPLE_CHOICE" && options && (
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => !disabled && setSelectedOption(opt.value)}
              disabled={disabled}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
                selectedOption === opt.value
                  ? "border-blue-500 bg-blue-600/10 text-blue-400"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <span className="mr-3 font-semibold text-gray-500">
                {String.fromCharCode(65 + idx)}.
              </span>
              {displayLabel(opt.label)}
            </button>
          ))}
        </div>
      )}

      {/* Open answer */}
      {question.type === "OPEN" && (
        <textarea
          value={openAnswer}
          onChange={(e) => setOpenAnswer(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer..."
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          rows={4}
        />
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={
          disabled ||
          (question.type === "MULTIPLE_CHOICE" && !selectedOption) ||
          (question.type === "OPEN" && !openAnswer.trim())
        }
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Submit Answer
      </button>
    </div>
  );
}
