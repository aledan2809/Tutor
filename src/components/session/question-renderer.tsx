"use client";

import { useState } from "react";

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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");

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

      {/* Question content */}
      <p className="text-lg text-white">{question.content}</p>

      {/* Multiple choice options */}
      {question.type === "MULTIPLE_CHOICE" && options && (
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => !disabled && setSelectedOption(opt.value)}
              disabled={disabled}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                selectedOption === opt.value
                  ? "border-blue-500 bg-blue-600/10 text-blue-400"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <span className="mr-3 font-semibold text-gray-500">
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt.label}
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
