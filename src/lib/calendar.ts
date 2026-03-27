import { GCalendarClient } from "@aledan/gcalendar";
import { prisma } from "@/lib/prisma";

let _client: GCalendarClient | null = null;

export function getCalendarClient(): GCalendarClient {
  if (!_client) {
    _client = new GCalendarClient({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI!,
    });
  }
  return _client;
}

/**
 * Returns a valid access token for the user's calendar connection.
 * Refreshes automatically if expired.
 */
export async function getValidAccessToken(
  userId: string,
  domainId: string
): Promise<{ accessToken: string; userCalendar: { id: string } } | null> {
  const userCalendar = await prisma.userCalendar.findUnique({
    where: { userId_domainId: { userId, domainId } },
  });

  if (!userCalendar) return null;

  // If token is still valid (with 5min buffer), return it
  if (userCalendar.expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return { accessToken: userCalendar.accessToken, userCalendar: { id: userCalendar.id } };
  }

  // Refresh the token
  const client = getCalendarClient();
  const tokenSet = await client.refreshToken(userCalendar.refreshToken);

  await prisma.userCalendar.update({
    where: { id: userCalendar.id },
    data: {
      accessToken: tokenSet.accessToken,
      expiresAt: tokenSet.expiresAt,
      ...(tokenSet.refreshToken ? { refreshToken: tokenSet.refreshToken } : {}),
    },
  });

  return { accessToken: tokenSet.accessToken, userCalendar: { id: userCalendar.id } };
}

/**
 * Parse study hours from user settings.
 * Format: ["09:00-12:00", "14:00-18:00"]
 */
export function parseStudyHours(
  studyHours: string[]
): { startHour: number; startMin: number; endHour: number; endMin: number }[] {
  return studyHours.map((range) => {
    const [start, end] = range.split("-");
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    return { startHour, startMin, endHour, endMin };
  });
}

/**
 * Find free time slots between busy events within study hours.
 */
export function findFreeSlots(
  busyEvents: { start: Date; end: Date }[],
  startDate: Date,
  endDate: Date,
  durationMins: number,
  studyHours: string[],
  timezone: string,
  bufferMins: number = 0
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const parsedHours = studyHours.length > 0
    ? parseStudyHours(studyHours)
    : [{ startHour: 9, startMin: 0, endHour: 18, endMin: 0 }];

  // Sort busy events by start time
  const sorted = [...busyEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  // Iterate day by day
  const current = new Date(startDate);
  while (current < endDate) {
    for (const hours of parsedHours) {
      const windowStart = new Date(current);
      windowStart.setHours(hours.startHour, hours.startMin, 0, 0);

      const windowEnd = new Date(current);
      windowEnd.setHours(hours.endHour, hours.endMin, 0, 0);

      if (windowEnd <= startDate || windowStart >= endDate) continue;

      // Clamp to requested range
      const rangeStart = windowStart < startDate ? startDate : windowStart;
      const rangeEnd = windowEnd > endDate ? endDate : windowEnd;

      // Find gaps in this window
      let cursor = rangeStart.getTime();

      for (const event of sorted) {
        const eventStart = event.start.getTime() - bufferMins * 60 * 1000;
        const eventEnd = event.end.getTime() + bufferMins * 60 * 1000;

        if (eventEnd <= cursor) continue;
        if (eventStart >= rangeEnd.getTime()) break;

        if (eventStart > cursor) {
          const gapMins = (eventStart - cursor) / 60000;
          if (gapMins >= durationMins) {
            slots.push({
              start: new Date(cursor).toISOString(),
              end: new Date(cursor + durationMins * 60000).toISOString(),
            });
          }
        }
        cursor = Math.max(cursor, eventEnd);
      }

      // Check remaining time after last event
      if (cursor < rangeEnd.getTime()) {
        const gapMins = (rangeEnd.getTime() - cursor) / 60000;
        if (gapMins >= durationMins) {
          slots.push({
            start: new Date(cursor).toISOString(),
            end: new Date(cursor + durationMins * 60000).toISOString(),
          });
        }
      }
    }

    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return slots;
}
