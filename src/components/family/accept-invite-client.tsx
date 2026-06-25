"use client";

import { useState } from "react";

const ROLE_RO: Record<string, string> = {
  CHILD: "elev",
  PARENT: "părinte",
  TUTOR: "meditator",
};

/**
 * Accept button for a family invite. The user is already logged in (the server
 * component renders sign-in links otherwise). On success it sends the user to
 * their dashboard.
 */
export function AcceptInviteClient({
  token,
  code,
  targetRole,
  locale,
}: {
  token?: string;
  code?: string;
  targetRole: string;
  locale: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/family/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(token ? { token } : { code }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      window.location.href = `/${locale}/dashboard`;
      return;
    }
    setBusy(false);
    if (d.status === "seat_unavailable") {
      setError(d.seat?.message ?? "Locurile din pachet sunt ocupate.");
    } else if (d.status === "expired") {
      setError("Invitația a expirat.");
    } else if (d.status === "already_used") {
      setError("Invitația a fost deja folosită.");
    } else if (d.status === "self_invite") {
      setError("Nu îți poți accepta propria invitație.");
    } else {
      setError("Nu am putut accepta invitația.");
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={accept}
        disabled={busy}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {busy ? "Se procesează…" : `Accept ca ${ROLE_RO[targetRole] ?? "membru"}`}
      </button>
      {error && <p className="text-sm text-amber-400">{error}</p>}
    </div>
  );
}
