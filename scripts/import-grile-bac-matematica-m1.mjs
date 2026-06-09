#!/usr/bin/env node
/**
 * import-grile-bac-matematica-m1.mjs — BAC Matematică M1 (Mate-Info) → GRILE (MCQ)
 *
 * BAC Matematică Subiectul I has 6 short-answer items per paper, each with a concrete
 * result in the official BAREM. These grile are built FROM that ground truth (L09):
 *   • the question is the official cerință (reframed "Arătați că…/Determinați…" → "valoarea … este:"),
 *   • the CORRECT option is the official barem result (verbatim),
 *   • distractors are plausible numeric/sign alternatives (manual, no AI).
 * Math notation is plain Unicode inline (the UI has no KaTeX/MathJax) — transcribed from the
 * rendered PDF, not from the (garbled) fitz text dump.
 *
 * Target: domain `matematica-m1-ix-xii` (slug → Bacalaureat), subject
 * "Matematică M1 (Mate-Info) — Bacalaureat", source MANUAL, status PUBLISHED.
 * The 3 BAC programs (M1/M2/M3) are NEVER mixed — each has its own domain + script.
 * Idempotent: deletes prior bac-grile-mate-m1:% rows in this domain then recreates.
 *
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL from env (VPS2 local PG).
 */
import { PrismaClient } from "@prisma/client";

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

const SUBJECT = "Matematică M1 (Mate-Info) — Bacalaureat";
const DOMAIN_SLUG = "matematica-m1-ix-xii";
const TAG_PREFIX = "bac-grile-mate-m1";

// Per paper: barem-anchored MCQ. `correct` MUST equal one option verbatim.
const GRILE = [
  {
    year: 2024, variant: "model",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Valoarea expresiei 2(1−2i)+i(4+i), unde i²=−1, este:",
        options: ["1", "−1", "5", "1+8i"], correct: "1" },
      { label: "I.2", topic: "Funcții. Grafic",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²+ax−a, unde a este număr real. Valoarea reală a lui a pentru care punctul A(3,−3) aparține graficului funcției f este:",
        options: ["−6", "6", "−3", "3"], correct: "−6" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Mulțimea soluțiilor reale ale ecuației log₂(x²+8)=log₂(8−2x) este:",
        options: ["{−2, 0}", "{0, 2}", "{−2, 2}", "{−4, 0}"], correct: "{−2, 0}" },
      { label: "I.4", topic: "Elemente de combinatorică",
        content: "Numărul numerelor naturale de două cifre distincte, cu cifra zecilor pară, care se pot forma cu elementele mulțimii A={1,2,3,4,5} este:",
        options: ["8", "10", "6", "16"], correct: "8" },
      { label: "I.5", topic: "Vectori. Geometrie analitică",
        content: "În sistemul cartezian xOy se consideră punctele A(0,3) și B(4,0). Coordonatele punctului C pentru care OC⃗=OA⃗+OB⃗ sunt:",
        options: ["(4, 3)", "(3, 4)", "(4, −3)", "(−4, 3)"], correct: "(4, 3)" },
      { label: "I.6", topic: "Trigonometrie. Triunghiul",
        content: "Se consideră triunghiul ascuțitunghic ABC, cu AB=5, măsura unghiului C egală cu π/4 și înălțimea AD=4 (D pe BC). Lungimea laturii BC este:",
        options: ["7", "5", "9", "6"], correct: "7" },
    ],
  },
];

function validate() {
  let errs = 0, n = 0;
  for (const p of GRILE) {
    const labels = new Set();
    for (const it of p.items) {
      n++;
      const where = `${p.year}-${p.variant}-${it.label}`;
      if (labels.has(it.label)) { console.error(`  ✗ dup label ${where}`); errs++; }
      labels.add(it.label);
      if (!it.options || it.options.length < 3) { console.error(`  ✗ <3 options ${where}`); errs++; }
      if (new Set(it.options).size !== it.options.length) { console.error(`  ✗ dup option ${where}`); errs++; }
      if (!it.options.includes(it.correct)) { console.error(`  ✗ correct not in options ${where}: "${it.correct}"`); errs++; }
      if (!it.content || !it.content.trim().endsWith(":")) { console.error(`  ✗ content should end with ":" ${where}`); errs++; }
    }
  }
  console.log(`validate: ${n} grile across ${GRILE.length} paper(s), ${errs} error(s)`);
  return errs;
}

async function run(dry) {
  const prisma = new PrismaClient();
  try {
    const domain = await prisma.domain.findUnique({ where: { slug: DOMAIN_SLUG } });
    if (!domain) throw new Error(`domain ${DOMAIN_SLUG} not found — run band-matematica-bac.mjs first`);
    const rows = [];
    for (const p of GRILE) {
      for (const it of p.items) {
        rows.push({
          domainId: domain.id, subject: SUBJECT, topic: it.topic, difficulty: 3,
          type: "MULTIPLE_CHOICE", content: it.content, passage: null,
          options: it.options, correctAnswer: it.correct, imageUrl: null,
          sourceReference: `${TAG_PREFIX}:${p.year}-${p.variant}-${it.label}`, source: "MANUAL", status: "PUBLISHED",
        });
      }
    }
    console.log(`  domain=${DOMAIN_SLUG} grile to create=${rows.length}`);
    if (dry) { console.log("  (dry — no writes)"); return; }
    const del = await prisma.question.deleteMany({ where: { domainId: domain.id, sourceReference: { startsWith: `${TAG_PREFIX}:` } } });
    let created = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const slice = rows.slice(i, i + 50);
      await prisma.question.createMany({ data: slice });
      created += slice.length;
    }
    const pub = await prisma.question.count({ where: { domainId: domain.id, status: "PUBLISHED", type: "MULTIPLE_CHOICE" } });
    console.log(`  ✅ deleted ${del.count} prior ${TAG_PREFIX}, created ${created}. Domain PUBLISHED MCQ now=${pub}`);
  } finally { await prisma.$disconnect(); }
}

if (MODE === "validate") { process.exit(validate() > 0 ? 1 : 0); }
else { run(MODE === "dry").catch((e) => { console.error(e); process.exit(1); }); }
