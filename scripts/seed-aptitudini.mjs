/**
 * Seed the private "Aptitudini Aviație" domain (restricted → only Rareș + admins,
 * since the slug doesn't classify to a curriculum level) and generate a pool of
 * pilot-aptitude exercises as MULTIPLE_CHOICE questions, so they run on the
 * existing practice engine. Idempotent: clears its own generated rows first.
 *
 * Run on prod:  cd /var/www/tutor && DATABASE_URL=... node scripts/seed-aptitudini.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "aptitudini-aviatie";
const STUDENT_EMAIL = "raresdanciulescu9@gmail.com";
const MARK = "aptitudini-gen";

const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const shuffle = (a) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

// ── Arithmetic (rapid mental math: +, −, ×, speed/distance/time) ──
function genArithmetic() {
  const builders = [
    () => { const a = rand(11, 99), b = rand(11, 99); return [`${a} + ${b}`, a + b]; },
    () => { const a = rand(30, 99), b = rand(10, a); return [`${a} − ${b}`, a - b]; },
    () => { const a = rand(3, 19), b = rand(3, 12); return [`${a} × ${b}`, a * b]; },
    () => { const v = rand(60, 180), t = [0.5, 1, 1.5, 2][rand(0, 3)]; return [`Un avion zboară cu ${v} km/h. Distanța în ${t} h?`, v * t]; },
    () => { const p = rand(2, 40), base = rand(50, 400); return [`${p}% din ${base}`, Math.round((p / 100) * base)]; },
  ];
  const [q, ans] = builders[rand(0, builders.length - 1)]();
  const correct = String(ans);
  const opts = new Set([correct]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 50) {
    const d = ans + (rand(-9, 9) || 1);
    if (d >= 0) opts.add(String(d));
  }
  return {
    content: `${q} = ?`,
    options: shuffle([...opts]),
    correctAnswer: correct,
    difficulty: 2,
    subject: "Aritmetică mentală",
    topic: "Calcul rapid",
  };
}

// ── Spatial cube rotation ──
function roll(s, dir) {
  switch (dir) {
    case "jos": return { U: s.S, N: s.U, D: s.N, S: s.D, E: s.E, W: s.W };
    case "sus": return { U: s.N, S: s.U, D: s.S, N: s.D, E: s.E, W: s.W };
    case "dreapta": return { U: s.W, E: s.U, D: s.E, W: s.D, N: s.N, S: s.S };
    case "stânga": return { U: s.E, W: s.U, D: s.W, E: s.D, N: s.N, S: s.S };
    default: return s;
  }
}
function genCube() {
  let st = { U: "A", D: "B", N: "C", S: "D", E: "E", W: "F" };
  const order = shuffle(["jos", "sus", "stânga", "dreapta"]).slice(0, rand(2, 4));
  const parts = [];
  for (const d of order) {
    const n = rand(1, 3);
    parts.push(`${n}× ${d}`);
    for (let i = 0; i < n; i++) st = roll(st, d);
  }
  const correct = st.U;
  const faces = ["A", "B", "C", "D", "E", "F"];
  const opts = new Set([correct]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 50) opts.add(faces[rand(0, 5)]);
  return {
    content:
      `Un cub stă pe masă: A (sus), B (jos), C (față, spre tine), D (spate), E (dreapta), F (stânga). ` +
      `Îl rostogolești pe masă în direcția indicată (ex. „jos" = se rostogolește spre tine, fața de sus ajunge în față). ` +
      `Pornind cu A sus, execută ÎN ORDINE: ${parts.join(", ")}. Ce față este sus la final?`,
    options: shuffle([...opts]),
    correctAnswer: correct,
    difficulty: 4,
    subject: "Raționament spațial",
    topic: "Rotație cub",
  };
}

// ── Working memory: show 10 numbers, then pick the 7-set fully among them ──
function genMemory() {
  const pool = shuffle(Array.from({ length: 90 }, (_, i) => i + 10)); // 10..99
  const shown = pool.slice(0, 10);
  const outsiders = pool.slice(10);
  const fmt = (arr) => [...arr].sort((a, b) => a - b).join(", ");
  const correctStr = fmt(shuffle(shown).slice(0, 7));
  const mkDistractor = () => fmt([...shuffle(shown).slice(0, 5), ...shuffle(outsiders).slice(0, 2)]);
  const opts = new Set([correctStr]);
  let guard = 0;
  while (opts.size < 3 && guard++ < 40) {
    const d = mkDistractor();
    if (d !== correctStr) opts.add(d);
  }
  return {
    content: "Care set de 7 numere conține DOAR numere care au fost afișate?",
    passage: `[MEMORIE:10] ${shown.join("    ")}`,
    options: shuffle([...opts]),
    correctAnswer: correctStr,
    difficulty: 3,
    subject: "Memorie de lucru",
    topic: "Memorare numere",
  };
}

async function main() {
  let domain = await prisma.domain.findUnique({ where: { slug: SLUG } });
  if (!domain) {
    domain = await prisma.domain.create({
      data: {
        name: "Aptitudini Aviație",
        slug: SLUG,
        description: "Exerciții de gândire rapidă, aritmetică, memorie și raționament spațial (stil teste de selecție piloți).",
        icon: "✈️",
        isActive: true,
      },
    });
    console.log("domain created", domain.id);
  } else {
    console.log("domain exists", domain.id);
  }

  const student = await prisma.user.findUnique({ where: { email: STUDENT_EMAIL }, select: { id: true } });
  if (student) {
    await prisma.enrollment.upsert({
      where: { userId_domainId: { userId: student.id, domainId: domain.id } },
      create: { userId: student.id, domainId: domain.id, roles: ["STUDENT"], isActive: true },
      update: { isActive: true },
    });
    console.log("enrolled student", student.id);

    // Enroll the child's guardians as WATCHER so the domain shows up for them
    // (the Watcher only lists domains the watcher is enrolled in) — needed for
    // the per-reminder domain picker to offer "Aptitudini Aviație".
    const guardians = await prisma.guardian.findMany({
      where: { childId: student.id, status: "active" },
      select: { parentId: true },
    });
    for (const g of guardians) {
      await prisma.enrollment.upsert({
        where: { userId_domainId: { userId: g.parentId, domainId: domain.id } },
        create: { userId: g.parentId, domainId: domain.id, roles: ["WATCHER"], isActive: true },
        update: { isActive: true },
      });
    }
    console.log("enrolled", guardians.length, "guardian(s) as WATCHER");
  } else {
    console.log("WARN: student not found:", STUDENT_EMAIL);
  }

  // Idempotent: drop previously generated rows for this domain.
  const del = await prisma.question.deleteMany({
    where: { domainId: domain.id, sourceReference: { startsWith: MARK } },
  });
  console.log("cleared", del.count, "old generated questions");

  const rows = [];
  for (let i = 0; i < 140; i++) rows.push({ ...genArithmetic(), ref: `${MARK}:arithmetic` });
  for (let i = 0; i < 90; i++) rows.push({ ...genCube(), ref: `${MARK}:cube` });
  for (let i = 0; i < 70; i++) rows.push({ ...genMemory(), ref: `${MARK}:memory` });

  await prisma.question.createMany({
    data: rows.map((r, idx) => ({
      domainId: domain.id,
      subject: r.subject,
      topic: r.topic,
      difficulty: r.difficulty,
      type: "MULTIPLE_CHOICE",
      content: r.content,
      options: r.options,
      correctAnswer: r.correctAnswer,
      passage: r.passage ?? null,
      source: "MANUAL",
      status: "PUBLISHED",
      sourceReference: r.ref,
      bookOrder: idx,
    })),
  });
  console.log("created", rows.length, "questions in", SLUG);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
