"use client";

import { useEffect, useState } from "react";

interface Nudge {
  id: string;
  message: string;
  intervalMin: number | null;
  fireCount: number;
  lastFiredAt: string | null;
  createdAt: string;
}

const INTERVALS: { v: number | ""; label: string }[] = [
  { v: "", label: "O singură dată" },
  { v: 15, label: "Din 15 în 15 min" },
  { v: 30, label: "Din 30 în 30 min" },
  { v: 60, label: "Din oră în oră" },
];

/** Parent sends an on-demand nudge (custom message) to the child, optionally repeating. */
export function ParentNudgeManager({ apiBase }: { apiBase: string }) {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [interval, setIntervalVal] = useState<number | "">("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(apiBase);
      const d = await r.json();
      setNudges(Array.isArray(d?.nudges) ? d.nudges : []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    setSent(false);
    try {
      const r = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          intervalMin: interval === "" ? null : interval,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error || "Nu am putut trimite.");
        return;
      }
      setMessage("");
      setIntervalVal("");
      setSent(true);
      await load();
    } finally {
      setSending(false);
    }
  };

  const stop = async (id: string) => {
    const r = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    if (!r.ok) {
      setError("Nu am putut opri mementoul. Reîncearcă.");
      return;
    }
    setNudges((n) => n.filter((x) => x.id !== id));
  };

  if (loading) return <p className="text-sm text-gray-400">Se încarcă…</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Trimite-i un mesaj personalizat la care știi că reacționează. Se oprește singur când copilul reacționează.
      </p>

      {nudges.length > 0 && (
        <div className="space-y-1">
          {nudges.map((n) => (
            <div key={n.id} className="flex items-center justify-between rounded bg-gray-800 px-3 py-2">
              <span className="min-w-0 text-sm text-white">
                <span className="block truncate">{n.message}</span>
                <span className="text-xs text-gray-500">
                  {n.intervalMin ? `repetă din ${n.intervalMin} în ${n.intervalMin} min` : "o singură dată"} ·{" "}
                  {n.fireCount} trimis(e)
                </span>
              </span>
              <button onClick={() => stop(n.id)} className="ml-2 flex-shrink-0 text-xs text-gray-500 hover:text-red-400">
                Oprește
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Ex: Hai, Rareș, 10 minute acum și ești liber de seară 💪"
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={interval}
            onChange={(e) => setIntervalVal(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-xs text-white"
          >
            {INTERVALS.map((it) => (
              <option key={String(it.v)} value={it.v}>
                {it.label}
              </option>
            ))}
          </select>
          <button
            onClick={send}
            disabled={sending || !message.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {sending ? "Se trimite…" : "Trimite memento acum"}
          </button>
          {sent && <span className="text-xs text-green-400">Trimis ✓</span>}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
