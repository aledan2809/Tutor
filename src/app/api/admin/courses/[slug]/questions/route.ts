import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { requireContentAdmin, ownsDomain } from "@/lib/merchant-auth";
import { generateQuestions } from "@/lib/ai-tutor";
import { extractJsonObjects } from "@/lib/json-from-model";
import { describeGateOutcome, gateGeneratedQuestions } from "@/lib/question-gate";
import { hasLengthCue } from "@/lib/answer-length-cue";
import { shuffleOptions } from "@/lib/shuffle-options";
import { findBlindSolvable } from "@/lib/blind-check";
import { measureGuessBaseline, describeGuessBaseline } from "@/lib/guess-baseline";
import { dropNearDuplicates } from "@/lib/near-duplicate";
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

      // Ce există deja pentru subiect — trimis modelului, nu doar numărat. Fără
      // asta, a doua trecere rescrie din aceeași lecție și iese aceeași întrebare
      // cu altă cheie.
      const existingStems = existing
        ? (
            await prisma.question.findMany({
              where: { domainId: course.domain.id, topic },
              select: { content: true },
              take: 60,
            })
          ).map((q) => q.content)
        : [];

      // Cerute în tranșe mici, nu într-un singur apel.
      //
      // De când promptul cere distractori adevărați-dar-nepotriviți, modelul scrie
      // mult mai încet. Un apel pentru opt grile a depășit de două ori limita
      // (240s, apoi 420s) și a căzut pe furnizorul de rezervă, care era limitat de
      // cotă — deci nu opt grile mai slabe, ci ZERO, după șapte minute de așteptare.
      // Tranșele fac progresul parțial să supraviețuiască, iar fiecare tranșă știe
      // ce au scris cele dinainte, deci nu se repetă între ele.
      const CHUNK = 2;
      const raw: Record<string, unknown>[] = [];
      const seenStems = [...existingStems];
      for (let done = 0; done < want; done += CHUNK) {
        const ask = Math.min(CHUNK, want - done);
        const res = await generateQuestions({
          domain: course.domain.name,
          subject: course.title,
          topic,
          count: ask,
          difficulty,
          type: "MULTIPLE_CHOICE",
          language,
          material,
          avoid: seenStems,
        });
        const part = extractJsonObjects(res.content ?? "[]") as Record<string, unknown>[];
        raw.push(...part);
        for (const q of part) {
          const c = String(q.content ?? "").trim();
          if (c) seenStems.push(c);
        }
        // Dacă o tranșă n-a întors nimic, a doua rareori merge mai bine (același
        // furnizor, aceeași limită) — oprim în loc să mai ardem șapte minute.
        if (!part.length) break;
      }
      const list = raw;
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

      // Plasa de sub instrucțiune: modelul poate ignora lista de mai sus, iar o
      // reformulare a aceleiași întrebări cu altă cheie e defectul cel mai scump.
      const deduped = dropNearDuplicates(candidates, existingStems);
      const duplicates = deduped.dropped.length;

      // Deterministic, before the judge: an answer that is the longest option AND
      // half again the others is guessable without reading the question.
      const withoutCue = deduped.kept.filter((q) => !hasLengthCue(q.options, q.correctAnswer));
      const cued = deduped.kept.length - withoutCue.length;
      row.generated = withoutCue.length;

      if (withoutCue.length) {
        const gate = await gateGeneratedQuestions(withoutCue);

        // A doua poartă, pe altă proprietate: judecătorul de mai sus vede întrebarea
        // și verifică dacă e corectă. Ăsta NU o vede și verifică dacă mai e nevoie
        // de ea. Șase atacuri oarbe pe lotul precedent au dat 95-100% — enunțul nu
        // făcea nicio muncă. Nu închide poarta când e inaccesibil: un item
        // rezolvabil orb e corect, doar slab.
        const blind = await findBlindSolvable(gate.kept);
        const blindSet = new Set(blind.solvable);
        const survivors = gate.kept.filter((_, i) => !blindSet.has(i));

        row.rejected = gate.rejected.length + cued + blind.solvable.length + duplicates;
        row.note =
          (duplicates ? `${duplicates}× reformulare a unei grile existente. ` : "") +
          (cued ? `${cued}× indiciu de lungime. ` : "") +
          describeGateOutcome(gate) +
          " " +
          blind.note;

        if (survivors.length) {
          // Ce ia un elev care nu citește deloc. Măsurat pe familia întreagă de
          // indicii, fiindcă fiecare filtru pe o singură unitate mută defectul în
          // vecina ei — caractere → cuvinte → virgule, de trei ori la rând.
          const baseline = measureGuessBaseline(survivors);
          row.note += " " + describeGuessBaseline(baseline);

          await prisma.question.createMany({
            data: survivors.map((q) => ({
              domainId: course.domain.id,
              subject: course.title,
              topic,
              difficulty,
              type: "MULTIPLE_CHOICE" as const,
              content: q.content,
              options: shuffleOptions(q.options, q.correctAnswer),
              correctAnswer: q.correctAnswer,
              explanation: q.explanation ?? null,
              source: "AI_GENERATED" as const,
              status: "DRAFT" as const,
              createdById: userId,
            })),
          });
          row.kept = survivors.length;
        }
      } else {
        row.rejected = cued + duplicates;
        row.note = duplicates
          ? `${duplicates}× reformulare a unei grile existente, ${cued}× indiciu de lungime`
          : cued
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
