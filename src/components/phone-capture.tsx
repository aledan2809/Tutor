"use client";

import { useEffect, useState } from "react";

/**
 * WhatsApp phone capture band. Reads/writes a phone via `apiBase` (GET → {phone},
 * PUT {phone} → set, PUT {phone:""} → clear). Used as the per-child band in the
 * Watcher (guardian endpoint) and as the student's own field in Settings.
 */
export function PhoneCapture({
  apiBase,
  label,
  hint,
}: {
  apiBase: string;
  label: string;
  hint: string;
}) {
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiBase)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setSaved(d.phone ?? null);
          setPhone(d.phone ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [apiBase]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error || "Număr invalid.");
        return;
      }
      setSaved(d.phone ?? null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    await fetch(apiBase, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "" }),
    });
    setSaved(null);
    setPhone("");
    setEditing(false);
  };

  if (loading) return null;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">{label}</h3>
        {saved && !editing && (
          <span className="rounded bg-green-600/20 px-2 py-0.5 text-xs text-green-400">WhatsApp activ</span>
        )}
      </div>

      {saved && !editing ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-300">{saved}</span>
          <span className="flex gap-3 text-xs">
            <button onClick={() => setEditing(true)} className="text-blue-400 hover:text-blue-300">
              Editează
            </button>
            <button onClick={clear} className="text-gray-500 hover:text-red-400">
              Șterge
            </button>
          </span>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-gray-500">{hint}</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="ex. +407xxxxxxxx"
              className="min-w-[160px] flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <button
              onClick={save}
              disabled={saving || !phone.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Se salvează…" : "Salvează"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </>
      )}
    </div>
  );
}
