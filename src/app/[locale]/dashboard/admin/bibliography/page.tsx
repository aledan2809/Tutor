"use client";

import { useState, useEffect } from "react";

interface Domain { id: string; name: string; slug: string; }
interface BibItem {
  id: string;
  domainId: string;
  title: string;
  authors: string;
  publisher: string | null;
  year: number | null;
  edition: string | null;
  city: string | null;
  isbn: string | null;
  url: string | null;
  notes: string | null;
  order: number;
  status: string;
  domain: { id: string; name: string; slug: string };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-900/50 text-yellow-400",
  APPROVED: "bg-blue-900/50 text-blue-400",
  PUBLISHED: "bg-green-900/50 text-green-400",
};

export default function BibliographyAdminPage() {
  const [items, setItems] = useState<BibItem[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BibItem | null>(null);

  const [form, setForm] = useState({
    domainId: "", title: "", authors: "", publisher: "", year: "",
    edition: "", city: "", isbn: "", url: "", notes: "", order: 0, status: "DRAFT",
  });

  const fetchData = () => {
    const url = filterDomain ? `/api/admin/bibliography?domainId=${filterDomain}` : "/api/admin/bibliography";
    fetch(url).then(r => r.json()).then(d => {
      setItems(d.items || []);
      setDomains(d.domains || []);
      if (!form.domainId && d.domains?.length) setForm(f => ({ ...f, domainId: d.domains[0].id }));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterDomain]);

  const resetForm = () => {
    setForm({ domainId: domains[0]?.id || "", title: "", authors: "", publisher: "", year: "", edition: "", city: "", isbn: "", url: "", notes: "", order: 0, status: "DRAFT" });
    setEditItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editItem ? "PUT" : "POST";
    const body = editItem ? { id: editItem.id, ...form, year: form.year ? parseInt(form.year as string) : null } : { ...form, year: form.year ? parseInt(form.year as string) : null };
    const res = await fetch("/api/admin/bibliography", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.ok) { resetForm(); fetchData(); }
  };

  const handleEdit = (item: BibItem) => {
    setForm({
      domainId: item.domainId, title: item.title, authors: item.authors,
      publisher: item.publisher || "", year: item.year?.toString() || "",
      edition: item.edition || "", city: item.city || "",
      isbn: item.isbn || "", url: item.url || "", notes: item.notes || "",
      order: item.order, status: item.status,
    });
    setEditItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bibliography entry?")) return;
    await fetch(`/api/admin/bibliography?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const quickAction = async (id: string, status: string) => {
    await fetch("/api/admin/bibliography", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchData();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bibliography</h1>
          <p className="mt-1 text-sm text-gray-400">Required by law — manage source references per domain</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          {showForm ? "Cancel" : "New Entry"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="text-sm font-medium text-white">{editItem ? "Edit Bibliography Entry" : "New Bibliography Entry"}</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Domain *</label>
              <select value={form.domainId} onChange={e => setForm({ ...form, domainId: e.target.value })} required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              placeholder="Teste grilă. Drept penal. Procedura penală" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Authors *</label>
            <input type="text" value={form.authors} onChange={e => setForm({ ...form, authors: e.target.value })} required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              placeholder="Mihail Udroiu" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Publisher</label>
              <input type="text" value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                placeholder="Editura C.H. Beck" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Year</label>
              <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                placeholder="2023" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">City</label>
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                placeholder="București" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Edition</label>
              <input type="text" value={form.edition} onChange={e => setForm({ ...form, edition: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                placeholder="Ediția 4, revizuită și adăugită" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">ISBN</label>
              <input type="text" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">URL (for online sources)</label>
              <input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Sort Order</label>
              <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Notes (optional — chapters, pages covered, etc.)</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
          </div>

          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            {editItem ? "Update" : "Create"}
          </button>
        </form>
      )}

      {domains.length > 1 && (
        <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
          <option value="">All Domains</option>
          {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500">No bibliography entries. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status] || "bg-gray-800 text-gray-400"}`}>
                  {item.status}
                </span>
                <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">{item.domain.name}</span>
              </div>
              <h3 className="text-sm font-medium text-white">{item.title}</h3>
              <p className="mt-1 text-xs text-gray-400">
                <strong>{item.authors}</strong>
                {item.edition && <span> · {item.edition}</span>}
                {item.publisher && <span> · {item.publisher}</span>}
                {item.city && <span>, {item.city}</span>}
                {item.year && <span>, {item.year}</span>}
              </p>
              {item.notes && <p className="mt-1 text-xs text-gray-500">{item.notes}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {item.status !== "PUBLISHED" && (
                  <button onClick={() => quickAction(item.id, "PUBLISHED")}
                    className="rounded bg-blue-700 px-2 py-1 text-xs text-white hover:bg-blue-600">
                    Publish
                  </button>
                )}
                {item.status === "DRAFT" && (
                  <button onClick={() => quickAction(item.id, "APPROVED")}
                    className="rounded bg-green-700 px-2 py-1 text-xs text-white hover:bg-green-600">
                    Approve
                  </button>
                )}
                <button onClick={() => handleEdit(item)} className="rounded border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-gray-800">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-900/20">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
