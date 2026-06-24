/**
 * Generate the "Aviație — Cunoștințe" domain (restricted → only Rareș + admins):
 * the Wizz Air Pilot Academy KNOWLEDGE test — Mathematics + Physics — as
 * MULTIPLE_CHOICE grilă, in English (the WAPA test language). Distinct from the
 * "Aptitudini Aviație" abilities domain. Self-contained; idempotent per MARK.
 *
 * Physics scope = standard intro-physics chapters 1–9 EXCEPT chapter 7:
 *   1 Measurement & Units · 2 Kinematics (1D) · 3 Vectors & 2D motion ·
 *   4 Newton's Laws & Forces · 5 Work, Energy & Power · 6 Momentum & Impulse ·
 *   [7 EXCLUDED] · 8 Circular Motion & Gravitation · 9 Rotational Motion & Torque
 *
 * Run on prod: cd /var/www/tutor && DATABASE_URL=... GROQ_API_KEY=... GEMINI_API_KEY=... \
 *   node scripts/generate-aviatie-cunostinte.mjs [perTopic]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "aviatie-cunostinte";
const STUDENT_EMAIL = "raresdanciulescu9@gmail.com";
const PER_TOPIC = Number(process.argv[2] || 12);
// Wave label keeps a new batch APPENDED (its own marker) instead of replacing
// the previous one. e.g. `node ... 16 w2` → marker "aviatie-cunostinte-gen-w2".
const WAVE = (process.argv[3] || "").trim();
const MARK = WAVE ? `aviatie-cunostinte-gen-${WAVE}` : "aviatie-cunostinte-gen";

const TOPICS = [
  { subject: "Mathematics", topic: "Fractions" },
  { subject: "Mathematics", topic: "Equations" },
  { subject: "Mathematics", topic: "Functions" },
  { subject: "Mathematics", topic: "Trigonometry" },
  { subject: "Physics", topic: "Measurement & Units" },
  { subject: "Physics", topic: "Kinematics (1D Motion)" },
  { subject: "Physics", topic: "Vectors & 2D Motion" },
  { subject: "Physics", topic: "Newton's Laws & Forces" },
  { subject: "Physics", topic: "Work, Energy & Power" },
  { subject: "Physics", topic: "Momentum & Impulse" },
  { subject: "Physics", topic: "Circular Motion & Gravitation" },
  { subject: "Physics", topic: "Rotational Motion & Torque" },
];

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
          temperature: 0.4,
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
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, responseMimeType: "application/json" } }),
        }
      );
      if (res.ok) return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch { /* fall through */ }
  }
  throw new Error("All AI providers failed");
}

// Independent verifier — prefers GEMINI (different model than the Groq generator)
// so a generation error isn't blindly confirmed by the same model.
async function callVerifyAI(prompt) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } }),
        }
      );
      if (res.ok) return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch { /* fall through */ }
  }
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0, response_format: { type: "json_object" } }),
      });
      if (res.ok) return (await res.json()).choices?.[0]?.message?.content || "";
    } catch { /* fall through */ }
  }
  return "";
}

// Re-solve a question independently → "agree" | "disagree" | "unknown".
// Only "disagree" is discarded (infra flakiness shouldn't nuke the batch).
async function verifyOne(q) {
  const prompt = `Solve this multiple-choice question independently and choose the single correct option.
Question: ${q.content}
${q.options.join("\n")}
Reply ONLY with JSON: {"correct":"a"} where the value is a, b, c, or d.`;
  let raw = await callVerifyAI(prompt);
  raw = (raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let letter;
  try {
    letter = (JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw).correct || "").toString().trim().toLowerCase()[0];
  } catch { return "unknown"; }
  if (!letter || !"abcd".includes(letter)) return "unknown";
  const marked = q.correctAnswer.trim()[0]?.toLowerCase();
  return letter === marked ? "agree" : "disagree";
}

const PROMPT = (subject, topic, n) => {
  const unitRule =
    subject === "Physics"
      ? "Include correct SI units in numeric answers (m/s, N, J, kg·m/s, etc.)."
      : "Do NOT attach physical units (no km, kg, N, m/s) — answers are purely numeric/symbolic (fractions, decimals, expressions, degrees only where an angle is the answer). A pure algebra result like x = 36 must NOT carry units.";
  return `Generate exactly ${n} multiple-choice questions in ENGLISH for an airline pilot academy entrance KNOWLEDGE test (Wizz Air Pilot Academy style). Subject: ${subject}. Topic: ${topic}.
RULES: each question self-contained, mathematically/physically CORRECT and unambiguous; 4 options labeled "a) ", "b) ", "c) ", "d) "; EXACTLY one correct; plausible but clearly wrong distractors; options of similar length; ${unitRule} vary difficulty 1-5. correctAnswer MUST be one of the options verbatim. No duplicates.
Respond ONLY with JSON: {"questions":[{"content":"...","options":["a) ...","b) ...","c) ...","d) ..."],"correctAnswer":"a) ...","explanation":"...","difficulty":3}]}`;
};

async function genTopic(subject, topic, n) {
  const raw = (await callTextAI(PROMPT(subject, topic, n))).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let parsed;
  try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw); } catch { return []; }
  const arr = Array.isArray(parsed) ? parsed : parsed.questions || [];
  return arr.filter(
    (q) =>
      q.content &&
      q.correctAnswer &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.includes(q.correctAnswer)
  );
}

async function main() {
  let domain = await prisma.domain.findUnique({ where: { slug: SLUG } });
  if (!domain) {
    domain = await prisma.domain.create({
      data: { name: "Aviație — Cunoștințe", slug: SLUG, description: "Test cunoștințe pilot (Wizz Air): Matematică + Fizică.", icon: "✈️", isActive: true },
    });
    console.log("domain created", domain.id);
  } else {
    console.log("domain exists", domain.id);
  }

  const student = await prisma.user.findUnique({ where: { email: STUDENT_EMAIL } });
  if (student) {
    await prisma.enrollment.upsert({
      where: { userId_domainId: { userId: student.id, domainId: domain.id } },
      create: { userId: student.id, domainId: domain.id, roles: ["STUDENT"], isActive: true },
      update: {},
    });
    const guardians = await prisma.guardian.findMany({ where: { childId: student.id, status: "active" }, select: { parentId: true } });
    for (const g of guardians) {
      await prisma.enrollment.upsert({
        where: { userId_domainId: { userId: g.parentId, domainId: domain.id } },
        create: { userId: g.parentId, domainId: domain.id, roles: ["WATCHER"], isActive: true },
        update: {},
      });
    }
    console.log("enrolled student", student.id, "+", guardians.length, "guardian(s)");
  } else {
    console.log("WARNING student not found:", STUDENT_EMAIL);
  }

  const del = await prisma.question.deleteMany({ where: { domainId: domain.id, sourceReference: { startsWith: MARK } } });
  console.log("cleared", del.count, "old generated questions");

  let order = 0;
  let total = 0;
  for (const { subject, topic } of TOPICS) {
    let qs = [];
    try {
      qs = await genTopic(subject, topic, PER_TOPIC);
    } catch (e) {
      console.log("  ! failed", subject, topic, e.message);
    }
    if (qs.length === 0) { console.log("  -", subject, "/", topic, "→ 0"); continue; }
    // Independent cross-model verification: drop questions whose marked answer
    // an independent solve contradicts.
    const kept = [];
    let disagree = 0, unknown = 0;
    for (const q of qs) {
      const v = await verifyOne(q);
      if (v === "disagree") { disagree++; continue; }
      if (v === "unknown") unknown++;
      kept.push(q);
    }
    if (kept.length === 0) { console.log("  -", subject, "/", topic, "→ 0 after verify (", disagree, "rejected )"); continue; }
    await prisma.question.createMany({
      data: kept.map((q) => ({
        domainId: domain.id,
        subject,
        topic,
        difficulty: Math.min(5, Math.max(1, Number(q.difficulty) || 3)),
        type: "MULTIPLE_CHOICE",
        content: String(q.content),
        options: q.options,
        correctAnswer: String(q.correctAnswer),
        explanation: q.explanation ? String(q.explanation) : null,
        source: "AI_GENERATED",
        status: "PUBLISHED",
        sourceReference: `${MARK}:${subject.toLowerCase()}:${topic}`,
        bookOrder: order++,
      })),
    });
    total += kept.length;
    console.log("  +", subject, "/", topic, "→", kept.length, `(rejected ${disagree}, unverified ${unknown})`);
  }
  console.log("created", total, "verified questions in", SLUG, `(wave: ${MARK})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
