import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { getValidAccessToken, getCalendarClient } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/[domain]/calendar/events
 * Query params: startDate, endDate
 * Returns merged Google Calendar events + local study sessions.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;
  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const searchParams = req.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Fetch local study sessions
  const studySessions = await prisma.studySession.findMany({
    where: {
      userId: session.user.id,
      domainId: domain.id,
      startTime: { gte: start },
      endTime: { lte: end },
    },
    orderBy: { startTime: "asc" },
  });

  const events: {
    id: string;
    title: string;
    start: string;
    end: string;
    type: "study" | "google";
    isReminderSet: boolean;
    calendarLink?: string;
  }[] = studySessions.map((s) => ({
    id: s.id,
    title: s.title,
    start: s.startTime.toISOString(),
    end: s.endTime.toISOString(),
    type: "study" as const,
    isReminderSet: !!s.googleEventId,
    calendarLink: s.calendarLink || undefined,
  }));

  // Fetch Google Calendar events
  const tokenResult = await getValidAccessToken(session.user.id, domain.id);
  if (tokenResult) {
    try {
      const client = getCalendarClient();
      const googleEvents = await client.listEvents(
        tokenResult.accessToken,
        start,
        end
      );

      // Track study session google event IDs to avoid duplicates
      const studyEventIds = new Set(
        studySessions.filter((s) => s.googleEventId).map((s) => s.googleEventId)
      );

      for (const ge of googleEvents) {
        if (studyEventIds.has(ge.id)) continue; // Skip duplicates

        events.push({
          id: ge.id,
          title: ge.summary,
          start: new Date(ge.start).toISOString(),
          end: new Date(ge.end).toISOString(),
          type: "google",
          isReminderSet: true,
          calendarLink: ge.htmlLink,
        });
      }
    } catch (err) {
      console.error("Failed to fetch Google Calendar events:", err);
      // Return local events only
    }
  }

  // Sort all events by start time
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return NextResponse.json({ events });
}
