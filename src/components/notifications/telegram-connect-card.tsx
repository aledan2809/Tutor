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
  // The minted link is KEPT on screen rather than only opened in a new tab.
  // Opening a `t.me` link on a laptop, where Telegram is not installed, goes
  // nowhere — which is exactly how the first attempt at this failed. Keeping it
  // visible lets the same person scan it with the phone instead.
  const [invite, setInvite] = useState<{ url: string; qrSvg: string | null; expiresInSec: number } | null>(null);

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
    if (status?.linked) {
      setWaiting(false);
      setInvite(null);
    }
  }, [status?.linked]);

  if (!status?.configured) return null;

  async function connect() {
    setBusy(true);
    try {
      const r = await fetch("/api/telegram/link", { method: "POST" });
      if (r.ok) {
        const data = await r.json();
        setInvite({ url: data.url, qrSvg: data.qrSvg ?? null, expiresInSec: data.expiresInSec });
        setWaiting(true);
        // Still try the app — on a phone this lands straight in Telegram and the
        // whole thing is one tap. On a laptop it does nothing useful, which is
        // why the QR stays on screen either way.
        window.open(data.url, "_blank", "noopener,noreferrer");
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

  if (status.linked) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-800 bg-emerald-950/20 px-4 py-3">
        <div>
          <h3 className="text-sm font-medium text-white">
            ✅ Telegram conectat{status.username ? ` — @${status.username}` : ""}
          </h3>
          <p className="text-xs text-gray-400">
            Mementourile și răspunsurile la feedback ajung aici, gratuit.
          </p>
        </div>
        <button
          onClick={disconnect}
          disabled={busy}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          Deconectează
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-blue-800 bg-blue-950/20 p-4">
      <h3 className="text-sm font-medium text-white">Primește notificările pe Telegram</h3>
      <p className="mt-1 text-xs text-gray-400">
        E gratuit și ajunge instant. WhatsApp costă la fiecare mesaj — de asta abonamentul
        e cu <strong className="text-emerald-300">10% mai ieftin</strong> cât timp
        comunicarea merge pe Telegram.
      </p>

      {!invite ? (
        <button
          onClick={connect}
          disabled={busy}
          className="mt-3 min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Se pregătește…" : "Conectează Telegram"}
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <ol className="space-y-2 text-sm text-gray-300">
            <li>
              <strong className="text-white">1.</strong> Ești pe telefon? S-a deschis
              Telegram — apasă <strong className="text-white">START</strong> și gata.
            </li>
            <li>
              <strong className="text-white">2.</strong> Ești pe calculator? Scanează codul
              de mai jos cu telefonul pe care ai Telegram.
            </li>
          </ol>

          {invite.qrSvg && (
            <div
              className="mx-auto w-fit rounded-lg bg-white p-2"
              // Generated on our own server — the link carries a single-use
              // token and must not be handed to an outside QR service.
              dangerouslySetInnerHTML={{ __html: invite.qrSvg }}
            />
          )}

          <div>
            <p className="mb-1 text-xs text-gray-500">Sau copiază linkul:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={invite.url}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-300"
              />
              <button
                onClick={() => navigator.clipboard?.writeText(invite.url)}
                className="shrink-0 rounded border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800"
              >
                Copiază
              </button>
            </div>
          </div>

          <p className="text-xs text-amber-300/80">
            Linkul e valabil ~{Math.round(invite.expiresInSec / 60)} minute și se folosește o
            singură dată. Dacă expiră, apasă din nou pe buton.
          </p>

          <button
            onClick={connect}
            disabled={busy}
            className="min-h-[40px] w-full rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50"
          >
            {busy ? "…" : waiting ? "Generează un link nou" : "Reîncearcă"}
          </button>
        </div>
      )}

      {waiting && (
        <p className="mt-3 text-xs text-blue-300">
          Aștept să apeși START în Telegram… pagina se actualizează singură.
        </p>
      )}
    </div>
  );
}
