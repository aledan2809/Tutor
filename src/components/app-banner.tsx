"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { isPushSupported, subscribeToPush } from "./push-subscribe";

// EAT-style post-login banner that drives BOTH actions in one card: install the
// app (PWA — Android/desktop via beforeinstallprompt) and enable web push (the
// free re-engagement channel). Each CTA disappears once done; the whole banner
// hides when there's nothing left to offer or after a 7-day snooze.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SNOOZE_KEY = "tutor_app_banner_snooze";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function AppBanner() {
  const ro = useLocale() === "ro";
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [needsPush, setNeedsPush] = useState(false);
  const [snoozed, setSnoozed] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
    setSnoozed(Date.now() < snoozedUntil);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    if (isPushSupported() && Notification.permission !== "denied") {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setNeedsPush(!sub))
        .catch(() => setNeedsPush(true));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canInstall = !installed && !!installEvt;
  const snooze = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* ignore */
    }
    setSnoozed(true);
  };

  const install = async () => {
    if (!installEvt) return;
    setBusy(true);
    try {
      await installEvt.prompt();
      await installEvt.userChoice;
    } catch {
      /* user dismissed */
    } finally {
      setInstallEvt(null);
      setBusy(false);
    }
  };

  const enablePush = async () => {
    setBusy(true);
    try {
      const ok = await subscribeToPush();
      if (ok) setNeedsPush(false);
      else snooze();
    } catch {
      snooze();
    } finally {
      setBusy(false);
    }
  };

  if (snoozed || (!canInstall && !needsPush)) return null;

  const both = canInstall && needsPush;
  const title = both
    ? ro
      ? "Instalează eTutor + activează notificările"
      : "Install eTutor + turn on notifications"
    : canInstall
      ? ro
        ? "Instalează eTutor"
        : "Install eTutor"
      : ro
        ? "Activează notificările"
        : "Turn on notifications";
  const desc = ro
    ? "Acces rapid de pe ecranul principal + mementouri gratuite ca să-ți păstrezi ritmul de studiu."
    : "One-tap access from your home screen + free reminders to keep your study rhythm.";

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-blue-900/50 bg-blue-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-xl">📲</span>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {canInstall && (
          <button
            onClick={install}
            disabled={busy}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {ro ? "Instalează" : "Install"}
          </button>
        )}
        {needsPush && (
          <button
            onClick={enablePush}
            disabled={busy}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-60 ${
              canInstall
                ? "border border-blue-700 text-blue-200 hover:bg-blue-900/40"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {busy ? "…" : ro ? "Activează" : "Enable"}
          </button>
        )}
        <button
          onClick={snooze}
          disabled={busy}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-white"
        >
          {ro ? "Mai târziu" : "Later"}
        </button>
      </div>
    </div>
  );
}
