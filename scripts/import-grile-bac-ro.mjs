#!/usr/bin/env node
/**
 * import-grile-bac-ro.mjs — BAC Limba și literatura română → GRILE (MCQ)
 *
 * BAC RO has NO official MCQ (it is essays + open comprehension). But each official paper
 * ships a BAREM with the official model answers. These grile are built FROM that ground truth:
 *   • the question is the official cerință (reformulated as a direct MCQ),
 *   • the CORRECT option is the official barem answer (verbatim sense),
 *   • the distractors are plausible-but-wrong options.
 * No AI generation of content; correctness is barem-anchored (per L07a — generation only where
 * no official source exists; here the official answer key IS the source). The supporting text is
 * reused verbatim from the already-imported ExamPaper passage (no duplication).
 *
 * Target: domain `romana-ix-xii` (slug → Bacalaureat in the public dropdown classifier),
 * subject "Română — Bacalaureat", source MANUAL, status PUBLISHED → visible in Grile + homepage
 * demo (under the "Bacalaureat" group). Idempotent: deletes prior bac-grile:% rows then recreates.
 *
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL din env (VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

const SUBJECT = "Română — Bacalaureat";
const DOMAIN_SLUG = "romana-ix-xii";
const TEXT = "Înțelegerea textului";
const VOCAB = "Vocabular și semantică";

// Per paper: barem-anchored MCQ. `correct` MUST equal one option verbatim.
const GRILE = [
  {
    year: 2025, variant: "model",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Valorificând textul, sensul din text al cuvântului „depășit” (în secvența „un obicei depășit de a te fotografia”) este:",
        options: ["învechit", "modern", "obositor", "costisitor"], correct: "învechit" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al secvenței „pe larg” (în „îi relata pe larg măicuței întâmplările de peste zi”) este:",
        options: ["în detaliu", "pe scurt", "cu voce tare", "în glumă"], correct: "în detaliu" },
      { label: "A.2", topic: TEXT, content: "Conform textului, talentul Ilenei Colonel Antonu se manifestă în domeniile:",
        options: ["pictura și muzica", "pictura și sculptura", "muzica și dansul", "literatura și pictura"], correct: "pictura și muzica" },
      { label: "A.3", topic: TEXT, content: "O caracteristică a scrisorii trimise de Radu soției sale, așa cum reiese din text, este:",
        options: ["dimensiunea amplă (optsprezece pagini)", "tonul oficial", "lungimea foarte redusă", "scrisul indescifrabil"], correct: "dimensiunea amplă (optsprezece pagini)" },
      { label: "A.4", topic: TEXT, content: "Un motiv pentru care Liviu Rebreanu scria scrisori imediat după câte un eveniment era:",
        options: ["dorința de a împărtăși detaliat experiența trăită", "o obligație de serviciu", "lipsa altor activități", "teama de a nu uita drumul"], correct: "dorința de a împărtăși detaliat experiența trăită" },
      { label: "A.5", topic: TEXT, content: "Reacția femeilor la vederea portretelor copiilor lor, realizate de pictoriță pornind de la fotografii, este una de:",
        options: ["uimire", "dezamăgire", "indiferență", "teamă"], correct: "uimire" },
    ],
  },
  {
    year: 2025, variant: "simulare",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Sensul din text al cuvântului „reală” (în secvența „o reală istorie a muzicii simfonice clasice”) este:",
        options: ["adevărată", "falsă", "îndelungată", "plictisitoare"], correct: "adevărată" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al secvenței „dădea la o parte” (în „sufleorul dădea la o parte capacul cuștii sale”) este:",
        options: ["îndepărta", "apăsa", "repara", "ascundea"], correct: "îndepărta" },
      { label: "A.2", topic: TEXT, content: "Conform textului, Universitatea „Regele Ferdinand”, refugiată în timpul războiului, a funcționat la:",
        options: ["Sibiu", "Cluj", "Iași", "București"], correct: "Sibiu" },
      { label: "A.3", topic: TEXT, content: "Domeniul artistic în care se manifestă spiritul competitiv al studenților de la Medicină și Litere este:",
        options: ["teatrul", "pictura", "muzica", "dansul"], correct: "teatrul" },
      { label: "A.4", topic: TEXT, content: "Un motiv pentru care spectacolul regizat de Liviu Rusu a atras atenția a fost:",
        options: ["noutatea abordării și soluțiile experimentale", "distribuția foarte numeroasă", "durata neobișnuit de scurtă", "decorul bogat și costisitor"], correct: "noutatea abordării și soluțiile experimentale" },
      { label: "A.5", topic: TEXT, content: "Un efect pe care îl are muzica simfonică asupra tânărului Ștefan Aug. Doinaș, conform textului, este:",
        options: ["descoperirea de sine", "plictiseala", "somnolența", "indiferența"], correct: "descoperirea de sine" },
    ],
  },
];

function validate() {
  const errors = [];
  const labels = new Set();
  for (const p of GRILE) {
    for (const it of p.items) {
      const k = `${p.year}-${p.variant}-${it.label}`;
      if (labels.has(k)) errors.push(`duplicate ${k}`); labels.add(k);
      if (!it.content?.trim()) errors.push(`${k} empty content`);
      if (!Array.isArray(it.options) || it.options.length < 3) errors.push(`${k} needs >=3 options`);
      if (new Set(it.options).size !== it.options.length) errors.push(`${k} duplicate options`);
      if (!it.options.includes(it.correct)) errors.push(`${k} correct '${it.correct}' not in options`);
    }
  }
  const total = GRILE.reduce((n, p) => n + p.items.length, 0);
  console.log(`  papers=${GRILE.length} grile=${total}`);
  if (errors.length) { console.error(`\n❌ VALIDATE FAILED (${errors.length}):`); errors.forEach((e) => console.error("   - " + e)); process.exit(1); }
  console.log("\n✅ VALIDATE OK — every grilă has a barem-anchored correct option present.");
}

async function run(dry) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const domain = await prisma.domain.findUnique({ where: { slug: DOMAIN_SLUG } });
    if (!domain) throw new Error(`domain ${DOMAIN_SLUG} not found`);

    const rows = [];
    for (const p of GRILE) {
      const paper = await prisma.examPaper.findUnique({
        where: { examType_year_subjectKey_variant: { examType: "BAC", year: p.year, subjectKey: "limba_romana", variant: p.variant } },
        include: { passages: { orderBy: { orderIndex: "asc" } } },
      });
      if (!paper) { console.warn(`  ⚠️ ExamPaper BAC ${p.year} ${p.variant} not found — grile vor avea passage null`); }
      const passageBody = paper?.passages?.[0]?.body ?? null;
      const passageHeader = paper?.passages?.[0]
        ? [paper.passages[0].title, paper.passages[0].author ? `de ${paper.passages[0].author}` : null].filter(Boolean).join(" — ")
        : null;
      const passage = passageBody ? (passageHeader ? `${passageHeader}\n\n${passageBody}` : passageBody) : null;
      for (const it of p.items) {
        rows.push({
          domainId: domain.id, subject: SUBJECT, topic: it.topic, difficulty: 3,
          type: "MULTIPLE_CHOICE", content: it.content, passage,
          options: it.options, correctAnswer: it.correct, imageUrl: null,
          sourceReference: `bac-grile:${p.year}-${p.variant}-${it.label}`, source: "MANUAL", status: "PUBLISHED",
        });
      }
    }

    console.log(`  domain=${DOMAIN_SLUG} grile to create=${rows.length}`);
    if (dry) { console.log("\n🔎 DRY — no writes."); return; }

    const del = await prisma.question.deleteMany({ where: { domainId: domain.id, sourceReference: { startsWith: "bac-grile:" } } });
    let created = 0;
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH);
      await prisma.question.createMany({ data: slice });
      created += slice.length;
    }
    const pub = await prisma.question.count({ where: { domainId: domain.id, status: "PUBLISHED", type: "MULTIPLE_CHOICE" } });
    console.log(`  ✅ deleted ${del.count} prior bac-grile, created ${created}. Domain PUBLISHED MCQ now=${pub}`);
    console.log("\n✅ APPLIED.");
  } finally { await prisma.$disconnect(); }
}

(async () => { console.log(`\n=== import-grile-bac-ro (mode=${MODE}) ===`); validate(); if (MODE === "validate") return; await run(MODE === "dry"); })().catch((e) => { console.error("FATAL:", e); process.exit(1); });
