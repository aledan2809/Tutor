import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { requireContentAdmin, ownsDomain } from "@/lib/merchant-auth";
import { generateQuestions } from "@/lib/ai-tutor";
import { extractJsonObjects } from "@/lib/json-from-model";
import { describeGateOutcome, gateGeneratedQuestions } from "@/lib/question-gate";
import { hasLengthCue } from "@/lib/answer-length-cue";
import { z } from "zod";

/**
 * Questions for a course that already exists.
 *
 * The build endpoint makes a course and its questions together; this fills in the
 * questions afterwards — for a course written elsewhere and imported, or for one
 * whose generation ran while no provider had quota left.
 *
 * Same road as everywhere else: generate, then the fail-closed judge in
 * question-gate.ts, then DRAFT. A question that cannot be judged is not stored.
 *
 * `moduleOrders` exists because judging is slow (each verdict is a CLI call, three
 * at a time), and eight modules at once outlast a proxy's patience. Driving it a
 * few modules per request is the difference between a finished course and a
 * request that dies half-way with no report of what it had already written.
 */
const bodySchema = z.object({
  perModule: z.number().int().min(1).max(15).default(8),
  /** Which modules to do now (1-based). Omitted = all of them. */
  moduleOrders: z.array(z.number().int().min(1)).max(20).optional(),
  /**
   * What to do with a module that already has questions.
   *   "skip"  — leave it alone; a re-run resumes where it stopped
   *   "topUp" — generate only the difference up to perModule
   *   "add"   — generate perModule more regardless
   * "topUp" is the default because yields vary: one module came back with eight
   * usable questions and its neighbour with two, and skipping the second would
   * leave the course permanently lopsided.
   */
  existingPolicy: z.enum(["skip", "topUp", "add"]).default("topUp"),
  difficulty: z.number().int().min(1).max(5).default(3),
  language: z.enum(["ro", "en"]).default("ro"),
});

async function _POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { error, scope, userId } = await requireContentAdmin();
  if (error) return error;

  const { slug } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { perModule, moduleOrders, existingPolicy, difficulty, language } = parsed.data;

  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      domain: { select: { id: true, name: true, slug: true, organizationId: true } },
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          title: true,
          summary: true,
          questionTopic: true,
          // The lesson is what the module's test must test.
          lessons: { orderBy: { order: "asc" }, select: { content: true }, take: 3 },
        },
      },
    },
  });
  if (!course || !ownsDomain(scope, course.domain)) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const wanted = course.modules.filter(
    (m) => m.questionTopic && (!moduleOrders || moduleOrders.includes(m.order))
  );

  const report: {
    order: number;
    module: string;
    existing: number;
    generated: number;
    kept: number;
    rejected: number;
    note?: string;
  }[] = [];

  for (const m of wanted) {
    const topic = m.questionTopic!;
    const existing = await prisma.question.count({ where: { domainId: course.domain.id, topic } });
    const row = { order: m.order, module: m.title, existing, generated: 0, kept: 0, rejected: 0 } as (typeof report)[number];

    let want = perModule;
    if (existing > 0) {
      if (existingPolicy === "skip") {
        row.note = "sărit — are deja întrebări";
        report.push(row);
        continue;
      }
      if (existingPolicy === "topUp") {
        want = perModule - existing;
        if (want <= 0) {
          row.note = `sărit — are deja ${existing}, cât s-a cerut`;
          report.push(row);
          continue;
        }
      }
    }

    try {
      const material = [m.summary ?? "", ...m.lessons.map((l) => l.content)]
        .filter(Boolean)
        .join("\n\n")
        .trim();
      // A module with no lesson yet gets no questions: without material the model
      // writes about the field instead of about the module, which is how the first
      // run produced land-registry questions for a module on commission and ethics.
      if (!material) {
        row.note = "sărit — modulul n-are încă lecție, iar grilele fără material ies generice";
        report.push(row);
        continue;
      }

      const res = await generateQuestions({
        domain: course.domain.name,
        subject: course.title,
        topic,
        count: want,
        difficulty,
        type: "MULTIPLE_CHOICE",
        language,
        material,
      });
      const list = extractJsonObjects(res.content ?? "[]");
      const candidates = (list as Record<string, unknown>[])
        .map((q) => ({
          content: String(q.content ?? "").trim(),
          options: Array.isArray(q.options) ? (q.options as unknown[]).map(String) : [],
          correctAnswer: String(q.correctAnswer ?? "").trim(),
          explanation: q.explanation ? String(q.explanation) : undefined,
        }))
        // A four-option question whose correct answer is not among the options is
        // not a borderline case for the judge to weigh — it is malformed, and it
        // is the exact shape that put wrong answers in front of a student before.
        .filter((q) => q.content && q.correctAnswer && q.options.length >= 2 && q.options.includes(q.correctAnswer));

      // Deterministic, before the judge: an answer that is the longest option AND
      // half again the others is guessable without reading the question.
      const withoutCue = candidates.filter((q) => !hasLengthCue(q.options, q.correctAnswer));
      const cued = candidates.length - withoutCue.length;
      row.generated = withoutCue.length;

      if (withoutCue.length) {
        const gate = await gateGeneratedQuestions(withoutCue);
        row.rejected = gate.rejected.length + cued;
        row.note = (cued ? `${cued}× indiciu de lungime. ` : "") + describeGateOutcome(gate);
        if (gate.kept.length) {
          await prisma.question.createMany({
            data: gate.kept.map((q) => ({
              domainId: course.domain.id,
              subject: course.title,
              topic,
              difficulty,
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
          row.kept = gate.kept.length;
        }
      } else {
        row.rejected = cued;
        row.note = cued
          ? `toate cele ${cued} aveau indiciu de lungime`
          : "modelul n-a întors nicio grilă utilizabilă";
      }
    } catch (e) {
      row.note = `eșec: ${(e as Error).message.slice(0, 200)}`;
    }

    report.push(row);
  }

  await logAudit({
    action: "COURSE_QUESTIONS_GENERATE",
    performedById: userId,
    targetType: "Course",
    metadata: {
      courseId: course.id,
      slug,
      domainSlug: course.domain.slug,
      modules: report.length,
      kept: report.reduce((a, r) => a + r.kept, 0),
      rejected: report.reduce((a, r) => a + r.rejected, 0),
      scope: scope.kind,
    },
  });

  return NextResponse.json({
    course: { slug, title: course.title },
    report,
    totals: {
      kept: report.reduce((a, r) => a + r.kept, 0),
      rejected: report.reduce((a, r) => a + r.rejected, 0),
    },
  });
}

export const POST = withErrorHandler(_POST);
