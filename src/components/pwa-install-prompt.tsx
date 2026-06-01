"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [ro, setRo] = useState(false);

  // This component lives in the root (locale-less) layout, so detect language
  // from the browser/path rather than next-intl context.
  useEffect(() => {
    const byPath = window.location.pathname.startsWith("/ro");
    const byLang = (navigator.language || "").toLowerCase().startsWith("ro");
    setRo(byPath || byLang);
  }, []);

  const T = ro
    ? {
        title: "Instalează Tutor",
        desc: "Instalează pentru acces offline și încărcare mai rapidă",
        install: "Instalează",
        notNow: "Mai târziu",
        dismiss: "Închide",
      }
    : {
        title: "Install Tutor",
        desc: "Install for offline access and faster loading",
        install: "Install",
        notNow: "Not now",
        dismiss: "Dismiss",
      };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 30s delay on first visit
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 30000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg border border-blue-500/30 bg-gray-900 p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{T.title}</p>
          <p className="mt-1 text-xs text-gray-400">
            {T.desc}
          </p>
        </div>
        <button onClick={handleDismiss} className="text-gray-500 hover:text-gray-300" aria-label={T.dismiss}>
          ✕
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {T.install}
        </button>
        <button
          onClick={handleDismiss}
          className="rounded px-3 py-1.5 text-sm text-gray-400 hover:text-white"
        >
          {T.notNow}
        </button>
      </div>
    </div>
  );
}
