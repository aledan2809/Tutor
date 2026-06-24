/**
 * Retroactive quality verification for Rareș's content, module-appropriate:
 *
 *  - aviatie-cunostinte (LLM-generated knowledge) → AI cross-model re-solve.
 *  - licenta-rares (LLM-generated from thesis) → AI check grounded on the stored
 *    explanation (the source passage isn't stored, so this verifies the answer is
 *    consistent with its own justification — internal consistency).
 *  - aptitudini-aviatie (DETERMINISTIC generators) → CODE checks, NOT AI:
 *      cube re-derived from [CUBEVOICE]; clock/memory vs their stimulus;
 *      arithmetic re-evaluated; monitoring structural. (AI is unreliable on the
 *      spatial cube and would falsely reject correct answers.)
 *
 * Failures are set to status=DRAFT (hidden from practice, fully reversible) — not
 * deleted. Run on prod: cd /var/www/tutor && DATABASE_URL=.. GROQ_API_KEY=.. GEMINI_API_KEY=.. \
 *   node scripts/verify-rares-content.mjs
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const AI_CONCURRENCY = 5;

// ── independent AI solver (Gemini-first → different model than the Groq generator) ──
async function callVerifyAI(prompt) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } }) }
      );
      if (res.ok) return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch { /* fall through */ }
  }
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0, response_format: { type: "json_object" } }),
      });
      if (res.ok) return (await res.json()).choices?.[0]?.message?.content || "";
    } catch { /* fall through */ }
  }
  return "";
}

function parseLetter(raw) {
  raw = (raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    const l = (JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw).correct || "").toString().trim().toLowerCase()[0];
    return l && "abcd".includes(l) ? l : null;
  } catch { return null; }
}

// classify → "agree" | "disagree" | "unknown"
async function aiVerify(q, { grounded } = {}) {
  const opts = Array.isArray(q.options) ? q.options : [];
  if (opts.length < 2) return "unknown";
  const ground = grounded && q.explanation ? `\nSupporting note from the source: ${q.explanation}\nUsing this note, ` : "\n";
  const prompt = `Solve this multiple-choice question independently and choose the single correct option.${ground}Question: ${q.content}
${opts.join("\n")}
Reply ONLY with JSON: {"correct":"a"} where the value is a, b, c, or d.`;
  const letter = parseLetter(await callVerifyAI(prompt));
  if (!letter) return "unknown";
  const marked = String(q.correctAnswer).trim()[0]?.toLowerCase();
  return letter === marked ? "agree" : "disagree";
}

async function pool(items, fn, concurrency = AI_CONCURRENCY) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    })
  );
  return out;
}

// ── deterministic cube model (must mirror seed-aptitudini.mjs genCube) ──
const FACE_RO = { T: "Sus", B: "Jos", F: "Față", K: "Spate", L: "Stânga", R: "Dreapta" };
const EN_TO_INT = { Top: "T", Bottom: "B", Front: "F", Back: "K", Left: "L", Right: "R" };
const TRANS = {
  up: { F: "T", T: "K", K: "B", B: "F" },
  down: { F: "B", B: "K", K: "T", T: "F" },
  right: { F: "R", R: "K", K: "L", L: "F" },
  left: { F: "L", L: "K", K: "R", R: "F" },
};
function checkCube(q) {
  const m = (q.passage || "").match(/^\[CUBEVOICE\]\s*start=([^;]+);\s*moves=([a-zA-Z,]+)/);
  if (!m) return "skip";
  let cur = EN_TO_INT[m[1].trim()];
  if (!cur) return "bad";
  for (const mv of m[2].split(",").map((s) => s.trim()).filter(Boolean)) {
    cur = TRANS[mv]?.[cur];
    if (!cur) return "bad";
  }
  const opts = Array.isArray(q.options) ? q.options : [];
  return FACE_RO[cur] === String(q.correctAnswer) && opts.includes(FACE_RO[cur]) ? "ok" : "bad";
}
function checkClock(q) {
  const m = (q.passage || "").match(/^\[CLOCK\]\s*(\d{1,2}:\d{2})/);
  if (!m) return "skip";
  return m[1] === String(q.correctAnswer).trim() ? "ok" : "bad";
}
function checkMemory(q) {
  const m = (q.passage || "").match(/^\[AUDIODICT:\w+\]\s*([\s\S]+)$/);
  if (!m) return "skip";
  const norm = (s) => s.trim().replace(/\s+/g, " ");
  return norm(m[1]) === norm(String(q.correctAnswer)) ? "ok" : "bad";
}
function checkArithmetic(q) {
  const m = String(q.content).match(/^\s*(\d+)\s*([+\-−×*])\s*(\d+)\s*=\s*\?/);
  if (!m) return "skip"; // word problems / percentages — deterministic by construction
  const a = Number(m[1]), b = Number(m[3]);
  const val = m[2] === "+" ? a + b : m[2] === "×" || m[2] === "*" ? a * b : a - b;
  return String(val) === String(q.correctAnswer).trim() ? "ok" : "bad";
}
function checkStructural(q) {
  const opts = Array.isArray(q.options) ? q.options : [];
  return opts.length >= 2 && opts.includes(String(q.correctAnswer)) ? "ok" : "bad";
}

async function draft(ids) {
  if (ids.length === 0) return 0;
  const r = await prisma.question.updateMany({ where: { id: { in: ids } }, data: { status: "DRAFT" } });
  return r.count;
}

async function verifyAIDomain(slug, grounded) {
  const domain = await prisma.domain.findUnique({ where: { slug } });
  if (!domain) { console.log(`! ${slug}: domain not found`); return; }
  const qs = await prisma.question.findMany({ where: { domainId: domain.id, status: "PUBLISHED", type: "MULTIPLE_CHOICE" } });
  console.log(`\n[${slug}] AI verify ${qs.length} MC questions (grounded=${!!grounded})…`);
  const verdicts = await pool(qs, (q) => aiVerify(q, { grounded }));
  const bad = qs.filter((_, i) => verdicts[i] === "disagree").map((q) => q.id);
  const unknown = verdicts.filter((v) => v === "unknown").length;
  const n = await draft(bad);
  console.log(`  agree=${verdicts.filter((v) => v === "agree").length} · disagree(drafted)=${n} · unverified=${unknown}`);
}

async function verifyAbilitati() {
  const domain = await prisma.domain.findUnique({ where: { slug: "aptitudini-aviatie" } });
  if (!domain) { console.log("! aptitudini-aviatie: domain not found"); return; }
  const qs = await prisma.question.findMany({ where: { domainId: domain.id, status: "PUBLISHED" } });
  console.log(`\n[aptitudini-aviatie] CODE verify ${qs.length} deterministic questions…`);
  const tally = {};
  const bad = [];
  for (const q of qs) {
    const t = q.topic;
    let res;
    if (t.startsWith("Rotație cub")) res = checkCube(q);
    else if (t.startsWith("Ceas")) res = checkClock(q);
    else if (t.startsWith("Memorare")) res = checkMemory(q);
    else if (t.startsWith("Calcul")) res = checkArithmetic(q);
    else res = checkStructural(q); // monitoring
    tally[t] = tally[t] || { ok: 0, bad: 0, skip: 0 };
    tally[t][res] = (tally[t][res] || 0) + 1;
    if (res === "bad") bad.push(q.id);
  }
  for (const [t, c] of Object.entries(tally)) console.log(`  ${t}: ok=${c.ok || 0} bad=${c.bad || 0} skip=${c.skip || 0}`);
  const n = await draft(bad);
  console.log(`  drafted (bad)=${n}`);
}

async function main() {
  await verifyAbilitati();
  await verifyAIDomain("aviatie-cunostinte", false);
  await verifyAIDomain("licenta-rares", true);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
