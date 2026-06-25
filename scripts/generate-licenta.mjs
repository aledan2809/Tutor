/**
 * Generate grilă questions from a licență thesis PDF into the private
 * "licenta-rares" domain (visible only to Rareș). Self-contained: PDF text →
 * passages → grounded MCQ via Groq/Gemini → seed PUBLISHED questions.
 *
 * Run (on a host with the AI keys + prod DB):
 *   cd /var/www/tutor && set -a && source .env && set +a && \
 *   node scripts/generate-licenta.mjs /tmp/licenta.pdf
 *
 * NOTE: this seeds topic="Secțiunea N" (the chunk index — not meaningful to the
 * student). ALWAYS follow a (re)generation with the provenance backfill so each
 * grilă gets its real PDF page + section heading + verifiable quote:
 *   node scripts/backfill-licenta-provenance.mjs /tmp/licenta.pdf --apply
 */
import { createRequire } from "module";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const prisma = new PrismaClient();

const SLUG = "licenta-rares";
const STUDENT_EMAIL = "raresdanciulescu9@gmail.com";
const MARK = "licenta-gen";
const MAX_CHUNKS = 55;
const PER_CHUNK = 4;

const filePath = process.argv[2];
if (!filePath) { console.error("usage: node generate-licenta.mjs <file.pdf>"); process.exit(1); }

async function extractPdf(path) {
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const data = await pdfParse(readFileSync(path));
  return data.text || "";
}

function clean(raw) {
  return raw
    .replace(/­/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunk(text) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n" + p).length > 1800) {
      if (buf.length >= 250) chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}\n${p}` : p;
    }
  }
  if (buf.length >= 250) chunks.push(buf);
  return chunks.slice(0, MAX_CHUNKS);
}

async function callTextAI(prompt) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) return (await res.json()).choices?.[0]?.message?.content || "";
    } catch { /* fall through */ }
  }
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json" } }),
        }
      );
      if (res.ok) return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch { /* fall through */ }
  }
  throw new Error("All AI providers failed");
}

const PROMPT = (passage) => `Pe baza PASAJULUI de mai jos dintr-o lucrare de licență, generează exact ${PER_CHUNK} întrebări grilă în română, ca studentul să stăpânească tot ce e acolo.
REGULI: răspunzabile DOAR din pasaj (nu inventa); 4 opțiuni (a, b, c, d), EXACT una corectă; distractori plauzibili dar clar greșiți; opțiuni de lungime similară; păstrează diacriticele. Include "sourceQuote" = citat verbatim din pasaj care susține răspunsul.
Răspunde DOAR cu JSON: {"questions":[{"content":"...","options":["a) ...","b) ...","c) ...","d) ..."],"correctAnswer":"a) ...","explanation":"...","sourceQuote":"..."}]}
PASAJ:
${passage.substring(0, 8000)}`;

async function genFrom(passage) {
  const raw = (await callTextAI(PROMPT(passage))).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let parsed;
  try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw); } catch { return []; }
  const arr = Array.isArray(parsed) ? parsed : parsed.questions || [];
  return arr.filter((q) => q.content && q.correctAnswer && Array.isArray(q.options));
}

async function main() {
  let domain = await prisma.domain.findUnique({ where: { slug: SLUG } });
  if (!domain) {
    domain = await prisma.domain.create({
      data: { name: "Licență — Rareș", slug: SLUG, description: "Grile din lucrarea de licență.", icon: "🎓", isActive: true },
    });
  }
  const student = await prisma.user.findUnique({ where: { email: STUDENT_EMAIL }, select: { id: true } });
  if (student) {
    await prisma.enrollment.upsert({
      where: { userId_domainId: { userId: student.id, domainId: domain.id } },
      create: { userId: student.id, domainId: domain.id, roles: ["STUDENT"], isActive: true },
      update: { isActive: true },
    });
    // Guardians as WATCHER so the domain shows in their Watcher + reminder picker.
    const guardians = await prisma.guardian.findMany({ where: { childId: student.id, status: "active" }, select: { parentId: true } });
    for (const g of guardians) {
      await prisma.enrollment.upsert({
        where: { userId_domainId: { userId: g.parentId, domainId: domain.id } },
        create: { userId: g.parentId, domainId: domain.id, roles: ["WATCHER"], isActive: true },
        update: { isActive: true },
      });
    }
  }
  console.log("domain", domain.id, "student", student?.id ?? "MISSING");

  const text = clean(await extractPdf(filePath));
  const chunks = chunk(text);
  console.log("chars", text.length, "chunks", chunks.length);

  const del = await prisma.question.deleteMany({ where: { domainId: domain.id, sourceReference: { startsWith: MARK } } });
  console.log("cleared", del.count);

  let order = 0, made = 0;
  for (let i = 0; i < chunks.length; i++) {
    let qs = [];
    try { qs = await genFrom(chunks[i]); } catch (e) { console.error("chunk", i, "fail", e.message); }
    if (qs.length === 0) continue;
    await prisma.question.createMany({
      data: qs.map((q) => ({
        domainId: domain.id,
        subject: "Licență",
        topic: `Secțiunea ${i + 1}`,
        difficulty: 3,
        type: "MULTIPLE_CHOICE",
        content: String(q.content),
        options: q.options,
        correctAnswer: String(q.correctAnswer),
        explanation: q.explanation ? String(q.explanation) : null,
        sourceReference: q.sourceQuote ? `${MARK}: "${String(q.sourceQuote).substring(0, 400)}"` : MARK,
        source: "MANUAL",
        status: "PUBLISHED",
        bookOrder: order++,
      })),
    });
    made += qs.length;
    console.log(`chunk ${i + 1}/${chunks.length} → +${qs.length} (total ${made})`);
  }
  console.log("DONE: created", made, "questions in", SLUG);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
