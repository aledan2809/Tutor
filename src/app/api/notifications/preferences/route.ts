import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notifications/preferences — Get user's notification preferences
 */
export async function GET() {
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

  return NextResponse.json(prefs);
}

/**
 * PUT /api/notifications/preferences — Update notification preferences
 */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { push, whatsapp, sms, email, call, quietHoursStart, quietHoursEnd, timezone } = body;

  const data: Record<string, unknown> = {};
  if (typeof push === "boolean") data.push = push;
  if (typeof whatsapp === "boolean") data.whatsapp = whatsapp;
  if (typeof sms === "boolean") data.sms = sms;
  if (typeof email === "boolean") data.email = email;
  if (typeof call === "boolean") data.call = call;
  if (typeof quietHoursStart === "string") data.quietHoursStart = quietHoursStart;
  if (typeof quietHoursEnd === "string") data.quietHoursEnd = quietHoursEnd;
  if (typeof timezone === "string") data.timezone = timezone;

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json(prefs);
}
