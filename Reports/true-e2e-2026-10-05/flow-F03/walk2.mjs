import { createRequire } from "node:module";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium, devices } = require("playwright");
const BASE = "http://localhost:3113";
const ROOT = "/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05";
const MAIL = ROOT + "/mailbox";
const MODE = process.argv[2] || "mobile";
const DIR = `${ROOT}/flow-F03/${MODE}-r2`;
mkdirSync(DIR, { recursive: true });
const TS = Date.now().toString().slice(-7);
const P1 = `qa-e2e-1005-f03-p1-${MODE}-${TS}@example.com`;
const P2 = `qa-e2e-1005-f03-p2-${MODE}-${TS}@example.com`;
const P3 = `qa-e2e-1005-f03-p3-${MODE}-${TS}@example.com`;
const PASS = "ParolaTest-1005!";
const sql = (q) => execSync(`docker exec tutor-qa-pg psql -U tutor -d tutor_qa -At -c "${q.replace(/"/g, '\\"')}"`).toString().trim();
const steps = []; let taps = 0, n = 0; const t0 = Date.now();
const errs = [];
const mkctx = async (browser) => {
  const opts = MODE === "mobile"
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent, locale: "ro-RO" }
    : { viewport: { width: 1440, height: 900 }, locale: "ro-RO" };
  const c = await browser.newContext(opts); const p = await c.newPage();
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  p.on("response", (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) errs.push(`${r.status()} ${r.url().replace(BASE, "")}`); });
  return p;
};
const shot = async (p, name, note = "") => {
  n++; const id = String(n).padStart(2, "0");
  await p.screenshot({ path: `${DIR}/${id}-${name}.png`, fullPage: false });
  const btns = await p.locator("button:visible, a:visible").evaluateAll((els) => els.map((e) => ({ t: e.innerText.trim().slice(0, 50), y: Math.round(e.getBoundingClientRect().top) })).filter((x) => x.t)).catch(() => []);
  const text = (await p.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 900);
  steps.push({ n: id, name, note, taps, sec: Math.round((Date.now() - t0) / 1000), url: p.url().replace(BASE, ""), title: await p.title(), btns: btns.slice(0, 25), text, errs: errs.splice(0) });
  console.log(id, name, p.url().replace(BASE, ""), `[${taps} taps, ${Math.round((Date.now() - t0) / 1000)}s]`, note, "\n   ", text.slice(0, 220));
};
const tap = async (l) => { taps++; await l.click(); };
const settle = async (p, ms = 1500) => { await p.waitForLoadState("networkidle").catch(() => {}); await p.waitForTimeout(ms); };
const mail = async (to, tries = 60) => {
  for (let i = 0; i < tries; i++) {
    for (const f of readdirSync(MAIL)) { if (!f.endsWith(".json")) continue; try { const j = JSON.parse(readFileSync(`${MAIL}/${f}`, "utf8")); if ((Array.isArray(j.to) ? j.to.join() : j.to).includes(to)) return j; } catch {} }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
};
const register = async (p, email, name) => {
  const inputs = p.locator("form input:not([type=checkbox]):not([type=hidden])");
  await inputs.nth(0).fill(name); await inputs.nth(1).fill(email); await inputs.nth(2).fill(PASS); await inputs.nth(3).fill(PASS);
  const boxes = p.locator("form input[type=checkbox]"); for (let i = 0; i < await boxes.count(); i++) await boxes.nth(i).check().catch(() => {});
};
const browser = await chromium.launch();
try {
  const p = await mkctx(browser);
  // P1: parent via landing
  await p.goto(`${BASE}/ro/parinte`, { waitUntil: "networkidle" });
  await p.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 2000 }).catch(() => {});
  await tap(p.getByRole("link", { name: /Încearcă fără card/i }).first()); await settle(p);
  await shot(p, "p1-register");
  await register(p, P1, "Părinte QA Unu");
  await tap(p.locator("form button[type=submit]"));
  await p.waitForURL((u) => !u.pathname.includes("/auth/register"), { timeout: 30000 }).catch(() => {}); await settle(p);
  await shot(p, "p1-dupa-register");
  if (/verify/.test(p.url())) { const m = await mail(P1); if (m) { await p.goto(m.links.find((l) => /verify/.test(l)) || m.links[0]); await settle(p); await shot(p, "p1-verificat"); } }
  await p.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" }); await settle(p);
  await shot(p, "p1-familia-mea-proba");
  const addP = p.locator("button", { hasText: /Adaugă al 2-lea părinte/ }).first();
  const info = await addP.evaluate((e) => ({ disabled: e.disabled, aria: e.getAttribute("aria-disabled"), cls: e.className.slice(0, 120), next: (e.parentElement?.innerText || "").replace(/\s+/g, " ").slice(0, 400), y: Math.round(e.getBoundingClientRect().top), vh: innerHeight })).catch((e) => ({ err: String(e) }));
  steps.push({ n: "--", name: "hipoteza-blocat", info });
  console.log("hipoteza:", JSON.stringify(info));
  await addP.scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(500); await shot(p, "p1-adauga-parinte-in-vizor");
  const before = (await p.locator("body").innerText()).length;
  await addP.click({ timeout: 4000 }).catch((e) => console.log("click err", e.message.slice(0, 100))); await settle(p, 1200);
  const after = (await p.locator("body").innerText()).replace(/\s+/g, " ");
  steps.push({ n: "--", name: "dupa-click-in-proba", bodyLenDelta: after.length - before, tail: after.slice(after.indexOf("Familia mea"), after.indexOf("Familia mea") + 900) });
  await shot(p, "p1-click-adauga-parinte-in-proba");
  // copil (cont direct) ca să existe ceva de văzut
  await tap(p.locator("button", { hasText: /Adaugă copil/ }).first()); await settle(p, 800);
  await tap(p.locator("button", { hasText: /Creează contul direct/ }).first()); await p.waitForTimeout(600);
  await p.getByPlaceholder("Numele copilului").fill("Copil QA " + TS);
  await p.getByPlaceholder("Emailul copilului (opțional)").fill(`qa-e2e-1005-f03-c-${MODE}-${TS}@example.com`);
  await p.getByPlaceholder("Parolă (min. 8 caractere)").fill(PASS);
  await tap(p.locator("button", { hasText: /Creează contul copilului/ }).first()); await settle(p, 3000);
  await shot(p, "p1-copil-creat");
  // QA DB: copilul și-a ales o materie (în flux real o face copilul la prima intrare, cf. F02)
  sql(`insert into "Enrollment"(id,"userId","domainId",roles,"isActive","updatedAt") select 'qa1005'||substr(md5(random()::text),1,12), u.id, (select id from "Domain" order by "createdAt" limit 1), '{STUDENT}', true, now() from "User" u where u.email='qa-e2e-1005-f03-c-${MODE}-${TS}@example.com'`);
  // upgrade on QA DB
  sql(`update "User" set "subscriptionStatus"='active', "subscriptionPlanId"=(select id from "SubscriptionPlan" where "familyPlanKey"='FAMILY_DUO' and interval='MONTH') where email='${P1}'`);
  await p.reload({ waitUntil: "networkidle" }); await settle(p);
  await shot(p, "p1-familia-mea-duo-activ");
  await tap(p.locator("button", { hasText: /Adaugă al 2-lea părinte/ }).first()); await settle(p, 800);
  await shot(p, "p1-formular-invitatie");
  await tap(p.locator("button", { hasText: /^Email$/ }).first());
  await p.getByPlaceholder("email@exemplu.ro").fill(P2);
  await tap(p.locator("button", { hasText: /Trimite invitația/ })); await settle(p, 2500);
  await shot(p, "p1-invitatie-trimisa");
  const m2 = await mail(P2); const link = m2?.links?.find((l) => /family\/accept/.test(l));
  steps.push({ n: "--", name: "email-invitatie", subject: m2?.subject, link, text: m2?.text?.slice(0, 600) });
  console.log("mail:", m2?.subject, link);
  if (!link) throw new Error("BLOCKED: no invite link in mailbox");
  const url = link.replace(/^https?:\/\/[^/]+/, BASE);
  // P2: clean session
  const tStart = Date.now(); taps = 0;
  const q = await mkctx(browser);
  await q.goto(url, { waitUntil: "networkidle" }); await settle(q, 500);
  await shot(q, "p2-accept-vizitator", "tema/brand");
  await tap(q.getByRole("link", { name: /Fă-ți cont/ })); await settle(q);
  await shot(q, "p2-register-preselectat");
  const roleSel = await q.locator('[aria-checked="true"], [aria-pressed="true"], input[type=radio]:checked').allInnerTexts().catch(() => []);
  steps.push({ n: "--", name: "rol-preselectat", roleSel });
  await register(q, P2, "Părinte QA Doi");
  await tap(q.locator("form button[type=submit]"));
  await q.waitForURL((u) => !u.pathname.includes("/auth/register"), { timeout: 30000 }).catch(() => {}); await settle(q);
  await shot(q, "p2-dupa-register");
  if (/verify/.test(q.url())) { const m = await mail(P2); const vl = m?.links?.find((l) => /verify/.test(l)); if (vl) { await q.goto(vl.replace(/^https?:\/\/[^/]+/, BASE)); await settle(q); await shot(q, "p2-verificat"); } }
  if (!/family\/accept/.test(q.url())) { await q.goto(url, { waitUntil: "networkidle" }); steps.push({ n: "--", name: "NU s-a intors automat la accept", url: q.url() }); }
  await settle(q, 800);
  await shot(q, "p2-accept-logat");
  await tap(q.locator("button", { hasText: /Accept/ }).first()); await settle(q, 2500);
  await shot(q, "p2-dupa-accept");
  const landed = q.url(); const navLinks = await q.locator("a:visible").evaluateAll((a) => a.map((x) => x.innerText.trim() + " -> " + x.getAttribute("href")).filter((t) => t.length > 6)).catch(() => []);
  steps.push({ n: "--", name: "p2-aterizare-dupa-accept", landed, navLinks, body: (await q.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 1200) });
  await q.goto(`${BASE}/ro/dashboard/watcher`, { waitUntil: "networkidle" }); await settle(q);
  steps.push({ n: "--", name: "watcher-final-url", url: q.url(), body: (await q.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 1500) });
  await shot(q, "p2-monitorizare-first-value", `secunde de la link: ${Math.round((Date.now() - tStart) / 1000)}, taps ${taps}`);
  steps.push({ n: "--", name: "FIRST VALUE", secFromLink: Math.round((Date.now() - tStart) / 1000), taps });
  await q.goto(`${BASE}/ro/dashboard/watcher`, { waitUntil: "networkidle" }); await settle(q, 2000);
  await shot(q, "p2-watcher-imediat-dupa-accept", "sesiune veche, fără re-login");
  await q.locator("button", { hasText: /Panou complet/ }).click().catch(() => {}); await settle(q, 2500);
  await shot(q, "p2-panou-complet");
  for (const u of ["watcher", "progress", "rapoarte", "notifications"]) { await q.goto(`${BASE}/ro/dashboard/${u}`, { waitUntil: "networkidle" }); await settle(q, 2000); await shot(q, "p2-" + u); }
  await q.context().clearCookies(); await q.goto(`${BASE}/ro/auth/signin`, { waitUntil: "networkidle" });
  await q.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 1500 }).catch(() => {});
  await q.fill("#email", P2); await q.fill("#password", PASS); await q.locator('form button[type="submit"]').first().click(); await settle(q, 3000);
  await shot(q, "p2-relogin");
  await q.goto(`${BASE}/ro/dashboard/watcher`, { waitUntil: "networkidle" }); await settle(q, 2500);
  await shot(q, "p2-watcher-dupa-relogin");
  await q.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" }); await settle(q);
  await shot(q, "p2-familia-mea");
  await q.goto(`${BASE}/ro/dashboard/packages`, { waitUntil: "networkidle" }).catch(() => {}); await settle(q, 800);
  await shot(q, "p2-abonament-preturi");
  // replay
  const r = await mkctx(browser);
  await r.goto(url, { waitUntil: "networkidle" }); await shot(r, "p3-link-refolosit-vizitator");
  await tap(r.getByRole("link", { name: /Fă-ți cont/ }).first()).catch(() => {});
  await settle(r);
  if (/register/.test(r.url())) { await register(r, P3, "Părinte QA Trei"); await tap(r.locator("form button[type=submit]")); await r.waitForURL((u) => !u.pathname.includes("/auth/register"), { timeout: 30000 }).catch(() => {}); await settle(r); await r.goto(url, { waitUntil: "networkidle" }); await shot(r, "p3-link-refolosit-logat"); }
  // English locale
  const e = await mkctx(browser); await e.goto(url.replace(BASE + "/", BASE + "/en/"), { waitUntil: "networkidle" }); await shot(e, "en-accept");
} catch (err) { console.log("ERR", err.message); steps.push({ n: "--", name: "EROARE", msg: err.message }); }
finally {
  writeFileSync(`${DIR}/steps.json`, JSON.stringify(steps, null, 1));
  try { sql(`delete from "FamilyInvite" where "inviterId" in (select id from "User" where email like 'qa-e2e-1005-f03-%-${MODE}-${TS}%')`); } catch (e) { console.log("cleanup invite", e.message.slice(0,150)); }
  await browser.close();
}
