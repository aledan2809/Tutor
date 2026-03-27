"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "study" | "google";
  isReminderSet: boolean;
  calendarLink?: string;
}

interface EventListProps {
  domainSlug: string;
  refreshKey?: number;
}

export function EventList({ domainSlug, refreshKey }: EventListProps) {
  const t = useTranslations("calendar");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "month">("week");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    if (view === "week") {
      end.setDate(end.getDate() + 7);
    } else {
      end.setMonth(end.getMonth() + 1);
    }

    try {
      const res = await fetch(
        `/api/${domainSlug}/calendar/events?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [domainSlug, view]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey]);

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  // Group events by date
  const grouped: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const dateKey = new Date(event.start).toDateString();
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(event);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setView("week")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            view === "week"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          {t("weekView")}
        </button>
        <button
          onClick={() => setView("month")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            view === "month"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          {t("monthView")}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t("loadingEvents")}</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-500">{t("noEvents")}</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateStr, dayEvents]) => (
            <div key={dateStr}>
              <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                {formatDate(dayEvents[0].start)}
              </h4>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      event.type === "study"
                        ? "border-blue-800/50 bg-blue-900/20"
                        : "border-gray-700 bg-gray-800"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        event.type === "study" ? "bg-blue-400" : "bg-gray-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(event.start)} – {formatTime(event.end)}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        event.type === "study"
                          ? "bg-blue-600/20 text-blue-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {event.type === "study" ? t("studySession") : t("googleEvent")}
                    </span>
                    {event.calendarLink && (
                      <a
                        href={event.calendarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline"
                      >
                        {t("openInGoogle")}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
