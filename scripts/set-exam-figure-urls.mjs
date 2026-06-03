#!/usr/bin/env node
/**
 * set-exam-figure-urls.mjs — attach extracted figure PNGs to exam-bank items.
 *
 * The 11 Matematică EN VIII 2026 figures were cropped from the official PDF into
 * Tutor/public/exam-figures/ (slice 3). This sets ExamItem.figureUrl on the matching
 * items (by section + label). Idempotent. Limba română has no figures.
 *
 * Modes: --dry (report only) / (no flag) apply.
 * DB target: DATABASE_URL from env. On prod = VPS2 local PG. Never Neon.
 */
const DRY = process.argv.includes("--dry");

const PAPER = { examType: "EN_VIII", year: 2026, subjectKey: "matematica", variant: "model" };
// section + label → public path
const MAP = [
  { section: "Subiectul I", label: "6", file: "en-viii-2026-mate-s1-6.png" },
  { section: "Subiectul al II-lea", label: "1", file: "en-viii-2026-mate-s2-1.png" },
  { section: "Subiectul al II-lea", label: "2", file: "en-viii-2026-mate-s2-2.png" },
  { section: "Subiectul al II-lea", label: "3", file: "en-viii-2026-mate-s2-3.png" },
  { section: "Subiectul al II-lea", label: "4", file: "en-viii-2026-mate-s2-4.png" },
  { section: "Subiectul al II-lea", label: "5", file: "en-viii-2026-mate-s2-5.png" },
  { section: "Subiectul al II-lea", label: "6", file: "en-viii-2026-mate-s2-6.png" },
  { section: "Subiectul al III-lea", label: "3", file: "en-viii-2026-mate-s3-3.png" },
  { section: "Subiectul al III-lea", label: "4", file: "en-viii-2026-mate-s3-4.png" },
  { section: "Subiectul al III-lea", label: "5", file: "en-viii-2026-mate-s3-5.png" },
  { section: "Subiectul al III-lea", label: "6", file: "en-viii-2026-mate-s3-6.png" },
];

(async () => {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    console.log(`\n=== set-exam-figure-urls (mode=${DRY ? "dry" : "apply"}) ===`);
    const paper = await prisma.examPaper.findUnique({
      where: { examType_year_subjectKey_variant: PAPER },
    });
    if (!paper) {
      console.error("❌ Matematică EN VIII 2026 paper not found. Aborting.");
      process.exit(1);
    }
    let updated = 0;
    for (const m of MAP) {
      const url = `/exam-figures/${m.file}`;
      const item = await prisma.examItem.findFirst({
        where: { paperId: paper.id, section: m.section, label: m.label },
        select: { id: true, figureUrl: true, hasFigure: true },
      });
      if (!item) {
        console.error(`  ⚠ item not found: ${m.section} ${m.label}`);
        continue;
      }
      const change = item.figureUrl === url ? "(unchanged)" : `→ ${url}`;
      console.log(`  ${m.section} ${m.label}  figure=${item.hasFigure}  ${change}`);
      if (!DRY && item.figureUrl !== url) {
        await prisma.examItem.update({ where: { id: item.id }, data: { figureUrl: url } });
        updated++;
      }
    }
    const withFig = await prisma.examItem.count({ where: { paperId: paper.id, figureUrl: { not: null } } });
    console.log(`\n${DRY ? "🔎 DRY — no writes." : `✅ APPLIED — ${updated} updated.`} Items with figureUrl now: ${withFig}/11 expected.`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
