import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { requireContentAdmin, ownsDomain } from "@/lib/merchant-auth";
import { planCourse, writeModuleLesson, courseSlug } from "@/lib/course-generator";
import { generateQuestions } from "@/lib/ai-tutor";
import { describeGateOutcome, gateGeneratedQuestions } from "@/lib/question-gate";
import { z } from "zod";
import crypto from "node:crypto";

/**
 * A course, from a prompt.
 *
 * Two calls, on purpose:
 *   POST { action: "plan",  prompt }              → the outline, written nowhere
 *   POST { action: "build", prompt, plan, ... }   → lessons + questions, all DRAFT
 *
 * The outline is shown to a human before a single row is written, because a
 * generator that plans and commits in one step gives nobody a place to say no.
 *
 * Everything it writes is unpublished: the course, its lessons, and its questions.
 * Questions additionally pass the fail-closed judge in question-gate.ts — the same
 * one the existing admin generator uses. There is no laxer second road into the bank.
 */
const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("plan"),
    prompt: z.string().min(50).max(20000),
    language: z.enum(["ro", "en"]).default("ro"),
    maxModules: z.number().int().min(2).max(12).default(8),
  }),
  z.object({
    action: z.literal("build"),
    domainId: z.string().min(1),
    prompt: z.string().min(50).max(20000),
    language: z.enum(["ro", "en"]).default("ro"),
    plan: z.object({
      title: z.string().min(2).max(160),
      description: z.string().max(2000).default(""),
      modules: z
        .array(
          z.object({
            order: z.number().int().min(1),
            title: z.string().min(2).max(60),
            summary: z.string().max(1000).default(""),
            lessonBrief: z.string().max(2000).default(""),
          })
        )
        .min(1)
        .max(12),
    }),
    questionsPerModule: z.number().int().min(0).max(15).default(8),
  }),
]);

async function _POST(req: NextRequest) {
  const { error, scope, userId } = await requireContentAdmin();
  if (error) return error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  if (body.action === "plan") {
    try {
      const plan = await planCourse({
        prompt: body.prompt,
        language: body.language,
        maxModules: body.maxModules,
      });
      return NextResponse.json({ plan });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 422 });
    }
  }

  const domain = await prisma.domain.findUnique({
    where: { id: body.domainId },
    select: { id: true, name: true, slug: true, organizationId: true },
  });
  if (!ownsDomain(scope, domain)) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const suffix = crypto.randomBytes(3).toString("hex");
  const course = await prisma.course.create({
    data: {
      domainId: domain!.id,
      title: body.plan.title,
      slug: courseSlug(body.plan.title, suffix),
      description: body.plan.description || null,
      isPublished: false,
    },
    select: { id: true, slug: true, title: true },
  });

  const report: {
    module: string;
    lesson: "ok" | "esuat";
    lessonError?: string;
    questionsKept: number;
    questionsRejected: number;
    questionsNote?: string;
  }[] = [];

  for (const m of body.plan.modules.sort((a, b) => a.order - b.order)) {
    // The module's test is found by this exact string; the questions below are
    // written with the same value, from this one variable.
    const questionTopic = m.title;

    const courseModule = await prisma.courseModule.create({
      data: {
        courseId: course.id,
        order: m.order,
        title: m.title,
        summary: m.summary || null,
        questionTopic,
      },
      select: { id: true },
    });

    const row: (typeof report)[number] = { module: m.title, lesson: "esuat", questionsKept: 0, questionsRejected: 0 };

    // A module whose lesson fails is left without one rather than filled with a
    // placeholder: an empty module is visibly unfinished, a fake one is not.
    try {
      const lesson = await writeModuleLesson({
        coursePrompt: body.prompt,
        courseTitle: body.plan.title,
        module: m,
        language: body.language,
      });
      await prisma.lesson.create({
        data: {
          domainId: domain!.id,
          moduleId: courseModule.id,
          subject: body.plan.title,
          topic: questionTopic,
          title: lesson.title,
          slug: courseSlug(lesson.title, `${suffix}-${m.order}`),
          content: lesson.contentMarkdown,
          summary: lesson.summary || null,
          order: m.order,
          isPublished: false,
        },
      });
      row.lesson = "ok";
    } catch (e) {
      row.lessonError = (e as Error).message;
    }

    if (body.questionsPerModule > 0) {
      try {
        const res = await generateQuestions({
          domain: domain!.name,
          subject: body.plan.title,
          topic: questionTopic,
          count: body.questionsPerModule,
          difficulty: 3,
          type: "MULTIPLE_CHOICE",
          language: body.language,
        });
        const raw = JSON.parse((res.content ?? "[]").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
        const candidates = (Array.isArray(raw) ? raw : []).map((q: Record<string, unknown>) => ({
          content: String(q.content ?? ""),
          options: Array.isArray(q.options) ? (q.options as string[]).map(String) : [],
          correctAnswer: String(q.correctAnswer ?? ""),
          explanation: q.explanation ? String(q.explanation) : undefined,
        }));

        const gate = await gateGeneratedQuestions(candidates);
        row.questionsRejected = gate.rejected.length;
        row.questionsNote = describeGateOutcome(gate);

        if (gate.kept.length) {
          await prisma.question.createMany({
            data: gate.kept.map((q) => ({
              domainId: domain!.id,
              subject: body.plan.title,
              topic: questionTopic,
              difficulty: 3,
              type: "MULTIPLE_CHOICE" as const,
              content: q.content,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation ?? null,
              source: "AI_GENERATED" as const,
              status: "DRAFT" as const,
              createdById: userId,
            })),
          });
          row.questionsKept = gate.kept.length;
        }
      } catch (e) {
        row.questionsNote = `generare eșuată: ${(e as Error).message}`;
      }
    }

    report.push(row);
  }

  await logAudit({
    action: "COURSE_GENERATE",
    performedById: userId,
    targetType: "Course",
    metadata: {
      courseId: course.id,
      slug: course.slug,
      domainId: domain!.id,
      domainSlug: domain!.slug,
      modules: report.length,
      lessonsWritten: report.filter((r) => r.lesson === "ok").length,
      questionsKept: report.reduce((a, r) => a + r.questionsKept, 0),
      scope: scope.kind,
    },
  });

  return NextResponse.json({ course, report }, { status: 201 });
}

export const POST = withErrorHandler(_POST);
