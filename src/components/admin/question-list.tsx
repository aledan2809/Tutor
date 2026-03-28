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
  filters: { status?: string; domainId?: string; search?: string; source?: string };
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const totalPages = Math.ceil(total / limit);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

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

  async function bulkAction(action: "approve" | "publish" | "delete") {
    if (selected.size === 0) return;
    const labels = { approve: "Approve", publish: "Publish", delete: "Delete" };
    if (!confirm(`${labels[action]} ${selected.size} question(s)?`)) return;

    setBulkProcessing(true);
    try {
      const promises = Array.from(selected).map((id) => {
        if (action === "delete") {
          return fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
        }
        const status = action === "approve" ? "APPROVED" : "PUBLISHED";
        return fetch(`/api/admin/questions/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      });
      await Promise.all(promises);
      setSelected(new Set());
      router.refresh();
    } finally {
      setBulkProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Questions ({total})</h2>
        <div className="flex gap-2">
          <Link
            href="/dashboard/admin/questions/import"
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            Import
          </Link>
          <Link
            href="/dashboard/admin/questions/generate"
            className="rounded-lg border border-purple-700 px-4 py-2 text-sm text-purple-400 hover:bg-purple-900/20"
          >
            AI Generate
          </Link>
          <Link
            href="/dashboard/admin/questions/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Question
          </Link>
        </div>
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
          value={filters.source || ""}
          onChange={(e) => updateFilter("source", e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Sources</option>
          <option value="MANUAL">Manual</option>
          <option value="AI_GENERATED">AI Generated</option>
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

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-800/50 bg-blue-900/10 px-4 py-2.5">
          <span className="text-sm text-blue-300">{selected.size} selected</span>
          <button
            onClick={() => bulkAction("approve")}
            disabled={bulkProcessing}
            className="rounded bg-green-700 px-3 py-1 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => bulkAction("publish")}
            disabled={bulkProcessing}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Publish
          </button>
          <button
            onClick={() => bulkAction("delete")}
            disabled={bulkProcessing}
            className="rounded border border-red-800 px-3 py-1 text-xs text-red-400 hover:bg-red-900/20 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-gray-500 hover:text-gray-300"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-800 bg-gray-900/50">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === questions.length && questions.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-600 bg-gray-800"
                />
              </th>
              <th className="px-4 py-3 text-gray-400">Content</th>
              <th className="px-4 py-3 text-gray-400">Domain</th>
              <th className="px-4 py-3 text-gray-400">Subject / Topic</th>
              <th className="px-4 py-3 text-gray-400">Diff.</th>
              <th className="px-4 py-3 text-gray-400">Type</th>
              <th className="px-4 py-3 text-gray-400">Source</th>
              <th className="px-4 py-3 text-gray-400">Status</th>
              <th className="px-4 py-3 text-gray-400">Tags</th>
              <th className="px-4 py-3 text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {questions.map((q) => (
              <tr key={q.id} className={`hover:bg-gray-900/50 ${selected.has(q.id) ? "bg-blue-900/10" : ""}`}>
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(q.id)}
                    onChange={() => toggleSelect(q.id)}
                    className="rounded border-gray-600 bg-gray-800"
                  />
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-white">
                  {q.content.substring(0, 80)}{q.content.length > 80 ? "..." : ""}
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
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    q.source === "AI_GENERATED" ? "bg-purple-900/50 text-purple-400" : "bg-gray-700 text-gray-400"
                  }`}>
                    {q.source === "AI_GENERATED" ? "AI" : "Manual"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[q.status]}`}>
                    {q.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {q.tags.slice(0, 3).map((t) => (
                      <span key={t.id} className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                        {t.name}
                      </span>
                    ))}
                    {q.tags.length > 3 && (
                      <span className="text-xs text-gray-600">+{q.tags.length - 3}</span>
                    )}
                  </div>
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
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
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
