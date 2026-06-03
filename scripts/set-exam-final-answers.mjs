#!/usr/bin/env node
/**
 * set-exam-final-answers.mjs — attach a clean "rezultat final" to the few Matematică
 * open items whose asked result is an unambiguous bare number (slice 4 "câștig gratuit").
 *
 * Conservative on purpose: only items where the question asks to FIND/CALCULATE a value
 * and that value is a plain integer (no radicals/units), so the auto-check never gives a
 * false negative. The student is told to type just the number. More can be added later.
 *
 * Idempotent. Modes: --dry / apply. DB: DATABASE_URL from env (prod = VPS2 local PG).
 */
const DRY = process.argv.includes("--dry");
const PAPER = { examType: "EN_VIII", year: 2026, subjectKey: "matematica", variant: "model" };
const MAP = [
  { section: "Subiectul al III-lea", label: "1", finalAnswer: "14" }, // vârsta lui Bogdan
  { section: "Subiectul al III-lea", label: "5", finalAnswer: "90" }, // aria triunghiului NCD (cm²)
];

(async () => {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    console.log(`\n=== set-exam-final-answers (mode=${DRY ? "dry" : "apply"}) ===`);
    const paper = await prisma.examPaper.findUnique({ where: { examType_year_subjectKey_variant: PAPER } });
    if (!paper) {
      console.error("❌ Matematică EN VIII 2026 paper not found.");
      process.exit(1);
    }
    let updated = 0;
    for (const m of MAP) {
      const item = await prisma.examItem.findFirst({
        where: { paperId: paper.id, section: m.section, label: m.label },
        select: { id: true, finalAnswer: true },
      });
      if (!item) {
        console.error(`  ⚠ item not found: ${m.section} ${m.label}`);
        continue;
      }
      const change = item.finalAnswer === m.finalAnswer ? "(unchanged)" : `→ "${m.finalAnswer}"`;
      console.log(`  ${m.section} ${m.label}  ${change}`);
      if (!DRY && item.finalAnswer !== m.finalAnswer) {
        await prisma.examItem.update({ where: { id: item.id }, data: { finalAnswer: m.finalAnswer } });
        updated++;
      }
    }
    const withFinal = await prisma.examItem.count({ where: { paperId: paper.id, finalAnswer: { not: null } } });
    console.log(`\n${DRY ? "🔎 DRY — no writes." : `✅ APPLIED — ${updated} updated.`} Items with finalAnswer: ${withFinal}`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
