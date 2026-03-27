"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { CalendarConnect } from "@/components/calendar/calendar-connect";
import { ScheduleForm } from "@/components/calendar/schedule-form";
import { EventList } from "@/components/calendar/event-list";
import { FreeSlots } from "@/components/calendar/free-slots";
import { CalendarGrid } from "@/components/calendar/calendar-grid";

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const { data: session } = useSession();
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [prefillStart, setPrefillStart] = useState<string | undefined>();
  const [prefillEnd, setPrefillEnd] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const enrollments = session?.user?.enrollments || [];

  const isInstructor = enrollments.some(
    (e) =>
      e.domainSlug === selectedDomain &&
      e.roles.includes("INSTRUCTOR" as never)
  );

  // Auto-select first domain
  useEffect(() => {
    if (enrollments.length > 0 && !selectedDomain) {
      setSelectedDomain(enrollments[0].domainSlug);
    }
  }, [enrollments, selectedDomain]);

  // Check connection status when domain changes
  useEffect(() => {
    if (!selectedDomain) return;
    setCheckingStatus(true);
    fetch(`/api/${selectedDomain}/calendar/status`)
      .then((r) => r.json())
      .then((data) => {
        setConnected(data.connected);
        setConnectedAt(data.connectedAt);
      })
      .catch(() => {
        setConnected(false);
      })
      .finally(() => setCheckingStatus(false));
  }, [selectedDomain, refreshKey]);

  function handleDisconnect() {
    setConnected(false);
    setConnectedAt(null);
    setRefreshKey((k) => k + 1);
  }

  function handleScheduled() {
    setRefreshKey((k) => k + 1);
    setPrefillStart(undefined);
    setPrefillEnd(undefined);
  }

  const handleSelectSlot = useCallback((start: string, end: string) => {
    setPrefillStart(start);
    setPrefillEnd(end);
    // Scroll to schedule form
    document.getElementById("schedule-form-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (!session) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        {connected && (
          <div className="flex gap-1 rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t("gridView")}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t("listView")}
            </button>
          </div>
        )}
      </div>

      {/* Domain selector */}
      {enrollments.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t("selectDomain")}
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

      {selectedDomain && !checkingStatus && (
        <>
          {/* Connection status */}
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-white">
              {t("googleCalendar")}
            </h2>
            <CalendarConnect
              domainSlug={selectedDomain}
              connected={connected}
              connectedAt={connectedAt}
              onDisconnect={handleDisconnect}
            />
          </div>

          {connected && (
            <>
              {/* Calendar grid view */}
              {viewMode === "grid" && (
                <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
                  <CalendarGrid
                    domainSlug={selectedDomain}
                    refreshKey={refreshKey}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left: Events */}
                <div className="lg:col-span-2">
                  {viewMode === "list" && (
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                      <h2 className="mb-4 text-lg font-semibold text-white">
                        {t("upcomingEvents")}
                      </h2>
                      <EventList
                        domainSlug={selectedDomain}
                        refreshKey={refreshKey}
                      />
                    </div>
                  )}

                  {/* Free Slots */}
                  <div className={`rounded-xl border border-gray-800 bg-gray-900 p-6 ${viewMode === "list" ? "mt-6" : ""}`}>
                    <h2 className="mb-4 text-lg font-semibold text-white">
                      {t("suggestedSlots")}
                    </h2>
                    <FreeSlots
                      domainSlug={selectedDomain}
                      onSelectSlot={handleSelectSlot}
                    />
                  </div>
                </div>

                {/* Right: Schedule */}
                <div id="schedule-form-section">
                  <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">
                      {t("scheduleSession")}
                    </h2>
                    <ScheduleForm
                      domainSlug={selectedDomain}
                      isInstructor={isInstructor}
                      prefillStart={prefillStart}
                      prefillEnd={prefillEnd}
                      onScheduled={handleScheduled}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {checkingStatus && (
        <p className="text-sm text-gray-500">{t("checkingConnection")}</p>
      )}
    </div>
  );
}
