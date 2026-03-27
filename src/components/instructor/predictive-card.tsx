"use client";

import { useTranslations } from "next-intl";

interface PredictiveCardProps {
  prediction: {
    studentId: string;
    studentName: string | null;
    domain: { id: string; name: string; slug: string };
    failureProbability: number;
    trend: "improving" | "declining" | "stable";
    factors: string[];
    recommendation: string;
  };
}

export function PredictiveCard({ prediction }: PredictiveCardProps) {
  const t = useTranslations("instructor");

  const riskColor =
    prediction.failureProbability > 70
      ? "border-red-600 bg-red-600/5"
      : prediction.failureProbability > 40
        ? "border-yellow-600 bg-yellow-600/5"
        : "border-green-600 bg-green-600/5";

  const riskLabel =
    prediction.failureProbability > 70
      ? t("highRisk")
      : prediction.failureProbability > 40
        ? t("mediumRisk")
        : t("lowRisk");

  const trendIcon =
    prediction.trend === "improving"
      ? "↑"
      : prediction.trend === "declining"
        ? "↓"
        : "→";

  const trendColor =
    prediction.trend === "improving"
      ? "text-green-400"
      : prediction.trend === "declining"
        ? "text-red-400"
        : "text-gray-400";

  return (
    <div className={`rounded-xl border ${riskColor} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-white">
            {prediction.studentName ?? "Unknown"}
          </p>
          <p className="text-xs text-gray-500">{prediction.domain.name}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {prediction.failureProbability}%
          </p>
          <p className="text-xs text-gray-400">{riskLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`text-sm font-medium ${trendColor}`}>
          {trendIcon} {t(`trend_${prediction.trend}`)}
        </span>
      </div>

      {prediction.factors.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">{t("riskFactors")}</p>
          <ul className="space-y-0.5">
            {prediction.factors.slice(0, 3).map((f, i) => (
              <li key={i} className="text-xs text-gray-400">
                · {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 border-t border-gray-800 pt-2 mt-2">
        {prediction.recommendation}
      </p>
    </div>
  );
}
