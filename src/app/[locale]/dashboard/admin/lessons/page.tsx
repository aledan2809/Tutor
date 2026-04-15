"use client";

import { useState, useEffect } from "react";

interface Domain { id: string; name: string; slug: string; }
interface Lesson {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: number;
  order: number;
  isPublished: boolean;
  content: string;
  summary: string | null;
  domain: { id: string; name: string };
  _count: { progress: number };
}

export default function LessonsAdminPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);

  // Form state
  const [form, setForm] = useState({
    domainId: "", subject: "", topic: "", title: "", content: "", summary: "", difficulty: 1, order: 0, isPublished: false,
  });

  const fetchLessons = () => {
    const url = filterDomain ? `/api/admin/lessons?domainId=${filterDomain}` : "/api/admin/lessons";
    fetch(url).then((r) => r.json()).then((d) => {
      setLessons(d.lessons || []);
      setDomains(d.domains || []);
      if (!form.domainId && d.domains?.length) setForm((f) => ({ ...f, domainId: d.domains[0].id }));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLessons(); }, [filterDomain]);

  const resetForm = () => {
    setForm({ domainId: domains[0]?.id || "", subject: "", topic: "", title: "", content: "", summary: "", difficulty: 1, order: 0, isPublished: false });
    setEditLesson(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editLesson ? "PUT" : "POST";
    const body = editLesson ? { id: editLesson.id, ...form } : form;

    const res = await fetch("/api/admin/lessons", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.ok) { resetForm(); fetchLessons(); }
  };

  const handleEdit = (lesson: Lesson) => {
    setForm({
      domainId: lesson.domain.id, subject: lesson.subject, topic: lesson.topic,
      title: lesson.title, content: lesson.content, summary: lesson.summary || "",
      difficulty: lesson.difficulty, order: lesson.order, isPublished: lesson.isPublished,
    });
    setEditLesson(lesson);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    await fetch(`/api/admin/lessons?id=${id}`, { method: "DELETE" });
    fetchLessons();
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    await fetch("/api/admin/lessons", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lesson.id, isPublished: !lesson.isPublished }),
    });
    fetchLessons();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lessons</h1>
          <p className="mt-1 text-sm text-gray-400">Manage learning content for students</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          {showForm ? "Cancel" : "New Lesson"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="text-sm font-medium text-white">{editLesson ? "Edit Lesson" : "Create Lesson"}</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Domain</label>
              <select value={form.domainId} onChange={(e) => setForm({ ...form, domainId: e.target.value })} required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Subject</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" placeholder="e.g., Physics" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Topic</label>
              <input type="text" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" placeholder="e.g., Electromagnetism" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Difficulty (1-5)</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Sort Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded border-gray-600" />
                Published
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Summary (optional)</label>
            <input type="text" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" placeholder="Brief description" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Content (Markdown)</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={10}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white font-mono"
              placeholder="# Lesson Title&#10;&#10;Write your lesson content in Markdown..." />
          </div>

          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            {editLesson ? "Update" : "Create"} Lesson
          </button>
        </form>
      )}

      {/* Filter */}
      {domains.length > 1 && (
        <select value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
          <option value="">All Domains</option>
          {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      )}

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : lessons.length === 0 ? (
        <p className="text-center text-gray-500">No lessons yet. Create one above.</p>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white truncate">{lesson.title}</h3>
                  <span className={`rounded px-1.5 py-0.5 text-xs ${lesson.isPublished ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                    {lesson.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="mt-1 flex gap-2 text-xs text-gray-500">
                  <span>{lesson.domain.name}</span>
                  <span>·</span>
                  <span>{lesson.subject} / {lesson.topic}</span>
                  <span>·</span>
                  <span>Lv.{lesson.difficulty}</span>
                  <span>·</span>
                  <span>{lesson._count.progress} students</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => handleTogglePublish(lesson)}
                  className="text-xs text-gray-500 hover:text-white">
                  {lesson.isPublished ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => handleEdit(lesson)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                <button onClick={() => handleDelete(lesson.id)} className="text-xs text-gray-500 hover:text-red-400">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
