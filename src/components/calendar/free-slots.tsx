"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface FreeSlotsProps {
  domainSlug: string;
  onSelectSlot?: (start: string, end: string) => void;
}

export function FreeSlots({ domainSlug, onSelectSlot }: FreeSlotsProps) {
  const t = useTranslations("calendar");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [durationMins, setDurationMins] = useState(60);

  async function findSlots() {
    setLoading(true);
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 7);

    try {
      const res = await fetch(
        `/api/${domainSlug}/calendar/free-slots?startDate=${now.toISOString()}&endDate=${end.toISOString()}&durationMins=${durationMins}&bufferMins=15`
      );
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  function formatSlot(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            {t("duration")}
          </label>
          <select
            value={durationMins}
            onChange={(e) => setDurationMins(Number(e.target.value))}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value={30}>30 min</option>
            <option value={60}>1 {t("hour")}</option>
            <option value={90}>1.5 {t("hours")}</option>
            <option value={120}>2 {t("hours")}</option>
          </select>
        </div>
        <button
          onClick={findSlots}
          disabled={loading}
          className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          {loading ? t("searching") : t("findSlots")}
        </button>
      </div>

      {slots.length > 0 && (
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {slots.slice(0, 10).map((slot, i) => (
            <button
              key={i}
              onClick={() => onSelectSlot?.(slot.start, slot.end)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-left text-sm hover:border-blue-600 hover:bg-gray-750 transition-colors"
            >
              <span className="text-gray-300">{formatSlot(slot.start)}</span>
              <span className="text-xs text-gray-500">
                {durationMins} min
              </span>
            </button>
          ))}
        </div>
      )}

      {!loading && slots.length === 0 && (
        <p className="text-xs text-gray-500">{t("noSlotsHint")}</p>
      )}
    </div>
  );
}
