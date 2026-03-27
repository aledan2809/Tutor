"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Student {
  id: string;
  name: string | null;
  email: string | null;
}

interface ScheduleFormProps {
  domainSlug: string;
  isInstructor?: boolean;
  prefillStart?: string;
  prefillEnd?: string;
  onScheduled?: () => void;
}

export function ScheduleForm({
  domainSlug,
  isInstructor,
  prefillStart,
  prefillEnd,
  onScheduled,
}: ScheduleFormProps) {
  const t = useTranslations("calendar");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Pre-fill from selected slot
  useEffect(() => {
    if (prefillStart) {
      setStartTime(toLocalDatetimeValue(prefillStart));
    }
    if (prefillEnd) {
      setEndTime(toLocalDatetimeValue(prefillEnd));
    }
  }, [prefillStart, prefillEnd]);

  // Load students for instructor
  useEffect(() => {
    if (!isInstructor) return;
    setLoadingStudents(true);
    fetch(`/api/${domainSlug}/calendar/students`)
      .then((r) => r.json())
      .then((data) => setStudents(data.students || []))
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [isInstructor, domainSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload: Record<string, unknown> = { title, description, startTime, endTime };
      if (isInstructor && selectedStudentIds.length > 0) {
        payload.studentIds = selectedStudentIds;
      }
      const res = await fetch(`/api/${domainSlug}/calendar/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("scheduleFailed"));
        return;
      }

      setSuccess(t("scheduleSuccess"));
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setSelectedStudentIds([]);
      onScheduled?.();
    } catch {
      setError(t("scheduleFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {t("sessionTitle")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder={t("sessionTitlePlaceholder")}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {t("description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t("startTime")}
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t("endTime")}
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {isInstructor && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t("scheduleForStudents")}
          </label>
          {loadingStudents ? (
            <p className="text-xs text-gray-500">{t("loadingStudents")}</p>
          ) : students.length === 0 ? (
            <p className="text-xs text-gray-500">{t("noStudentsEnrolled")}</p>
          ) : (
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-2">
              {students.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(s.id)}
                    onChange={(e) => {
                      setSelectedStudentIds((prev) =>
                        e.target.checked
                          ? [...prev, s.id]
                          : prev.filter((id) => id !== s.id)
                      );
                    }}
                    className="rounded border-gray-600"
                  />
                  {s.name || s.email}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? t("scheduling") : t("scheduleSession")}
      </button>
    </form>
  );
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
