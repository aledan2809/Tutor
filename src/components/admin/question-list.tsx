"use client";

import { Link } from "@/i18n/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useState } from "react";

interface Question {
  id: string;
  content: string;
  subject: string;
  topic: string;
  difficulty: number;
  type: string;
  source: string;
  status: string;
  createdAt: string;
  domain: { name: string; slug: string };
  tags: { id: string; name: string }[];
  createdBy: { name: string } | null;
}

interface Props {
  questions: Question[];
  domains: { id: string; name: string }[];
  total: number;
  page: number;
  limit: number;
  filters: { status?: string; domainId?: string; search?: string };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-900/50 text-yellow-400",
  APPROVED: "bg-green-900/50 text-green-400",
  PUBLISHED: "bg-blue-900/50 text-blue-400",
};

const difficultyLabels = ["", "Very Easy", "Easy", "Medium", "Hard", "Expert"];

export function QuestionList({ questions, domains, total, page, limit, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(filters.search || "");
  const totalPages = Math.ceil(total / limit);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Questions ({total})</h2>
        <Link
          href="/dashboard/admin/questions/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Question
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateFilter("search", search)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <select
          value={filters.status || ""}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="APPROVED">Approved</option>
          <option value="PUBLISHED">Published</option>
        </select>
        <select
          value={filters.domainId || ""}
          onChange={(e) => updateFilter("domainId", e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Domains</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-800 bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-gray-400">Content</th>
              <th className="px-4 py-3 text-gray-400">Domain</th>
              <th className="px-4 py-3 text-gray-400">Subject / Topic</th>
              <th className="px-4 py-3 text-gray-400">Diff.</th>
              <th className="px-4 py-3 text-gray-400">Type</th>
              <th className="px-4 py-3 text-gray-400">Source</th>
              <th className="px-4 py-3 text-gray-400">Status</th>
              <th className="px-4 py-3 text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {questions.map((q) => (
              <tr key={q.id} className="hover:bg-gray-900/50">
                <td className="max-w-xs truncate px-4 py-3 text-white">
                  {q.content.substring(0, 80)}...
                </td>
                <td className="px-4 py-3 text-gray-300">{q.domain.name}</td>
                <td className="px-4 py-3 text-gray-300">
                  <span className="text-white">{q.subject}</span>
                  <br />
                  <span className="text-xs text-gray-500">{q.topic}</span>
                </td>
                <td className="px-4 py-3 text-gray-300" title={difficultyLabels[q.difficulty]}>
                  {q.difficulty}/5
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs">
                  {q.type === "MULTIPLE_CHOICE" ? "MC" : "Open"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {q.source === "AI_GENERATED" ? "AI" : "Manual"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[q.status]}`}>
                    {q.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/admin/questions/${q.id}/edit`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No questions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateFilter("page", p.toString())}
              className={`rounded-lg px-3 py-1 text-sm ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
