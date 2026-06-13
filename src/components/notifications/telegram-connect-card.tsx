"use client";

import { useEffect, useState, useCallback } from "react";

interface LinkStatus {
  configured: boolean;
  linked: boolean;
  username: string | null;
}

/**
 * Telegram connect card — opt-in deep-link flow. Mints a t.me/<bot>?start link,
 * opens it, then polls link status so the UI flips to "connected" once the user
 * taps /start in Telegram. Renders nothing if the bot isn't configured.
 */
export function TelegramConnectCard() {
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/telegram/link");
      if (r.ok) setStatus(await r.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // While waiting for the user to tap /start, poll a few times so the card
  // flips to "connected" without a manual refresh.
  useEffect(() => {
    if (!waiting) return;
    let n = 0;
    const id = setInterval(async () => {
      n += 1;
      await refresh();
      if (n >= 20) setWaiting(false); // ~100s ceiling
    }, 5000);
    return () => clearInterval(id);
  }, [waiting, refresh]);

  useEffect(() => {
    if (status?.linked) setWaiting(false);
  }, [status?.linked]);

  if (!status?.configured) return null;

  async function connect() {
    setBusy(true);
    try {
      const r = await fetch("/api/telegram/link", { method: "POST" });
      if (r.ok) {
        const { url } = await r.json();
        window.open(url, "_blank", "noopener,noreferrer");
        setWaiting(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/telegram/link", { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
      <div>
        <h3 className="text-sm font-medium text-white">Telegram Reminders</h3>
        <p className="text-xs text-gray-500">
          {status.linked
            ? `Connected${status.username ? ` as @${status.username}` : ""} — reminders arrive free on Telegram`
            : waiting
              ? "Tap Start in Telegram to finish connecting…"
              : "Get reminders free on Telegram instead of SMS/WhatsApp"}
        </p>
      </div>
      {status.linked ? (
        <button
          onClick={disconnect}
          disabled={busy}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={connect}
          disabled={busy}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {busy ? "…" : waiting ? "Reopen link" : "Connect"}
        </button>
      )}
    </div>
  );
}
