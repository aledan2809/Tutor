// Verificarea lotului din observațiile testerului (14.10.2026), pe stiva QA, pe telefon:
//   1. bannerul probei spune data de final, ca ceasul de sus — nu „mai ai 7 zile” lângă „6z 13:22”;
//   2. proba lasă oricâți copii și oricâte materii, iar pagina și „Familia mea” o spun înainte de card;
//   3. /ro/parinte e scurtă (restul se deschide la apăsare) și Family e la singular („dacă materia aleasă le are”);
//   4. invitația pe WhatsApp pleacă din WhatsApp-ul părintelui, și din lista invitațiilor în așteptare.
//   BASE=http://localhost:3113 node Reports/tester-2026-10-15/verificare.mjs
// Creează un cont de părinte de probă în baza QA (ca celelalte verificări); nu se rulează pe prod.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const { chromium, devices } = createRequire(process.cwd() + "/package.json")("playwright");
const BASE = (process.env.BASE || "http://localhost:3113").replace(/\/$/, "");
const OUT = new URL("./capturi/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const sql = (q) => execSync(`docker exec -i tutor-qa-pg psql -U tutor -d tutor_qa -v ON_ERROR_STOP=1 -tA`, { input: q }).toString().trim();

let fail = 0;
const check = (ok, what) => {
  console.log(`${ok ? "✓" : "✗"} ${what}`);
  if (!ok) fail++;
};
const stamp = Date.now();
const browser = await chromium.launch();
const ctxOpts = { ...devices["iPhone 13"], locale: "ro-RO", serviceWorkers: "block" };
const words = (t) => t.split(/\s+/).filter(Boolean).length;

try {
  // ── 3 (+2): pagina pentru părinți ──
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${BASE}/ro/parinte`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Respinge" }).click().catch(() => {});
    const visible = await page.evaluate(() => document.body.innerText);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    check(words(visible) < 700, `3 pagina are ${words(visible)} cuvinte la vedere (era ~1.477), înălțime ${height}px`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "3 fără derulare pe orizontală la 390 px");
    const hero = (await page.locator("#parinte-sus a").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    check(/Încearcă 7 zile fără card/.test(hero[0] ?? ""), `3 primul buton rămâne „Încearcă 7 zile fără card” (${hero[0]})`);
    check(await page.getByText("*Family: 1 părinte + 1 copil, o materie.").first().isVisible(), "3 condiția planului rămâne lângă preț, la vedere");
    const terms = page.locator("summary", { hasText: "Condițiile ofertei" });
    check(await terms.isVisible(), "3 condițiile codului sunt sub „Condițiile ofertei”");
    await terms.click();
    check(await page.getByText(/Activezi codul ONV126S până la/).first().isVisible(), "3 „Condițiile ofertei” se deschide cu textul codului");
    for (const title of ["Vezi ce a lucrat azi", "Reminderele îl găsesc singure", "Te anunțăm doar dacă ignoră tot"]) {
      check(await page.locator("summary", { hasText: title }).isVisible(), `3 „Ce primești”: „${title}”`);
    }
    check(!(await page.locator("ol").filter({ hasText: "Telegram" }).first().isVisible()), "3 lanțul de remindere e închis la început");
    await page.locator("summary", { hasText: "Reminderele îl găsesc singure" }).click();
    check(await page.locator("ol").filter({ hasText: "Telegram" }).first().isVisible(), "3 la apăsare se vede lanțul de remindere (conținutul de dinainte, păstrat)");
    check((await page.getByText("la materiile care le au").count()) === 0 && (await page.getByText("dacă materia aleasă le are").isVisible()),
      "3 Family la singular: „Simulări de examen și lecții structurate, dacă materia aleasă le are”");
    check(await page.getByText("Proba de 7 zile, pe înțeles").isVisible() && (await page.getByText(/oricâți copii și oricâte materii/).first().isVisible()),
      "2 pagina spune că proba lasă oricâți copii și oricâte materii, și ce acoperă Family după");
    const openFaq = await page.evaluate(() => [...document.querySelectorAll("details[open]")].map((d) => d.querySelector("summary")?.textContent?.trim()));
    check(openFaq.length === 2 && openFaq.includes("Reminderele îl găsesc singure"), `3 întrebările frecvente pornesc închise (deschise acum: ${openFaq.join(" | ")})`);
    check(await page.locator("summary", { hasText: "Am doi copii sau mai multe materii. Cât plătesc?" }).isVisible(), "2 întrebarea „Am doi copii sau mai multe materii. Cât plătesc?”");
    check((await page.getByText("De aici în aplicație, în 4 pași").count()) === 0 && (await page.getByText("5 minute: contul tău → invitația copilului → programul lui.").isVisible()),
      "3 „În 4 pași” e un singur rând la final");
    check(errors.length === 0, `3 fără erori în pagină${errors.length ? `: ${errors.join(" | ")}` : ""}`);
    await page.screenshot({ path: `${OUT}3-parinte-telefon.png`, fullPage: true });
    await ctx.close();
  }

  // ── 1, 2, 4: părinte nou ──
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ro/auth/register`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Respinge" }).click().catch(() => {});
  await page.getByRole("radio", { name: "Părinte" }).click();
  const email = `qa-tester-${stamp}@qa-parinte.ro`;
  await page.getByPlaceholder("Numele tău").fill("QA Tester");
  await page.getByPlaceholder("tu@exemplu.ro").fill(email);
  await page.getByPlaceholder("Minimum 8 caractere").fill("qa-parola-123");
  await page.getByRole("button", { name: "Creează cont" }).click();
  await page.waitForURL((u) => /\/dashboard\/?$/.test(u.pathname), { timeout: 60000 });
  await page.waitForLoadState("networkidle");

  // 1: data de final în banner, aceeași cu cea a probei (crearea contului + 7 zile, ora României).
  const created = new Date(sql(`SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') FROM "User" WHERE email = '${email}'`));
  const ends = new Date(created.getTime() + 7 * 864e5);
  const p = Object.fromEntries(new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(ends).map((x) => [x.type, x.value]));
  const expected = `până ${p.weekday}, ${p.day} ${p.month}, la ${p.hour}:${p.minute}`;
  const banner = page.locator("main").getByText(/^Proba gratuită ·/);
  const bannerText = (await banner.first().textContent())?.replace(/\s+/g, " ").trim();
  check(bannerText === `Proba gratuită · ${expected}`, `1 bannerul: „${bannerText}” (așteptat „Proba gratuită · ${expected}”)`);
  check((await page.locator("main").getByText(/mai ai \d+ zile/).count()) === 0, "1 bannerul nu mai spune „mai ai N zile”");
  check(await page.locator("main").getByText(/În probă încerci tot: oricâți copii și oricâte materii/).isVisible(), "2 bannerul părintelui spune că proba lasă tot");
  await page.screenshot({ path: `${OUT}1-banner.png` });

  // 2: „Familia mea” spune ce acoperă Family după probă.
  await page.goto(`${BASE}/ro/dashboard/family`, { waitUntil: "networkidle" });
  check(await page.getByText(/În probă au acces toți copiii și toate materiile\. După probă, Family acoperă un copil și o materie/).isVisible(),
    "2 „Familia mea” spune ce acoperă Family după probă");

  // 4: invitația pe WhatsApp.
  await page.getByRole("button", { name: "Adaugă copil" }).click();
  await page.getByRole("button", { name: "WhatsApp", exact: true }).click();
  await page.getByPlaceholder("+407…").fill("0724 000 111");
  await page.getByRole("button", { name: "Trimite invitația" }).click();
  await page.getByText("Ultimul pas: apasă „Trimite pe WhatsApp”").waitFor({ timeout: 20000 }).catch(() => {});
  check(await page.getByText("Ultimul pas: apasă „Trimite pe WhatsApp”").isVisible(), "4 după trimitere: „Ultimul pas: apasă «Trimite pe WhatsApp»” (nu „canalul direct nu a putut livra”)");
  const wa = page.getByRole("link", { name: "Trimite pe WhatsApp" }).first();
  const href = (await wa.getAttribute("href")) ?? "";
  const text = decodeURIComponent(href.split("?text=")[1] ?? "");
  check(href.startsWith("https://wa.me/40724000111?text="), `4 butonul deschide WhatsApp spre numărul copilului (${href.slice(0, 40)}…)`);
  check(/^Salut! Te-am adăugat în familia noastră pe eTutor\.ro/.test(text) && /\/family\/accept\/[\w-]+$/.test(text), "4 mesajul e gata scris și are linkul de acceptare");
  check(await page.getByRole("button", { name: "Copiază invitația" }).first().isVisible(), "4 și „Copiază invitația”");
  await page.screenshot({ path: `${OUT}4-invitatie-whatsapp.png` });
  // Lista „Invitații în așteptare”: același buton, după reîncărcare.
  await page.reload({ waitUntil: "networkidle" });
  const pending = page.locator("div", { hasText: /^copil · 0724 000 111/ }).last();
  const pHref = (await page.getByRole("link", { name: "Trimite pe WhatsApp" }).first().getAttribute("href")) ?? "";
  check(pHref.startsWith("https://wa.me/40724000111?text=") && decodeURIComponent(pHref).includes("/family/accept/"),
    "4 invitația în așteptare se poate retrimite pe WhatsApp după reîncărcare");
  const token = sql(`SELECT token FROM "FamilyInvite" WHERE "inviterId" = (SELECT id FROM "User" WHERE email = '${email}') AND channel = 'WHATSAPP'`);
  check(token.length > 0 && decodeURIComponent(pHref).endsWith(`/family/accept/${token}`), "4 linkul e chiar al acestei invitații");
  await pending.screenshot({ path: `${OUT}4-in-asteptare.png` }).catch(() => {});
  // O invitație trecută de cele 7 zile rămâne „în așteptare”: nu se mai oferă linkul ei, care nu mai merge (revizia OpenAI).
  sql(`UPDATE "FamilyInvite" SET "expiresAt" = now() - interval '1 hour' WHERE token = '${token}'`);
  await page.reload({ waitUntil: "networkidle" });
  check(await page.getByText("Invitația a expirat — anuleaz-o și trimite una nouă.").isVisible() &&
    (await page.getByRole("link", { name: "Trimite pe WhatsApp" }).count()) === 0,
    "4 o invitație expirată nu mai oferă linkul: „Invitația a expirat — anuleaz-o și trimite una nouă.”");
  await page.screenshot({ path: `${OUT}4-familia-mea.png`, fullPage: true });
  await ctx.close();
} finally {
  await browser.close();
}
console.log(fail ? `\n${fail} verificări picate` : "\ntoate verificările au trecut");
process.exit(fail ? 1 : 0);
