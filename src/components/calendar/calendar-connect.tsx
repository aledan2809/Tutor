"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface CalendarConnectProps {
  domainSlug: string;
  connected: boolean;
  connectedAt?: string | null;
  onDisconnect?: () => void;
}

export function CalendarConnect({
  domainSlug,
  connected,
  connectedAt,
  onDisconnect,
}: CalendarConnectProps) {
  const t = useTranslations("calendar");
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch(`/api/${domainSlug}/calendar/connect`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await fetch(`/api/${domainSlug}/calendar/connect`, { method: "DELETE" });
      onDisconnect?.();
    } finally {
      setLoading(false);
    }
  }

  if (connected) {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-green-800/50 bg-green-900/20 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600/20">
          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-400">{t("connected")}</p>
          {connectedAt && (
            <p className="text-xs text-gray-500">
              {t("connectedSince", { date: new Date(connectedAt).toLocaleDateString() })}
            </p>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="rounded-lg border border-red-800/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          {t("disconnect")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
        <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} />
        <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} />
        <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
      </svg>
      {loading ? t("connecting") : t("connectGoogle")}
    </button>
  );
}
