import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { applyRemarkVote } from "@/lib/remarks";

/**
 * POST /api/student/remarks/vote — record a like/dislike on a remark.
 * Disliked keys are excluded from future selection (the "drop what they reject" loop).
 */
async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { key, signal } = (await req.json()) as { key?: string; signal?: string };
  if (!key || typeof key !== "string" || (signal !== "like" && signal !== "dislike")) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const userId = session.user.id;
  const existing = await prisma.setting.findUnique({
    where: { userId_key: { userId, key: "remarkFeedback" } },
  });
  const current = (existing?.value as { liked?: string[]; disliked?: string[] } | undefined) ?? null;
  const next = applyRemarkVote(current, key, signal);

  await prisma.setting.upsert({
    where: { userId_key: { userId, key: "remarkFeedback" } },
    update: { value: next },
    create: { userId, key: "remarkFeedback", value: next },
  });

  return NextResponse.json({ success: true, disliked: next.disliked });
}

export const POST = withErrorHandler(_POST);
