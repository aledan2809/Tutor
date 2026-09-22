// Checks the trail a code leaves, end to end, on the local QA stack (production build on :3113 +
// docker QA database) — never production. Real browser, real sessions.
//
//   cd /Users/danciulescu/Projects/REAL && node <this file>
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const DB = "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa";
const BASE = "http://localhost:3113";
const prisma = new PrismaClient({ datasources: { db: { url: DB } } });
const tag = `qa-trace-${Date.now()}`;
const PASSWORD = "parola-qa-1234";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

const mkUser = async (key, data = {}) =>
  prisma.user.create({
    data: {
      email: `${tag}-${key}@demo.tutor.app`,
      name: data.name ?? key,
      password: await bcrypt.hash(PASSWORD, 10),
      emailVerified: new Date(),
      ...data,
    },
  });

async function login(ctx, email) {
  const csrf = await (await ctx.request.get(`${BASE}/api/auth/csrf`)).json();
  await ctx.request.post(`${BASE}/api/auth/callback/credentials`, {
    form: { csrfToken: csrf.csrfToken, email, password: PASSWORD, callbackUrl: `${BASE}/ro/dashboard` },
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  return (await ctx.cookies()).some((c) => c.name.includes("session-token"));
}

async function api(ctx, method, url, body) {
  const res = await ctx.request.fetch(`${BASE}${url}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    data: body ? JSON.stringify(body) : undefined,
    failOnStatusCode: false,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status(), body: json };
}

const text = async (page, url) => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForLoadState("load", { timeout: 120000 });
  return page.locator("body").innerText();
};

const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/trasabilitate-coduri-2026-09-22/capturi";
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
try {
  const admin = await mkUser("admin", { name: "Admin QA", isSuperAdmin: true });
  const learner = await mkUser("elev", { name: "Elev Cod", accountRole: "STUDENT" });
  const payer = await mkUser("platitor", {
    name: "Părinte Card",
    accountRole: "PARENT",
    subscriptionStatus: "active",
    stripeSubscriptionId: `sub_${tag}`,
  });
  const keeper = await mkUser("pastreaza", { name: "Părinte Cod Păstrat", accountRole: "PARENT" });
  const domain = await prisma.domain.create({
    data: { name: `QA trasabilitate ${tag}`, slug: `${tag}-mate`, visibility: "PUBLIC", isActive: true },
  });
  const free = await prisma.voucher.create({
    data: { code: `TRACE${tag.slice(-6).toUpperCase()}`, discountPercent: 100, oncePerUser: true, createdById: admin.id },
  });
  const partial = await prisma.voucher.create({
    data: {
      code: `PART${tag.slice(-6).toUpperCase()}`,
      discountPercent: 25,
      createdById: admin.id,
      expiresAt: new Date("2026-11-30T21:59:59.000Z"),
    },
  });
  await prisma.user.update({ where: { id: keeper.id }, data: { pendingVoucherCode: partial.code } });
  // A code used at a card payment (the Stripe path writes the session on the row).
  await prisma.voucherRedemption.create({ data: { voucherId: partial.id, userId: payer.id, sessionId: `cs_${tag}` } });

  // ── The learner activates a 100% code ────────────────────────────────────────────────────────────
  const learnerCtx = await browser.newContext();
  check("elevul se autentifică", await login(learnerCtx, learner.email));
  const act = await api(learnerCtx, "POST", "/api/activate", { voucherCode: free.code, domainSlugs: [domain.slug] });
  const redemption = await prisma.voucherRedemption.findUnique({
    where: { voucherId_userId: { voucherId: free.id, userId: learner.id } },
  });
  const after = await prisma.user.findUnique({ where: { id: learner.id } });
  const months = after?.subscriptionEndsAt ? (after.subscriptionEndsAt.getTime() - Date.now()) / (30 * 864e5) : 0;
  check(
    "folosirea codului lasă urmă: cine, ce cod, când",
    act.status === 200 && redemption !== null && after?.subscriptionStatus === "active" && months > 11.5 && months < 12.5,
    JSON.stringify({ status: act.status, urma: redemption !== null, luni: Math.round(months) }),
  );
  const again = await api(learnerCtx, "POST", "/api/activate", { voucherCode: free.code, domainSlugs: [domain.slug] });
  const uses = (await prisma.voucher.findUnique({ where: { id: free.id } }))?.usedCount;
  check(
    "un cod „o singură dată pe cont” nu se mai poate folosi a doua oară",
    again.status === 400 && String(again.body?.error).includes("deja folosit") && uses === 1,
    JSON.stringify({ status: again.status, error: again.body?.error, folosiri: uses }),
  );
  await learnerCtx.close();

  // ── The administrator sees it ────────────────────────────────────────────────────────────────────
  const adminCtx = await browser.newContext();
  check("administratorul se autentifică", await login(adminCtx, admin.email));
  const found = await api(adminCtx, "GET", `/api/admin/users?search=${encodeURIComponent(free.code)}`);
  const row = (found.body?.users ?? []).find((u) => u.id === learner.id);
  check(
    "căutarea după cod găsește contul care l-a folosit",
    found.status === 200 && found.body?.users?.length === 1 && row?.voucherUsed?.code === free.code && row?.paysByCard === false,
    JSON.stringify({ total: found.body?.total, cod: row?.voucherUsed?.code, card: row?.paysByCard }),
  );
  const list = await api(adminCtx, "GET", `/api/admin/users?search=${encodeURIComponent(tag)}&limit=20`);
  const byId = Object.fromEntries((list.body?.users ?? []).map((u) => [u.id, u]));
  check(
    "contul plătit cu cardul e marcat ca atare, cu codul de la plată",
    byId[payer.id]?.paysByCard === true && byId[payer.id]?.voucherUsed?.code === partial.code,
    JSON.stringify({ card: byId[payer.id]?.paysByCard, cod: byId[payer.id]?.voucherUsed?.code }),
  );
  check(
    "codul păstrat, nefolosit, apare cu valabilitatea lui",
    byId[keeper.id]?.voucherKept?.code === partial.code && byId[keeper.id]?.voucherKept?.expiresAt !== null && byId[keeper.id]?.voucherUsed === null,
    JSON.stringify(byId[keeper.id]?.voucherKept),
  );

  const page = await adminCtx.newPage();
  await page.goto(`${BASE}/ro/dashboard/admin/superadmin/users`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByPlaceholder("Caută după nume, email sau cod").fill(free.code);
  await page.keyboard.press("Enter");
  await page.getByText("Cod gratuit").first().waitFor({ timeout: 60000 }).catch(() => {});
  const t1 = await page.locator("body").innerText();
  check(
    "în listă scrie „Cod gratuit · până la …”, nu „Plătit”",
    t1.includes("Cod gratuit · până la") && t1.includes(`Cod: ${free.code}`) && t1.includes("folosit pe") && !t1.includes("Plătit cu cardul"),
    t1.split("\n").filter((l) => l.includes("Cod")).slice(0, 4).join(" | "),
  );
  await page.screenshot({ path: `${SHOTS}/utilizatori-cod-gratuit.png`, fullPage: true });
  await page.getByPlaceholder("Caută după nume, email sau cod").fill(payer.email);
  await page.keyboard.press("Enter");
  await page.getByText("Plătit cu cardul").first().waitFor({ timeout: 60000 }).catch(() => {});
  const t2 = await page.locator("body").innerText();
  check(
    "pentru cel cu card: „Plătit cu cardul” și codul de la plată",
    t2.includes("Plătit cu cardul") && t2.includes(`Cod la plată: ${partial.code}`) && !t2.includes("Cod gratuit"),
    t2.split("\n").filter((l) => l.includes("Cod") || l.includes("Plătit")).slice(0, 4).join(" | "),
  );

  await page.screenshot({ path: `${SHOTS}/utilizatori-plata-card.png`, fullPage: true });

  const who = await api(adminCtx, "GET", `/api/admin/vouchers/${free.id}/redemptions`);
  check(
    "din pagina codurilor se vede cine l-a folosit",
    who.status === 200 && who.body?.redemptions?.length === 1 && who.body.redemptions[0].email === learner.email,
    JSON.stringify(who.body?.redemptions?.[0] ?? who.status),
  );
  const vpage = await adminCtx.newPage();
  await vpage.goto(`${BASE}/ro/dashboard/admin/superadmin/vouchers`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await vpage.getByText(free.code).first().waitFor({ timeout: 60000 }).catch(() => {});
  // The button of THIS code's row — the page lists every code, each with its own.
  await vpage.locator("tr", { hasText: free.code }).getByRole("button", { name: /vezi cine/ }).first().click();
  await vpage.getByText(learner.email).first().waitFor({ timeout: 30000 }).catch(() => {});
  const t3 = await vpage.locator("body").innerText();
  check("butonul „vezi cine” deschide lista conturilor", t3.includes(learner.email), t3.slice(0, 200).replace(/\n/g, " | "));
  await vpage.screenshot({ path: `${SHOTS}/vouchere-cine-a-folosit.png`, fullPage: true });
  await adminCtx.close();
} catch (e) {
  check("script", false, e.stack || String(e));
} finally {
  await prisma.user.deleteMany({ where: { email: { startsWith: tag } } }).catch(() => {});
  await prisma.voucher.deleteMany({ where: { code: { contains: tag.slice(-6).toUpperCase() } } }).catch(() => {});
  await prisma.domain.deleteMany({ where: { slug: { startsWith: tag } } }).catch(() => {});
  await browser.close();
  await prisma.$disconnect();
}

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} PASS`);
process.exit(failed === 0 ? 0 : 1);
