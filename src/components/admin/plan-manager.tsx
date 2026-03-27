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

export function PlanManager() {
  const t = useTranslations("admin");
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: 0,
    interval: "MONTH" as "MONTH" | "YEAR" | "ONE_TIME",
    trialDays: "",
    features: "",
  });

  const fetchPlans = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/plans");
    const data = await res.json();
    setPlans(data);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        price: Math.round(form.price * 100), // dollars to cents
        interval: form.interval,
        trialDays: form.trialDays ? parseInt(form.trialDays) : null,
        features: form.features ? form.features.split("\n").filter(Boolean) : [],
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", price: 0, interval: "MONTH", trialDays: "", features: "" });
      fetchPlans();
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">{t("saPlans")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          {showForm ? t("cancel") : t("createPlan")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
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
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
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
                onChange={(e) => setForm({ ...form, interval: e.target.value as "MONTH" | "YEAR" | "ONE_TIME" })}
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
          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            {t("createPlan")}
          </button>
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
