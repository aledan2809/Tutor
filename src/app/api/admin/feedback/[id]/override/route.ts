import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { requireAdminOrInstructor } from "@/lib/admin-auth";
import { applyOverride } from "@/lib/feedback-admin";

const schema = z.object({
  action: z.enum(["publish", "hide", "set_answer", "dismiss"]),
  correctAnswer: z.string().optional(),
  note: z.string().max(1000).optional(),
});

/** POST: admin overrides the automated decision on a feedback (domain-scoped). */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session, allowedDomainIds } = await requireAdminOrInstructor();
  if (error) return error;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Domain scope check before mutating.
  const fb = await prisma.questionFeedback.findUnique({ where: { id }, select: { questionId: true } });
  if (!fb) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (allowedDomainIds !== null) {
    const q = await prisma.question.findUnique({ where: { id: fb.questionId }, select: { domainId: true } });
    if (!q || !allowedDomainIds.includes(q.domainId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const result = await applyOverride({
    feedbackId: id,
    adminId: session!.user.id,
    action: parsed.data.action,
    correctAnswer: parsed.data.correctAnswer ?? null,
    note: parsed.data.note ?? null,
  });
  if (!result.ok) {
    const code = result.error === "answer_not_an_option" ? 400 : 404;
    return NextResponse.json({ error: result.error }, { status: code });
  }
  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(_POST);
