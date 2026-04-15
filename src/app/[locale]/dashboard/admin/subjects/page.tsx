"use client";

import { useState, useEffect } from "react";

interface SubjectTopic {
  id: string;
  name: string;
  category: string;
  _count?: { questions: number };
}

export default function SubjectsPage() {
  const [items, setItems] = useState<SubjectTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<"subject" | "topic">("subject");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [filter, setFilter] = useState<"all" | "subject" | "topic">("all");

  const fetchItems = () => {
    fetch("/api/admin/tags")
      .then((r) => r.json())
      .then((d) => {
        const tags = (d.tags || d || []).filter(
          (t: SubjectTopic) => t.category === "subject" || t.category === "topic"
        );
        setItems(tags);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), category: newCategory }),
    });
    setNewName("");
    fetchItems();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await fetch("/api/admin/tags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName.trim() }),
    });
    setEditId(null);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/admin/tags?id=${id}`, { method: "DELETE" });
    fetchItems();
  };

  const filtered = items.filter((i) => filter === "all" || i.category === filter);
  const subjects = items.filter((i) => i.category === "subject");
  const topics = items.filter((i) => i.category === "topic");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subjects & Topics</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage the vocabulary of subjects and topics used in questions. These appear as suggestions when creating questions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{subjects.length}</p>
          <p className="text-xs text-gray-500">Subjects</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{topics.length}</p>
          <p className="text-xs text-gray-500">Topics</p>
        </div>
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as "subject" | "topic")}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        >
          <option value="subject">Subject</option>
          <option value="topic">Topic</option>
        </select>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New subject or topic name..."
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          onClick={handleCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Add
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "subject", "topic"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              filter === f ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"
            }`}
          >
            {f === "all" ? "All" : f === "subject" ? "Subjects" : "Topics"}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500">No entries yet. Add subjects and topics above.</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-2"
            >
              {editId === item.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate(item.id)}
                  />
                  <button onClick={() => handleUpdate(item.id)} className="text-sm text-green-400">Save</button>
                  <button onClick={() => setEditId(null)} className="text-sm text-gray-500">Cancel</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${
                      item.category === "subject" ? "bg-blue-900/30 text-blue-400" : "bg-purple-900/30 text-purple-400"
                    }`}>
                      {item.category}
                    </span>
                    <span className="text-sm text-white">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditId(item.id); setEditName(item.name); }}
                      className="text-xs text-gray-500 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
