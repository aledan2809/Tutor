import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET /api/settings/study-hours
 * Returns the user's preferred study hours.
 */
async function _GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const setting = await prisma.setting.findUnique({
    where: { userId_key: { userId: session.user.id, key: "studyHours" } },
  });

  return NextResponse.json({
    studyHours: setting?.value ?? [],
  });
}

/**
 * PUT /api/settings/study-hours
 * Updates the user's preferred study hours.
 */
async function _PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { studyHours } = body as { studyHours: string[] };

  if (!Array.isArray(studyHours)) {
    return NextResponse.json(
      { error: "studyHours must be an array of strings" },
      { status: 400 }
    );
  }

  // Validate format: "HH:MM-HH:MM"
  const timeRangeRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
  for (const range of studyHours) {
    if (!timeRangeRegex.test(range)) {
      return NextResponse.json(
        { error: `Invalid time range format: ${range}` },
        { status: 400 }
      );
    }
  }

  await prisma.setting.upsert({
    where: { userId_key: { userId: session.user.id, key: "studyHours" } },
    update: { value: studyHours },
    create: { userId: session.user.id, key: "studyHours", value: studyHours },
  });

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
