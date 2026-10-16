// Pachetul 1 (16.10.2026), pe stiva QA (build de producție pe :3113 + baza QA), niciodată pe producție:
//   1. „Continuă cu Google”: pagina de după Google dă unui cont nou rolul de părinte, păstrează codul, notează campania,
//      reîmprospătează sesiunea și duce unde ar fi dus formularul; nu schimbă conturi vechi, cu parolă sau cu rol;
//   2. butonul Google apare la înscriere doar pentru părinte și duce înapoi cu planul, codul și proba;
//   3. primul ecran al paginii pentru părinți: prețul din probă e exact cel cerut la plată (broker fals pe 55499).
// Google însuși nu se poate parcurge aici: un cont „ca de la Google” = fără parolă și fără rol, creat acum.
//   cd /Users/danciulescu/Projects/Tutor && node Reports/pachet1-2026-10-16/verificare.mjs
import { createRequire } from "node:module";
import http from "node:http";

const require = createRequire(process.cwd() + "/package.json");
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const BASE = "http://localhost:3113";
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa" } } });
const tag = `qa-google-${Date.now()}`;
const PASSWORD = "parola-qa-1234";
let fail = 0;
const check = (name, ok, detail = "") => {
  if (!ok) fail++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail && !ok ? `  — ${detail}` : ""}`);
};

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
await new Promise((r) => broker.listen(55499, "127.0.0.1", r));

const made = [];
async function account(key, data = {}) {
  const u = await prisma.user.create({
    data: {
      email: `${tag}-${key}@example.com`,
      name: "Maria QA",
      password: await bcrypt.hash(PASSWORD, 10),
      emailVerified: new Date(),
      ...data,
    },
  });
  made.push(u.id);
  return u;
}
async function login(ctx, email) {
  const csrf = await (await ctx.request.get(`${BASE}/api/auth/csrf`)).json();
  await ctx.request.post(`${BASE}/api/auth/callback/credentials`, {
    form: { csrfToken: csrf.csrfToken, email, password: PASSWORD, callbackUrl: `${BASE}/ro/dashboard` },
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  return (await ctx.cookies()).some((c) => c.name.includes("session-token"));
}
/** Signed in, then made to look like an account the Google button created: no password. */
async function asGoogle(ctx, u) {
  const ok = await login(ctx, u.email);
  await prisma.user.update({ where: { id: u.id }, data: { password: null } });
  return ok;
}
async function finish(page, qs) {
  await page.goto(`${BASE}/ro/auth/google-done${qs ? `?${qs}` : ""}`);
  await page.waitForURL((url) => !url.pathname.includes("google-done"), { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  return new URL(page.url());
}
const reload = (id) => prisma.user.findUnique({ where: { id }, select: { accountRole: true, pendingVoucherCode: true } });
const campaignRows = (userId) => prisma.campaignSignup.count({ where: { userId } });

const browser = await chromium.launch();
const newCtx = () => browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ro-RO" });

try {
  // ── 1. drumul Google ──
  {
    const ctx = await newCtx();
    const page = await ctx.newPage();
    const u = await account("nou");
    check("1 cont „ca de la Google” intră în sesiune", await asGoogle(ctx, u));
    const url = await finish(page, "plan=FAMILY&voucher=V126S&start=free");
    check("1 cont nou → „Familia mea”, ca formularul cu „Încearcă fără card”", url.pathname === "/ro/dashboard/family", url.pathname);
    const after = await reload(u.id);
    check("1 contul devine de părinte", after?.accountRole === "PARENT", JSON.stringify(after));
    check("1 codul V126S e păstrat pe cont, pentru plată", after?.pendingVoucherCode === "V126S", JSON.stringify(after));
    check("1 campania (codul de pe flyer) e notată o dată", (await campaignRows(u.id)) === 1);
    const sess = await (await ctx.request.get(`${BASE}/api/auth/session`)).json();
    check("1 sesiunea știe imediat că e părinte (fără să aștepte 5 minute)", sess?.user?.accountRole === "PARENT", JSON.stringify(sess?.user ?? null));

    const again = await finish(page, "plan=FAMILY&voucher=V126S&start=free");
    check("1 a doua vizită nu mai schimbă nimic și duce în panou", again.pathname === "/ro/dashboard", again.pathname);
    check("1 a doua vizită nu notează campania de două ori", (await campaignRows(u.id)) === 1);

    // Price on the page = price at checkout, for this very account (still in its free week).
    await page.goto(`${BASE}/ro/parinte?voucher=V126S`);
    const text = await page.locator("body").innerText();
    const shown = text.match(/(\d+,\d{2}) lei pe lună dacă plătești (?:cât ține proba|până pe [^,]+),/);
    const plan = await prisma.subscriptionPlan.findFirst({ where: { familyPlanKey: "FAMILY", interval: "MONTH", isActive: true } });
    const before = brokerCalls.length;
    const res = await ctx.request.post(`${BASE}/api/admin/stripe/checkout`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ planId: plan.id, voucherCode: "V126S" }),
      failOnStatusCode: false,
    });
    const sent = brokerCalls[before];
    const charged = (sent?.lineItems ?? []).reduce((sum, l) => sum + Math.round(l.amount * 100), 0);
    const shownMinor = shown ? Math.round(Number(shown[1].replace(",", ".")) * 100) : NaN;
    check("3 pagina arată în probă un preț, iar plata cere exact același", res.status() === 200 && shownMinor === charged && charged > 0, JSON.stringify({ status: res.status(), shown: shown?.[1], charged }));
    check("3 butonul „Începe cu …” are aceeași sumă", text.includes(`Începe cu ${shown?.[1]} lei/lună`));
    check("3 cont deja făcut: pe pagină nu mai apare „Continuă cu Google”", (await page.getByRole("button", { name: /Continuă cu Google/ }).count()) === 0);
    check("3 cont în probă: prețul spune până când ține (data), nu „cât ține proba”", /dacă plătești până pe \d{1,2} \p{L}+/u.test(text), shown?.[0]);
    await ctx.close();
  }

  // Conturi care NU trebuie schimbate.
  {
    const ctx = await newCtx();
    const page = await ctx.newPage();
    const u = await account("elev", { accountRole: "STUDENT" });
    await asGoogle(ctx, u);
    const url = await finish(page, "plan=FAMILY&voucher=V126S&start=free");
    const after = await reload(u.id);
    check("1 cont care are deja rol (elev): rămâne elev, intră în panou", after?.accountRole === "STUDENT" && url.pathname === "/ro/dashboard", JSON.stringify({ after, path: url.pathname }));
    check("1 …și nu i se notează nicio campanie", (await campaignRows(u.id)) === 0);
    await ctx.close();
  }
  {
    const ctx = await newCtx();
    const page = await ctx.newPage();
    const u = await account("vechi", { createdAt: new Date(Date.now() - 40 * 60_000) });
    await asGoogle(ctx, u);
    await finish(page, "plan=FAMILY&start=free");
    check("1 cont fără rol, dar făcut acum 40 de minute: nu primește rol", (await reload(u.id))?.accountRole === null);
    await ctx.close();
  }
  {
    const ctx = await newCtx();
    const page = await ctx.newPage();
    const u = await account("cu-parola");
    await login(ctx, u.email);
    await finish(page, "plan=FAMILY&start=free");
    check("1 cont făcut cu parolă (nu prin Google): nu primește rol aici", (await reload(u.id))?.accountRole === null);
    await ctx.close();
  }
  {
    const ctx = await newCtx();
    const page = await ctx.newPage();
    const u = await account("intoarcere");
    await asGoogle(ctx, u);
    const url = await finish(page, `plan=FAMILY&voucher=${encodeURIComponent("<b>x")}&start=free&returnTo=${encodeURIComponent("//evil.example/x")}`);
    check("1 întoarcere spre alt site ignorată; cod stricat ignorat", url.host === new URL(BASE).host && url.pathname === "/ro/dashboard/family", url.href);
    check("1 …contul tot devine de părinte, fără cod păstrat", JSON.stringify(await reload(u.id)) === JSON.stringify({ accountRole: "PARENT", pendingVoucherCode: null }));
    await ctx.close();
  }
  {
    const ctx = await newCtx();
    const page = await ctx.newPage();
    const u = await account("invitatie");
    await asGoogle(ctx, u);
    const url = await finish(page, `returnTo=${encodeURIComponent("/dashboard/settings")}`);
    check("1 venit de pe o invitație: se întoarce acolo", url.pathname === "/ro/dashboard/settings", url.pathname);
    await ctx.close();
  }
  {
    const ctx = await newCtx();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/ro/auth/google-done?plan=FAMILY`);
    await page.waitForLoadState("networkidle").catch(() => {});
    check("1 fără sesiune: pagina trimite la autentificare", new URL(page.url()).pathname === "/ro/auth/signin", page.url());
    await ctx.close();
  }

  {
    // A child's account (signed in, linked to a parent) must not get a page of prices (UCPD).
    const ctx = await newCtx();
    const page = await ctx.newPage();
    const parent = await account("parinte-copil", { accountRole: "PARENT" });
    const child = await account("copil", { accountRole: "STUDENT", birthDate: new Date("2012-05-01") });
    await prisma.guardian.create({ data: { parentId: parent.id, childId: child.id, relation: "PARENT", status: "active" } });
    await login(ctx, child.email);
    await page.goto(`${BASE}/ro/parinte?voucher=V126S`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.locator("body").innerText();
    check("3 copilul logat care deschide pagina pentru părinți ajunge în panoul lui, fără prețuri", new URL(page.url()).pathname.startsWith("/ro/dashboard") && !/lei pe lună|sub 1 leu/.test(body), page.url());
    await ctx.close();
  }

  // ── 2. butonul la înscriere ──
  {
    const ctx = await newCtx();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/ro/auth/register?plan=FAMILY&voucher=V126S&start=free`);
    const g = page.getByRole("button", { name: /Continuă cu Google/ });
    check("2 înscriere de părinte: butonul Google e acolo", (await g.count()) === 1);
    const req = page.waitForRequest((r) => r.url().includes("/api/auth/signin/google"), { timeout: 10000 }).catch(() => null);
    await g.click();
    const r = await req;
    const cb = r ? new URLSearchParams(r.postData() ?? "").get("callbackUrl") ?? "" : "";
    check(
      "2 Google pornește cu întoarcere la pagina de final, cu planul, codul și proba",
      cb.includes("/ro/auth/google-done?") && cb.includes("plan=FAMILY") && cb.includes("voucher=V126S") && cb.includes("start=free"),
      cb,
    );
    await page.goto(`${BASE}/ro/auth/register`);
    check("2 înscriere de elev (implicit): fără buton Google", (await page.getByRole("button", { name: /Continuă cu Google/ }).count()) === 0);
    await page.getByRole("radio", { name: "Părinte" }).click();
    check("2 elevul care alege „Părinte”: butonul apare", (await page.getByRole("button", { name: /Continuă cu Google/ }).count()) === 1);

    // ── 3. primul ecran, vizitator nou ──
    await page.goto(`${BASE}/ro/parinte?voucher=V126S`);
    const body = await page.locator("body").innerText();
    check("3 vizitator nou: „sub 1 leu pe zi”", body.includes("sub 1 leu pe zi"));
    check("3 vizitator nou: 23,24 în probă, 24,90 cu codul, Family spus", body.includes("23,24 lei pe lună dacă plătești cât ține proba") && body.includes("24,90 lei cu codul V126S") && body.includes("Family: 1 părinte, 1 copil, o materie."));
    check("3 exemplul e marcat ca exemplu", body.includes("exemplu: ce vezi în contul tău"));
    check("3 „Câte grile” sau „Continuă cu Google” pentru vizitator: Google e acolo", (await page.getByRole("button", { name: /Continuă cu Google/ }).count()) === 1);
    const req2 = page.waitForRequest((r) => r.url().includes("/api/auth/signin/google"), { timeout: 10000 }).catch(() => null);
    await page.getByRole("button", { name: /Continuă cu Google/ }).click();
    const r2 = await req2;
    const cb2 = r2 ? new URLSearchParams(r2.postData() ?? "").get("callbackUrl") ?? "" : "";
    check("3 Google de pe pagină: plan Family, codul de pe flyer, proba", cb2.includes("plan=FAMILY") && cb2.includes("voucher=V126S") && cb2.includes("start=free"), cb2);
    await ctx.close();
  }
} finally {
  await browser.close();
  broker.close();
  await prisma.campaignSignup.deleteMany({ where: { userId: { in: made } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: made } } }).catch((e) => console.log("curățenie:", e.message));
  await prisma.$disconnect();
}

console.log(fail === 0 ? "\ntoate verificările au trecut" : `\n${fail} verificări au picat`);
process.exit(fail === 0 ? 0 : 1);
