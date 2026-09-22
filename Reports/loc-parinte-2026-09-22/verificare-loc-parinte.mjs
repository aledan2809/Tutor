// „Treci pe Family Duo": the offer, the payment, the seat and the way back — on the local QA stack
// (production build on :3113 + docker QA database), never production. The payment service is a fake
// that records what checkout sends; callbacks are signed with the QA launch config's dummy secret.
//
//   cd /Users/danciulescu/Projects/REAL && node <this file>
import { createRequire } from "node:module";
import http from "node:http";
import crypto from "node:crypto";
import { mkdirSync } from "node:fs";

const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client");
const bcrypt = require("/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs");

const BASE = "http://localhost:3113";
const BROKER_SECRET = "qa-fake";
const SHOTS = "/Users/danciulescu/Projects/Tutor/Reports/loc-parinte-2026-09-22/capturi";
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const tag = `qa-duo-${Date.now()}`;
const PASSWORD = "parola-qa-1234";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

// ── fake payment service ──
const brokerCalls = [];
const broker = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    try {
      brokerCalls.push({ path: req.url, body: JSON.parse(body || "{}") });
    } catch {
      brokerCalls.push({ path: req.url, raw: body });
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ url: `${BASE}/ro/dashboard/family?fake-stripe=1` }));
  });
});
await new Promise((r) => broker.listen(55499, "127.0.0.1", r));

const mkUser = async (key, data = {}) =>
  prisma.user.create({
    data: {
      email: `${tag}-${key}@demo.tutor.app`,
      name: data.name ?? key,
      password: await bcrypt.hash(PASSWORD, 10),
      emailVerified: new Date(),
      createdAt: new Date(Date.now() - 60 * 864e5),
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

/** A payment-service callback, signed the way the service signs it. */
async function callback(event, metadata, extra = {}) {
  const payload = { event, t: Math.floor(Date.now() / 1000), sessionId: `cs_${tag}_${Math.random().toString(36).slice(2)}`, metadata, ...extra };
  const raw = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", BROKER_SECRET).update(raw, "utf8").digest("hex");
  const res = await fetch(`${BASE}/api/stripe/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-broker-signature": sig },
    body: raw,
  });
  return { status: res.status, sessionId: payload.sessionId };
}

const seats = (u) => prisma.user.findUnique({ where: { id: u }, select: { paidExtraParentSeats: true } });

const browser = await chromium.launch();
try {
  const family = await prisma.subscriptionPlan.findFirstOrThrow({ where: { isActive: true, interval: "MONTH", familyPlanKey: "FAMILY" }, orderBy: { price: "asc" } });
  const duo = await prisma.subscriptionPlan.findFirstOrThrow({ where: { isActive: true, interval: "MONTH", familyPlanKey: "FAMILY_DUO" }, orderBy: { price: "asc" } });
  const diff = (duo.price - family.price) / 100;

  const payer = await mkUser("platitor", {
    name: "Mara Plătește",
    accountRole: "PARENT",
    subscriptionPlanId: family.id,
    subscriptionStatus: "active",
    subscriptionEndsAt: null,
    stripeSubscriptionId: `sub_${tag}`,
  });
  const child = await mkUser("copil", { name: "Ilie Comun", accountRole: "STUDENT" });
  const other = await mkUser("al-doilea-parinte", { name: "Ana Rămas", accountRole: "PARENT" });
  await prisma.guardian.create({ data: { parentId: payer.id, childId: child.id, relation: "PARENT", status: "active", createdAt: new Date(Date.now() - 2 * 864e5) } });
  await prisma.guardian.create({ data: { parentId: other.id, childId: child.id, relation: "PARENT", status: "active" } });

  // ── The payer is told, with the real price ───────────────────────────────────────────────────────
  const payerCtx = await browser.newContext();
  check("plătitorul se autentifică", await login(payerCtx, payer.email));
  const fam = await api(payerCtx, "GET", "/api/dashboard/family");
  check(
    "pe „Familia mea”: un adult rămas în afară și prețul diferenței",
    fam.body?.parentUpgrade?.planLabel === "Family Duo" &&
      fam.body.parentUpgrade.price === diff &&
      fam.body.parentUpgrade.leftOut.length === 1 &&
      fam.body.parentUpgrade.leftOut[0].name === "Ana Rămas",
    JSON.stringify(fam.body?.parentUpgrade),
  );
  const plansBefore = await api(payerCtx, "GET", "/api/plans");
  check(
    "aceeași ofertă pe Abonament, cu totalul cât prețul Family Duo",
    plansBefore.body?.current?.parentUpgrade?.price === diff &&
      plansBefore.body.current.parentUpgrade.total === duo.price / 100 &&
      plansBefore.body.current.upgradedPlanName == null,
    JSON.stringify(plansBefore.body?.current?.parentUpgrade),
  );

  // ── The parent left out sees who holds the package, never a price ────────────────────────────────
  const otherCtx = await browser.newContext();
  await login(otherCtx, other.email);
  const otherPlans = await api(otherCtx, "GET", "/api/plans");
  check(
    "celui lăsat în afară: cine are pachetul, fără preț și fără ofertă",
    otherPlans.body?.current?.seatHolder?.plan === "Family" && otherPlans.body.current.parentUpgrade == null,
    JSON.stringify({ seatHolder: otherPlans.body?.current?.seatHolder, upgrade: otherPlans.body?.current?.parentUpgrade }),
  );

  // What the payer sees before paying (the same page the mockup showed).
  const offerPage = await payerCtx.newPage();
  await offerPage.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await offerPage.getByText("Treci pe Family Duo").first().waitFor({ timeout: 30000 }).catch(() => {});
  const ot = await offerPage.locator("body").innerText();
  check(
    "pe pagina Familia mea: oferta cu prețul diferenței și totalul",
    ot.includes("Treci pe Family Duo") && ot.includes("6,67") && ot.includes("39,87") && ot.includes("Ana Rămas nu are loc în pachet"),
    ot.split("\n").filter((l) => l.includes("Family Duo") || l.includes("6,67")).slice(0, 3).join(" | "),
  );
  await offerPage.screenshot({ path: `${SHOTS}/familia-oferta.png`, fullPage: true });
  await offerPage.close();

  // ── Payment ──────────────────────────────────────────────────────────────────────────────────────
  const before = brokerCalls.length;
  const pay = await api(payerCtx, "POST", "/api/dashboard/family/addon-checkout", { type: "parent" });
  const sent = brokerCalls.length > before ? brokerCalls[brokerCalls.length - 1].body : null;
  check(
    "plata pleacă drept „Trecerea pe Family Duo (diferența)”, cu suma diferenței",
    pay.status === 200 && sent?.lineItems?.[0]?.name === "Trecerea pe Family Duo (diferența)" && sent.lineItems[0].amount === diff && sent.metadata?.type === "parent_addon",
    JSON.stringify({ status: pay.status, line: sent?.lineItems?.[0], meta: sent?.metadata }),
  );

  const act = await callback("subscription.activated", { userId: payer.id, type: "parent_addon", upgradeTo: "FAMILY_DUO" }, { amountTotal: diff, currency: "ron", subscriptionStatus: "active" });
  check("confirmarea plății dă locul al doilea de părinte", act.status === 200 && (await seats(payer.id))?.paidExtraParentSeats === 1, JSON.stringify(act));

  const otherAfter = await api(otherCtx, "GET", "/api/dashboard/family");
  check(
    "al doilea părinte are acum acces prin familie",
    otherAfter.body?.access?.kind === "full" && otherAfter.body.access.reason === "family_paid",
    JSON.stringify(otherAfter.body?.access),
  );
  const plansAfter = await api(payerCtx, "GET", "/api/plans");
  const entry = (plansAfter.body?.current?.addons ?? []).find((a) => a.type === "parent_addon");
  check(
    "pachetul familiei e acum Family Duo, iar diferența apare în „Abonamente separate”",
    plansAfter.body?.current?.upgradedPlanName === "Family Duo" && plansAfter.body.current.parentUpgrade == null && entry != null,
    JSON.stringify({ plan: plansAfter.body?.current?.upgradedPlanName, upgrade: plansAfter.body?.current?.parentUpgrade, entry }),
  );
  const famAfter = await api(payerCtx, "GET", "/api/dashboard/family");
  check(
    "locurile de părinte: 2 din 2, sub numele Family Duo",
    famAfter.body?.seats?.parents?.max === 2 && famAfter.body.seats.parents.used === 2 && famAfter.body.planLabel === "Family Duo",
    JSON.stringify({ seats: famAfter.body?.seats?.parents, plan: famAfter.body?.planLabel }),
  );
  const again = await api(payerCtx, "POST", "/api/dashboard/family/addon-checkout", { type: "parent" });
  check("nu se poate plăti a doua oară aceeași trecere", again.status === 409, JSON.stringify(again.body));

  const page = await payerCtx.newPage();
  await page.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByText("Family Duo").first().waitFor({ timeout: 30000 }).catch(() => {});
  const ft = await page.locator("body").innerText();
  check(
    "pe pagina Familia mea scrie Family Duo, fără ofertă și fără îndemn la un pachet pe care familia îl are deja",
    ft.includes("Pachet: Family Duo") && !ft.includes("Treci pe Family Duo") && !ft.includes("Treci la „Family Duo") && ft.includes("a atins numărul maxim de părinți"),
    ft.split("\n").filter((l) => l.includes("Family") || l.includes("părinți")).slice(0, 3).join(" | "),
  );
  await page.screenshot({ path: `${SHOTS}/familia-dupa-trecere.png`, fullPage: true });

  // ── The way back ─────────────────────────────────────────────────────────────────────────────────
  const listed = (await prisma.setting.findUnique({ where: { userId_key: { userId: payer.id, key: "addonSubscriptions" } } }))?.value ?? [];
  const parentSession = listed.find((a) => a.type === "parent_addon")?.sessionId;
  const cancel = await callback("subscription.canceled", { userId: payer.id, type: "parent_addon" }, { sessionId: parentSession });
  const backToFamily = await api(payerCtx, "GET", "/api/plans");
  const otherBack = await api(otherCtx, "GET", "/api/dashboard/family");
  check(
    "oprirea diferenței: familia revine la Family, al doilea părinte iese din pachet, oferta reapare",
    cancel.status === 200 &&
      (await seats(payer.id))?.paidExtraParentSeats === 0 &&
      backToFamily.body?.current?.upgradedPlanName == null &&
      backToFamily.body.current.parentUpgrade?.price === diff &&
      otherBack.body?.access?.kind !== "full",
    JSON.stringify({ seats: (await seats(payer.id))?.paidExtraParentSeats, upgrade: backToFamily.body?.current?.upgradedPlanName, other: otherBack.body?.access?.kind }),
  );

  // ── Before anyone is linked: the move is the way to add the second parent ────────────────────────
  await prisma.guardian.update({ where: { parentId_childId: { parentId: other.id, childId: child.id } }, data: { status: "removed" } });
  const alone = await api(payerCtx, "GET", "/api/dashboard/family");
  check(
    "fără un al doilea adult legat: oferta rămâne, fără să pretindă că lipsește cineva",
    alone.body?.parentUpgrade?.price === diff && alone.body.parentUpgrade.leftOut.length === 0,
    JSON.stringify(alone.body?.parentUpgrade),
  );
  const addPage = await payerCtx.newPage();
  await addPage.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await addPage.getByText("include doi părinți").first().waitFor({ timeout: 30000 }).catch(() => {});
  const at = await addPage.locator("body").innerText();
  check(
    "butonul „al 2-lea părinte” duce la trecere, nu la fundătura cu oprit abonamentul",
    at.includes("Treci pe Family Duo · +6,67 lei") && !at.includes("oprește abonamentul"),
    at.split("\n").filter((l) => l.includes("Family Duo")).slice(0, 2).join(" | "),
  );
  await addPage.screenshot({ path: `${SHOTS}/familia-al-doilea-parinte.png`, fullPage: true });
  await addPage.close();

  // ── An adult who already has access is not „left out” ────────────────────────────────────────────
  const freeAdult = await mkUser("bunica-gratuita", { name: "Bunica Gratuită", accountRole: "PARENT", freeForever: true });
  await prisma.guardian.create({ data: { parentId: freeAdult.id, childId: child.id, relation: "PARENT", status: "active" } });
  const withFree = await api(payerCtx, "GET", "/api/dashboard/family");
  check(
    "un adult cu „Gratuit permanent” nu e vândut ca lipsind din pachet",
    withFree.body?.parentUpgrade?.leftOut.length === 0,
    JSON.stringify(withFree.body?.parentUpgrade?.leftOut),
  );

  // ── Two adults without a seat: the offer says who comes in ───────────────────────────────────────
  // „Gratuit permanent" covers the child's other adults too (access.ts paysForSecondParent), so the
  // grandmother leaves first — otherwise nobody would be left out, which is what the check above proved.
  await prisma.guardian.update({ where: { parentId_childId: { parentId: freeAdult.id, childId: child.id } }, data: { status: "removed" } });
  const third = await mkUser("al-treilea-adult", { name: "Mihai Al Treilea", accountRole: "PARENT" });
  await prisma.guardian.update({ where: { parentId_childId: { parentId: other.id, childId: child.id } }, data: { status: "active" } });
  await prisma.guardian.create({ data: { parentId: third.id, childId: child.id, relation: "PARENT", status: "active" } });
  const twoOut = await api(payerCtx, "GET", "/api/dashboard/family");
  check(
    "doi adulți fără loc: oferta îi numără pe amândoi și spune că intră unul",
    twoOut.body?.parentUpgrade?.leftOut.length === 2 && twoOut.body.parentUpgrade.seats === 1 && twoOut.body.parentUpgrade.leftOut[0].name === "Ana Rămas",
    JSON.stringify(twoOut.body?.parentUpgrade?.leftOut?.map((p) => p.name)),
  );

  // ── Paid twice for the same move ─────────────────────────────────────────────────────────────────
  await callback("subscription.activated", { userId: payer.id, type: "parent_addon" }, { amountTotal: diff, currency: "ron" });
  await callback("subscription.activated", { userId: payer.id, type: "parent_addon" }, { amountTotal: diff, currency: "ron" });
  const twice = await seats(payer.id);
  const twoFamily = await api(payerCtx, "GET", "/api/dashboard/family");
  check(
    "plătită de două ori, trecerea dă un singur loc (a doua rămâne vizibilă, de oprit)",
    twice?.paidExtraParentSeats === 1 && twoFamily.body?.seats?.parents?.max === 2,
    JSON.stringify({ seats: twice?.paidExtraParentSeats, max: twoFamily.body?.seats?.parents?.max }),
  );

  // ── The family later buys the bigger package outright ────────────────────────────────────────────
  await prisma.user.update({ where: { id: payer.id }, data: { subscriptionPlanId: duo.id } });
  const onDuo = await api(payerCtx, "GET", "/api/plans");
  const duoFamily = await api(payerCtx, "GET", "/api/dashboard/family");
  check(
    "pe Family Duo cu diferența încă plătită: fără al treilea loc, cu avertisment că e de oprit",
    duoFamily.body?.seats?.parents?.max === 2 && onDuo.body?.current?.parentUpgradeRedundant === true && onDuo.body.current.parentUpgrade == null,
    JSON.stringify({ max: duoFamily.body?.seats?.parents?.max, redundant: onDuo.body?.current?.parentUpgradeRedundant }),
  );

  // ── A free year from a code is not a card subscription ───────────────────────────────────────────
  const codeYear = await mkUser("an-din-cod", { name: "Cod Gratuit", accountRole: "PARENT", subscriptionPlanId: family.id, subscriptionStatus: "active", subscriptionEndsAt: new Date(Date.now() + 300 * 864e5) });
  const codeChild = await mkUser("copil-cod", { name: "Copil Cod", accountRole: "STUDENT" });
  const codeOther = await mkUser("parinte-cod", { name: "Al Doilea Cod", accountRole: "PARENT" });
  await prisma.guardian.create({ data: { parentId: codeYear.id, childId: codeChild.id, relation: "PARENT", status: "active" } });
  await prisma.guardian.create({ data: { parentId: codeOther.id, childId: codeChild.id, relation: "PARENT", status: "active" } });
  const codeCtx = await browser.newContext();
  await login(codeCtx, codeYear.email);
  const codeFam = await api(codeCtx, "GET", "/api/dashboard/family");
  const codeBuy = await api(codeCtx, "POST", "/api/dashboard/family/addon-checkout", { type: "parent" });
  check(
    "un an gratuit dintr-un cod nu primește oferta și nu poate plăti diferența",
    codeFam.body?.parentUpgrade == null && codeBuy.status === 400,
    JSON.stringify({ offer: codeFam.body?.parentUpgrade, status: codeBuy.status, error: codeBuy.body?.error }),
  );
  await codeCtx.close();
  await payerCtx.close();
  await otherCtx.close();
} catch (e) {
  check("script", false, e.stack || String(e));
} finally {
  await prisma.setting.deleteMany({ where: { user: { email: { startsWith: tag } } } }).catch(() => {});
  await prisma.guardian.deleteMany({ where: { OR: [{ parent: { email: { startsWith: tag } } }, { child: { email: { startsWith: tag } } }] } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: { startsWith: tag } } }).catch(() => {});
  await browser.close();
  broker.close();
  await prisma.$disconnect();
}

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} PASS`);
process.exit(failed === 0 ? 0 : 1);
