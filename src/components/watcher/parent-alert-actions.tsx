"use client";

import { useEffect, useState } from "react";

interface NudgeTarget {
  value: string;
  label: string;
  message: string;
  url: string;
}

/**
 * CTA shown on a "no reaction" parent alert: send a memento for ONE or SEVERAL
 * un-done sessions (recent ignored ≤4h + upcoming ≤4h), or a free-text message;
 * optionally as a SERIES (every N min until a chosen time). The server refuses /
 * auto-stops a series when the child's next scheduled session is imminent.
 */
export function ParentAlertActions({ childId }: { childId: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("Hai la o sesiune scurtă! 💪");
  const [intervalMin, setIntervalMin] = useState(15);
  const [until, setUntil] = useState("2h");
  const [channels, setChannels] = useState<string[]>(["PUSH", "TELEGRAM"]);
  const [targets, setTargets] = useState<{ recent: NudgeTarget[]; upcoming: NudgeTarget[] }>({ recent: [], upcoming: [] });
  const [selected, setSelected] = useState<string[]>([]); // [] = mesaj liber
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/watcher/${childId}/nudge-targets`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setTargets({ recent: d.recent ?? [], upcoming: d.upcoming ?? [] }); })
      .catch(() => {});
  }, [childId]);

  const allTargets = [...targets.recent, ...targets.upcoming];
  const toggleTarget = (value: string) =>
    setSelected((s) => (s.includes(value) ? s.filter((v) => v !== value) : [...s, value]));

  // When exactly one target is picked, prefill the message (so the free-text box
  // + a series both reflect that session).
  useEffect(() => {
    if (selected.length === 1) {
      const t = allTargets.find((x) => x.value === selected[0]);
      if (t) setMsg(t.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

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

  const postOne = async (body: {
    message: string;
    intervalMin?: number;
    untilAt?: string;
    url?: string;
  }): Promise<boolean> => {
    const r = await fetch(`/api/dashboard/watcher/${childId}/nudge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, channels }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Nu am putut trimite.");
      return false;
    }
    return true;
  };

  // "Trimite memento acum": one memento per selected un-done session, or a single
  // free-text memento when nothing is selected.
  const sendNow = async () => {
    if (channels.length === 0) {
      setError("Alege cel puțin un canal.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      if (selected.length === 0) {
        if (await postOne({ message: msg })) setDone("Memento trimis ✅");
        return;
      }
      let ok = 0;
      for (const value of selected) {
        const t = allTargets.find((x) => x.value === value);
        if (!t) continue;
        if (await postOne({ message: t.message, url: t.url })) ok++;
        else break;
      }
      if (ok > 0) setDone(`${ok} ${ok === 1 ? "memento trimis" : "mementouri trimise"} ✅`);
    } finally {
      setBusy(false);
    }
  };

  // Series uses the free-text message; if exactly one session is selected it
  // carries that session's deep-link.
  const startSeries = async () => {
    if (channels.length === 0) {
      setError("Alege cel puțin un canal.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const one = selected.length === 1 ? allTargets.find((x) => x.value === selected[0]) : undefined;
      const ok = await postOne({
        message: msg,
        intervalMin,
        untilAt: computeUntil(),
        ...(one ? { url: one.url } : {}),
      });
      if (ok) {
        setDone("Serie pornită ✅");
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p className="mt-3 text-xs text-green-400">{done}</p>;

  const hasTargets = allTargets.length > 0;
  const Target = ({ t }: { t: NudgeTarget }) => (
    <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-gray-800">
      <input
        type="checkbox"
        checked={selected.includes(t.value)}
        onChange={() => toggleTarget(t.value)}
        className="mt-0.5 accent-blue-500"
      />
      <span className="text-white">{t.label}</span>
    </label>
  );

  return (
    <div className="mt-3 space-y-2 border-t border-gray-800 pt-3">
      {/* Target picker — pick one OR several un-done sessions (ignored ≤4h / upcoming ≤4h). */}
      {hasTargets && (
        <div className="space-y-1 text-xs text-gray-400">
          <span>Pentru ce sesiuni (bifează una sau mai multe):</span>
          {targets.recent.length > 0 && (
            <div>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">Sărite recent (≤4h)</p>
              {targets.recent.map((t) => (
                <Target key={t.value} t={t} />
              ))}
            </div>
          )}
          {targets.upcoming.length > 0 && (
            <div>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">Viitoare (≤4h)</p>
              {targets.upcoming.map((t) => (
                <Target key={t.value} t={t} />
              ))}
            </div>
          )}
          {selected.length > 1 && (
            <p className="text-[11px] text-blue-300">
              {selected.length} sesiuni selectate — se trimite câte un memento pentru fiecare.
            </p>
          )}
        </div>
      )}

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
          onClick={sendNow}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {selected.length > 1 ? `Trimite ${selected.length} mementouri acum` : "Trimite memento acum"}
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
              onClick={startSeries}
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
