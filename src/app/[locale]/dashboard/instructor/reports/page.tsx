"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function InstructorReportsPage() {
  const t = useTranslations("instructor");
  const [reportType, setReportType] = useState<"student" | "group" | "domain">("student");
  const [targetId, setTargetId] = useState("");
  const [format, setFormat] = useState<"json" | "csv">("csv");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  const handleGenerate = async () => {
    if (!targetId.trim()) return;
    setLoading(true);
    setReport(null);

    try {
      const url = `/api/dashboard/instructor/reports?type=${reportType}&id=${targetId}&format=${format}`;
      const res = await fetch(url);

      if (format === "csv") {
        const blob = await res.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${reportType}-report-${targetId}.csv`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      } else {
        const data = await res.json();
        setReport(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("reports")}</h1>

      <div className="mb-6 max-w-xl space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            {t("reportType")}
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as "student" | "group" | "domain")}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none"
          >
            <option value="student">{t("perStudent")}</option>
            <option value="group">{t("perGroup")}</option>
            <option value="domain">{t("perDomain")}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            {t("targetId")}
          </label>
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder={t("enterTargetId")}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            {t("exportFormat")}
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "json" | "csv")}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !targetId.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("generating") : t("generateReport")}
        </button>
      </div>

      {report && format === "json" && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">{t("reportResults")}</h2>
          <pre className="max-h-96 overflow-auto rounded bg-gray-800 p-4 text-xs text-gray-300">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
