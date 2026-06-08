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

import { macroTopic } from "./lib/macro-topic.mjs";

const DRY = process.argv.includes("--dry");

const MATE_SLUG = "matematica-v-viii"; // domain "Matematica cl. VIII"
const RO_SLUG = "romana-cl-viii"; // domain "Română cl. VIII"

// ExamItem.options = [{key,text}], correctAnswer = key letter → convert to Question shape
// (options = string[], correctAnswer = full text of the keyed option), verbatim.
function toQuestionShape(item, paper, domainId, subjectName, passageText, subjectKey) {
  const opts = Array.isArray(item.options) ? item.options : [];
  const optionTexts = opts.map((o) => String(o.text));
  const keyed = opts.find((o) => String(o.key) === String(item.correctAnswer));
  const correctText = keyed ? String(keyed.text) : String(item.correctAnswer);
  // Granular capitol/competență (NOT the exam section) so progress + weak areas are meaningful.
  const topic = macroTopic({
    subjectKey,
    topic: item.topic,
    passageRef: item.passageRef,
    content: item.content,
  });
  return {
    domainId,
    subject: subjectName,
    topic,
    difficulty: 3,
    type: "MULTIPLE_CHOICE",
    content: item.content,
    passage: passageText || null,
    options: optionTexts,
    correctAnswer: correctText,
    imageUrl: item.figureUrl || null,
    sourceReference: `exam-bank:${item.id} | ${paper.source}`,
    source: "MANUAL",
    status: "PUBLISHED",
  };
}

// Resolve an item's passageRef ("Textul 1" / "Textul 1, Textul 2") to the reading text,
// concatenating the referenced ExamPassage bodies with a small header each.
function resolvePassage(item, passages) {
  if (!item.passageRef || !Array.isArray(passages) || passages.length === 0) return null;
  const refs = String(item.passageRef).split(",").map((s) => s.trim());
  const parts = [];
  for (const ref of refs) {
    const p = passages.find((x) => x.ref === ref);
    if (!p) continue;
    const header = [p.ref, p.title, p.author ? `de ${p.author}` : null]
      .filter(Boolean)
      .join(" — ");
    parts.push(`${header}\n\n${p.body}`);
  }
  return parts.length ? parts.join("\n\n———\n\n") : null;
}

// Expand a passage-dependent TF_GRID item into one True/False MCQ per statement.
// Statements live in item.rubric = [{label, answer:"Adevărat"|"Fals", points}]. Verbatim.
function tfGridToQuestionRows(item, paper, domainId, subjectName, passageText) {
  const rubric = Array.isArray(item.rubric) ? item.rubric : [];
  const topic = macroTopic({
    subjectKey: "limba_romana",
    topic: item.topic,
    passageRef: item.passageRef,
    content: item.content,
  });
  return rubric
    .filter((stmt) => stmt && stmt.label && stmt.answer)
    .map((stmt, i) => ({
      domainId,
      subject: subjectName,
      topic,
      difficulty: 3,
      type: "MULTIPLE_CHOICE",
      content: String(stmt.label).trim(),
      passage: passageText || null,
      options: ["Adevărat", "Fals"],
      correctAnswer: String(stmt.answer).trim(),
      imageUrl: null,
      sourceReference: `exam-bank:${item.id}#${i} | ${paper.source}`,
      source: "MANUAL",
      status: "PUBLISHED",
    }));
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
      where: { type: "MCQ", paper: { subjectKey: "limba_romana" } },
      include: { paper: { select: { source: true, passages: true } } },
    });
    const roWithPassage = roItems.filter((it) => it.passageRef).length;
    console.log(`Official MCQ to copy: Matematică=${mateItems.length}, Română=${roItems.length} (din care ${roWithPassage} cu text-suport)`);

    // Passage-dependent True/False grids → expanded into one A/F MCQ per statement
    // (the Question/Grile flow renders MCQ, not grids). Source = limba română only.
    const roTfGrid = await prisma.examItem.findMany({
      where: { type: "TF_GRID", paper: { subjectKey: "limba_romana" } },
      include: { paper: { select: { source: true, passages: true } } },
    });
    const tfStmtCount = roTfGrid.reduce((n, it) => n + (Array.isArray(it.rubric) ? it.rubric.length : 0), 0);
    console.log(`TF_GRID RO: ${roTfGrid.length} grids → ${tfStmtCount} True/False grile`);

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
    for (const [domain, items, subjectName, subjectKey] of [
      [mate, mateItems, "Matematica cl. VIII", "matematica"],
      [ro, roItems, "Română cl. VIII", "limba_romana"],
    ]) {
      const del = await prisma.question.deleteMany({
        where: { domainId: domain.id, sourceReference: { startsWith: "exam-bank:" } },
      });
      const rows = items.map((it) =>
        toQuestionShape(it, it.paper, domain.id, subjectName, resolvePassage(it, it.paper.passages), subjectKey)
      );
      // RO: also expand TF_GRID grids into A/F MCQ grile
      if (subjectKey === "limba_romana") {
        for (const it of roTfGrid) {
          rows.push(...tfGridToQuestionRows(it, it.paper, domain.id, subjectName, resolvePassage(it, it.paper.passages)));
        }
      }
      // createMany can't take options as Json[] inline reliably across drivers — map explicitly
      let created = 0;
      const BATCH = 100;
      for (let i = 0; i < rows.length; i += BATCH) {
        const slice = rows.slice(i, i + BATCH);
        await prisma.question.createMany({
          data: slice.map((r) => ({
            domainId: r.domainId, subject: r.subject, topic: r.topic, difficulty: r.difficulty,
            type: r.type, content: r.content, passage: r.passage, options: r.options,
            correctAnswer: r.correctAnswer, imageUrl: r.imageUrl, sourceReference: r.sourceReference,
            source: r.source, status: r.status,
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
