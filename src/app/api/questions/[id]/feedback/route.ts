import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

const feedbackInput = z.object({
  rating: z.enum(["up", "down"]),
  comment: z.string().trim().max(500).optional(),
  sessionId: z.string().optional(),
});

/** POST /api/questions/[id]/feedback — 👍/👎 (+ comment) on a question. */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: questionId } = await params;

  const parsed = feedbackInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const q = await prisma.question.findUnique({ where: { id: questionId }, select: { id: true } });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // One feedback per (user, question); a new one re-opens it for the review agent.
  await prisma.questionFeedback.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId } },
    create: {
      userId: session.user.id,
      questionId,
      sessionId: parsed.data.sessionId ?? null,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
      status: "new",
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
      sessionId: parsed.data.sessionId ?? null,
      status: "new",
      resolution: null,
    },
  });

  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(_POST);
