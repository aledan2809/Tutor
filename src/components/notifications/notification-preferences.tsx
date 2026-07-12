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
  /** Priority order of the escalation cascade channels (upper-case), most-preferred first. */
  channelOrder?: string[];
  /** Channels included in the user's plan (server-provided); others are locked. */
  allowedChannels?: string[];
  /** Parent-only re-alert cadence (see /watcher/setari). */
  selfAlertMode?: string;
  selfAlertEveryH?: number;
  selfAlertAt?: string;
}

/** Metered channels gated by plan; `push`/`email`/`call` are not plan-gated here. */
const GATED_CHANNELS = new Set(["whatsapp", "sms"]);

/** The escalation cascade channels the user can reorder (must match ORDERABLE_CHANNELS on the server). */
const CASCADE_CHANNELS = ["PUSH", "TELEGRAM", "EMAIL", "WHATSAPP"] as const;

/** Normalise a saved order to always contain all cascade channels exactly once (missing ones appended in default order). */
function normalizeOrder(saved?: string[]): string[] {
  const up = (saved ?? []).map((s) => s.toUpperCase()).filter((s) => (CASCADE_CHANNELS as readonly string[]).includes(s));
  const seen = new Set(up);
  return [...up, ...CASCADE_CHANNELS.filter((c) => !seen.has(c))];
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

export function NotificationPreferences({ showSelfAlert = false }: { showSelfAlert?: boolean } = {}) {
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

  const CHANNEL_LABEL: Record<string, string> = {
    PUSH: t("channelPush"),
    TELEGRAM: t("channelTelegram"),
    EMAIL: t("channelEmail"),
    WHATSAPP: t("channelWhatsApp"),
  };
  const order = normalizeOrder(prefs.channelOrder);
  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || !prefs) return;
    const next = [...order];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setPrefs({ ...prefs, channelOrder: next });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">{t("channelOrderTitle")}</h2>
        <p className="text-sm text-gray-500">{t("channelOrderDesc")}</p>
        <ul className="mt-3 space-y-2">
          {order.map((ch, i) => {
            const locked =
              GATED_CHANNELS.has(ch.toLowerCase()) &&
              Array.isArray(prefs.allowedChannels) &&
              !prefs.allowedChannels.includes(ch.toLowerCase());
            return (
              <li
                key={ch}
                className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600/15 text-xs font-bold text-blue-400">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-200">
                  {CHANNEL_LABEL[ch] ?? ch}
                  {locked && <span className="ml-2 text-xs text-amber-400">🔒 {t("paidOnly")}</span>}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={t("moveUp")}
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={t("moveDown")}
                    disabled={i === order.length - 1}
                    onClick={() => move(i, i + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {showSelfAlert && (
        <div>
          <h2 className="text-lg font-semibold text-white">{t("selfAlertTitle")}</h2>
          <p className="text-sm text-gray-500">{t("selfAlertDesc")}</p>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5">
              <input
                type="radio"
                name="selfAlertMode"
                checked={(prefs.selfAlertMode ?? "STANDARD_30") === "STANDARD_30"}
                onChange={() => setPrefs({ ...prefs, selfAlertMode: "STANDARD_30" })}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-200">{t("selfAlertStandard")}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5">
              <input
                type="radio"
                name="selfAlertMode"
                checked={prefs.selfAlertMode === "EVERY_H"}
                onChange={() => setPrefs({ ...prefs, selfAlertMode: "EVERY_H" })}
                className="accent-blue-600"
              />
              <span className="flex items-center gap-2 text-sm text-gray-200">
                {t("selfAlertEveryPre")}
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={prefs.selfAlertEveryH ?? 6}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      selfAlertMode: "EVERY_H",
                      selfAlertEveryH: Math.max(1, Math.min(24, Number(e.target.value) || 6)),
                    })
                  }
                  className="w-14 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-center text-sm text-white"
                />
                {t("selfAlertEveryPost")}
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5">
              <input
                type="radio"
                name="selfAlertMode"
                checked={prefs.selfAlertMode === "FIXED_AT"}
                onChange={() => setPrefs({ ...prefs, selfAlertMode: "FIXED_AT" })}
                className="accent-blue-600"
              />
              <span className="flex items-center gap-2 text-sm text-gray-200">
                {t("selfAlertFixedPre")}
                <input
                  type="time"
                  value={prefs.selfAlertAt ?? "20:00"}
                  onChange={(e) =>
                    setPrefs({ ...prefs, selfAlertMode: "FIXED_AT", selfAlertAt: e.target.value })
                  }
                  className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white"
                />
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5">
              <input
                type="radio"
                name="selfAlertMode"
                checked={prefs.selfAlertMode === "ONCE"}
                onChange={() => setPrefs({ ...prefs, selfAlertMode: "ONCE" })}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-200">{t("selfAlertOnce")}</span>
            </label>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white">{t("channels")}</h2>
        <p className="text-sm text-gray-500">{t("channelsDesc")}</p>
        <div className="mt-3 space-y-3">
          {channels.map((ch) => {
            const locked =
              GATED_CHANNELS.has(ch.key) &&
              Array.isArray(prefs.allowedChannels) &&
              !prefs.allowedChannels.includes(ch.key);
            const on = locked ? false : prefs[ch.key];
            return (
              <label
                key={ch.key}
                className={`flex items-center justify-between rounded-lg border border-gray-800 px-4 py-3 ${locked ? "opacity-60" : ""}`}
              >
                <span className="flex items-center gap-2 text-sm text-gray-300">
                  {ch.label}
                  {locked && <span className="text-xs text-amber-400">🔒 {t("paidOnly")}</span>}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  disabled={locked}
                  onClick={() => !locked && setPrefs({ ...prefs, [ch.key]: !prefs[ch.key] })}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                    on ? "bg-blue-600" : "bg-gray-700"
                  } ${locked ? "cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      on ? "translate-x-5.5" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </label>
            );
          })}
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
