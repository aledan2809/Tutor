"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
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
 *
 * Resilience: if the user keeps tapping "install" without success (counted in
 * localStorage), we surface an ALTERNATE plan (check Safari / use Telegram
 * without installing / skip). The notification + Telegram steps are OPTIONAL and
 * can be dismissed ("Mai târziu") — e.g. a user who doesn't want notifications
 * or has no Telegram account.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
interface TgStatus {
  configured: boolean;
  linked: boolean;
}

const ATTEMPTS_KEY = "tutor_pwa_install_attempts";
const SKIP_INSTALL = "tutor_setup_skip_install";
const SKIP_PUSH = "tutor_setup_skip_push";
const SKIP_TG = "tutor_setup_skip_tg";
const ATTEMPT_THRESHOLD = 2; // after this many tries with no install → alt plan

export function SetupChecklist({ showLinkChild = false }: { showLinkChild?: boolean }) {
  const ro = useLocale() === "ro";
  const t = (r: string, e: string) => (ro ? r : e);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  // For parent accounts: whether at least one child is already linked (drives the
  // "add your child" step). null = not yet known.
  const [childLinked, setChildLinked] = useState<boolean | null>(null);

  const [ios, setIos] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [inApp, setInApp] = useState(false);

  const [installed, setInstalled] = useState(false);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallSteps, setShowInstallSteps] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [tg, setTg] = useState<TgStatus | null>(null);
  const [tgWaiting, setTgWaiting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // dismissed (skipped) steps
  const [skipInstall, setSkipInstall] = useState(false);
  const [skipPush, setSkipPush] = useState(false);
  const [skipTg, setSkipTg] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIos(isIOS());
    setMobile(isMobileUA());
    setInApp(isInAppWebView());
    setInstalled(isStandalone() || readFlag(INSTALL_DONE_KEY));
    setSkipInstall(readFlag(SKIP_INSTALL));
    setSkipPush(readFlag(SKIP_PUSH));
    setSkipTg(readFlag(SKIP_TG));
    try {
      setAttempts(Number(localStorage.getItem(ATTEMPTS_KEY) ?? 0) || 0);
    } catch {}
    setReady(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      writeFlag(INSTALL_DONE_KEY);
      try {
        localStorage.removeItem(ATTEMPTS_KEY);
      } catch {}
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (isPushSupported()) {
      setPushSupported(true);
      if (Notification.permission !== "denied") {
        navigator.serviceWorker.ready
          .then((reg) => reg.pushManager.getSubscription())
          .then((sub) => setPushOn(!!sub))
          .catch(() => {});
      }
    }

    fetch("/api/telegram/link")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setTg({ configured: !!d.configured, linked: !!d.linked }))
      .catch(() => {});

    // Parent accounts: is a child already linked? Drives the "add your child" step.
    if (showLinkChild) {
      fetch("/api/dashboard/family")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setChildLinked((d.children?.length ?? 0) > 0))
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

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

  const bumpAttempts = () => {
    setAttempts((a) => {
      const next = a + 1;
      try {
        localStorage.setItem(ATTEMPTS_KEY, String(next));
      } catch {}
      return next;
    });
  };
  const skip = (key: "install" | "push" | "tg") => {
    const map = { install: SKIP_INSTALL, push: SKIP_PUSH, tg: SKIP_TG } as const;
    writeFlag(map[key]);
    if (key === "install") setSkipInstall(true);
    if (key === "push") setSkipPush(true);
    if (key === "tg") setSkipTg(true);
  };
  const resetSkips = () => {
    try {
      [SKIP_INSTALL, SKIP_PUSH, SKIP_TG].forEach((k) => localStorage.removeItem(k));
    } catch {}
    setSkipInstall(false);
    setSkipPush(false);
    setSkipTg(false);
  };

  const doInstall = async () => {
    if (installEvt) {
      setBusy("install");
      try {
        await installEvt.prompt();
        const choice = await installEvt.userChoice;
        if (choice.outcome !== "accepted") bumpAttempts();
      } catch {
        bumpAttempts();
      } finally {
        setInstallEvt(null);
        setBusy(null);
      }
    } else {
      // No native prompt (iOS / Firefox / nothing happens) → show steps + count
      // the attempt so we can offer an alternate plan after a few tries.
      setShowInstallSteps(true);
      bumpAttempts();
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
      ? t("În Safari: apasă Share ↑ (jos), apoi „Adaugă la ecranul principal”.", "In Safari: tap Share ↑ (bottom), then “Add to Home Screen”.")
      : mobile
        ? t("Meniul browserului (⋮) → „Instalează aplicația” / „Adaugă la ecranul principal”.", "Browser menu (⋮) → “Install app” / “Add to Home Screen”.")
        : t("În bara de adrese apasă pictograma de instalare (⊕), sau meniul → „Instalează”.", "Click the install icon (⊕) in the address bar, or menu → “Install”.");

  const pushBlockedByInstall = ios && !installed;
  const tgApplies = tg?.configured === true;
  const tgLinked = tg?.linked === true;
  const showAltPlan = !installed && attempts >= ATTEMPT_THRESHOLD;

  type Step = {
    key: "install" | "push" | "tg" | "child";
    done: boolean;
    title: string;
    sub: string;
    action: { label: string; on: () => void } | null;
    canSkip: boolean;
  };
  const all: Step[] = [
    // Parent-only: link a child first — the whole family flow is pointless without it.
    ...(showLinkChild
      ? [
          {
            key: "child" as const,
            done: childLinked === true,
            title: t("Adaugă copilul", "Add your child"),
            sub:
              childLinked === true
                ? t("Copil legat ✓", "Child linked ✓")
                : t(
                    "Leagă contul copilului ca să-i vezi progresul.",
                    "Link your child's account to see their progress."
                  ),
            action:
              childLinked === true
                ? null
                : {
                    label: t("Adaugă", "Add"),
                    on: () => {
                      setOpen(false);
                      router.push("/dashboard/family");
                    },
                  },
            canSkip: false,
          },
        ]
      : []),
    {
      key: "install",
      done: installed,
      title: t("Instalează aplicația", "Install the app"),
      sub: installed
        ? t("Instalată ✓", "Installed ✓")
        : t("Acces rapid de pe ecranul principal.", "Quick access from your home screen."),
      action: installed || inApp ? null : { label: installEvt ? t("Instalează", "Install") : t("Cum?", "How?"), on: doInstall },
      canSkip: false, // skip is offered only via the alternate plan
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
      action: pushOn || pushBlockedByInstall || !pushSupported ? null : { label: t("Activează", "Enable"), on: doPush },
      canSkip: true,
    },
    ...(tgApplies
      ? [
          {
            key: "tg" as const,
            done: tgLinked,
            title: t("Conectează Telegram", "Connect Telegram"),
            sub: tgLinked
              ? t("Conectat ✓", "Connected ✓")
              : tgWaiting
                ? t("Apasă „Start” în Telegram…", "Tap “Start” in Telegram…")
                : t("Mementouri gratuite (necesită cont Telegram).", "Free reminders (needs a Telegram account)."),
            action: tgLinked ? null : { label: t("Conectează", "Connect"), on: doTelegram },
            canSkip: true,
          },
        ]
      : []),
  ];

  const skipped: Record<string, boolean> = { install: skipInstall, push: skipPush, tg: skipTg };
  const visible = all.filter((s) => !skipped[s.key]);
  const anySkipped = all.some((s) => skipped[s.key]);
  const remaining = visible.filter((s) => !s.done).length;

  if (!ready) return null;
  const allDone = visible.every((s) => s.done);
  if (allDone && !anySkipped && !open) return null;

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
            {visible.map((s) => (
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
                  <div className="flex shrink-0 items-center gap-1">
                    {s.action && (
                      <button
                        onClick={s.action.on}
                        disabled={busy === s.key}
                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {busy === s.key ? "…" : s.action.label}
                      </button>
                    )}
                    {s.canSkip && !s.done && s.key !== "child" && (
                      <button
                        onClick={() => s.key !== "child" && skip(s.key)}
                        className="rounded-lg px-2 py-1 text-[11px] text-gray-500 hover:text-gray-300"
                        title={t("Ascunde acest pas", "Hide this step")}
                      >
                        {t("Mai târziu", "Later")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Install: steps + alternate plan after repeated failed attempts */}
                {s.key === "install" && !installed && (inApp || showInstallSteps) && (
                  <p className="mt-2 rounded-lg border border-blue-900/40 bg-blue-950/40 p-2 text-xs text-blue-100">
                    {installSteps}
                  </p>
                )}
                {s.key === "install" && showAltPlan && (
                  <div className="mt-2 rounded-lg border border-amber-900/40 bg-amber-950/30 p-2 text-xs text-amber-100">
                    <p className="font-medium">{t("Nu reușește instalarea?", "Install not working?")}</p>
                    <ul className="ml-4 mt-1 list-disc space-y-0.5">
                      <li>
                        {inApp
                          ? t("Ești într-un browser din altă aplicație — deschide întâi în Safari/Chrome.", "You're in another app's browser — open in Safari/Chrome first.")
                          : t("Asigură-te că ești în Safari/Chrome (nu într-o altă aplicație).", "Make sure you're in Safari/Chrome (not inside another app).")}
                      </li>
                      <li>{t("Instalarea NU e obligatorie — poți primi notificările pe Telegram, fără instalare.", "Installing is NOT required — you can get reminders on Telegram, no install needed.")}</li>
                    </ul>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tgApplies && !tgLinked && (
                        <button
                          onClick={doTelegram}
                          disabled={busy === "tg"}
                          className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {t("Folosește Telegram", "Use Telegram")}
                        </button>
                      )}
                      <button
                        onClick={() => skip("install")}
                        className="rounded-lg border border-gray-600 px-2.5 py-1 text-xs text-gray-300 hover:bg-gray-800"
                      >
                        {t("Sari peste instalare", "Skip install")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {anySkipped && (
            <button onClick={resetSkips} className="mt-2 w-full text-center text-[11px] text-gray-500 hover:text-gray-300">
              {t("Arată pașii ascunși", "Show hidden steps")}
            </button>
          )}
          {allDone && !anySkipped && (
            <p className="mt-2 text-center text-xs text-green-400">{t("Totul e gata! 🎉", "All set! 🎉")}</p>
          )}
        </div>
      )}
    </div>
  );
}
