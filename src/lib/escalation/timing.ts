/**
 * Smart timing utilities for escalation engine.
 * Handles quiet hours, timezone awareness, and study pattern detection.
 */

export function isQuietHours(
  timezone: string,
  quietStart: string,
  quietEnd: string
): boolean {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const [nowH, nowM] = timeStr.split(":").map(Number);
  const [startH, startM] = quietStart.split(":").map(Number);
  const [endH, endM] = quietEnd.split(":").map(Number);

  const nowMin = nowH * 60 + nowM;
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  // Handles overnight quiet hours (e.g., 22:00 - 07:00)
  if (startMin > endMin) {
    return nowMin >= startMin || nowMin < endMin;
  }
  return nowMin >= startMin && nowMin < endMin;
}

export function getNextAvailableTime(
  timezone: string,
  quietEnd: string
): Date {
  const now = new Date();
  const [endH, endM] = quietEnd.split(":").map(Number);

  // Create date in user timezone for tomorrow at quiet end
  const dateStr = now.toLocaleDateString("en-CA", { timeZone: timezone });
  const [year, month, day] = dateStr.split("-").map(Number);

  // Try today first
  const candidate = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`);

  // If that time already passed, use tomorrow
  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

export function getUserLocalHour(timezone: string): number {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
  return parseInt(timeStr, 10);
}
