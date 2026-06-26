import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveTone, REMARK_TONES } from "@/lib/remarks";

/**
 * GET /api/student/remarks
 * Config for the answer-screen remarks: the resolved tone (student preference clamped
 * by any parent restriction), the raw student preference, and disliked remark keys.
 */
async function _GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [toneSetting, restrictSetting, feedbackSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { userId_key: { userId, key: "gamificationTone" } } }),
    prisma.setting.findUnique({ where: { userId_key: { userId, key: "toneRestriction" } } }),
    prisma.setting.findUnique({ where: { userId_key: { userId, key: "remarkFeedback" } } }),
  ]);

  const studentTone = typeof toneSetting?.value === "string" ? (toneSetting.value as string) : null;
  const restrictPlayful = (restrictSetting?.value as { restrictPlayful?: boolean } | undefined)?.restrictPlayful === true;
  const disliked = Array.isArray((feedbackSetting?.value as { disliked?: unknown })?.disliked)
    ? ((feedbackSetting!.value as { disliked: string[] }).disliked)
    : [];

  return NextResponse.json({
    tone: resolveTone(studentTone, restrictPlayful),
    studentTone,
    restrictPlayful,
    disliked,
  });
}

/**
 * PUT /api/student/remarks — set the student's own encouragement tone preference.
 */
async function _PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tone } = (await req.json()) as { tone?: string };
  if (!tone || !REMARK_TONES.includes(tone as never)) {
    return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
  }
  await prisma.setting.upsert({
    where: { userId_key: { userId: session.user.id, key: "gamificationTone" } },
    update: { value: tone },
    create: { userId: session.user.id, key: "gamificationTone", value: tone },
  });
  return NextResponse.json({ success: true, tone });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
