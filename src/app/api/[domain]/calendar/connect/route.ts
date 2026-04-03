import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { getCalendarClient } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * POST /api/[domain]/calendar/connect
 * Returns the Google OAuth URL for calendar authorization.
 */
async function _POST(
  _req: NextRequest,
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

  // Check if already connected
  const existing = await prisma.userCalendar.findUnique({
    where: { userId_domainId: { userId: session.user.id, domainId: domain.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Calendar already connected" }, { status: 409 });
  }

  const client = getCalendarClient();
  const state = JSON.stringify({
    userId: session.user.id,
    domainId: domain.id,
    domainSlug,
  });

  const authUrl = client.getAuthUrl(state, [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
  ]);

  return NextResponse.json({ authUrl });
}

/**
 * DELETE /api/[domain]/calendar/connect
 * Disconnects the user's Google Calendar for this domain.
 */
async function _DELETE(
  _req: NextRequest,
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

  await prisma.userCalendar.deleteMany({
    where: { userId: session.user.id, domainId: domain.id },
  });

  return NextResponse.json({ success: true });
}

export const POST = withErrorHandler(_POST);
export const DELETE = withErrorHandler(_DELETE);
