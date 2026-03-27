"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Preferences {
  push: boolean;
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
  call: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}

const TIMEZONES = [
  "Europe/Bucharest",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "UTC",
];

export function NotificationPreferences() {
  const t = useTranslations("notifications");
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then(setPrefs)
      .catch(() => {});
  }, []);

  async function save() {
    if (!prefs) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!prefs) {
    return <p className="text-gray-500">{t("loading")}</p>;
  }

  const channels: { key: keyof Pick<Preferences, "push" | "whatsapp" | "sms" | "email" | "call">; label: string }[] = [
    { key: "push", label: t("channelPush") },
    { key: "whatsapp", label: t("channelWhatsApp") },
    { key: "sms", label: t("channelSMS") },
    { key: "email", label: t("channelEmail") },
    { key: "call", label: t("channelCall") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">{t("channels")}</h2>
        <p className="text-sm text-gray-500">{t("channelsDesc")}</p>
        <div className="mt-3 space-y-3">
          {channels.map((ch) => (
            <label
              key={ch.key}
              className="flex items-center justify-between rounded-lg border border-gray-800 px-4 py-3"
            >
              <span className="text-sm text-gray-300">{ch.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[ch.key]}
                onClick={() =>
                  setPrefs({ ...prefs, [ch.key]: !prefs[ch.key] })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                  prefs[ch.key] ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    prefs[ch.key] ? "translate-x-5.5" : "translate-x-0.5"
                  } mt-0.5`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">{t("quietHours")}</h2>
        <p className="text-sm text-gray-500">{t("quietHoursDesc")}</p>
        <div className="mt-3 flex gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("from")}</label>
            <input
              type="time"
              value={prefs.quietHoursStart}
              onChange={(e) =>
                setPrefs({ ...prefs, quietHoursStart: e.target.value })
              }
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("to")}</label>
            <input
              type="time"
              value={prefs.quietHoursEnd}
              onChange={(e) =>
                setPrefs({ ...prefs, quietHoursEnd: e.target.value })
              }
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">{t("timezone")}</h2>
        <select
          value={prefs.timezone}
          onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
          className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? t("saving") : t("save")}
        </button>
        {saved && (
          <span className="text-sm text-green-400">{t("saved")}</span>
        )}
      </div>
    </div>
  );
}
