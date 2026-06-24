"use client";

import { useEffect, useState } from "react";

interface Schedule {
  id: string;
  childId: string | null;
  cadence: string;
  dayOfWeek: number | null;
  hour: number;
  minute: number;
  channels: string[];
  sections: string[];
  isActive: boolean;
  lastSentOn: string | null;
}
interface Child {
  id: string;
  name: string | null;
  email: string | null;
}

const DAYS = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
const CHANNELS: { v: string; label: string }[] = [
  { v: "EMAIL", label: "Email" },
  { v: "PUSH", label: "Aplicație" },
  { v: "TELEGRAM", label: "Telegram" },
];
const SECTIONS: { v: string; label: string }[] = [
  { v: "sessions", label: "Sesiuni" },
  { v: "discipline", label: "Disciplină" },
  { v: "weaknesses", label: "Puncte slabe" },
  { v: "results", label: "Rezultate" },
];
const hm = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

/**
 * Watcher report scheduler: parents set daily/weekly KPI digests (sessions,
 * discipline, weaknesses, results) delivered at a chosen day+time on chosen
 * channels — for one child or all linked children.
 */
export function ReportsManager() {
  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // form state
  const [childId, setChildId] = useState<string>(""); // "" = toți
  const [cadence, setCadence] = useState<"daily" | "weekly">("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1); // Luni
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [channels, setChannels] = useState<string[]>(["EMAIL"]);
  const [sections, setSections] = useState<string[]>(["sessions", "discipline", "weaknesses", "results"]);

  const load = () => {
    fetch("/api/dashboard/watcher/reports")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setSchedules(d.schedules ?? []);
          setChildren(d.children ?? []);
        }
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const childName = (id: string | null) => {
    if (!id) return "Toți copiii";
    const c = children.find((x) => x.id === id);
    return c?.name || c?.email || "Copil";
  };
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const create = async () => {
    if (channels.length === 0 || sections.length === 0) {
      setMsg("Alege cel puțin un canal și o secțiune.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/dashboard/watcher/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: childId || null,
          cadence,
          dayOfWeek: cadence === "weekly" ? dayOfWeek : null,
          hour,
          minute,
          channels,
          sections,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(d.error || "Nu am putut salva.");
        return;
      }
      setSchedules((s) => [...s, d.schedule]);
      setMsg("Raport programat ✅");
    } finally {
      setBusy(false);
    }
  };

  const patch = async (id: string, body: Partial<Schedule>) => {
    const r = await fetch(`/api/dashboard/watcher/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const d = await r.json();
      setSchedules((s) => s.map((x) => (x.id === id ? d.schedule : x)));
    }
  };
  const remove = async (id: string) => {
    const r = await fetch(`/api/dashboard/watcher/reports/${id}`, { method: "DELETE" });
    if (r.ok) setSchedules((s) => s.filter((x) => x.id !== id));
  };
  const sendNow = async (id: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/dashboard/watcher/reports/${id}/send`, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? `Trimis acum ✅ (${d.children ?? 0} ${d.children === 1 ? "copil" : "copii"})` : d.error || "Eroare");
    } finally {
      setBusy(false);
    }
  };

  const summary = (s: Schedule) =>
    `${s.cadence === "daily" ? "Zilnic" : `Săptămânal · ${DAYS[s.dayOfWeek ?? 1]}`} la ${hm(s.hour, s.minute)}`;

  return (
    <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-base font-semibold text-white">
          📈 Rapoarte programate
          {schedules.length > 0 && (
            <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs text-blue-300">
              {schedules.length}
            </span>
          )}
        </span>
        <span className="text-gray-400">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-gray-500">
            Primește automat un rezumat (sesiuni, disciplină, puncte slabe, rezultate) zilnic sau
            săptămânal, la ziua și ora pe care le alegi.
          </p>

          {loading ? (
            <p className="text-sm text-gray-500">Se încarcă…</p>
          ) : (
            <>
              {/* Existing schedules */}
              {schedules.length > 0 && (
                <div className="space-y-2">
                  {schedules.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-800 px-3 py-2"
                    >
                      <div className="text-sm text-white">
                        <span className="font-medium">{childName(s.childId)}</span>
                        <span className="ml-2 text-xs text-gray-400">{summary(s)}</span>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {s.sections
                            .map((x) => SECTIONS.find((y) => y.v === x)?.label ?? x)
                            .join(", ")}{" "}
                          · {s.channels.map((c) => CHANNELS.find((y) => y.v === c)?.label ?? c).join(", ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => patch(s.id, { isActive: !s.isActive })}
                          className={`rounded px-2 py-1 ${
                            s.isActive ? "bg-green-600/20 text-green-400" : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {s.isActive ? "Activ" : "Inactiv"}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => sendNow(s.id)}
                          className="rounded border border-gray-600 px-2 py-1 text-gray-300 hover:bg-gray-700 disabled:opacity-60"
                        >
                          Trimite acum
                        </button>
                        <button
                          onClick={() => remove(s.id)}
                          className="rounded px-2 py-1 text-red-400 hover:bg-red-600/10"
                        >
                          Șterge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* New schedule form */}
              <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-900 p-3">
                <p className="text-sm font-medium text-gray-300">Raport nou</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs text-gray-400">
                    Copil
                    <select
                      value={childId}
                      onChange={(e) => setChildId(e.target.value)}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-white"
                    >
                      <option value="">Toți copiii</option>
                      {children.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-gray-400">
                    Frecvență
                    <select
                      value={cadence}
                      onChange={(e) => setCadence(e.target.value as "daily" | "weekly")}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-white"
                    >
                      <option value="weekly">Săptămânal</option>
                      <option value="daily">Zilnic</option>
                    </select>
                  </label>
                  {cadence === "weekly" && (
                    <label className="flex flex-col gap-1 text-xs text-gray-400">
                      Ziua
                      <select
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(Number(e.target.value))}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-white"
                      >
                        {DAYS.map((d, i) => (
                          <option key={i} value={i}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="flex flex-col gap-1 text-xs text-gray-400">
                    Ora
                    <div className="flex items-center gap-1">
                      <select
                        value={hour}
                        onChange={(e) => setHour(Number(e.target.value))}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {String(i).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-500">:</span>
                      <select
                        value={minute}
                        onChange={(e) => setMinute(Number(e.target.value))}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-white"
                      >
                        {[0, 15, 30, 45].map((m) => (
                          <option key={m} value={m}>
                            {String(m).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>

                <div className="text-xs text-gray-400">
                  <span className="mb-1 block">Conținut</span>
                  <div className="flex flex-wrap gap-2">
                    {SECTIONS.map((s) => (
                      <button
                        key={s.v}
                        onClick={() => toggle(sections, setSections, s.v)}
                        className={`rounded-full border px-2.5 py-1 ${
                          sections.includes(s.v)
                            ? "border-blue-500 bg-blue-600/20 text-blue-300"
                            : "border-gray-700 text-gray-400 hover:bg-gray-800"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  <span className="mb-1 block">Canale</span>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((c) => (
                      <button
                        key={c.v}
                        onClick={() => toggle(channels, setChannels, c.v)}
                        className={`rounded-full border px-2.5 py-1 ${
                          channels.includes(c.v)
                            ? "border-blue-500 bg-blue-600/20 text-blue-300"
                            : "border-gray-700 text-gray-400 hover:bg-gray-800"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={busy}
                  onClick={create}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Programează raportul
                </button>
              </div>
            </>
          )}

          {msg && <p className="text-xs text-green-400">{msg}</p>}
        </div>
      )}
    </div>
  );
}
