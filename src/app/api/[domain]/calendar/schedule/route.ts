import { NextRequest, NextResponse } from "next/server";
import { getSession, hasRole } from "@/lib/authorization";
import { getValidAccessToken, getCalendarClient } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * POST /api/[domain]/calendar/schedule
 * Create a study session and corresponding Google Calendar event.
 */
async function _POST(
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

  const body = await req.json();
  const {
    title,
    description,
    startTime,
    endTime,
    attendees,
    studentIds,
  } = body as {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendees?: string[];
    studentIds?: string[];
  };

  if (!title || !startTime || !endTime) {
    return NextResponse.json(
      { error: "title, startTime, and endTime are required" },
      { status: 400 }
    );
  }

  // Instructor scheduling for students
  const isInstructor = hasRole(session, domainSlug, "INSTRUCTOR");
  let targetUserIds = [session.user.id];

  if (studentIds && studentIds.length > 0) {
    if (!isInstructor) {
      return NextResponse.json(
        { error: "Only instructors can schedule for students" },
        { status: 403 }
      );
    }
    targetUserIds = [...studentIds];
    // Include instructor too
    if (!targetUserIds.includes(session.user.id)) {
      targetUserIds.push(session.user.id);
    }
  }

  // Collect attendee emails for the calendar event
  const attendeeEmails: string[] = attendees || [];
  if (studentIds && studentIds.length > 0) {
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { email: true },
    });
    for (const s of students) {
      if (s.email && !attendeeEmails.includes(s.email)) {
        attendeeEmails.push(s.email);
      }
    }
  }

  // Create calendar event for the primary user (scheduler)
  const tokenResult = await getValidAccessToken(session.user.id, domain.id);
  let googleEventId: string | undefined;
  let calendarLink: string | undefined;

  if (tokenResult) {
    const client = getCalendarClient();
    try {
      const event = await client.createEvent(tokenResult.accessToken, {
        summary: title,
        description: description || "",
        start: new Date(startTime),
        end: new Date(endTime),
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 60 },
          ],
        },
        ...(attendeeEmails.length > 0
          ? { attendees: attendeeEmails.map((email) => ({ email })) }
          : {}),
      });
      googleEventId = event.id;
      calendarLink = event.htmlLink;
    } catch (err) {
      console.error("Failed to create Google Calendar event:", err);
      // Continue without Google event - still save locally
    }
  }

  // Create study session records for all target users
  const sessions = await Promise.all(
    targetUserIds.map(async (userId) => {
      const userCal = await prisma.userCalendar.findUnique({
        where: { userId_domainId: { userId, domainId: domain.id } },
      });

      if (!userCal) return null;

      return prisma.studySession.create({
        data: {
          userCalendarId: userCal.id,
          userId,
          domainId: domain.id,
          title,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          googleEventId: userId === session.user.id ? googleEventId : undefined,
          calendarLink: userId === session.user.id ? calendarLink : undefined,
        },
      });
    })
  );

  const created = sessions.filter(Boolean);

  return NextResponse.json({
    success: true,
    eventId: googleEventId,
    calendarLink,
    sessionsCreated: created.length,
  });
}

export const POST = withErrorHandler(_POST);
