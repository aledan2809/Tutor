"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface InstructorSettings {
  notifyOnStudentInactivity: boolean;
  notifyOnLowScores: boolean;
  notifyOnStreakBreak: boolean;
  inactivityThresholdDays: number;
  lowScoreThreshold: number;
  emailNotifications: boolean;
  dashboardRefreshInterval: number;
}

interface Threshold {
  id: string;
  studentId: string;
  domainId: string;
  metric: string;
  operator: string;
  value: number;
  action: string;
  student: { id: string; name: string | null };
  domain: { id: string; name: string };
}

interface StudentOption {
  id: string;
  name: string | null;
  email: string | null;
}

interface DomainOption {
  id: string;
  name: string;
  slug: string;
}

export default function InstructorSettingsPage() {
  const t = useTranslations("instructor");
  const [settings, setSettings] = useState<InstructorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Escalation thresholds
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [showThresholdForm, setShowThresholdForm] = useState(false);
  const [tStudentId, setTStudentId] = useState("");
  const [tDomainId, setTDomainId] = useState("");
  const [tMetric, setTMetric] = useState<"streak" | "score" | "session_missed">("score");
  const [tOperator, setTOperator] = useState<"lt" | "gt" | "eq">("lt");
  const [tValue, setTValue] = useState(50);
  const [tAction, setTAction] = useState<"notify_instructor" | "notify_watcher">("notify_instructor");
  const [savingThreshold, setSavingThreshold] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/instructor/settings").then((r) => r.json()),
      fetch("/api/dashboard/instructor/thresholds").then((r) => r.json()),
      fetch("/api/dashboard/instructor/students?limit=200").then((r) => r.json()),
      fetch("/api/dashboard/instructor").then((r) => r.json()).catch(() => ({ domains: [] })),
      fetch("/api/admin/domains").then((r) => r.json()).catch(() => ({ domains: [] })),
    ]).then(([settingsData, thresholdsData, studentsData, dashData, domainsData]) => {
      setSettings(settingsData.settings);
      setThresholds(thresholdsData.thresholds ?? []);
      setStudents(
        (studentsData.students ?? []).map((s: StudentOption) => ({
          id: s.id,
          name: s.name,
          email: s.email,
        }))
      );
      // Merge domain sources
      const allDomains = (domainsData.domains ?? []) as DomainOption[];
      if (allDomains.length === 0 && dashData.domains) {
        setDomains(dashData.domains.map((id: string) => ({ id, name: id, slug: id })));
      } else {
        setDomains(allDomains);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/dashboard/instructor/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddThreshold = async () => {
    if (!tStudentId || !tDomainId) return;
    setSavingThreshold(true);
    try {
      const res = await fetch("/api/dashboard/instructor/thresholds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: tStudentId,
          domainId: tDomainId,
          metric: tMetric,
          operator: tOperator,
          value: tValue,
          action: tAction,
        }),
      });
      if (res.ok) {
        // Refresh thresholds
        const data = await fetch("/api/dashboard/instructor/thresholds").then((r) => r.json());
        setThresholds(data.thresholds ?? []);
        setShowThresholdForm(false);
        setTStudentId("");
        setTDomainId("");
        setTValue(50);
      }
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleDeleteThreshold = async (id: string) => {
    await fetch(`/api/dashboard/instructor/thresholds?id=${id}`, { method: "DELETE" });
    setThresholds((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) return <p className="text-gray-500">{t("loading")}</p>;
  if (!settings) return null;

  const metricLabels: Record<string, string> = {
    streak: t("streak"),
    score: t("accuracy"),
    session_missed: t("sessionsMissed"),
  };

  const operatorLabels: Record<string, string> = {
    lt: "<",
    gt: ">",
    eq: "=",
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">{t("instructorSettings")}</h1>

      {/* Notification Preferences */}
      <div className="max-w-xl space-y-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-lg font-semibold text-white">{t("notificationPreferences")}</h2>

        <Toggle
          label={t("notifyInactivity")}
          checked={settings.notifyOnStudentInactivity}
          onChange={(v) => setSettings({ ...settings, notifyOnStudentInactivity: v })}
        />
        <Toggle
          label={t("notifyLowScores")}
          checked={settings.notifyOnLowScores}
          onChange={(v) => setSettings({ ...settings, notifyOnLowScores: v })}
        />
        <Toggle
          label={t("notifyStreakBreak")}
          checked={settings.notifyOnStreakBreak}
          onChange={(v) => setSettings({ ...settings, notifyOnStreakBreak: v })}
        />
        <Toggle
          label={t("emailNotifications")}
          checked={settings.emailNotifications}
          onChange={(v) => setSettings({ ...settings, emailNotifications: v })}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            {t("inactivityDays")}
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={settings.inactivityThresholdDays}
            onChange={(e) =>
              setSettings({ ...settings, inactivityThresholdDays: parseInt(e.target.value) || 3 })
            }
            className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            {t("lowScoreThreshold")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={settings.lowScoreThreshold}
              onChange={(e) =>
                setSettings({ ...settings, lowScoreThreshold: parseInt(e.target.value) || 50 })
              }
              className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t("saving") : saved ? t("saved") : t("saveSettings")}
        </button>
      </div>

      {/* Escalation Thresholds */}
      <div className="max-w-2xl rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{t("escalationThresholds")}</h2>
          <button
            onClick={() => setShowThresholdForm(!showThresholdForm)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            {showThresholdForm ? t("cancel") : t("addThreshold")}
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-400">{t("escalationThresholdsDesc")}</p>

        {/* Add threshold form */}
        {showThresholdForm && (
          <div className="mb-4 rounded-lg bg-gray-800 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">{t("student")}</label>
                <select
                  value={tStudentId}
                  onChange={(e) => setTStudentId(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="">{t("selectStudent")}</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name ?? s.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">{t("domain")}</label>
                <select
                  value={tDomainId}
                  onChange={(e) => setTDomainId(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="">{t("selectDomain")}</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">{t("metric")}</label>
                <select
                  value={tMetric}
                  onChange={(e) => setTMetric(e.target.value as typeof tMetric)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="score">{t("accuracy")}</option>
                  <option value="streak">{t("streak")}</option>
                  <option value="session_missed">{t("sessionsMissed")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">{t("operator")}</label>
                <select
                  value={tOperator}
                  onChange={(e) => setTOperator(e.target.value as typeof tOperator)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="lt">&lt; {t("lessThan")}</option>
                  <option value="gt">&gt; {t("greaterThan")}</option>
                  <option value="eq">= {t("equalTo")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">{t("thresholdValue")}</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={tValue}
                  onChange={(e) => setTValue(parseInt(e.target.value) || 0)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">{t("action")}</label>
              <select
                value={tAction}
                onChange={(e) => setTAction(e.target.value as typeof tAction)}
                className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:outline-none"
              >
                <option value="notify_instructor">{t("notifyInstructor")}</option>
                <option value="notify_watcher">{t("notifyWatcher")}</option>
              </select>
            </div>
            <button
              onClick={handleAddThreshold}
              disabled={savingThreshold || !tStudentId || !tDomainId}
              className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {savingThreshold ? t("saving") : t("addThreshold")}
            </button>
          </div>
        )}

        {/* Existing thresholds */}
        {thresholds.length === 0 ? (
          <p className="text-sm text-gray-500">{t("noThresholds")}</p>
        ) : (
          <div className="space-y-2">
            {thresholds.map((th) => (
              <div
                key={th.id}
                className="flex items-center justify-between rounded bg-gray-800 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">
                    {th.student.name ?? th.studentId}
                    <span className="mx-2 text-gray-500">·</span>
                    <span className="text-gray-400">{th.domain.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {metricLabels[th.metric] ?? th.metric}{" "}
                    {operatorLabels[th.operator] ?? th.operator}{" "}
                    {th.value}
                    <span className="mx-2 text-gray-600">→</span>
                    {th.action === "notify_watcher" ? t("notifyWatcher") : t("notifyInstructor")}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteThreshold(th.id)}
                  className="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-900/20"
                >
                  {t("delete")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-700"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  );
}
