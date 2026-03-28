"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface SelectOption {
  id: string;
  name: string;
}

export default function InstructorReportsPage() {
  const t = useTranslations("instructor");
  const [reportType, setReportType] = useState<"student" | "group" | "domain">("student");
  const [targetId, setTargetId] = useState("");
  const [format, setFormat] = useState<"json" | "csv">("csv");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  // Dynamic options
  const [students, setStudents] = useState<SelectOption[]>([]);
  const [groups, setGroups] = useState<SelectOption[]>([]);
  const [domains, setDomains] = useState<SelectOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/instructor/students?limit=200").then((r) => r.json()),
      fetch("/api/dashboard/instructor/groups").then((r) => r.json()),
      fetch("/api/admin/domains").then((r) => r.json()).catch(() => ({ domains: [] })),
    ]).then(([studentsData, groupsData, domainsData]) => {
      setStudents(
        (studentsData.students ?? []).map((s: { id: string; name: string | null; email: string | null }) => ({
          id: s.id,
          name: s.name ?? s.email ?? s.id,
        }))
      );
      setGroups(
        (groupsData.groups ?? []).map((g: { id: string; name: string }) => ({
          id: g.id,
          name: g.name,
        }))
      );
      setDomains(
        (domainsData.domains ?? []).map((d: { id: string; name: string }) => ({
          id: d.id,
          name: d.name,
        }))
      );
      setOptionsLoading(false);
    });
  }, []);

  // Reset target when type changes
  useEffect(() => {
    setTargetId("");
    setReport(null);
  }, [reportType]);

  const currentOptions =
    reportType === "student" ? students : reportType === "group" ? groups : domains;

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
            {t("selectTarget")}
          </label>
          {optionsLoading ? (
            <p className="text-sm text-gray-500">{t("loading")}</p>
          ) : currentOptions.length === 0 ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">{t("noOptionsAvailable")}</p>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder={t("enterTargetId")}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          ) : (
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none"
            >
              <option value="">
                {reportType === "student"
                  ? t("selectStudent")
                  : reportType === "group"
                    ? t("selectGroup")
                    : t("selectDomain")}
              </option>
              {currentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          )}
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
