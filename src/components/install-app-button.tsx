"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { INSTALL_DONE_KEY, isStandalone, isIOS, isMobileUA, readFlag } from "@/lib/pwa";

// Permanent "Install the app" card in Settings — always available (no snooze),
// complementing the dismissible post-login banner. Chromium uses the native
// prompt; iOS/Firefox/desktop-FF show platform steps.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton() {
  const ro = useLocale() === "ro";
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone() || readFlag(INSTALL_DONE_KEY));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onClick = async () => {
    if (installEvt) {
      setBusy(true);
      try {
        await installEvt.prompt();
        await installEvt.userChoice;
      } catch {
        /* dismissed */
      } finally {
        setInstallEvt(null);
        setBusy(false);
      }
    } else {
      setShowSteps((s) => !s);
    }
  };

  const steps = isIOS()
    ? ro
      ? "Apasă butonul Share (pătrat cu săgeată ↑), apoi „Adaugă la ecranul principal”."
      : "Tap the Share button (square with ↑), then “Add to Home Screen”."
    : isMobileUA()
      ? ro
        ? "Deschide meniul browserului (⋮) și alege „Instalează aplicația” / „Adaugă la ecranul principal”."
        : "Open the browser menu (⋮) and choose “Install app” / “Add to Home Screen”."
      : ro
        ? "În bara de adrese apasă pictograma de instalare (⊕), sau meniul browserului → „Instalează”."
        : "Click the install icon (⊕) in the address bar, or the browser menu → “Install”.";

  return (
    <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-white">
            {ro ? "Instalează aplicația" : "Install the app"}
          </h3>
          <p className="text-xs text-gray-500">
            {ro
              ? "Acces rapid de pe ecranul principal, ca o aplicație."
              : "Quick access from your home screen, like an app."}
          </p>
        </div>
        {installed ? (
          <span className="shrink-0 text-xs font-medium text-green-400">
            {ro ? "Instalată ✓" : "Installed ✓"}
          </span>
        ) : (
          <button
            onClick={onClick}
            disabled={busy}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "…" : ro ? "Instalează" : "Install"}
          </button>
        )}
      </div>
      {showSteps && !installEvt && !installed && (
        <p className="mt-3 rounded-lg border border-blue-900/40 bg-blue-950/40 p-3 text-xs text-blue-100">
          {steps}
        </p>
      )}
    </div>
  );
}
