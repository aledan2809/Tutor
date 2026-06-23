import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

// Notifications a parent receives ABOUT a child (parent-monitor alerts). These
// must be separable from the user's own student notifications so the two
// audiences don't show "la grămadă" in one feed.
const PARENT_ALERT_TYPES = ["parent_alert"];

/**
 * GET /api/notifications — Get current user's notifications
 * Query params: ?unread=true&limit=50&offset=0&audience=self|child
 *   audience=self  → own notifications (excludes parent-about-child alerts)
 *   audience=child → only parent-about-child alerts
 *   (omitted)      → everything (back-compat)
 */
async function _GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const audience = url.searchParams.get("audience"); // "self" | "child" | null
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const audienceWhere =
    audience === "child"
      ? { type: { in: PARENT_ALERT_TYPES } }
      : audience === "self"
        ? { type: { notIn: PARENT_ALERT_TYPES } }
        : {};

  const where = {
    userId: session.user.id,
    ...audienceWhere,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total, unreadCount, childTotal] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
    // Whether this user receives child alerts at all → drives the UI tab.
    prisma.notification.count({
      where: { userId: session.user.id, type: { in: PARENT_ALERT_TYPES } },
    }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    unreadCount,
    childTotal,
    limit,
    offset,
  });
}

/**
 * PATCH /api/notifications — Mark all as read
 */
async function _PATCH() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const PATCH = withErrorHandler(_PATCH);
