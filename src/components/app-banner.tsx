"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { isPushSupported, subscribeToPush } from "./push-subscribe";
import { hasFeltValue } from "@/lib/engagement";
import {
  INSTALL_DONE_KEY,
  MANUAL_SEEN_KEY,
  isStandalone,
  isIOS,
  isMobileUA,
  isInAppWebView,
  readFlag,
  writeFlag,
} from "@/lib/pwa";

// Post-login banner driving install + web push in one card.
// - Chromium (Android/desktop) fires `beforeinstallprompt` → a real Install button.
// - Firefox / iOS never fire it → after a short wait we show a manual "how to
//   install" hint (iOS: Share → Add to Home Screen; others: browser menu), so
//   mobile users still get an install solicitation.
// Each CTA disappears once done; the banner hides when nothing's left or after a
// 7-day snooze.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SNOOZE_KEY = "tutor_app_banner_snooze";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function AppBanner({ isWatcherOnly = false }: { isWatcherOnly?: boolean }) {
  const ro = useLocale() === "ro";
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [needsPush, setNeedsPush] = useState(false);
  const [snoozed, setSnoozed] = useState(true);
  const [noAutoPrompt, setNoAutoPrompt] = useState(false);
  const [manualSeen, setManualSeen] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [busy, setBusy] = useState(false);
  // A2: hold the install/notifications chore until the user has answered a few
  // questions and felt the value (like social apps asking for notifications only
  // after you're hooked). Defaults hidden until confirmed client-side.
  const [feltValue, setFeltValue] = useState(false);

  useEffect(() => {
    // Standalone launch is the ground truth for "installed" — persist it so the
    // browser tab (shared storage on Android) stops offering install afterwards.
    const standalone = isStandalone();
    if (standalone) writeFlag(INSTALL_DONE_KEY);
    setInstalled(standalone || readFlag(INSTALL_DONE_KEY));
    setManualSeen(readFlag(MANUAL_SEEN_KEY));
    // Already-installed users have clearly engaged → don't hide it from them.
    // A watcher-only parent never answers questions, so gate on role too — else the
    // free push channel stays off and their alerts fall back to paid WhatsApp.
    setFeltValue(isWatcherOnly || hasFeltValue() || standalone || readFlag(INSTALL_DONE_KEY));

    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
    setSnoozed(Date.now() < snoozedUntil);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => {
      writeFlag(INSTALL_DONE_KEY);
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

    // If no auto-prompt arrives shortly, fall back to a manual hint (Firefox/iOS).
    const t = setTimeout(() => setNoAutoPrompt(true), 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(t);
    };
  }, []);

  const canInstall = !installed && !!installEvt;
  // Show the manual "Add to Home Screen" hint on mobile when no native prompt
  // fired (iOS always; Firefox) — but never inside an in-app webview where it
  // can't work.
  const manualInstall =
    !installed && !manualSeen && !installEvt && noAutoPrompt && isMobileUA() && !isInAppWebView();

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

  // A2: nothing before first value — defer the whole install/push solicitation
  // until the user has actually answered a few questions.
  if (!feltValue) return null;

  // First-touch from a chat link opens an in-app browser where install + push
  // can't work. Instead of staying silent, point the user to Safari.
  if (!snoozed && !installed && isInAppWebView()) {
    return (
      <div className="mb-4 rounded-lg border border-blue-900/50 bg-blue-950/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-xl">📲</span>
            <div>
              <p className="text-sm font-semibold text-white">
                {ro ? "Instalează eTutor din Safari" : "Install eTutor from Safari"}
              </p>
              <p className="text-xs text-gray-400">
                {ro
                  ? "Ai deschis linkul în altă aplicație. Apasă „⋯” / butonul de partajare → „Deschide în Safari”, apoi Share ↑ → „Adaugă la ecranul principal”. Așa primești și notificările."
                  : "You opened this in another app. Tap “⋯” / the share button → “Open in Safari”, then Share ↑ → “Add to Home Screen”. That also enables notifications."}
              </p>
            </div>
          </div>
          <button onClick={snooze} className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-white">
            {ro ? "Mai târziu" : "Later"}
          </button>
        </div>
      </div>
    );
  }

  if (snoozed || (!canInstall && !manualInstall && !needsPush)) return null;

  const anyInstall = canInstall || manualInstall;
  const title =
    anyInstall && needsPush
      ? ro
        ? "Instalează eTutor + activează notificările"
        : "Install eTutor + turn on notifications"
      : anyInstall
        ? ro
          ? "Instalează eTutor"
          : "Install eTutor"
        : ro
          ? "Activează notificările"
          : "Turn on notifications";
  const desc = ro
    ? "Acces rapid de pe ecranul principal + mementouri gratuite ca să-ți păstrezi ritmul de studiu."
    : "One-tap access from your home screen + free reminders to keep your study rhythm.";

  const iosSteps = ro
    ? "Apasă butonul Share (pătrat cu săgeată ↑), apoi „Adaugă la ecranul principal”."
    : "Tap the Share button (square with ↑), then “Add to Home Screen”.";
  const otherSteps = ro
    ? "Deschide meniul browserului (⋮) și alege „Instalează aplicația” / „Adaugă la ecranul principal”."
    : "Open the browser menu (⋮) and choose “Install app” / “Add to Home Screen”.";

  return (
    <div className="mb-4 rounded-lg border border-blue-900/50 bg-blue-950/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          {manualInstall && (
            <button
              onClick={() => {
                setShowSteps((s) => !s);
                // Seen the steps → don't nag on the next visit (can't detect
                // manual Add-to-Home-Screen on iOS/Firefox). Stays visible now.
                writeFlag(MANUAL_SEEN_KEY);
              }}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {ro ? "Instalează" : "Install"}
            </button>
          )}
          {needsPush && (
            <button
              onClick={enablePush}
              disabled={busy}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-60 ${
                anyInstall
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
      {manualInstall && showSteps && (
        <p className="mt-3 rounded-lg border border-blue-900/40 bg-blue-950/40 p-3 text-xs text-blue-100">
          {isIOS() ? iosSteps : otherSteps}
        </p>
      )}
    </div>
  );
}
