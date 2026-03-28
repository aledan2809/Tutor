"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface PlanRow {
  id: string;
  name: string;
  stripeId: string;
  price: number;
  interval: string;
  trialDays: number | null;
  features: string[] | null;
  isActive: boolean;
  subscriberCount: number;
}

type FormData = {
  name: string;
  price: number;
  interval: "MONTH" | "YEAR" | "ONE_TIME";
  trialDays: string;
  features: string;
};

const emptyForm: FormData = { name: "", price: 0, interval: "MONTH", trialDays: "", features: "" };

export function PlanManager() {
  const t = useTranslations("admin");
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");

  const fetchPlans = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/plans");
    if (res.ok) {
      const data = await res.json();
      setPlans(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (plan: PlanRow) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      price: plan.price,
      interval: plan.interval as FormData["interval"],
      trialDays: plan.trialDays?.toString() || "",
      features: plan.features?.join("\n") || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name,
      price: Math.round(form.price * 100),
      interval: form.interval,
      trialDays: form.trialDays ? parseInt(form.trialDays) : null,
      features: form.features ? form.features.split("\n").filter(Boolean) : [],
    };

    const url = editingId ? `/api/admin/plans/${editingId}` : "/api/admin/plans";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchPlans();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save plan");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchPlans();
  };

  const handleDelete = async (plan: PlanRow) => {
    if (!confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
    if (res.ok) {
      fetchPlans();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete plan");
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">{t("saPlans")}</h2>
        {!showForm && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            + {t("createPlan")}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-300">
            {editingId ? "Edit Plan" : "Create New Plan"}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("planName")}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Monthly Pro"
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("planPrice")} (USD)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.01}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("planInterval")}</label>
              <select
                value={form.interval}
                onChange={(e) => setForm({ ...form, interval: e.target.value as FormData["interval"] })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="MONTH">Monthly</option>
                <option value="YEAR">Yearly</option>
                <option value="ONE_TIME">One-time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("trialDays")}</label>
              <input
                type="number"
                value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
                placeholder="0"
                min={0}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t("planFeatures")}</label>
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder="One feature per line..."
              rows={3}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              {editingId ? "Save Changes" : t("createPlan")}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">{t("loading")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border p-4 ${
                plan.isActive ? "border-gray-700 bg-gray-900" : "border-gray-800 bg-gray-950 opacity-60"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    ${plan.price}
                    <span className="text-sm text-gray-400 font-normal">
                      /{plan.interval.toLowerCase()}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(plan.id, plan.isActive)}
                  className={`rounded px-2 py-1 text-xs ${
                    plan.isActive
                      ? "bg-green-600/20 text-green-400"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </button>
              </div>
              {plan.trialDays && (
                <p className="mt-1 text-xs text-blue-400">{plan.trialDays}-day free trial</p>
              )}
              <p className="mt-2 text-sm text-purple-400">
                {plan.subscriberCount} subscriber{plan.subscriberCount !== 1 ? "s" : ""}
              </p>
              {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {(plan.features as string[]).map((f, i) => (
                    <li key={i} className="text-xs text-gray-400">• {f}</li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex gap-2 border-t border-gray-800 pt-3">
                <button
                  onClick={() => openEdit(plan)}
                  className="rounded bg-blue-600/20 px-3 py-1 text-xs text-blue-400 hover:bg-blue-600/30"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan)}
                  className="rounded bg-red-600/20 px-3 py-1 text-xs text-red-400 hover:bg-red-600/30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="col-span-3 text-center text-gray-500 py-8">No plans created yet</p>
          )}
        </div>
      )}
    </div>
  );
}
