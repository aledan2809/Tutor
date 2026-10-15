// Reparațiile din /bani (15.10.2026), pe stiva QA (build de producție pe :3113 + baza QA), niciodată pe producție:
//   1. copilul rămas fără loc după ce familia plătește Family: anunțul pe „Familia mea”, prețul locului, plata, accesul;
//   2. alertele pe Telegram către administrator: plată nouă, reînnoire, plată eșuată, abonament încheiat, plată
//      abandonată, intrarea în pauză — câte una, nimic pentru conturile de test;
//   3. Umami nu mai numără vizitele de pe alt domeniu decât etutor.ro.
// Plățile și Telegram sunt servere false locale (55499 / 55498); confirmările plății sunt semnate cu secretul QA.
//   cd /Users/danciulescu/Projects/Tutor && node Reports/bani-2026-10-15/verificare.mjs
import { createRequire } from "node:module";
import http from "node:http";
import crypto from "node:crypto";
import { mkdirSync } from "node:fs";

const require = createRequire(process.cwd() + "/package.json");
const { chromium, devices } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const BASE = "http://localhost:3113";
const SHOTS = new URL("./capturi/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const tag = `qa-bani-${Date.now()}`;
const PASSWORD = "parola-qa-1234";
let fail = 0;
const check = (name, ok, detail = "") => {
  if (!ok) fail++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail && !ok ? `  — ${detail}` : ""}`);
};

// ── servere false ──
const brokerCalls = [];
const broker = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    brokerCalls.push(JSON.parse(body || "{}"));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ url: `${BASE}/ro/dashboard/family?fake-stripe=1` }));
  });
});
const tg = [];
const telegram = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    try {
      tg.push(JSON.parse(body || "{}"));
    } catch {}
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, result: { message_id: tg.length } }));
  });
});
await new Promise((r) => broker.listen(55499, "127.0.0.1", r));
await new Promise((r) => telegram.listen(55498, "127.0.0.1", r));
const ADMIN_CHAT = `qa-chat-${Date.now()}`;
const tgFor = () => tg.filter((m) => String(m.chat_id) === ADMIN_CHAT).map((m) => m.text);

const DAY = 864e5;
const mkUser = async (key, data = {}, domain = "qa-parinte.ro") =>
  prisma.user.create({
    data: {
      email: `${tag}-${key}@${domain}`,
      name: data.name ?? key,
      password: await bcrypt.hash(PASSWORD, 10),
      emailVerified: new Date(),
      createdAt: new Date(Date.now() - 60 * DAY),
      ...data,
    },
  });
const link = (parentId, childId, daysAgo) =>
  prisma.guardian.create({ data: { parentId, childId, relation: "PARENT", status: "active", createdAt: new Date(Date.now() - daysAgo * DAY) } });

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
async function callback(event, metadata, extra = {}) {
  const payload = { event, t: Math.floor(Date.now() / 1000), sessionId: `cs_${tag}_${Math.random().toString(36).slice(2)}`, projectSlug: "tutor", metadata, ...extra };
  const raw = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", "qa-fake").update(raw, "utf8").digest("hex");
  const res = await fetch(`${BASE}/api/stripe/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-broker-signature": sig },
    body: raw,
  });
  return { status: res.status, raw, sig };
}
const settle = () => new Promise((r) => setTimeout(r, 700));

// Cu comutatorul probei oprit nimeni nu intră în pauză și toate verificările ar trece în gol: îl cerem aprins
// înainte de pornirea serverului (serverul îl ține minte 30 s).
if (!(await prisma.appSetting.findUnique({ where: { key: "accessTrial" } }))) {
  console.error("Comutatorul probei e oprit în baza QA: pornește-l înainte de server (AppSetting accessTrial).");
  process.exit(2);
}
const browser = await chromium.launch();
try {
  const family = await prisma.subscriptionPlan.findFirstOrThrow({ where: { isActive: true, interval: "MONTH", familyPlanKey: "FAMILY" }, orderBy: { price: "asc" } });
  const seatLei = Math.round(family.price * 0.8) / 100;
  const leiText = (n) => n.toFixed(2).replace(".", ",");
  await mkUser("admin", { name: "QA Admin", isSuperAdmin: true, telegramChatId: ADMIN_CHAT }, "demo.tutor.app");

  // ── 1. Copilul rămas fără loc ─────────────────────────────────────────────────────────────────
  const payer = await mkUser("platitor", {
    name: "Mara Plătește",
    accountRole: "PARENT",
    subscriptionPlanId: family.id,
    subscriptionStatus: "active",
    stripeSubscriptionId: `sub_${tag}`,
  });
  const c1 = await mkUser("copil1", { name: "Ilie Primul", accountRole: "STUDENT" });
  const c2 = await mkUser("copil2", { name: "Ana Adoua", accountRole: "STUDENT" });
  await link(payer.id, c1.id, 5);
  await link(payer.id, c2.id, 4);

  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO", serviceWorkers: "block" });
  check("1 plătitorul se autentifică", await login(ctx, payer.email));
  const fam = await api(ctx, "GET", "/api/dashboard/family");
  const cs = fam.body?.childSeat;
  check(
    `1 API: al doilea copil e fără loc, în pauză, locul ${leiText(seatLei)} lei/lună (−20%)`,
    cs?.leftOut?.length === 1 && cs.leftOut[0].name === "Ana Adoua" && cs.leftOut[0].trialEndsAt === null && cs.price === seatLei && cs.discountPercent === 20 && cs.interval === "MONTH",
    JSON.stringify(cs),
  );
  const childAccess = await api(await (async () => { const c = await browser.newContext(); await login(c, c2.email); return c; })(), "GET", "/api/dashboard/family");
  check("1 copilul e chiar în pauză și nu vede nicio ofertă", childAccess.body?.access?.kind === "paused" && !childAccess.body?.childSeat, JSON.stringify({ access: childAccess.body?.access, seat: childAccess.body?.childSeat }));

  const page = await ctx.newPage();
  await page.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Respinge" }).click().catch(() => {});
  const box = page.getByText("Ana nu are loc în pachet");
  check("1 pe „Familia mea”: „Ana nu are loc în pachet”", await box.isVisible());
  check("1 spune că e în pauză și ce o scoate din pauză", await page.getByText(/Ana e în pauză: nu poate exersa/).isVisible());
  const btn = page.getByRole("button", { name: `Adaugă locul pentru Ana · +${leiText(seatLei)} lei` });
  check("1 butonul arată prețul locului", await btn.isVisible());
  const order = await page.evaluate(() => {
    const t = document.body.innerText;
    return { child: t.indexOf("Ana nu are loc în pachet"), duo: t.indexOf("Family Duo include") };
  });
  check("1 anunțul copilului stă deasupra ofertei Family Duo", order.child >= 0 && (order.duo === -1 || order.child < order.duo), JSON.stringify(order));
  check(
    "1 „Adaugă copil” trimite întâi la locul Anei, fără „al 3-lea copil cu 30%”",
    (await page.getByText("Întâi locul pentru Ana, mai sus.").isVisible()) && (await page.getByText(/al 3-lea copil/).count()) === 0 &&
      (await page.getByRole("button", { name: "Adaugă copil", exact: true }).isDisabled()),
  );
  check("1 fără derulare pe orizontală pe telefon", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `${SHOTS}1-copil-fara-loc.png`, fullPage: true });
  const before = brokerCalls.length;
  await btn.click();
  await page.waitForURL(/fake-stripe=1/, { timeout: 20000 }).catch(() => {});
  const sent = brokerCalls[before];
  check(
    "1 plata pleacă la broker drept loc de copil, cu prețul arătat",
    sent?.metadata?.type === "child_addon" && sent.lineItems?.[0]?.amount === seatLei,
    JSON.stringify({ meta: sent?.metadata, line: sent?.lineItems?.[0] }),
  );
  const act = await callback("subscription.activated", { userId: payer.id, type: "child_addon", childIndex: "2" }, { amountTotal: Math.round(seatLei * 100), currency: "ron", subscriptionStatus: "active", stripeSubscriptionId: `sub_${tag}_c2` });
  check("1 confirmarea plății e primită", act.status === 200, JSON.stringify(act.status));
  await settle();
  const after = await api(ctx, "GET", "/api/dashboard/family");
  check("1 după plată: anunțul dispare", after.body?.childSeat == null, JSON.stringify(after.body?.childSeat));
  const c2ctx = await browser.newContext();
  await login(c2ctx, c2.email);
  const c2after = await api(c2ctx, "GET", "/api/dashboard/family");
  check("1 după plată: Ana are acces", c2after.body?.access?.kind === "full", JSON.stringify(c2after.body?.access));
  check("1 Telegram: „Abonament nou: loc pentru încă un copil”", tgFor().some((t) => t.includes("Abonament nou: loc pentru încă un copil") && t.includes(leiText(seatLei))), JSON.stringify(tgFor()));

  // Varianta din probă: copilul are încă acces, anunțul spune până când.
  const payer2 = await mkUser("platitor2", { name: "Ion Plătește", accountRole: "PARENT", subscriptionPlanId: family.id, subscriptionStatus: "active", stripeSubscriptionId: `sub_${tag}_2` });
  const d1 = await mkUser("copil3", { name: "Radu Unu", accountRole: "STUDENT" });
  const d2 = await mkUser("copil4", { name: "Eva Doi", accountRole: "STUDENT", createdAt: new Date(Date.now() - 2 * DAY) });
  await link(payer2.id, d1.id, 3);
  await link(payer2.id, d2.id, 2);
  const ctx2 = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO", serviceWorkers: "block" });
  await login(ctx2, payer2.email);
  const fam2 = await api(ctx2, "GET", "/api/dashboard/family");
  check("1 copilul încă în probă: anunțul are data de final a probei", fam2.body?.childSeat?.leftOut?.[0]?.name === "Eva Doi" && typeof fam2.body.childSeat.leftOut[0].trialEndsAt === "string", JSON.stringify(fam2.body?.childSeat));
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" });
  await p2.getByRole("button", { name: "Respinge" }).click().catch(() => {});
  check("1 pe pagină: „Eva are acces din probă până …, apoi intră în pauză.”", await p2.getByText(/Eva are acces din probă până .+, apoi intră în pauză\./).isVisible());
  await p2.screenshot({ path: `${SHOTS}1-copil-in-proba.png`, fullPage: true });

  // Un copil din mijloc acoperit altfel („Gratuit permanent”) ia totuși locul următor: pentru ultimul trebuie 2 locuri.
  const payer4 = await mkUser("platitor4", { name: "Lia Trei", accountRole: "PARENT", subscriptionPlanId: family.id, subscriptionStatus: "active", stripeSubscriptionId: `sub_${tag}_4` });
  const f1 = await mkUser("copil7", { name: "Mihai Unu", accountRole: "STUDENT" });
  const f2 = await mkUser("copil8", { name: "Nora Gratuit", accountRole: "STUDENT", freeForever: true });
  const f3 = await mkUser("copil9", { name: "Petra Ultima", accountRole: "STUDENT" });
  await link(payer4.id, f1.id, 5);
  await link(payer4.id, f2.id, 4);
  await link(payer4.id, f3.id, 3);
  const ctx4 = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO", serviceWorkers: "block" });
  await login(ctx4, payer4.email);
  const fam4 = await api(ctx4, "GET", "/api/dashboard/family");
  check(
    "1 copil din mijloc acoperit altfel: doar ultimul e fără loc, iar locurile necesare sunt 2",
    fam4.body?.childSeat?.leftOut?.length === 1 && fam4.body.childSeat.leftOut[0].name === "Petra Ultima" && fam4.body.childSeat.seatsNeeded === 2,
    JSON.stringify(fam4.body?.childSeat),
  );
  const p4 = await ctx4.newPage();
  await p4.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" });
  await p4.getByRole("button", { name: "Respinge" }).click().catch(() => {});
  check(
    "1 pe pagină spune că trebuie 2 locuri, iar butonul nu promite locul Petrei",
    (await p4.getByText(/pentru Petra trebuie 2 locuri; acesta e primul\./).isVisible()) &&
      (await p4.getByRole("button", { name: /^Adaugă un loc de copil · \+/ }).isVisible()) &&
      (await p4.getByRole("button", { name: /Adaugă locul pentru Petra/ }).count()) === 0,
  );

  // Familie cu un singur copil: niciun anunț.
  const payer3 = await mkUser("platitor3", { name: "Dan Unul", accountRole: "PARENT", subscriptionPlanId: family.id, subscriptionStatus: "active", stripeSubscriptionId: `sub_${tag}_3` });
  const e1 = await mkUser("copil5", { name: "Sara Una", accountRole: "STUDENT" });
  await link(payer3.id, e1.id, 3);
  const ctx3 = await browser.newContext();
  await login(ctx3, payer3.email);
  check("1 un singur copil: niciun anunț", (await api(ctx3, "GET", "/api/dashboard/family")).body?.childSeat == null);

  // ── 2. Alertele pe Telegram ────────────────────────────────────────────────────────────────────
  const buyer = await mkUser("cumparator", { name: "Geo Nou", accountRole: "PARENT" });
  tg.length = 0;
  const first = await callback("subscription.activated", { userId: buyer.id, planId: family.id }, { amountTotal: family.price, currency: "ron", subscriptionStatus: "active", stripeSubscriptionId: `sub_${tag}_b` });
  await settle();
  check("2 plată nouă: „💳 Abonament nou: Family · 33,20 lei” + cine", tgFor().length === 1 && tgFor()[0].includes(`Abonament nou: ${family.name} · ${leiText(family.price / 100)} lei`) && tgFor()[0].includes("Geo (q***"), JSON.stringify(tgFor()));
  // Aceeași confirmare trimisă din nou de broker: nicio a doua alertă.
  const replay = await fetch(`${BASE}/api/stripe/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-broker-signature": crypto.createHmac("sha256", "qa-fake").update(first.raw.replace(/"t":\d+/, `"t":${Math.floor(Date.now() / 1000)}`), "utf8").digest("hex") },
    body: first.raw.replace(/"t":\d+/, `"t":${Math.floor(Date.now() / 1000)}`),
  });
  await settle();
  check("2 aceeași confirmare din nou: o singură alertă", tgFor().length === 1, JSON.stringify({ status: replay.status, n: tgFor().length }));
  await callback("subscription.renewed", { userId: buyer.id, planId: family.id }, { eventId: `evt_${tag}_r`, amountTotal: family.price, currency: "ron", stripeSubscriptionId: `sub_${tag}_b` });
  await settle();
  check("2 reînnoire: „🔁 Reînnoire încasată”", tgFor().some((t) => t.startsWith("🔁 Reînnoire încasată")), JSON.stringify(tgFor()));
  // Revizia Codex: două reînnoiri pe aceeași sesiune, fără cod de eveniment (apeluri vechi) → două alerte.
  const legacySession = `cs_${tag}_legacy`;
  const nBefore = tgFor().filter((t) => t.startsWith("🔁")).length;
  await callback("subscription.renewed", { userId: buyer.id, planId: family.id }, { sessionId: legacySession, amountTotal: family.price, currency: "ron", stripeSubscriptionId: `sub_${tag}_b` });
  await callback("subscription.renewed", { userId: buyer.id, planId: family.id }, { sessionId: legacySession, amountTotal: family.price, currency: "ron", stripeSubscriptionId: `sub_${tag}_b` });
  await settle();
  check("2 două reînnoiri fără cod de eveniment, aceeași sesiune: două alerte", tgFor().filter((t) => t.startsWith("🔁")).length === nBefore + 2, JSON.stringify(tgFor()));
  // Aceeași plată abandonată trimisă de două ori: o singură alertă.
  const expiredSession = `cs_${tag}_expired`;
  const nExp = tgFor().filter((t) => t.startsWith("⌛")).length;
  await callback("payment.expired", { userId: buyer.id, planId: family.id }, { sessionId: expiredSession });
  await callback("payment.expired", { userId: buyer.id, planId: family.id }, { sessionId: expiredSession });
  await settle();
  check("2 aceeași plată abandonată de două ori: o singură alertă", tgFor().filter((t) => t.startsWith("⌛")).length === nExp + 1, JSON.stringify(tgFor()));
  await callback("subscription.payment_failed", { userId: buyer.id, planId: family.id }, { stripeSubscriptionId: `sub_${tag}_b`, nextPaymentAttempt: new Date(Date.now() + 3 * DAY).toISOString() });
  await settle();
  check("2 plată eșuată: „⚠️ Plata n-a trecut …”", tgFor().some((t) => t.startsWith("⚠️ Plata n-a trecut") && t.includes("banca mai e încercată")), JSON.stringify(tgFor()));
  await callback("subscription.canceled", { userId: buyer.id, planId: family.id }, { stripeSubscriptionId: `sub_${tag}_b` });
  await settle();
  check("2 abonament încheiat: „🛑 Abonament încheiat”", tgFor().some((t) => t.startsWith("🛑 Abonament încheiat")), JSON.stringify(tgFor()));
  // Revizia Codex: aceeași încheiere, retrimisă fără codul abonamentului (apel vechi) → nicio a doua alertă.
  await callback("subscription.canceled", { userId: buyer.id, planId: family.id });
  await settle();
  check("2 încheierea retrimisă: o singură alertă „🛑”", tgFor().filter((t) => t.startsWith("🛑")).length === 1, JSON.stringify(tgFor()));
  await callback("payment.expired", { userId: buyer.id, planId: family.id });
  await settle();
  check("2 plată abandonată: „⌛ Plată începută și neterminată”", tgFor().some((t) => t.startsWith("⌛ Plată începută și neterminată")), JSON.stringify(tgFor()));
  const n = tgFor().length;
  const testBuyer = await mkUser("cont-test", { name: "Test Cont" }, "demo.tutor.app");
  await callback("subscription.activated", { userId: testBuyer.id, planId: family.id }, { amountTotal: family.price, currency: "ron", subscriptionStatus: "active", stripeSubscriptionId: `sub_${tag}_t` });
  await settle();
  check("2 cont de test: nicio alertă", tgFor().length === n, JSON.stringify(tgFor().slice(n)));
  check("2 nicio adresă întreagă în alerte", tgFor().every((t) => !t.includes(`@qa-parinte.ro`) || /\*\*\*/.test(t)), JSON.stringify(tgFor()));

  // Pauza: mesajul de ziua 8 pentru un părinte nou în pauză → rezumat pentru administrator.
  // Proba lui s-a terminat ieri (mesajul de pauză pleacă doar în primele 3 zile); orele lui de liniște nu acoperă
  // ora rulării (implicit 22–07, iar proba poate rula seara).
  const pausedParent = await mkUser("in-pauza", { name: "Vlad Pauza", accountRole: "PARENT", createdAt: new Date(Date.now() - 8 * DAY) });
  const pc = await mkUser("copil6", { name: "Ina Pauza", accountRole: "STUDENT", createdAt: new Date(Date.now() - 8 * DAY) });
  await link(pausedParent.id, pc.id, 8);
  await prisma.notificationPreference.create({ data: { userId: pausedParent.id, quietHoursStart: "04:00", quietHoursEnd: "04:01" } });
  tg.length = 0;
  const cron = await fetch(`${BASE}/api/cron/escalation`, { method: "POST", headers: { Authorization: "Bearer qa-cron-local" } });
  await settle();
  check("2 cron-ul: „⏸ … în pauză la finalul probei”", cron.status === 200 && tgFor().some((t) => /^⏸ \d+ famil(ie a intrat|ii au intrat) în pauză la finalul probei\./m.test(t)), JSON.stringify({ status: cron.status, tg: tgFor() }));

  // ── 4. Poziția contrară (15.10): textul nu mai promite o „sumă exactă” care lasă afară al doilea copil ──
  {
    const lp = await (await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" })).newPage();
    await lp.goto(`${BASE}/ro/parinte`, { waitUntil: "networkidle" });
    const all = await lp.evaluate(() => document.body.textContent ?? "");
    check("4 /parinte: fără „La plată păstrezi ce vrei” și fără „Suma exactă”", !all.includes("păstrezi ce vrei") && !all.includes("Suma exactă"));
    check("4 /parinte: al doilea copil are locul lui, plătit separat, după pachet", all.includes("Al doilea copil are locul lui, cu 20% mai puțin, plătit separat, după pachet"));
    check("4 /parinte (întrebări): locul se plătește separat și primește reducerea familiei", all.includes("plătit separat, după pachet: cu 20% mai puțin") && all.includes("reducerea familiei se aplică și locului"));
  }
  {
    // Părinte în probă, cu doi copii: Abonamentul arată locul celui de-al doilea și totalul; după plată, „Familia mea”
    // cere exact prețul arătat înainte (prețul afișat = prețul încasat).
    const parent = await mkUser("proba-doi-copii", { name: "Rita Doi", accountRole: "PARENT", createdAt: new Date() });
    const k1 = await mkUser("copil10", { name: "Toma Primul", accountRole: "STUDENT", createdAt: new Date() });
    const k2 = await mkUser("copil11", { name: "Lia Adoua", accountRole: "STUDENT", createdAt: new Date() });
    await prisma.guardian.create({ data: { parentId: parent.id, childId: k1.id, relation: "PARENT", status: "active", createdAt: new Date(Date.now() - 60_000) } });
    await prisma.guardian.create({ data: { parentId: parent.id, childId: k2.id, relation: "PARENT", status: "active" } });
    const pctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO", serviceWorkers: "block" });
    await login(pctx, parent.email);
    const plans = await api(pctx, "GET", "/api/plans");
    check("4 API: Abonamentul știe că familia are 2 copii", plans.body?.current?.childrenLinked === 2, JSON.stringify(plans.body?.current?.childrenLinked));
    const pk = await pctx.newPage();
    await pk.goto(`${BASE}/ro/dashboard/packages`, { waitUntil: "networkidle" });
    await pk.getByRole("button", { name: "Respinge" }).click().catch(() => {});
    const card = pk.locator(`#plan-card-${family.id}`);
    const cardText = (await card.innerText().catch(() => "")).replace(/\s+/g, " ");
    const seatMatch = cardText.match(/Locul pentru al 2-lea copil: ([\d.,]+) lei\/lună, plătit separat, după pachet\./);
    const totalMatch = cardText.match(/Total pentru 2 copii: ([\d.,]+) lei\/lună\./);
    check("4 Abonament, cardul Family: locul celui de-al doilea copil și totalul familiei", Boolean(seatMatch && totalMatch), cardText.slice(0, 400));
    await card.screenshot({ path: `${SHOTS}4-abonament-doi-copii.png` }).catch(() => {});
    const before = brokerCalls.length;
    const co = await api(pctx, "POST", "/api/admin/stripe/checkout", { planId: family.id });
    const sentPlan = brokerCalls[before];
    check("4 plata pachetului pleacă la broker", co.status === 200 && sentPlan?.metadata?.planId === family.id, JSON.stringify({ status: co.status, body: co.body }));
    const planMinor = (sentPlan?.lineItems ?? []).reduce((sum, l) => sum + Math.round(l.amount * 100), 0);
    await callback("subscription.activated", sentPlan?.metadata ?? {}, { amountTotal: planMinor, currency: "ron", subscriptionStatus: "active", stripeSubscriptionId: `sub_${tag}_rita` });
    await settle();
    const after = await api(pctx, "GET", "/api/dashboard/family");
    const shown = seatMatch ? Number(seatMatch[1].replace(/\./g, "").replace(",", ".")) : NaN;
    const shownTotal = totalMatch ? Number(totalMatch[1].replace(/\./g, "").replace(",", ".")) : NaN;
    check(
      "4 după plată, locul cerut în „Familia mea” = locul arătat înainte în Abonament",
      after.body?.childSeat?.leftOut?.[0]?.name === "Lia Adoua" && after.body.childSeat.price === shown,
      JSON.stringify({ shown, quote: after.body?.childSeat }),
    );
    check("4 totalul arătat = pachetul plătit + locul", Math.round((planMinor / 100 + shown) * 100) === Math.round(shownTotal * 100), JSON.stringify({ planMinor, shown, shownTotal }));
  }

  {
    // Revizia Codex: pachetul s-a încheiat, dar abonamentul locului de copil încă merge — locul nu se mai cere o dată.
    const parent = await mkUser("loc-ramas", { name: "Sorin Ramas", accountRole: "PARENT" });
    const k1 = await mkUser("copil12", { name: "Ada Unu", accountRole: "STUDENT" });
    const k2 = await mkUser("copil13", { name: "Bogdan Doi", accountRole: "STUDENT" });
    const k3 = await mkUser("copil14", { name: "Cora Trei", accountRole: "STUDENT" });
    await link(parent.id, k1.id, 6);
    await link(parent.id, k2.id, 5);
    await link(parent.id, k3.id, 4);
    await callback("subscription.activated", { userId: parent.id, planId: family.id, discountPercent: 0 }, { amountTotal: family.price, currency: "ron", subscriptionStatus: "active", stripeSubscriptionId: `sub_${tag}_sorin` });
    await callback("subscription.activated", { userId: parent.id, type: "child_addon", childIndex: "2" }, { amountTotal: Math.round(family.price * 0.8), currency: "ron", subscriptionStatus: "active", stripeSubscriptionId: `sub_${tag}_sorin_c2` });
    await callback("subscription.canceled", { userId: parent.id, planId: family.id }, { stripeSubscriptionId: `sub_${tag}_sorin` });
    await settle();
    const sctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO", serviceWorkers: "block" });
    await login(sctx, parent.email);
    const pl = await api(sctx, "GET", "/api/plans");
    const hasAddon = (pl.body?.current?.addons ?? []).some((a) => a.type === "child_addon");
    const sp = await sctx.newPage();
    await sp.goto(`${BASE}/ro/dashboard/packages`, { waitUntil: "networkidle" });
    await sp.getByRole("button", { name: "Respinge" }).click().catch(() => {});
    const famCard = (await sp.locator(`#plan-card-${family.id}`).innerText().catch(() => "")).replace(/\s+/g, " ");
    check(
      "4 pachet încheiat, locul copilului încă plătit: Abonamentul nu-l mai cere o dată",
      hasAddon && pl.body?.current?.childrenLinked === 3 && famCard.length > 0 && !famCard.includes("Locul pentru al 2-lea copil"),
      JSON.stringify({ hasAddon, linked: pl.body?.current?.childrenLinked, card: famCard.slice(0, 200) }),
    );
    check(
      "4 cu un loc plătit deja separat: arată locul celui de-al 3-lea copil și nu pretinde „Total pentru 3 copii”",
      famCard.includes("Locul pentru al 3-lea copil") && famCard.includes("Pachetul și locurile noi:") &&
        famCard.includes("Locul plătit deja separat continuă la prețul lui.") && !famCard.includes("Total pentru 3 copii"),
      famCard.slice(0, 400),
    );
  }

  // ── 3. Umami doar pe etutor.ro ──────────────────────────────────────────────────────────────────
  const anon = await browser.newContext();
  const ap = await anon.newPage();
  const umami = [];
  ap.on("request", (r) => {
    if (/analytics\.knowbest\.ro\/api\/send/.test(r.url())) umami.push(r.url());
  });
  await ap.goto(`${BASE}/ro/parinte`, { waitUntil: "networkidle" });
  await ap.waitForTimeout(2500);
  const attr = await ap.evaluate(() => document.querySelector('script[data-website-id]')?.getAttribute("data-domains"));
  check("3 scriptul Umami poartă data-domains=\"etutor.ro\"", attr === "etutor.ro", String(attr));
  check("3 pe localhost nu pleacă nicio vizită la Umami", umami.length === 0, JSON.stringify(umami));
} finally {
  await browser.close();
  broker.close();
  telegram.close();
  await prisma.$disconnect();
}
console.log(fail ? `\n${fail} verificări picate` : "\ntoate verificările au trecut");
process.exit(fail ? 1 : 0);
