"use client";

import { useEffect, useState } from "react";

interface Break {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  label: string | null;
}

const fmt = (ymd: string) =>
  new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

/** Manage a child's vacation periods (no reminders / no parent alerts in range). */
export function BreaksManager({ apiBase }: { apiBase: string }) {
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(apiBase);
      const d = await r.json();
      setBreaks(Array.isArray(d?.breaks) ? d.breaks : []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async () => {
    if (!start || !end) return;
    if (end < start) {
      setError("Data de final trebuie să fie ≥ data de început.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: start, endDate: end, label: label.trim() || null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error || "Nu am putut adăuga.");
        return;
      }
      if (d.break) {
        setBreaks((b) => [...b, d.break].sort((x, y) => x.startDate.localeCompare(y.startDate)));
      }
      setStart("");
      setEnd("");
      setLabel("");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    setBreaks((b) => b.filter((x) => x.id !== id));
  };

  if (loading) return <p className="text-sm text-gray-400">Se încarcă…</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        În zilele de vacanță nu se trimit memento-uri și nu primești alerte.
      </p>

      {breaks.length === 0 ? (
        <p className="text-sm text-gray-500">Nicio perioadă de vacanță.</p>
      ) : (
        <div className="space-y-1">
          {breaks.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded bg-gray-800 px-3 py-2">
              <span className="text-sm text-white">
                {b.startDate === b.endDate ? fmt(b.startDate) : `${fmt(b.startDate)} – ${fmt(b.endDate)}`}
                {b.label ? <span className="ml-2 text-xs text-gray-400">{b.label}</span> : null}
              </span>
              <button onClick={() => remove(b.id)} className="text-xs text-gray-500 hover:text-red-400">
                Șterge
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-gray-400">
            De la
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 block rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
            />
          </label>
          <label className="text-xs text-gray-400">
            Până la
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 block rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
            />
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Etichetă (opțional)"
            className="min-w-[120px] flex-1 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          />
          <button
            onClick={add}
            disabled={saving || !start || !end}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Se adaugă…" : "+ Adaugă vacanță"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
