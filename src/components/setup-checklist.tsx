"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { isPushSupported, subscribeToPush } from "./push-subscribe";
import {
  INSTALL_DONE_KEY,
  isStandalone,
  isIOS,
  isMobileUA,
  isInAppWebView,
  readFlag,
  writeFlag,
} from "@/lib/pwa";

/**
 * Platform-aware setup checklist, opened from the top bar. Adapts to the user's
 * device (iOS Safari / Android / in-app browser / desktop) and walks any new
 * user through: install the app → enable notifications → connect Telegram.
 * Each step shows live status + the right action/instruction for THIS phone.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
interface TgStatus {
  configured: boolean;
  linked: boolean;
}

export function SetupChecklist() {
  const ro = useLocale() === "ro";
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false); // platform known (avoids SSR mismatch)

  // platform
  const [ios, setIos] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [inApp, setInApp] = useState(false);

  // step state
  const [installed, setInstalled] = useState(false);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallSteps, setShowInstallSteps] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [tg, setTg] = useState<TgStatus | null>(null);
  const [tgWaiting, setTgWaiting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIos(isIOS());
    setMobile(isMobileUA());
    setInApp(isInAppWebView());
    setInstalled(isStandalone() || readFlag(INSTALL_DONE_KEY));
    setReady(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      writeFlag(INSTALL_DONE_KEY);
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (isPushSupported() && Notification.permission !== "denied") {
      setPushSupported(true);
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setPushOn(!!sub))
        .catch(() => {});
    } else if (isPushSupported()) {
      setPushSupported(true);
    }

    fetch("/api/telegram/link")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setTg({ configured: !!d.configured, linked: !!d.linked }))
      .catch(() => {});

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Poll Telegram status while waiting for the user to tap /start.
  useEffect(() => {
    if (!tgWaiting) return;
    let n = 0;
    const id = setInterval(async () => {
      n += 1;
      try {
        const r = await fetch("/api/telegram/link");
        if (r.ok) {
          const d = await r.json();
          setTg({ configured: !!d.configured, linked: !!d.linked });
          if (d.linked) setTgWaiting(false);
        }
      } catch {}
      if (n >= 20) setTgWaiting(false);
    }, 5000);
    return () => clearInterval(id);
  }, [tgWaiting]);

  const doInstall = async () => {
    if (installEvt) {
      setBusy("install");
      try {
        await installEvt.prompt();
        await installEvt.userChoice;
      } catch {} finally {
        setInstallEvt(null);
        setBusy(null);
      }
    } else {
      setShowInstallSteps((s) => !s);
    }
  };
  const doPush = async () => {
    setBusy("push");
    try {
      const ok = await subscribeToPush();
      setPushOn(ok);
    } finally {
      setBusy(null);
    }
  };
  const doTelegram = async () => {
    setBusy("tg");
    try {
      const r = await fetch("/api/telegram/link", { method: "POST" });
      if (r.ok) {
        const { url } = await r.json();
        window.open(url, "_blank", "noopener,noreferrer");
        setTgWaiting(true);
      }
    } finally {
      setBusy(null);
    }
  };

  // ---- derive per-step status/labels for THIS device ----
  const t = (r: string, e: string) => (ro ? r : e);

  const installSteps = inApp
    ? t(
        ios
          ? "Apasă „⋯”/partajare → „Deschide în Safari”, apoi Share ↑ → „Adaugă la ecranul principal”."
          : "Apasă „⋯” → „Deschide în Chrome”, apoi meniul (⋮) → „Instalează aplicația”.",
        ios
          ? "Tap “⋯”/share → “Open in Safari”, then Share ↑ → “Add to Home Screen”."
          : "Tap “⋯” → “Open in Chrome”, then menu (⋮) → “Install app”."
      )
    : ios
      ? t(
          "În Safari: apasă Share ↑ (jos), apoi „Adaugă la ecranul principal”.",
          "In Safari: tap Share ↑ (bottom), then “Add to Home Screen”."
        )
      : mobile
        ? t(
            "Meniul browserului (⋮) → „Instalează aplicația” / „Adaugă la ecranul principal”.",
            "Browser menu (⋮) → “Install app” / “Add to Home Screen”."
          )
        : t(
            "În bara de adrese apasă pictograma de instalare (⊕), sau meniul → „Instalează”.",
            "Click the install icon (⊕) in the address bar, or menu → “Install”."
          );

  const pushBlockedByInstall = ios && !installed; // iOS push needs an installed PWA
  const tgApplies = tg?.configured === true;

  const steps = [
    {
      key: "install",
      done: installed,
      title: t("Instalează aplicația", "Install the app"),
      sub: installed
        ? t("Instalată ✓", "Installed ✓")
        : t("Acces rapid de pe ecranul principal.", "Quick access from your home screen."),
      action:
        installed || inApp
          ? null
          : { label: installEvt ? t("Instalează", "Install") : t("Cum?", "How?"), on: doInstall },
      hint: !installed && (inApp || showInstallSteps || (ios && !installEvt)) ? installSteps : null,
    },
    {
      key: "push",
      done: pushOn,
      title: t("Activează notificările", "Turn on notifications"),
      sub: pushOn
        ? t("Active ✓", "On ✓")
        : pushBlockedByInstall
          ? t("Instalează aplicația întâi (pas 1).", "Install the app first (step 1).")
          : pushSupported
            ? t("Mementouri gratuite pe telefon.", "Free reminders on your phone.")
            : t("Neacceptat pe acest browser.", "Not supported on this browser."),
      action:
        pushOn || pushBlockedByInstall || !pushSupported
          ? null
          : { label: t("Activează", "Enable"), on: doPush },
      hint: null,
    },
    ...(tgApplies
      ? [
          {
            key: "tg",
            done: tg!.linked,
            title: t("Conectează Telegram", "Connect Telegram"),
            sub: tg!.linked
              ? t("Conectat ✓", "Connected ✓")
              : tgWaiting
                ? t("Apasă „Start” în Telegram…", "Tap “Start” in Telegram…")
                : t("Mementouri gratuite, fără cost.", "Free reminders, no cost."),
            action: tg!.linked
              ? null
              : { label: t("Conectează", "Connect"), on: doTelegram },
            hint: null,
          },
        ]
      : []),
  ];

  const remaining = steps.filter((s) => !s.done).length;
  // Don't render until platform is known; hide entirely once nothing is left.
  if (!ready) return null;
  const allCoreDone = steps.every((s) => s.done);
  if (allCoreDone && !open) return null;

  return (
    <div className="relative mr-2" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("Configurare", "Setup")}
        className="relative flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800"
      >
        <span aria-hidden>🚀</span>
        <span className="hidden sm:inline">{t("Configurare", "Setup")}</span>
        {remaining > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
            {remaining}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-gray-700 bg-gray-900 p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{t("Pași de configurare", "Setup steps")}</p>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">✕</button>
          </div>
          <div className="space-y-2">
            {steps.map((s) => (
              <div key={s.key} className="rounded-lg bg-gray-800 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 text-sm ${s.done ? "text-green-400" : "text-gray-500"}`}>
                      {s.done ? "✓" : "○"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{s.title}</p>
                      <p className="text-xs text-gray-400">{s.sub}</p>
                    </div>
                  </div>
                  {s.action && (
                    <button
                      onClick={s.action.on}
                      disabled={busy === s.key}
                      className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {busy === s.key ? "…" : s.action.label}
                    </button>
                  )}
                </div>
                {s.hint && (
                  <p className="mt-2 rounded-lg border border-blue-900/40 bg-blue-950/40 p-2 text-xs text-blue-100">
                    {s.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
          {allCoreDone && (
            <p className="mt-2 text-center text-xs text-green-400">{t("Totul e gata! 🎉", "All set! 🎉")}</p>
          )}
        </div>
      )}
    </div>
  );
}
