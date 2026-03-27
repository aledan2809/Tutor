"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface RevenueData {
  mrr: number;
  totalRevenue: number;
  totalTransactions: number;
  totalUsers: number;
  activeSubscriptions: number;
  churnRate: number;
  conversionRate: number;
  recentPayments: {
    id: string;
    amount: number;
    status: string;
    type: string;
    createdAt: string;
    user: { name: string | null; email: string | null };
    plan: { name: string } | null;
  }[];
  planDistribution: {
    id: string;
    name: string;
    price: number;
    interval: string;
    subscribers: number;
  }[];
}

export function RevenueDashboard() {
  const t = useTranslations("admin");
  const [data, setData] = useState<RevenueData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/revenue?days=${days}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => { fetchRevenue(); }, [days]);

  if (loading || !data) {
    return <p className="text-gray-400">{t("loading")}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              days === d
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">MRR</p>
          <p className="text-2xl font-bold text-green-400">${data.mrr.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">{t("totalRevenue")}</p>
          <p className="text-2xl font-bold text-white">${data.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{data.totalTransactions} transactions</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">{t("churnRate")}</p>
          <p className={`text-2xl font-bold ${data.churnRate > 5 ? "text-red-400" : "text-green-400"}`}>
            {data.churnRate}%
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">{t("conversionRate")}</p>
          <p className="text-2xl font-bold text-blue-400">{data.conversionRate}%</p>
          <p className="text-xs text-gray-500">
            {data.activeSubscriptions} / {data.totalUsers} users
          </p>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">{t("planDistribution")}</h3>
        <div className="space-y-2">
          {data.planDistribution.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white">{plan.name}</span>
                <span className="ml-2 text-xs text-gray-500">
                  ${plan.price}/{plan.interval.toLowerCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-purple-400">
                {plan.subscribers} subscribers
              </span>
            </div>
          ))}
          {data.planDistribution.length === 0 && (
            <p className="text-sm text-gray-500">No plans with subscribers</p>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">{t("recentPayments")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400">
              <tr>
                <th className="pb-2">User</th>
                <th className="pb-2">Plan</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.recentPayments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 text-white">{p.user.name || p.user.email}</td>
                  <td className="py-2 text-gray-300">{p.plan?.name || "—"}</td>
                  <td className="py-2 text-green-400">${p.amount.toFixed(2)}</td>
                  <td className="py-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${
                      p.status === "succeeded" ? "bg-green-600/20 text-green-400" :
                      p.status === "failed" ? "bg-red-600/20 text-red-400" :
                      "bg-yellow-600/20 text-yellow-400"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {data.recentPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No payments yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
