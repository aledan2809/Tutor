"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface TimeRange {
  start: string;
  end: string;
}

export function StudyHoursForm() {
  const t = useTranslations("settings");
  const [ranges, setRanges] = useState<TimeRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/study-hours")
      .then((r) => r.json())
      .then((data) => {
        if (data.studyHours && data.studyHours.length > 0) {
          setRanges(
            data.studyHours.map((h: string) => {
              const [start, end] = h.split("-");
              return { start, end };
            })
          );
        } else {
          setRanges([{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }]);
        }
      })
      .catch(() => {
        setRanges([{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }]);
      })
      .finally(() => setLoading(false));
  }, []);

  function addRange() {
    setRanges((prev) => [...prev, { start: "09:00", end: "12:00" }]);
  }

  function removeRange(index: number) {
    setRanges((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRange(index: number, field: "start" | "end", value: string) {
    setRanges((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const studyHours = ranges.map((r) => `${r.start}-${r.end}`);
      await fetch("/api/settings/study-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyHours }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">{t("loading")}</p>;
  }

  return (
    <div className="space-y-3">
      {ranges.map((range, i) => (
        <div key={i} className="flex items-center gap-3">
          <input
            type="time"
            value={range.start}
            onChange={(e) => updateRange(i, "start", e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
          <span className="text-gray-500">–</span>
          <input
            type="time"
            value={range.end}
            onChange={(e) => updateRange(i, "end", e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
          {ranges.length > 1 && (
            <button
              onClick={() => removeRange(i)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              {t("remove")}
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addRange}
        className="text-sm text-blue-400 hover:text-blue-300"
      >
        + {t("addTimeRange")}
      </button>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? t("saving") : t("save")}
        </button>
        {saved && <span className="text-sm text-green-400">{t("saved")}</span>}
      </div>
    </div>
  );
}
