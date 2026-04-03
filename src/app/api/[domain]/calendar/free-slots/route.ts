import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { getValidAccessToken, findFreeSlots, getCalendarClient } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET /api/[domain]/calendar/free-slots
 * Query params: startDate, endDate, durationMins, bufferMins?
 */
async function _GET(
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
  const durationMins = parseInt(searchParams.get("durationMins") || "60", 10);
  const bufferMins = parseInt(searchParams.get("bufferMins") || "0", 10);

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  const tokenResult = await getValidAccessToken(session.user.id, domain.id);
  if (!tokenResult) {
    return NextResponse.json(
      { error: "Calendar not connected" },
      { status: 400 }
    );
  }

  // Get user preferences (study hours + timezone)
  const studyHoursSetting = await prisma.setting.findUnique({
    where: { userId_key: { userId: session.user.id, key: "studyHours" } },
  });
  const notifPref = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  const studyHours: string[] = studyHoursSetting?.value
    ? (studyHoursSetting.value as string[])
    : [];
  const timezone = notifPref?.timezone || "Europe/Bucharest";

  // Fetch busy events from Google Calendar
  const client = getCalendarClient();
  const events = await client.listEvents(
    tokenResult.accessToken,
    new Date(startDate),
    new Date(endDate)
  );

  const busyEvents = events.map((e) => ({
    start: new Date(e.start),
    end: new Date(e.end),
  }));

  const slots = findFreeSlots(
    busyEvents,
    new Date(startDate),
    new Date(endDate),
    durationMins,
    studyHours,
    timezone,
    bufferMins
  );

  return NextResponse.json({ slots });
}

export const GET = withErrorHandler(_GET);
