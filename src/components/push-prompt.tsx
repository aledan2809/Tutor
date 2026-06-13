"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { isPushSupported, subscribeToPush } from "./push-subscribe";

// Post-login nudge to enable web push — the free re-engagement channel. Shown
// once (per snooze window) to supported browsers that aren't subscribed and
// haven't denied permission. Dismiss snoozes it; enabling hides it for good.
const SNOOZE_KEY = "tutor_push_prompt_snooze";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function PushPrompt() {
  const ro = useLocale() === "ro";
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (Notification.permission === "denied") return;
    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
    if (Date.now() < snoozedUntil) return;

    // Show only if there's no existing push subscription yet.
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!sub) setShow(true);
      })
      .catch(() => setShow(true));
  }, []);

  const snooze = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* localStorage unavailable — just hide for this session */
    }
    setShow(false);
  };

  const enable = async () => {
    setLoading(true);
    try {
      const ok = await subscribeToPush();
      if (ok) {
        setShow(false);
      } else {
        // Permission denied or no VAPID — don't nag again this window.
        snooze();
      }
    } catch {
      snooze();
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-blue-900/50 bg-blue-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-xl">🔔</span>
        <div>
          <p className="text-sm font-semibold text-white">
            {ro ? "Activează notificările" : "Turn on notifications"}
          </p>
          <p className="text-xs text-gray-400">
            {ro
              ? "Primești mementouri gratuite ca să-ți păstrezi seria de studiu — direct în browser, fără cont de mesagerie."
              : "Get free reminders to keep your study streak — right in your browser, no messaging account needed."}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={snooze}
          disabled={loading}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white"
        >
          {ro ? "Mai târziu" : "Later"}
        </button>
        <button
          onClick={enable}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "…" : ro ? "Activează" : "Enable"}
        </button>
      </div>
    </div>
  );
}
