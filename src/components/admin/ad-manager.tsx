"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface AdRow {
  id: string;
  name: string;
  slot: string;
  imageUrl: string | null;
  clickUrl: string | null;
  priority: number;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
}

const AD_SLOTS = [
  "homepage_banner",
  "exam_sidebar",
  "dashboard_top",
  "practice_bottom",
];

export function AdManager() {
  const t = useTranslations("admin");
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slot: AD_SLOTS[0],
    imageUrl: "",
    clickUrl: "",
    priority: 0,
  });

  const fetchAds = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/ads");
    const data = await res.json();
    setAds(data);
    setLoading(false);
  };

  useEffect(() => { fetchAds(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        imageUrl: form.imageUrl || null,
        clickUrl: form.clickUrl || null,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", slot: AD_SLOTS[0], imageUrl: "", clickUrl: "", priority: 0 });
      fetchAds();
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAds();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad placement?")) return;
    await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
    fetchAds();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">{t("saAds")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          {showForm ? t("cancel") : t("createAd")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("adName")}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Summer Sale Banner"
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("adSlot")}</label>
              <select
                value={form.slot}
                onChange={(e) => setForm({ ...form, slot: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                {AD_SLOTS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("imageUrl")}</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("clickUrl")}</label>
              <input
                type="url"
                value={form.clickUrl}
                onChange={(e) => setForm({ ...form, clickUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("priority")}</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                min={0}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            {t("createAd")}
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
                <th className="px-4 py-3">{t("adName")}</th>
                <th className="px-4 py-3">{t("adSlot")}</th>
                <th className="px-4 py-3">{t("impressions")}</th>
                <th className="px-4 py-3">{t("adClicks")}</th>
                <th className="px-4 py-3">CTR</th>
                <th className="px-4 py-3">{t("voucherStatus")}</th>
                <th className="px-4 py-3">{t("userActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-900/50">
                  <td className="px-4 py-3 text-white">{ad.name}</td>
                  <td className="px-4 py-3 text-gray-300">{ad.slot.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-gray-300">{ad.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{ad.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-blue-400">
                    {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0"}%
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${
                      ad.isActive ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"
                    }`}>
                      {ad.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggle(ad.id, ad.isActive)}
                        className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
                      >
                        {ad.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="rounded bg-red-600/20 px-2 py-1 text-xs text-red-400 hover:bg-red-600/30"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {ads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No ad placements yet
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
