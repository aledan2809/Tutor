/**
 * Smart timing utilities for escalation engine.
 * Handles quiet hours, timezone awareness, and study pattern detection.
 */

import { prisma } from "@/lib/prisma";

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

export interface StudyPattern {
  preferredHours: number[]; // Hours (0-23) when user typically studies
  avgSessionsPerWeek: number;
  mostActiveDay: number; // 0=Sunday, 6=Saturday
  isOptimalTime: boolean; // Whether now is a good time to notify
}

/**
 * Detect study patterns from session history.
 * Analyzes the last 30 days of sessions to find preferred study times.
 */
export async function detectStudyPatterns(
  userId: string,
  timezone: string
): Promise<StudyPattern> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const sessions = await prisma.session.findMany({
    where: {
      userId,
      startedAt: { gte: thirtyDaysAgo },
      endedAt: { not: null },
    },
    select: { startedAt: true },
    orderBy: { startedAt: "desc" },
  });

  // Count sessions by hour and day-of-week in user's timezone
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);

  for (const session of sessions) {
    const hourStr = session.startedAt.toLocaleTimeString("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false,
    });
    const hour = parseInt(hourStr, 10);
    hourCounts[hour]++;

    const dayStr = session.startedAt.toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "short",
    });
    const dayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    dayCounts[dayMap[dayStr] ?? 0]++;
  }

  // Find top 3 preferred hours (hours with most sessions)
  const preferredHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((h) => h.hour);

  // Most active day
  const mostActiveDay = dayCounts.indexOf(Math.max(...dayCounts));

  // Average sessions per week
  const weeks = Math.max(1, Math.ceil((Date.now() - thirtyDaysAgo.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const avgSessionsPerWeek = Math.round((sessions.length / weeks) * 10) / 10;

  // Check if current hour is within ±1 of a preferred study time
  const currentHour = getUserLocalHour(timezone);
  const isOptimalTime = preferredHours.some(
    (h) => Math.abs(h - currentHour) <= 1 || Math.abs(h - currentHour) >= 23
  );

  return {
    preferredHours: preferredHours.length > 0 ? preferredHours : [9, 14, 19], // defaults
    avgSessionsPerWeek,
    mostActiveDay,
    isOptimalTime,
  };
}

/**
 * Check if now is a good time to send a notification based on study patterns.
 * Returns true if the user is likely to be available to study.
 */
export async function isOptimalNotificationTime(
  userId: string,
  timezone: string
): Promise<boolean> {
  const pattern = await detectStudyPatterns(userId, timezone);
  return pattern.isOptimalTime;
}
