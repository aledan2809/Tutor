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

interface CalendarGridProps {
  domainSlug: string;
  refreshKey?: number;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

export function CalendarGrid({ domainSlug, refreshKey }: CalendarGridProps) {
  const t = useTranslations("calendar");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDays = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const days = getWeekDays();
    const start = days[0];
    const end = new Date(days[6]);
    end.setHours(23, 59, 59, 999);

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
  }, [domainSlug, getWeekDays]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey]);

  const days = getWeekDays();
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getEventsForDayHour(day: Date, hour: number) {
    return events.filter((e) => {
      const start = new Date(e.start);
      const end = new Date(e.end);
      return (
        start.toDateString() === day.toDateString() &&
        start.getHours() <= hour &&
        end.getHours() > hour
      );
    });
  }

  function getEventsStartingAt(day: Date, hour: number) {
    return events.filter((e) => {
      const start = new Date(e.start);
      return (
        start.toDateString() === day.toDateString() &&
        start.getHours() === hour
      );
    });
  }

  const weekLabel = `${days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div>
      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          &larr; {t("prevWeek")}
        </button>
        <span className="text-sm font-medium text-white">{weekLabel}</span>
        <div className="flex gap-2">
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t("today")}
            </button>
          )}
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t("nextWeek")} &rarr;
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t("loadingEvents")}</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-800">
              <div />
              {days.map((day, i) => {
                const isToday = day.toDateString() === today.toDateString();
                return (
                  <div
                    key={i}
                    className={`py-2 text-center text-xs font-medium ${
                      isToday ? "text-blue-400" : "text-gray-500"
                    }`}
                  >
                    <div>{dayNames[i]}</div>
                    <div
                      className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        isToday ? "bg-blue-600 text-white" : "text-gray-300"
                      }`}
                    >
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="max-h-[500px] overflow-y-auto">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-800/50"
                >
                  <div className="py-2 pr-2 text-right text-xs text-gray-600">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {days.map((day, dayIdx) => {
                    const starting = getEventsStartingAt(day, hour);
                    const covering = getEventsForDayHour(day, hour);
                    const hasEvent = covering.length > 0;

                    return (
                      <div
                        key={dayIdx}
                        className={`relative min-h-[40px] border-l border-gray-800/50 px-0.5 ${
                          hasEvent ? "" : ""
                        }`}
                      >
                        {starting.map((event) => {
                          const startH = new Date(event.start).getHours();
                          const endH = new Date(event.end).getHours();
                          const spanHours = Math.max(1, endH - startH);
                          return (
                            <div
                              key={event.id}
                              className={`absolute inset-x-0.5 z-10 overflow-hidden rounded px-1.5 py-0.5 text-xs ${
                                event.type === "study"
                                  ? "bg-blue-600/30 border border-blue-600/50 text-blue-300"
                                  : "bg-gray-700/50 border border-gray-600/50 text-gray-300"
                              }`}
                              style={{
                                height: `${spanHours * 40 - 2}px`,
                              }}
                              title={`${event.title} (${new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`}
                            >
                              <div className="truncate font-medium">
                                {event.title}
                              </div>
                              <div className="truncate text-[10px] opacity-70">
                                {new Date(event.start).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
