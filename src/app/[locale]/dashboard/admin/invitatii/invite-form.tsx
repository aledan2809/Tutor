"use client";

import { useState } from "react";

type DomainOpt = {
  id: string;
  name: string;
  course: string;
  org: string | null;
  code: string;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
};

/**
 * Formularul de invitare. Trei stări, toate spuse pe față: se trimite / a plecat /
 * n-a plecat, cu motivul de la Meta. Ruta se apasă în fața clientului, deci o
 * eroare înghițită ar fi mai rea decât una urâtă.
 */
export function InviteForm({ domains }: { domains: DomainOpt[] }) {
  const [domainId, setDomainId] = useState(domains[0]?.id ?? "");
  const [phone, setPhone] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [badgeNo, setBadgeNo] = useState("");
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const selected = domains.find((d) => d.id === domainId);

  const submit = async () => {
    if (busy || !domainId || !phone.trim() || !lastName.trim() || !firstName.trim()) return;
    setBusy(true);
    setOk(null);
    setErr(null);
    try {
      const res = await fetch("/api/admin/course-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId, phone, lastName, firstName, jobTitle, badgeNo, county, city, postOffice,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr([data?.error, data?.detail].filter(Boolean).join(" · ") || "Mesajul nu a plecat.");
        return;
      }
      setOk(`Trimis lui ${data.person}, la ${data.to} — cursul „${data.course}".`);
      setPhone(""); setLastName(""); setFirstName(""); setBadgeNo("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Mesajul nu a plecat.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div>
        <label htmlFor="materie" className="mb-1 block text-sm text-gray-400">
          Materia
        </label>
        <select
          id="materie"
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white"
        >
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.org ? `${d.org} — ${d.name}` : d.name}
            </option>
          ))}
        </select>
        {selected && (
          <p className="mt-2 text-xs text-gray-500">
            Curs: {selected.course} · cod {selected.code} · folosit de {selected.uses}
            {selected.maxUses !== null ? ` din ${selected.maxUses}` : ""} ori
            {selected.expiresAt
              ? ` · expiră ${new Date(selected.expiresAt).toLocaleDateString("ro-RO")}`
              : ""}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="telefon" className="mb-1 block text-sm text-gray-400">
          Numărul lui de telefon
        </label>
        <input
          id="telefon"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07xx xxx xxx"
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-600"
        />
        <p className="mt-1 text-xs text-gray-500">
          Trebuie să fie un număr cu WhatsApp. Merge scris și cu 0 la început.
        </p>
      </div>

      {/*
        Numele nu e comoditate de gestiune, e chiar mecanismul de raportare: fără
        el, managerul vede un număr de telefon și nu știe cine a citit ce. De-aia
        numele și prenumele sunt obligatorii, iar restul, opțional.
      */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="nume" className="mb-1 block text-sm text-gray-400">Nume</label>
          <input id="nume" value={lastName} onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white" />
        </div>
        <div>
          <label htmlFor="prenume" className="mb-1 block text-sm text-gray-400">Prenume</label>
          <input id="prenume" value={firstName} onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white" />
        </div>
        <div>
          <label htmlFor="functie" className="mb-1 block text-sm text-gray-400">Funcția</label>
          <input id="functie" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
            placeholder="factor poștal"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-600" />
        </div>
        <div>
          <label htmlFor="marca" className="mb-1 block text-sm text-gray-400">Marca</label>
          <input id="marca" value={badgeNo} onChange={(e) => setBadgeNo(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white" />
        </div>
        <div>
          <label htmlFor="judet" className="mb-1 block text-sm text-gray-400">Județ</label>
          <input id="judet" value={county} onChange={(e) => setCounty(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white" />
        </div>
        <div>
          <label htmlFor="localitate" className="mb-1 block text-sm text-gray-400">Localitate</label>
          <input id="localitate" value={city} onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white" />
        </div>
        <div className="col-span-2">
          <label htmlFor="oficiu" className="mb-1 block text-sm text-gray-400">Oficiul poștal</label>
          <input id="oficiu" value={postOffice} onChange={(e) => setPostOffice(e.target.value)}
            placeholder="Oficiul Poștal Slatina 3"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-600" />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={busy || !phone.trim() || !lastName.trim() || !firstName.trim()}
        className="min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Se trimite…" : "Trimite invitația pe WhatsApp"}
      </button>

      {ok && (
        <div
          role="status"
          className="rounded-lg border border-green-800 bg-green-900/20 px-3 py-2 text-sm text-green-300"
        >
          {ok}
        </div>
      )}
      {err && (
        <div
          role="status"
          className="rounded-lg border border-amber-800 bg-amber-900/20 px-3 py-2 text-sm text-amber-200"
        >
          {err}
        </div>
      )}
    </div>
  );
}
