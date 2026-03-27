"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PredictiveCard } from "@/components/instructor/predictive-card";

interface Prediction {
  studentId: string;
  studentName: string | null;
  domain: { id: string; name: string; slug: string };
  failureProbability: number;
  trend: "improving" | "declining" | "stable";
  factors: string[];
  recommendation: string;
}

interface AnalyticsData {
  predictions: Prediction[];
  summary: {
    totalStudents: number;
    atRiskCount: number;
    decliningCount: number;
    improvingCount: number;
    averageRisk: number;
  };
}

export default function InstructorAnalyticsPage() {
  const t = useTranslations("instructor");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "at_risk" | "declining" | "improving">("all");

  useEffect(() => {
    fetch("/api/dashboard/instructor/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">{t("loading")}</p>;
  if (!data) return <p className="text-red-400">{t("noData")}</p>;

  const filtered = data.predictions.filter((p) => {
    if (filter === "at_risk") return p.failureProbability > 60;
    if (filter === "declining") return p.trend === "declining";
    if (filter === "improving") return p.trend === "improving";
    return true;
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("predictiveAnalytics")}</h1>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label={t("totalStudents")}
          value={data.summary.totalStudents}
          accent="border-gray-700"
        />
        <SummaryCard
          label={t("atRisk")}
          value={data.summary.atRiskCount}
          accent="border-red-600"
        />
        <SummaryCard
          label={t("declining")}
          value={data.summary.decliningCount}
          accent="border-yellow-600"
        />
        <SummaryCard
          label={t("improving")}
          value={data.summary.improvingCount}
          accent="border-green-600"
        />
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {(["all", "at_risk", "declining", "improving"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-600/10 text-blue-500"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {t(`filter_${f}`)}
          </button>
        ))}
      </div>

      {/* Predictions grid */}
      {filtered.length === 0 ? (
        <p className="text-gray-500">{t("noPredictions")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((prediction) => (
            <PredictiveCard
              key={`${prediction.studentId}-${prediction.domain.id}`}
              prediction={prediction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className={`rounded-xl border ${accent} bg-gray-900 p-4`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
