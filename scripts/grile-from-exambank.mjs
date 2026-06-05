#!/usr/bin/env node
/**
 * grile-from-exambank.mjs — populate the "Grile" bank with OFFICIAL verbatim grile
 *
 * The Grile section must show the OFFICIAL multiple-choice items (ground-truth, from the
 * exam-bank papers), NOT AI-generated questions. This script:
 *   1. Reverts AI_GENERATED questions in the consolidated domains → DRAFT (out of Grile).
 *   2. Copies official MCQ ExamItems → Question rows VERBATIM (content, options, key→text
 *      from barem, figureUrl→imageUrl), source=MANUAL, status=PUBLISHED.
 *        - Matematica cl. VIII: ALL Mate MCQ items (Subiectul I + II; figures kept).
 *        - Română cl. VIII: only passage-INDEPENDENT MCQ (passageRef IS NULL — self-contained
 *          language items). Passage-dependent items stay in Simulări (need the reading text).
 *
 * Idempotent: official copies carry sourceReference="exam-bank:<examItemId> | <paper source>";
 * each run deletes prior 'exam-bank:%' rows in the domain then recreates. Re-run = same result.
 *
 * Modes: --dry (report, no writes) · (no flag) apply. DB: DATABASE_URL from env (VPS2 local PG).
 */

const DRY = process.argv.includes("--dry");

const MATE_SLUG = "matematica-v-viii"; // domain "Matematica cl. VIII"
const RO_SLUG = "romana-cl-viii"; // domain "Română cl. VIII"

// ExamItem.options = [{key,text}], correctAnswer = key letter → convert to Question shape
// (options = string[], correctAnswer = full text of the keyed option), verbatim.
function toQuestionShape(item, paper, domainId, subjectName) {
  const opts = Array.isArray(item.options) ? item.options : [];
  const optionTexts = opts.map((o) => String(o.text));
  const keyed = opts.find((o) => String(o.key) === String(item.correctAnswer));
  const correctText = keyed ? String(keyed.text) : String(item.correctAnswer);
  return {
    domainId,
    subject: subjectName,
    topic: item.section || "Grile",
    difficulty: 3,
    type: "MULTIPLE_CHOICE",
    content: item.content,
    options: optionTexts,
    correctAnswer: correctText,
    imageUrl: item.figureUrl || null,
    sourceReference: `exam-bank:${item.id} | ${paper.source}`,
    source: "MANUAL",
    status: "PUBLISHED",
  };
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const mate = await prisma.domain.findUnique({ where: { slug: MATE_SLUG } });
    const ro = await prisma.domain.findUnique({ where: { slug: RO_SLUG } });
    if (!mate || !ro) throw new Error("consolidated domains not found");

    // Gather official MCQ items
    const mateItems = await prisma.examItem.findMany({
      where: { type: "MCQ", paper: { subjectKey: "matematica" } },
      include: { paper: { select: { source: true } } },
    });
    const roItems = await prisma.examItem.findMany({
      where: { type: "MCQ", passageRef: null, paper: { subjectKey: "limba_romana" } },
      include: { paper: { select: { source: true } } },
    });
    console.log(`Official MCQ to copy: Matematică=${mateItems.length}, Română (passage-free)=${roItems.length}`);

    // AI rows to revert
    const aiCount = await prisma.question.count({
      where: { domainId: { in: [mate.id, ro.id] }, source: "AI_GENERATED", status: "PUBLISHED" },
    });
    console.log(`AI_GENERATED PUBLISHED to revert → DRAFT: ${aiCount}`);

    if (DRY) {
      console.log("\n🔎 DRY — no writes.");
      return;
    }

    // 1. revert AI
    const reverted = await prisma.question.updateMany({
      where: { domainId: { in: [mate.id, ro.id] }, source: "AI_GENERATED", status: "PUBLISHED" },
      data: { status: "DRAFT" },
    });
    console.log(`  ✅ reverted ${reverted.count} AI questions → DRAFT`);

    // 2. delete prior official copies (idempotent) + recreate
    for (const [domain, items, subjectName] of [
      [mate, mateItems, "Matematica cl. VIII"],
      [ro, roItems, "Română cl. VIII"],
    ]) {
      const del = await prisma.question.deleteMany({
        where: { domainId: domain.id, sourceReference: { startsWith: "exam-bank:" } },
      });
      const rows = items.map((it) => toQuestionShape(it, it.paper, domain.id, subjectName));
      // createMany can't take options as Json[] inline reliably across drivers — map explicitly
      let created = 0;
      const BATCH = 100;
      for (let i = 0; i < rows.length; i += BATCH) {
        const slice = rows.slice(i, i + BATCH);
        await prisma.question.createMany({
          data: slice.map((r) => ({
            domainId: r.domainId, subject: r.subject, topic: r.topic, difficulty: r.difficulty,
            type: r.type, content: r.content, options: r.options, correctAnswer: r.correctAnswer,
            imageUrl: r.imageUrl, sourceReference: r.sourceReference, source: r.source, status: r.status,
          })),
        });
        created += slice.length;
      }
      console.log(`  ✅ ${subjectName}: deleted ${del.count} prior official, created ${created} official grile`);
    }

    // summary
    for (const [domain, label] of [[mate, "Matematica cl. VIII"], [ro, "Română cl. VIII"]]) {
      const pub = await prisma.question.count({ where: { domainId: domain.id, status: "PUBLISHED" } });
      const off = await prisma.question.count({ where: { domainId: domain.id, status: "PUBLISHED", source: "MANUAL" } });
      console.log(`  ${label}: PUBLISHED=${pub} (official MANUAL=${off})`);
    }
    console.log("\n✅ APPLIED.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
