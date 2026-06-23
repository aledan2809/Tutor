"use client";

import { useState } from "react";

/**
 * CTA shown on a "no reaction" parent alert: authorize a single extra memento,
 * or a SERIES (every N min until a chosen time). The server refuses / auto-stops
 * the series when the child's next scheduled session is imminent (no overlap).
 */
export function ParentAlertActions({ childId }: { childId: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("Hai la o sesiune scurtă! 💪");
  const [intervalMin, setIntervalMin] = useState(15);
  const [until, setUntil] = useState("2h");
  const [channels, setChannels] = useState<string[]>(["PUSH", "TELEGRAM"]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const CHANNELS: { v: string; label: string }[] = [
    { v: "PUSH", label: "Aplicație" },
    { v: "TELEGRAM", label: "Telegram" },
    { v: "WHATSAPP", label: "WhatsApp" },
    { v: "EMAIL", label: "Email" },
  ];
  const toggleChannel = (v: string) =>
    setChannels((cs) => (cs.includes(v) ? cs.filter((c) => c !== v) : [...cs, v]));

  const computeUntil = (): string => {
    if (until === "18") {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      if (d.getTime() <= Date.now()) return new Date(Date.now() + 4 * 3_600_000).toISOString();
      return d.toISOString();
    }
    const h = until === "1h" ? 1 : until === "4h" ? 4 : 2;
    return new Date(Date.now() + h * 3_600_000).toISOString();
  };

  const post = async (body: { message: string; intervalMin?: number; untilAt?: string }) => {
    if (channels.length === 0) {
      setError("Alege cel puțin un canal.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const r = await fetch(`/api/dashboard/watcher/${childId}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, channels }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error || "Nu am putut trimite.");
        return;
      }
      setDone(body.intervalMin ? "Serie pornită ✅" : "Memento trimis ✅");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p className="mt-3 text-xs text-green-400">{done}</p>;

  return (
    <div className="mt-3 space-y-2 border-t border-gray-800 pt-3">
      {/* Channel picker — e.g. direct WhatsApp only. */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <span>Pe:</span>
        {CHANNELS.map((c) => (
          <button
            key={c.v}
            onClick={() => toggleChannel(c.v)}
            className={`rounded-full border px-2.5 py-1 transition-colors ${
              channels.includes(c.v)
                ? "border-blue-500 bg-blue-600/20 text-blue-300"
                : "border-gray-700 text-gray-400 hover:bg-gray-800"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={() => post({ message: msg })}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Trimite memento acum
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
        >
          Serie de mementouri…
        </button>
      </div>

      {open && (
        <div className="space-y-2 rounded-lg bg-gray-800 p-3">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Mesaj (la care reacționează)"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <label className="flex items-center gap-1">
              La fiecare
              <select
                value={intervalMin}
                onChange={(e) => setIntervalMin(Number(e.target.value))}
                className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-white"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              până
              <select
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-white"
              >
                <option value="1h">peste 1h</option>
                <option value="2h">peste 2h</option>
                <option value="4h">peste 4h</option>
                <option value="18">la ora 18:00</option>
              </select>
            </label>
            <button
              disabled={busy || !msg.trim()}
              onClick={() => post({ message: msg, intervalMin, untilAt: computeUntil() })}
              className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Pornește seria
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            Seria se oprește automat când copilul reacționează sau când urmează o sesiune programată.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
