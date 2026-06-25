/**
 * Backfill verifiable provenance on the "licenta-rares" grile.
 *
 * Problem: each question's `topic` was "Secțiunea N" (= the Nth auto-cut text
 * chunk of the thesis PDF) — meaningless to the student. The verbatim source
 * quote IS stored in `sourceReference` ("licenta-gen: \"…\"") but was never
 * anchored to a page or a real section, and is hidden from students.
 *
 * This script (NON-destructive, idempotent) re-reads the thesis PDF page by
 * page, finds which page each question's stored quote appears on, and writes:
 *   - pdfPage  = the real PDF page where the quote is found
 *   - topic    = the real section heading active on that page
 *                (e.g. "1.2. Calitatea serviciilor") instead of "Secțiunea 29"
 * `sourceReference` (the verbatim quote) is preserved untouched.
 *
 * Front-matter quotes (cover / table of contents) that don't match real body
 * text get topic "Pagina de titlu / Cuprins" and pdfPage = null (no misleading
 * page) and are listed at the end as review candidates.
 *
 * Run DRY (default — prints the plan, writes nothing):
 *   cd /var/www/tutor && set -a && source .env && set +a && \
 *   node scripts/backfill-licenta-provenance.mjs /tmp/licenta.pdf
 * Apply:
 *   … node scripts/backfill-licenta-provenance.mjs /tmp/licenta.pdf --apply
 * Offline self-test of the matching logic (no DB):
 *   node scripts/backfill-licenta-provenance.mjs <pdf> --from-file questions.json
 */
import { createRequire } from "module";
import { readFileSync } from "fs";

const require = createRequire(import.meta.url);

const SLUG = "licenta-rares";
const args = process.argv.slice(2);
const pdfPath = args.find((a) => !a.startsWith("--")) || "/tmp/licenta.pdf";
const APPLY = args.includes("--apply");
const fromFileIdx = args.indexOf("--from-file");
const fromFile = fromFileIdx >= 0 ? args[fromFileIdx + 1] : null;

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ăâîșţț ]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

async function extractPages(path) {
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const pages = []; // { flat: string (for quote search), lines: string[] (for heading detection) }
  function pagerender(pageData) {
    return pageData
      .getTextContent({ normalizeWhitespace: true })
      .then((tc) => {
        let flat = "";
        let lined = "";
        let lastY = null;
        for (const it of tc.items) {
          const y = it.transform[5];
          if (lastY !== null && Math.abs(y - lastY) > 3) lined += "\n";
          lined += it.str;
          flat += it.str + " ";
          lastY = y;
        }
        pages.push({ flat, lines: lined.split("\n").map((l) => l.trim()).filter(Boolean) });
        return flat;
      });
  }
  await pdfParse(readFileSync(path), { pagerender });
  return pages;
}

// A real section start (top of a body page). Subsections require the N.M form
// (\d+\.\d+) so the bibliography's numbered reference list ("1. Asubonteng…")
// is NOT mistaken for a heading.
const HEAD_RE =
  /^(capitolul\s+\d+\.?\s+\p{Lu}.{2,80}|introducere|concluzii(?:\s+generale)?|bibliografie|anexa\s*\d*|\d+\.\d+\.?\s+\p{L}.{2,70})$/iu;

function buildSectionMap(pages, cuprinsPages) {
  const anchors = [[1, "Pagina de titlu"]];
  let bibliografieLocked = false; // after BIBLIOGRAFIE, everything is Bibliografie
  pages.forEach((pg, idx) => {
    const pageNo = idx + 1;
    if (bibliografieLocked) return;
    if (cuprinsPages.has(pageNo)) {
      anchors.push([pageNo, "Cuprins"]);
      return;
    }
    // Scan every line — subsection headings (1.2, 2.3…) often sit mid-page where
    // the previous section's text ends. The \d+\.\d+ form + biblio-lock keep the
    // bibliography's numbered reference list from being read as headings.
    for (const l of pg.lines) {
      if (l.length <= 90 && HEAD_RE.test(l)) {
        const label = l.replace(/\s+/g, " ").trim();
        anchors.push([pageNo, label]);
        if (/^bibliografie/i.test(label)) {
          bibliografieLocked = true;
          break;
        }
      }
    }
  });
  const map = [];
  for (const [pg, label] of anchors) {
    if (!map.length || map[map.length - 1][1] !== label) map.push([pg, label]);
  }
  return map;
}

function sectionForPage(map, pg) {
  let label = "Lucrare de licență";
  for (const [p, l] of map) {
    if (p <= pg) label = l;
    else break;
  }
  return label;
}

const FRONT_MATTER_RE =
  /coordonator|absolvent|cuprins|capitolul\s+\d+\.|bibliografie\s+\d+|academia de studii/i;

function matchPage(quote, npages, cuprinsPages) {
  const nq = norm(quote);
  if (nq.length < 8) return { page: null, how: "none" };
  // The stored "sourceQuote" is only loosely verbatim (the AI paraphrases after
  // a few words), so cascade from the full quote down to a 25-char prefix.
  const tries = [
    [nq, "full"],
    [nq.slice(0, 60), "prefix"],
    [nq.slice(0, 40), "prefix"],
    [nq.slice(0, 25), "approx"],
  ];
  for (const [needle, how] of tries) {
    if (needle.length < 25 && how !== "full") continue;
    const hits = [];
    npages.forEach((p, i) => {
      if (p.includes(needle)) hits.push(i + 1);
    });
    if (hits.length) {
      const nonCuprins = hits.filter((h) => !cuprinsPages.has(h));
      return { page: (nonCuprins.length ? nonCuprins : hits)[0], how };
    }
  }
  return { page: null, how: "none" };
}

async function loadQuestions() {
  if (fromFile) return JSON.parse(readFileSync(fromFile, "utf8"));
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const domain = await prisma.domain.findUnique({ where: { slug: SLUG } });
  if (!domain) throw new Error(`domain ${SLUG} not found`);
  const qs = await prisma.question.findMany({
    where: { domainId: domain.id },
    select: { id: true, topic: true, sourceReference: true, status: true, bookOrder: true },
    orderBy: { bookOrder: "asc" },
  });
  return { prisma, domainId: domain.id, qs };
}

async function main() {
  const pages = await extractPages(pdfPath);
  const npages = pages.map((p) => norm(p.flat));
  // Cuprins (table of contents): a page that lists 2+ chapter titles at once.
  const cuprinsPages = new Set();
  npages.forEach((p, i) => {
    if (/\bcuprins\b/.test(p) || (p.match(/capitolul\s+\d/g) || []).length >= 2) cuprinsPages.add(i + 1);
  });
  const sectionMap = buildSectionMap(pages, cuprinsPages);

  console.log(`PDF: ${pdfPath} — ${pages.length} pages; cuprins=${[...cuprinsPages].join(",") || "-"}`);
  console.log("Section map (page → heading):");
  sectionMap.forEach(([p, l]) => console.log(`  p${p}: ${l}`));

  const loaded = await loadQuestions();
  const prisma = fromFile ? null : loaded.prisma;
  const qs = fromFile ? loaded : loaded.qs;

  const plan = [];
  const stat = { full: 0, prefix: 0, approx: 0, none: 0 };
  for (const q of qs) {
    const m = /^licenta-gen:\s*"([\s\S]*)"$/.exec(q.sourceReference || "");
    const quote = m ? m[1] : "";
    const { page, how } = matchPage(quote, npages, cuprinsPages);
    stat[how]++;
    let pdfPage = null;
    let topic = q.topic;
    if (page) {
      pdfPage = page;
      topic = sectionForPage(sectionMap, page);
    } else {
      topic = FRONT_MATTER_RE.test(quote) ? "Pagina de titlu / Cuprins" : "Lucrare de licență";
    }
    plan.push({ id: q.id, oldTopic: q.topic, newTopic: topic, pdfPage, how, status: q.status, quote: quote.slice(0, 60) });
  }

  const secCount = {};
  plan.forEach((p) => (secCount[p.newTopic] = (secCount[p.newTopic] || 0) + 1));
  console.log(`\nMATCH: full=${stat.full} prefix=${stat.prefix} approx=${stat.approx} none(front-matter)=${stat.none}  (total ${qs.length})`);
  console.log("New section distribution:");
  Object.entries(secCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([s, c]) => console.log(`  ${String(c).padStart(3)}  ${s}`));
  const unmatched = plan.filter((p) => !p.pdfPage);
  if (unmatched.length) {
    console.log(`\n⚠ ${unmatched.length} front-matter / unmatched (pdfPage=null) — review candidates:`);
    unmatched.forEach((p) => console.log(`  ${p.id} [${p.status}] "${p.quote}"`));
  }

  if (!APPLY) {
    console.log("\nDRY-RUN — nothing written. Re-run with --apply to persist.");
    if (prisma) await prisma.$disconnect();
    return;
  }
  if (!prisma) {
    console.log("\n--apply ignored in --from-file mode (no DB).");
    return;
  }
  let n = 0;
  for (const p of plan) {
    await prisma.question.update({
      where: { id: p.id },
      data: { topic: p.newTopic, pdfPage: p.pdfPage },
    });
    n++;
  }
  console.log(`\nAPPLIED: updated ${n} questions.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
