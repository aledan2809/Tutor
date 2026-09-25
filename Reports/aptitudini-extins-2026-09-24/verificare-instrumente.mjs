// Etapa 2: busola și orizontul artificial, văzute de elev în browser (stiva QA locală :3113).
// O materie de test cu 4 exerciții cunoscute; se capturează fiecare desen, iar orientarea se verifică
// din SVG-ul randat (unde e reperul, încotro urcă orizontul).
//   cd /Users/danciulescu/Projects/REAL && node /Users/danciulescu/Projects/Tutor/Reports/aptitudini-extins-2026-09-24/verificare-instrumente.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const BASE = "http://localhost:3113";
const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/aptitudini-extins-2026-09-24/capturi";
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const TAG = "qa-instr";
const PASS = "parola-instr-1234";
const results = [];
const check = (n, ok, d = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`);
};
async function wipe() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}-` } } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}

const ITEMS = [
  { passage: "[HEADING] 90", topic: "Busolă (indicator de direcție)", options: ["090°", "270°", "080°", "100°", "095°"], correct: "090°", content: "Ce direcție (cap) arată indicatorul?" },
  { passage: "[HEADING] 225", topic: "Busolă (indicator de direcție)", options: ["225°", "045°", "135°", "215°", "235°"], correct: "225°", content: "Ce direcție (cap) arată indicatorul?" },
  { passage: "[ATTITUDE] bank=30;pitch=10", topic: "Orizont artificial", options: ["înclinat 30° la dreapta, bot 10° sus", "înclinat 30° la stânga, bot 10° sus", "înclinat 30° la dreapta, bot 10° jos", "înclinat 30° la stânga, bot 10° jos", "înclinat 45° la dreapta, bot 10° sus"], correct: "înclinat 30° la dreapta, bot 10° sus", content: "Ce face avionul, după orizontul artificial?" },
  { passage: "[ATTITUDE] bank=-20;pitch=-5", topic: "Orizont artificial", options: ["înclinat 20° la stânga, bot 5° jos", "înclinat 20° la dreapta, bot 5° jos", "înclinat 20° la stânga, bot 5° sus", "înclinat 20° la dreapta, bot 5° sus", "înclinat 30° la stânga, bot 5° jos"], correct: "înclinat 20° la stânga, bot 5° jos", content: "Ce face avionul, după orizontul artificial?" },
];

let browser;
try {
  await wipe();
  const s = Date.now();
  const user = await prisma.user.create({ data: { email: `${TAG}-elev-${s}@demo.tutor.app`, name: "Elev QA", password: await bcrypt.hash(PASS, 10), freeForever: true, accountRole: "STUDENT" } });
  const domain = await prisma.domain.create({ data: { name: `Instrumente QA ${s}`, slug: `${TAG}-${s}`, isActive: true } });
  await prisma.enrollment.create({ data: { userId: user.id, domainId: domain.id, roles: ["STUDENT"], isActive: true } });
  await prisma.question.createMany({
    data: ITEMS.map((it) => ({ domainId: domain.id, subject: "Orientare spațială", topic: it.topic, content: it.content, options: it.options, correctAnswer: it.correct, passage: it.passage, status: "PUBLISHED" })),
  });

  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  const answers = [];
  page.on("response", async (r) => {
    if (r.url().includes("/session/answer")) answers.push(`${r.status()} ${(await r.text().catch(() => "")).slice(0, 120)}`);
  });
  await page.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  // On a phone the cookie banner sits over the bottom buttons (Trimite răspunsul) — accept it first.
  await page.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await page.fill("#email", user.email);
  await page.fill("#password", PASS);
  await Promise.all([page.waitForLoadState("networkidle"), page.click('form button[type="submit"]')]);
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/ro/dashboard/practice?start=quick&domain=${domain.slug}`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 20000 }).catch(() => {});
  check("sesiunea pornește", /\/dashboard\/practice\/[^/?]+$/.test(page.url()), page.url());

  const seen = new Set();
  for (let step = 0; step < 4; step++) {
    await page.waitForTimeout(1500);
    const svg = page.locator('svg[aria-label="Indicator de direcție (busolă)"], svg[aria-label="Orizont artificial"]').first();
    const has = (await svg.count()) > 0;
    const label = has ? await svg.getAttribute("aria-label") : "";
    const main = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    const item = ITEMS.find((it) => it.options.every((o) => main.includes(o)));
    check(`întrebarea ${step + 1}: desenul apare`, has && !!item, `${label} · ${item?.passage ?? "?"}`);
    if (has && item) {
      seen.add(item.passage);
      await svg.screenshot({ path: `${SHOTS}/instrument-${item.passage.replace(/[^a-z0-9-]+/gi, "_")}.png` });
      // Orientation from the rendered SVG: the horizon group's rotation and the card's rotation.
      const transforms = await svg.locator("g[transform]").evaluateAll((gs) => gs.map((g) => g.getAttribute("transform")));
      if (item.passage.startsWith("[HEADING]")) {
        const h = Number(item.passage.match(/\d+/)[0]);
        check(`   cardul e rotit cu −${h}° (valoarea ${h}° ajunge sub reper)`, transforms.some((t) => t.startsWith(`rotate(${-h} `)), transforms[0]);
      } else {
        const [, bank, pitch] = item.passage.match(/bank=(-?\d+);pitch=(-?\d+)/).map(Number);
        check(`   orizontul: rotire −bank (${-bank}°) și coborâre cu botul sus (${pitch * 3}px)`, transforms.some((t) => t === `rotate(${-bank} 110 110) translate(0 ${pitch * 3})`), transforms.join(" | "));
      }
      // Answer so the next question appears.
      const opt = page.locator("button", { hasText: item.correct }).first();
      await opt.click({ timeout: 5000 }).catch((e) => console.log("   (clic variantă:", String(e).slice(0, 120), ")"));
      await page.waitForTimeout(600);
      // Some sessions answer on tap; others need „Trimite răspunsul” after picking.
      const submit = page.locator("button", { hasText: "Trimite răspunsul" }).first();
      if (await submit.count()) await submit.click().catch(() => {});
      await page.waitForTimeout(1500);
      const next = page.locator("button", { hasText: /Următoarea întrebare|Vezi rezultatele|Termină/ }).first();
      if (await next.count()) await next.click().catch(() => {});
      else console.log("   (fără buton „următoarea”; pe ecran:", (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 160), ")");
    }
  }
  console.log("   răspunsuri server:", answers.join(" || "));
  check("toate cele 4 exerciții au fost văzute", seen.size === 4, [...seen].join(", "));
  check("fără erori în pagină", errs.length === 0, errs.join(" | "));
} catch (e) {
  console.error(e);
  results.push(false);
} finally {
  await browser?.close();
  await wipe();
  await prisma.$disconnect();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} ${ok === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(ok === results.length ? 0 : 1);
}
