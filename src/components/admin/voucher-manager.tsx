"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface VoucherRow {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: { name: string | null; email: string | null };
}

export function VoucherManager() {
  const t = useTranslations("admin");
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const emptyForm = { code: "", discountPercent: 10, maxUses: "", expiresAt: "" };
  const [form, setForm] = useState(emptyForm);

  const fetchVouchers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/vouchers");
    const data = await res.json();
    setVouchers(data.vouchers);
    setLoading(false);
  };

  useEffect(() => { fetchVouchers(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setFormError("");
  };

  const startEdit = (v: VoucherRow) => {
    setForm({
      code: v.code,
      discountPercent: v.discountPercent,
      maxUses: v.maxUses != null ? String(v.maxUses) : "",
      // datetime-local wants "YYYY-MM-DDTHH:mm"
      expiresAt: v.expiresAt ? new Date(v.expiresAt).toISOString().slice(0, 16) : "",
    });
    setEditingId(v.id);
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const payload = {
      code: form.code.toUpperCase(),
      discountPercent: form.discountPercent,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    const res = editingId
      ? await fetch(`/api/admin/vouchers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/vouchers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (res.ok) {
      resetForm();
      fetchVouchers();
    } else {
      const d = await res.json().catch(() => ({}));
      setFormError(typeof d.error === "string" ? d.error : "Could not save voucher");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/vouchers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchVouchers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this voucher?")) return;
    await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
    fetchVouchers();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">{t("saVouchers")}</h2>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(true);
            }
          }}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          {showForm ? t("cancel") : t("createVoucher")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("voucherCode")}</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SUMMER2026"
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("discountPercent")}</label>
              <input
                type="number"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: parseInt(e.target.value) })}
                min={1}
                max={100}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("maxUses")}</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Unlimited"
                min={1}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("expiresAt")}</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          {editingId && (
            <p className="text-xs text-yellow-400/80">
              Editezi voucherul. Schimbarea codului invalidează codurile deja distribuite.
            </p>
          )}
          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            {editingId ? "Save" : t("createVoucher")}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">{t("loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3">{t("voucherCode")}</th>
                <th className="px-4 py-3">{t("discountPercent")}</th>
                <th className="px-4 py-3">{t("usageCount")}</th>
                <th className="px-4 py-3">{t("expiresAt")}</th>
                <th className="px-4 py-3">{t("voucherStatus")}</th>
                <th className="px-4 py-3">{t("userActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-gray-900/50">
                  <td className="px-4 py-3 font-mono text-white">{v.code}</td>
                  <td className="px-4 py-3 text-green-400">{v.discountPercent}%</td>
                  <td className="px-4 py-3 text-gray-300">
                    {v.usedCount}{v.maxUses ? ` / ${v.maxUses}` : " / ∞"}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${
                      v.isActive ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"
                    }`}>
                      {v.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(v)}
                        className="rounded bg-blue-600/20 px-2 py-1 text-xs text-blue-400 hover:bg-blue-600/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(v.id, v.isActive)}
                        className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
                      >
                        {v.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="rounded bg-red-600/20 px-2 py-1 text-xs text-red-400 hover:bg-red-600/30"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No vouchers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
