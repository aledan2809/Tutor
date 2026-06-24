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

// ── Spatial cube navigation (Rareș's rules) ──
// Move a marker across cube faces. Allowed moves depend on the current face:
//   Top/Bottom    → only up/down
//   Left/Right    → only left/right
//   Front/Back    → all four (up/down/left/right)
// Two loops: vertical F→T→K→B→F (up) and horizontal F→R→K→L→F (right).
// Start face + 6 moves are DICTATED (voice, English); the student picks the
// final face from 6 buttons.
const CUBE_FACE_RO = { T: "Sus", B: "Jos", F: "Față", K: "Spate", L: "Stânga", R: "Dreapta" };
const CUBE_FACE_EN = { T: "Top", B: "Bottom", F: "Front", K: "Back", L: "Left", R: "Right" };
const CUBE_ALLOWED = {
  T: ["up", "down"],
  B: ["up", "down"],
  L: ["left", "right"],
  R: ["left", "right"],
  F: ["up", "down", "left", "right"],
  K: ["up", "down", "left", "right"],
};
const CUBE_TRANS = {
  up: { F: "T", T: "K", K: "B", B: "F" },
  down: { F: "B", B: "K", K: "T", T: "F" },
  right: { F: "R", R: "K", K: "L", L: "F" },
  left: { F: "L", L: "K", K: "R", R: "F" },
};
function genCube() {
  const faces = ["T", "B", "F", "K", "L", "R"];
  const start = faces[rand(0, 5)];
  let cur = start;
  const moves = [];
  for (let i = 0; i < 6; i++) {
    const opts = CUBE_ALLOWED[cur];
    const m = opts[rand(0, opts.length - 1)];
    moves.push(m);
    cur = CUBE_TRANS[m][cur];
  }
  const correct = CUBE_FACE_RO[cur];
  return {
    content:
      "Ascultă: pornești de pe o față dictată și urmează 6 mișcări dictate (sus/jos/stânga/dreapta). " +
      "Pe ce față ești la final? Apasă 🔊 pentru a reasculta.",
    // Voice-only payload (start + moves) — read aloud, never shown.
    passage: `[CUBEVOICE] start=${CUBE_FACE_EN[start]}; moves=${moves.join(",")}`,
    options: shuffle(Object.values(CUBE_FACE_RO)),
    correctAnswer: correct,
    difficulty: 4,
    subject: "Raționament spațial",
    topic: "Rotație cub (voce)",
  };
}

// ── Working memory: a robot DICTATES 7 two-digit numbers (English), nothing is
//    shown; the student types them back IN ORDER. ──
function genMemory() {
  const nums = Array.from({ length: 7 }, () => rand(10, 99));
  const seq = nums.join(" ");
  return {
    type: "OPEN",
    content:
      "Ascultă cele 7 numere dictate (în engleză), apoi introdu-le în ORDINE. Nu sunt afișate — apasă 🔊 pentru a reasculta.",
    // Voice-only payload — read aloud (English), never shown.
    passage: `[AUDIODICT:en] ${seq}`,
    options: null,
    correctAnswer: seq, // "14 83 27 ..." — graded as normalized exact match
    difficulty: 4,
    subject: "Memorie de lucru",
    topic: "Memorare numere (audio)",
  };
}

// ── Clock reading: an analog clock shows a random time (5-min steps); the
//    student reads it and enters HH:MM (12h). ──
function genClock() {
  const h = rand(1, 12);
  const m = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][rand(0, 11)];
  const ans = `${h}:${String(m).padStart(2, "0")}`;
  return {
    type: "OPEN",
    content: "Citește ceasul analog și introdu ora afișată (format de 12 ore).",
    passage: `[CLOCK] ${ans}`,
    options: null,
    correctAnswer: ans, // "3:25"
    difficulty: 2,
    subject: "Citire ceas",
    topic: "Ceas analog",
  };
}

// ── Instrument monitoring: scan dials, spot the one out of limits ──
function genMonitoring() {
  const instruments = [
    { name: "Altitudine", unit: "ft", min: 2800, max: 3500 },
    { name: "Viteză", unit: "kt", min: 250, max: 320 },
    { name: "Combustibil", unit: "%", min: 20, max: 100 },
    { name: "Temperatură motor", unit: "°C", min: 600, max: 900 },
    { name: "Presiune ulei", unit: "psi", min: 40, max: 80 },
    { name: "Turații (RPM)", unit: "%", min: 60, max: 100 },
  ];
  const chosen = shuffle(instruments).slice(0, 4);
  const outIdx = rand(0, 3);
  const lines = chosen.map((ins, i) => {
    const val =
      i === outIdx
        ? rand(0, 1)
          ? ins.min - rand(5, 40)
          : ins.max + rand(5, 40)
        : rand(ins.min, ins.max);
    return `• ${ins.name}: ${val} ${ins.unit} (normal ${ins.min}–${ins.max})`;
  });
  return {
    content: `Verifică instrumentele. Care este ÎN AFARA limitelor normale?\n${lines.join("\n")}`,
    options: shuffle(chosen.map((c) => c.name)),
    correctAnswer: chosen[outIdx].name,
    difficulty: 3,
    subject: "Monitorizare instrumente",
    topic: "Scanare cadrane",
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
  for (let i = 0; i < 70; i++) rows.push({ ...genMonitoring(), ref: `${MARK}:monitoring` });
  for (let i = 0; i < 70; i++) rows.push({ ...genClock(), ref: `${MARK}:clock` });

  await prisma.question.createMany({
    data: rows.map((r, idx) => ({
      domainId: domain.id,
      subject: r.subject,
      topic: r.topic,
      difficulty: r.difficulty,
      type: r.type ?? "MULTIPLE_CHOICE",
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
