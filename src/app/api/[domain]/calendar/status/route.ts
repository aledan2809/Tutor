import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET /api/[domain]/calendar/status
 * Check if user has Google Calendar connected for this domain.
 */
async function _GET(
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

  const userCalendar = await prisma.userCalendar.findUnique({
    where: { userId_domainId: { userId: session.user.id, domainId: domain.id } },
  });

  return NextResponse.json({
    connected: !!userCalendar,
    connectedAt: userCalendar?.createdAt || null,
  });
}

export const GET = withErrorHandler(_GET);
