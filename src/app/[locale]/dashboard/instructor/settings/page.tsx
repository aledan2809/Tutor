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

export default function InstructorSettingsPage() {
  const t = useTranslations("instructor");
  const [settings, setSettings] = useState<InstructorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/instructor/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings))
      .finally(() => setLoading(false));
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

  if (loading) return <p className="text-gray-500">{t("loading")}</p>;
  if (!settings) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("instructorSettings")}</h1>

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
