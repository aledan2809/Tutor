/**
 * Admin-side feedback review: assemble the full picture for a 👎 (question as it
 * was presented + the student's complaint + the reviewer's decision + the source
 * provenance) and let an admin OVERRIDE the automated decision.
 *
 * Server-only (reads fs-backed provenance via routes). The licență quote lives in
 * `Question.sourceReference` as `licenta-gen: "..."` and the page in `pdfPage`.
 */
import { prisma } from "@/lib/prisma";

const LICENTA_QUOTE_RE = /^licenta-gen:\s*"([\s\S]*)"\s*$/;

export interface FeedbackProvenance {
  sectionTopic: string | null;
  chapterIndex: number | null;
  pdfPage: number | null;
  bookPage: number | null;
  qNumberInBook: number | null;
  sourceReference: string | null;
  quote: string | null; // extracted licență quote (the exact selected paragraph)
  docUrl: string | null; // link to the source document at the exact page
}

export interface FeedbackDetail {
  id: string;
  status: string;
  comment: string | null;
  resolution: string | null;
  reviewAction: string | null;
  reviewIssue: string | null;
  correctedAnswer: string | null;
  overriddenById: string | null;
  overrideNote: string | null;
  overriddenAt: Date | null;
  createdAt: Date;
  needsAdmin: boolean; // reviewer flagged it for a human
  isAuto: boolean; // reviewer acted on its own (corrected/hidden/dismissed)
  student: { name: string | null; email: string | null };
  question: {
    id: string;
    content: string;
    options: string[];
    correctAnswer: string;
    explanation: string | null;
    status: string; // PUBLISHED | DRAFT | ...
    domainSlug: string | null;
    domainName: string | null;
  };
  provenance: FeedbackProvenance;
}

/** Build the full admin view for one feedback. Returns null if not found. */
export async function buildFeedbackDetail(
  feedbackId: string
): Promise<FeedbackDetail | null> {
  const fb = await prisma.questionFeedback.findUnique({ where: { id: feedbackId } });
  if (!fb) return null;

  const [q, student] = await Promise.all([
    prisma.question.findUnique({
      where: { id: fb.questionId },
      select: {
        id: true,
        content: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        status: true,
        topic: true,
        chapterIndex: true,
        pdfPage: true,
        bookPage: true,
        qNumberInBook: true,
        sourceReference: true,
        domainId: true,
      },
    }),
    prisma.user.findUnique({ where: { id: fb.userId }, select: { name: true, email: true } }),
  ]);

  let domainSlug: string | null = null;
  let domainName: string | null = null;
  let docUrl: string | null = null;
  let quote: string | null = null;

  if (q) {
    const domain = await prisma.domain.findUnique({
      where: { id: q.domainId },
      select: { slug: true, name: true },
    });
    domainSlug = domain?.slug ?? null;
    domainName = domain?.name ?? null;

    const m = q.sourceReference?.match(LICENTA_QUOTE_RE);
    if (m) quote = m[1];

    // Link to the source document at the exact page (licență = the student's own PDF).
    if (domainSlug === "licenta-rares") {
      const doc = await prisma.licentaDocument.findFirst({
        where: { domainId: q.domainId, status: "ready" },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (doc) {
        docUrl = `/api/licenta/${doc.id}/file${q.pdfPage ? `#page=${q.pdfPage}` : ""}`;
      }
    }
  }

  return {
    id: fb.id,
    status: fb.status,
    comment: fb.comment,
    resolution: fb.resolution,
    reviewAction: fb.reviewAction,
    reviewIssue: fb.reviewIssue,
    correctedAnswer: fb.correctedAnswer,
    overriddenById: fb.overriddenById,
    overrideNote: fb.overrideNote,
    overriddenAt: fb.overriddenAt,
    createdAt: fb.createdAt,
    needsAdmin: fb.reviewAction === "flagged",
    isAuto: ["corrected", "hidden", "dismissed"].includes(fb.reviewAction ?? ""),
    student: { name: student?.name ?? null, email: student?.email ?? null },
    question: {
      id: q?.id ?? fb.questionId,
      content: q?.content ?? "(întrebarea nu mai există)",
      options: Array.isArray(q?.options) ? (q!.options as string[]) : [],
      correctAnswer: q?.correctAnswer ?? "",
      explanation: q?.explanation ?? null,
      status: q?.status ?? "—",
      domainSlug,
      domainName,
    },
    provenance: {
      sectionTopic: q?.topic ?? null,
      chapterIndex: q?.chapterIndex ?? null,
      pdfPage: q?.pdfPage ?? null,
      bookPage: q?.bookPage ?? null,
      qNumberInBook: q?.qNumberInBook ?? null,
      sourceReference: q?.sourceReference ?? null,
      quote,
      docUrl,
    },
  };
}

export type OverrideAction = "publish" | "hide" | "set_answer" | "dismiss";

export interface OverrideResult {
  ok: boolean;
  error?: string;
}

/**
 * Apply an admin override of the automated decision. Mutates the Question
 * (publish/hide/set answer) and records the override on the feedback + an audit
 * log + a notification to the student. `adminId` must already be authorized
 * (and, for non-superadmins, scoped to the question's domain) by the caller.
 */
export async function applyOverride(params: {
  feedbackId: string;
  adminId: string;
  action: OverrideAction;
  correctAnswer?: string | null;
  note?: string | null;
}): Promise<OverrideResult> {
  const fb = await prisma.questionFeedback.findUnique({
    where: { id: params.feedbackId },
    select: { id: true, userId: true, questionId: true },
  });
  if (!fb) return { ok: false, error: "not_found" };

  const q = await prisma.question.findUnique({
    where: { id: fb.questionId },
    select: { id: true, options: true, status: true, correctAnswer: true },
  });
  if (!q) return { ok: false, error: "question_missing" };

  let changeLabel: string;
  if (params.action === "publish") {
    await prisma.question.update({ where: { id: q.id }, data: { status: "PUBLISHED" } });
    changeLabel = "Repusă în practică (PUBLISHED)";
  } else if (params.action === "hide") {
    await prisma.question.update({ where: { id: q.id }, data: { status: "DRAFT" } });
    changeLabel = "Ascunsă din practică (DRAFT)";
  } else if (params.action === "set_answer") {
    const options = Array.isArray(q.options) ? (q.options as string[]) : [];
    if (!params.correctAnswer || !options.includes(params.correctAnswer)) {
      return { ok: false, error: "answer_not_an_option" };
    }
    await prisma.question.update({
      where: { id: q.id },
      data: { correctAnswer: params.correctAnswer },
    });
    changeLabel = `Răspuns corect setat: „${params.correctAnswer}"`;
  } else {
    changeLabel = "Decizie confirmată (fără schimbare)";
  }

  const note = params.note?.trim() || null;
  await prisma.questionFeedback.update({
    where: { id: fb.id },
    data: {
      status: "resolved",
      reviewAction: "overridden",
      overriddenById: params.adminId,
      overriddenAt: new Date(),
      overrideNote: note,
      resolution: `Decizie revizuită de admin: ${changeLabel}${note ? ` — ${note}` : ""}`,
    },
  });

  // Audit + notify the student of the human decision (best-effort).
  await prisma.adminAuditLog
    .create({
      data: {
        action: "FEEDBACK_OVERRIDE",
        targetUserId: fb.userId,
        targetType: "QuestionFeedback",
        metadata: { feedbackId: fb.id, questionId: q.id, override: params.action, note },
        performedById: params.adminId,
      },
    })
    .catch(() => {});
  await prisma.notification
    .create({
      data: {
        userId: fb.userId,
        type: "feedback_resolved",
        title: "Feedback revizuit ✅",
        message: changeLabel,
        metadata: { feedbackId: fb.id, questionId: q.id, action: "overridden" },
      },
    })
    .catch(() => {});

  return { ok: true };
}
