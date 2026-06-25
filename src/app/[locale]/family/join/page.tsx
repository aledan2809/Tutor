"use client";

import { useState } from "react";
import Link from "next/link";

const ROLE_RO: Record<string, string> = {
  CHILD: "elev",
  PARENT: "părinte",
  TUTOR: "meditator",
};

export default function FamilyJoinPage() {
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<{
    inviterName: string | null;
    targetRole: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const norm = code.trim().toUpperCase();

  const lookup = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    const r = await fetch(`/api/family/invite/lookup?code=${encodeURIComponent(norm)}`);
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok || !d.found) {
      setError("Cod inexistent. Verifică-l și încearcă din nou.");
      return;
    }
    if (!d.usable) {
      setError("Codul a fost deja folosit sau a expirat.");
      return;
    }
    setInfo({ inviterName: d.inviterName, targetRole: d.targetRole });
  };

  const accept = async () => {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/family/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: norm }),
    });
    if (r.status === 401) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent("/family/join")}`;
      return;
    }
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) {
      setDone(true);
      return;
    }
    if (d.status === "seat_unavailable")
      setError(d.seat?.message ?? "Locurile din pachet sunt ocupate.");
    else if (d.status === "expired") setError("Codul a expirat.");
    else if (d.status === "already_used") setError("Codul a fost deja folosit.");
    else if (d.status === "self_invite") setError("Nu îți poți accepta propriul cod.");
    else if (d.status === "role_conflict") setError("Ai deja un alt rol în această familie.");
    else setError("Nu am putut folosi codul.");
  };

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Intră în familie cu un cod
        </h1>

        {done ? (
          <div className="mt-4">
            <p className="text-green-600 dark:text-green-400">Gata! Ești legat de familie.</p>
            <Link href="/dashboard" className="mt-3 inline-block text-blue-600 underline dark:text-blue-400">
              Mergi la panou
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Introdu codul de familie primit de la părinte.
            </p>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setInfo(null);
              }}
              placeholder="ex. ABCD2345"
              className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono uppercase tracking-widest text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {!info ? (
              <button
                onClick={lookup}
                disabled={busy || norm.length < 4}
                className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {busy ? "Se verifică…" : "Verifică codul"}
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{info.inviterName ?? "Cineva"}</strong> te invită ca{" "}
                  <strong>{ROLE_RO[info.targetRole] ?? "membru"}</strong>.
                </p>
                <button
                  onClick={accept}
                  disabled={busy}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {busy ? "Se procesează…" : "Accept"}
                </button>
              </div>
            )}

            {error && <p className="mt-3 text-sm text-amber-500">{error}</p>}
          </>
        )}
      </div>
    </main>
  );
}
