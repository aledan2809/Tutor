"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type CreatorEntry = {
  id: string;
  name: string;
  email: string;
  track: string;
  subject: string;
  experience: string | null;
  needsTaxHelp: boolean;
  cvPath: string | null;
  createdAt: string;
};

type FormState = {
  name: string;
  email: string;
  track: string;
  subject: string;
  experience: string;
  needsTaxHelp: boolean;
};

const emptyForm: FormState = { name: "", email: "", track: "", subject: "", experience: "", needsTaxHelp: false };

export function CreatoriAdmin({ entries }: { entries: CreatorEntry[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const taxHelpCount = entries.filter((e) => e.needsTaxHelp).length;

  const fieldClass =
    "w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none";

  async function create() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/creatori", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error || "Eroare la creare.");
      return;
    }
    setCreateForm(emptyForm);
    setShowCreate(false);
    router.refresh();
  }

  function startEdit(e: CreatorEntry) {
    setError("");
    setEditingId(e.id);
    setEditForm({
      name: e.name,
      email: e.email,
      track: e.track,
      subject: e.subject,
      experience: e.experience || "",
      needsTaxHelp: e.needsTaxHelp,
    });
  }

  async function saveEdit(id: string) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/creatori/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error || "Eroare la actualizare.");
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Ștergi înscrierea „${name}"? Acțiunea nu poate fi anulată.`)) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/creatori/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error || "Eroare la ștergere.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-xl font-semibold text-white">Înscrieri creatori</h2>
        <span className="rounded-full bg-blue-600/20 px-3 py-1 text-sm text-blue-300">{entries.length} total</span>
        {taxHelpCount > 0 && (
          <span className="rounded-full bg-amber-600/20 px-3 py-1 text-sm text-amber-300">{taxHelpCount} cer sprijin fiscal</span>
        )}
        <button
          onClick={() => { setShowCreate((v) => !v); setError(""); }}
          className="ml-auto rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCreate ? "Anulează" : "+ Adaugă creator"}
        </button>
      </div>

      {error && <p className="rounded bg-red-600/15 px-3 py-2 text-sm text-red-400">{error}</p>}

      {showCreate && (
        <div className="grid gap-2 rounded-lg border border-gray-800 bg-gray-950 p-4 sm:grid-cols-2">
          <input className={fieldClass} placeholder="Nume *" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
          <input className={fieldClass} placeholder="Email *" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
          <input className={fieldClass} placeholder="Track (ex: Bacalaureat)" value={createForm.track} onChange={(e) => setCreateForm({ ...createForm, track: e.target.value })} />
          <input className={fieldClass} placeholder="Materie *" value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} />
          <textarea className={`${fieldClass} sm:col-span-2`} placeholder="Experiență" rows={2} value={createForm.experience} onChange={(e) => setCreateForm({ ...createForm, experience: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={createForm.needsTaxHelp} onChange={(e) => setCreateForm({ ...createForm, needsTaxHelp: e.target.checked })} />
            Cere sprijin fiscal
          </label>
          <div className="sm:col-span-2">
            <button disabled={busy} onClick={create} className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {busy ? "Se salvează…" : "Salvează înscrierea"}
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-gray-400">Nicio înscriere încă.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Nume</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Pregătire → Materie</th>
                <th className="px-3 py-2">Experiență</th>
                <th className="px-3 py-2">Fiscal</th>
                <th className="px-3 py-2">CV</th>
                <th className="px-3 py-2 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {entries.map((e) => {
                const editing = editingId === e.id;
                return (
                  <tr key={e.id} className="bg-gray-950 align-top hover:bg-gray-900">
                    <td className="whitespace-nowrap px-3 py-2 text-gray-400">{new Date(e.createdAt).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })}</td>
                    {editing ? (
                      <>
                        <td className="px-3 py-2"><input className={fieldClass} value={editForm.name} onChange={(ev) => setEditForm({ ...editForm, name: ev.target.value })} /></td>
                        <td className="px-3 py-2"><input className={fieldClass} value={editForm.email} onChange={(ev) => setEditForm({ ...editForm, email: ev.target.value })} /></td>
                        <td className="px-3 py-2 space-y-1">
                          <input className={fieldClass} placeholder="Track" value={editForm.track} onChange={(ev) => setEditForm({ ...editForm, track: ev.target.value })} />
                          <input className={fieldClass} placeholder="Materie" value={editForm.subject} onChange={(ev) => setEditForm({ ...editForm, subject: ev.target.value })} />
                        </td>
                        <td className="px-3 py-2"><textarea className={fieldClass} rows={2} value={editForm.experience} onChange={(ev) => setEditForm({ ...editForm, experience: ev.target.value })} /></td>
                        <td className="px-3 py-2">
                          <label className="flex items-center gap-1 text-xs text-gray-300">
                            <input type="checkbox" checked={editForm.needsTaxHelp} onChange={(ev) => setEditForm({ ...editForm, needsTaxHelp: ev.target.checked })} />
                            fiscal
                          </label>
                        </td>
                        <td className="px-3 py-2">
                          {e.cvPath ? <a href={`/api/admin/creator-cv/${e.id}`} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">descarcă</a> : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <button disabled={busy} onClick={() => saveEdit(e.id)} className="mr-2 text-green-400 hover:underline disabled:opacity-50">Salvează</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:underline">Anulează</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 font-medium text-white">{e.name}</td>
                        <td className="px-3 py-2 text-gray-300"><a href={`mailto:${e.email}`} className="text-blue-400 hover:underline">{e.email}</a></td>
                        <td className="px-3 py-2 text-gray-300"><span className="text-gray-400">{e.track || "—"}</span><br /><span className="font-medium">{e.subject}</span></td>
                        <td className="max-w-xs px-3 py-2 text-gray-400">{e.experience || "—"}</td>
                        <td className="px-3 py-2">{e.needsTaxHelp ? <span className="rounded bg-amber-600/20 px-2 py-0.5 text-xs text-amber-300">cere sprijin</span> : <span className="text-gray-600">—</span>}</td>
                        <td className="px-3 py-2">{e.cvPath ? <a href={`/api/admin/creator-cv/${e.id}`} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">descarcă</a> : <span className="text-gray-600">—</span>}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <button onClick={() => startEdit(e)} className="mr-2 text-blue-400 hover:underline">Editează</button>
                          <button disabled={busy} onClick={() => remove(e.id, e.name)} className="text-red-400 hover:underline disabled:opacity-50">Șterge</button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
