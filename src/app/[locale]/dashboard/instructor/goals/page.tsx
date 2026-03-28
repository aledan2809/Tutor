"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  isCompleted: boolean;
  createdAt: string;
  student: { id: string; name: string | null; email: string | null };
  domain: { id: string; name: string; slug: string };
}

interface Student {
  id: string;
  name: string | null;
  email: string | null;
}

interface DomainItem {
  id: string;
  name: string;
}

export default function InstructorGoalsPage() {
  const t = useTranslations("instructor");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  // New goal form
  const [showForm, setShowForm] = useState(false);
  const [formStudentId, setFormStudentId] = useState("");
  const [formDomainId, setFormDomainId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchGoals = async () => {
    const data = await fetch("/api/dashboard/instructor/goals").then((r) => r.json());
    setGoals(data.goals ?? []);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/instructor/goals").then((r) => r.json()),
      fetch("/api/dashboard/instructor/students?limit=200").then((r) => r.json()),
      fetch("/api/dashboard/instructor").then((r) => r.json()),
    ]).then(([goalsData, studentsData, dashData]) => {
      setGoals(goalsData.goals ?? []);
      setStudents(
        (studentsData.students ?? []).map((s: { id: string; name: string | null; email: string | null }) => ({
          id: s.id,
          name: s.name,
          email: s.email,
        }))
      );
      // Extract unique domains from goals + students
      const domainMap = new Map<string, string>();
      (goalsData.goals ?? []).forEach((g: Goal) => domainMap.set(g.domain.id, g.domain.name));
      setDomains(Array.from(domainMap.entries()).map(([id, name]) => ({ id, name })));
      // If no domains from goals, try from dashboard
      if (domainMap.size === 0 && dashData.domains) {
        setDomains(dashData.domains.map((id: string) => ({ id, name: id })));
      }
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!formStudentId || !formDomainId || !formTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/instructor/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: formStudentId,
          domainId: formDomainId,
          title: formTitle,
          description: formDesc || undefined,
          targetDate: formDate || undefined,
        }),
      });
      if (res.ok) {
        setFormTitle("");
        setFormDesc("");
        setFormDate("");
        setShowForm(false);
        await fetchGoals();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (goalId: string, isCompleted: boolean) => {
    await fetch("/api/dashboard/instructor/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId, isCompleted: !isCompleted }),
    });
    await fetchGoals();
  };

  const filtered = goals.filter((g) => {
    if (filter === "active") return !g.isCompleted;
    if (filter === "completed") return g.isCompleted;
    return true;
  });

  if (loading) return <p className="text-gray-500">{t("loading")}</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t("goals")}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? t("cancel") : t("createGoal")}
        </button>
      </div>

      {/* Create goal form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                {t("student")}
              </label>
              <select
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none"
              >
                <option value="">{t("selectStudent")}</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name ?? s.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                {t("domain")}
              </label>
              <select
                value={formDomainId}
                onChange={(e) => setFormDomainId(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none"
              >
                <option value="">{t("selectDomain")}</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              {t("goalTitle")}
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={t("goalTitlePlaceholder")}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              {t("description")}
            </label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                {t("targetDate")}
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !formStudentId || !formDomainId || !formTitle.trim()}
              className="mt-6 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? t("saving") : t("createGoal")}
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-600/10 text-blue-500"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {t(`filter_goals_${f}`)}
          </button>
        ))}
      </div>

      {/* Goals list */}
      {filtered.length === 0 ? (
        <p className="text-gray-500">{t("noGoals")}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((goal) => (
            <div
              key={goal.id}
              className={`flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 ${
                goal.isCompleted ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => handleToggle(goal.id, goal.isCompleted)}
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                    goal.isCompleted
                      ? "border-green-600 bg-green-600"
                      : "border-gray-600 hover:border-blue-500"
                  }`}
                >
                  {goal.isCompleted && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${goal.isCompleted ? "text-gray-500 line-through" : "text-white"}`}>
                    {goal.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {goal.student.name ?? goal.student.email}
                    </span>
                    <span className="text-xs text-blue-400">{goal.domain.name}</span>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-gray-500 mt-1">{goal.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {goal.targetDate && (
                  <span className={`text-xs ${
                    new Date(goal.targetDate) < new Date() && !goal.isCompleted
                      ? "text-red-400"
                      : "text-gray-500"
                  }`}>
                    {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
