"use client";

interface ExamQuestionNavProps {
  total: number;
  current: number;
  answered: Set<number>;
  flagged: Set<number>;
  onSelect: (index: number) => void;
}

export function ExamQuestionNav({
  total,
  current,
  answered,
  flagged,
  onSelect,
}: ExamQuestionNavProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">Questions</h3>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600" /> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-600" /> Answered
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-yellow-600" /> Flagged
          </span>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === current;
          const isAnswered = answered.has(i);
          const isFlagged = flagged.has(i);

          let bg = "bg-gray-800 text-gray-500 hover:bg-gray-700";
          if (isCurrent) bg = "bg-blue-600 text-white ring-2 ring-blue-400";
          else if (isFlagged && isAnswered) bg = "bg-yellow-700 text-yellow-200";
          else if (isFlagged) bg = "bg-yellow-600/30 text-yellow-400 border border-yellow-600";
          else if (isAnswered) bg = "bg-green-700/50 text-green-300";

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`flex h-8 w-full items-center justify-center rounded text-xs font-medium transition-colors ${bg}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>{answered.size}/{total} answered</span>
        {flagged.size > 0 && <span>{flagged.size} flagged</span>}
      </div>
    </div>
  );
}
