"use client";

import { Link } from "@/i18n/navigation";

interface Props {
  prevId: string | null;
  nextId: string | null;
  currentIndex: number;
  total: number;
  queryString: string;
}

export function QuestionNavigation({ prevId, nextId, currentIndex, total, queryString }: Props) {
  const qs = queryString ? `?${queryString}` : "";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">
        {currentIndex} / {total}
      </span>
      <Link
        href={prevId ? `/dashboard/admin/questions/${prevId}/edit${qs}` : "#"}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
          prevId
            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
            : "cursor-not-allowed bg-gray-900 text-gray-600"
        }`}
        aria-disabled={!prevId}
        onClick={(e) => !prevId && e.preventDefault()}
      >
        ← Prev
      </Link>
      <Link
        href={nextId ? `/dashboard/admin/questions/${nextId}/edit${qs}` : "#"}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
          nextId
            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
            : "cursor-not-allowed bg-gray-900 text-gray-600"
        }`}
        aria-disabled={!nextId}
        onClick={(e) => !nextId && e.preventDefault()}
      >
        Next →
      </Link>
    </div>
  );
}
