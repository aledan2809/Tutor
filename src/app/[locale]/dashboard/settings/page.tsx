"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CalendarConnect } from "@/components/calendar/calendar-connect";
import { StudyHoursForm } from "@/components/calendar/study-hours-form";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tCal = useTranslations("calendar");
  const { data: session } = useSession();
  const [selectedDomain, setSelectedDomain] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const enrollments = session?.user?.enrollments || [];

  useEffect(() => {
    if (enrollments.length > 0 && !selectedDomain) {
      setSelectedDomain(enrollments[0].domainSlug);
    }
  }, [enrollments, selectedDomain]);

  useEffect(() => {
    if (!selectedDomain) return;
    fetch(`/api/${selectedDomain}/calendar/status`)
      .then((r) => r.json())
      .then((data) => {
        setConnected(data.connected);
        setConnectedAt(data.connectedAt);
      })
      .catch(() => setConnected(false));
  }, [selectedDomain, refreshKey]);

  if (!session) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-white">{t("title")}</h1>

      {/* Navigation links */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/settings/notifications"
          className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
        >
          {t("notificationSettings")}
        </Link>
      </div>

      {/* Domain selector */}
      {enrollments.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {tCal("selectDomain")}
          </label>
          <div className="flex gap-2">
            {enrollments.map((e) => (
              <button
                key={e.domainSlug}
                onClick={() => setSelectedDomain(e.domainSlug)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedDomain === e.domainSlug
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {e.domainSlug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Google Calendar */}
      {selectedDomain && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            {tCal("googleCalendar")}
          </h2>
          <CalendarConnect
            domainSlug={selectedDomain}
            connected={connected}
            connectedAt={connectedAt}
            onDisconnect={() => {
              setConnected(false);
              setConnectedAt(null);
              setRefreshKey((k) => k + 1);
            }}
          />
        </div>
      )}

      {/* Study Hours */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {t("studyHours")}
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          {t("studyHoursDescription")}
        </p>
        <StudyHoursForm />
      </div>
    </div>
  );
}
