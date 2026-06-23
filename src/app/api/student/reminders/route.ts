import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { reminderInput } from "@/lib/reminder-schema";

async function _GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const reminders = await prisma.studyReminder.findMany({
    where: { userId: session.user.id },
    orderBy: [{ hour: "asc" }, { minute: "asc" }],
  });
  return NextResponse.json({ reminders });
}

async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = reminderInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  const reminder = await prisma.studyReminder.create({
    data: {
      userId: session.user.id,
      label: parsed.data.label ?? null,
      window: parsed.data.window,
      sessionType: parsed.data.sessionType,
      daysOfWeek: parsed.data.daysOfWeek,
      hour: parsed.data.hour,
      minute: parsed.data.minute,
      domainSlug: parsed.data.domainSlug ?? null,
      timezone: "Europe/Bucharest",
      isActive: parsed.data.isActive ?? true,
    },
  });
  return NextResponse.json({ reminder }, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
