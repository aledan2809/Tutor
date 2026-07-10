import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { allowedChannels, clampChannelWrite } from "@/lib/plan-channels";
import { sanitizeChannelOrder } from "@/lib/escalation/config";

/**
 * GET /api/notifications/preferences — Get user's notification preferences.
 * Also returns `allowedChannels` so the UI can gate the metered channels by plan.
 */
async function _GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  if (!prefs) {
    prefs = await prisma.notificationPreference.create({
      data: { userId: session.user.id },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true },
  });

  return NextResponse.json({ ...prefs, allowedChannels: allowedChannels(user?.subscriptionStatus) });
}

/**
 * PUT /api/notifications/preferences — Update notification preferences
 */
async function _PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If a parent has taken over this user's notifications, the user can't self-edit them.
  const delegation = await prisma.setting.findUnique({
    where: { userId_key: { userId: session.user.id, key: "notifDelegation" } },
  });
  if ((delegation?.value as { managedByParent?: boolean } | undefined)?.managedByParent === true) {
    return NextResponse.json({ error: "Managed by parent" }, { status: 403 });
  }

  const body = await req.json();
  const { push, whatsapp, sms, email, call, quietHoursStart, quietHoursEnd, timezone, channelOrder } = body;

  // Clamp the metered channels to the user's plan (a free account can't ENABLE
  // WhatsApp/SMS via a direct call — only disable them).
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true },
  });
  const { applied } = clampChannelWrite({ push, email, whatsapp, sms }, user?.subscriptionStatus);

  const data: Record<string, unknown> = { ...applied };
  if (typeof call === "boolean") data.call = call;
  const cleanOrder = sanitizeChannelOrder(channelOrder);
  if (cleanOrder) data.channelOrder = cleanOrder;
  if (typeof quietHoursStart === "string") data.quietHoursStart = quietHoursStart;
  if (typeof quietHoursEnd === "string") data.quietHoursEnd = quietHoursEnd;
  if (typeof timezone === "string") data.timezone = timezone;

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json({ ...prefs, allowedChannels: allowedChannels(user?.subscriptionStatus) });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
