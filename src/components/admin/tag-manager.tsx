"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Tag {
  id: string;
  name: string;
  category: string;
  _count: { questions: number };
}

const categoryColors: Record<string, string> = {
  domain: "bg-blue-900/50 text-blue-400",
  subject: "bg-green-900/50 text-green-400",
  topic: "bg-purple-900/50 text-purple-400",
  general: "bg-gray-700 text-gray-300",
};

export function TagManager({ initialTags }: { initialTags: Tag[] }) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), category }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create tag");
        return;
      }
      const tag = await res.json();
      setTags([...tags, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, tagName: string) {
    if (!confirm(`Delete tag "${tagName}"? It will be unlinked from all questions.`)) return;
    try {
      await fetch(`/api/admin/tags?id=${id}`, { method: "DELETE" });
      setTags(tags.filter((t) => t.id !== id));
      router.refresh();
    } catch {
      setError("Failed to delete tag");
    }
  }

  const filtered = filter
    ? tags.filter((t) => t.category === filter)
    : tags;

  return (
    <div className="space-y-6">
      {/* Create Tag */}
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Tag Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g. ATPL, safety"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="general">General</option>
            <option value="domain">Domain</option>
            <option value="subject">Subject</option>
            <option value="topic">Topic</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Tag"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!filter ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
        >
          All ({tags.length})
        </button>
        {["domain", "subject", "topic", "general"].map((cat) => {
          const count = tags.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${filter === cat ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Tags Grid */}
      <div className="flex flex-wrap gap-2">
        {filtered.map((tag) => (
          <div
            key={tag.id}
            className="group flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2"
          >
            <span className={`rounded px-1.5 py-0.5 text-xs ${categoryColors[tag.category]}`}>
              {tag.category}
            </span>
            <span className="text-sm text-white">{tag.name}</span>
            <span className="text-xs text-gray-600">{tag._count.questions}q</span>
            {tag._count.questions === 0 && (
              <button
                onClick={() => handleDelete(tag.id, tag.name)}
                className="ml-1 hidden text-xs text-red-500 hover:text-red-400 group-hover:inline"
              >
                x
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm">No tags found.</p>
        )}
      </div>
    </div>
  );
}
