// Verificarea pasului 10 (formular, clasă+capitole cu un buton, primul test, prima grilă) pe stiva QA, pe telefon.
//   BASE=http://localhost:3113 node Reports/formular-calibrare-2026-10-14/verificare.mjs
// Două conturi noi de elev (14 ani): A confirmă cu un buton, B deschide lista completă. A termină primul test și
// pornește al doilea, care trebuie să fie din nou cel obișnuit (15 întrebări, cu cronometru). Iese cu 1 la orice abatere.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const { chromium, devices } = createRequire(process.cwd() + "/package.json")("playwright");
const BASE = (process.env.BASE || "http://localhost:3113").replace(/\/$/, "");
const OUT = new URL("./capturi/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

let fail = 0;
const check = (ok, what) => {
  console.log(`${ok ? "✓" : "✗"} ${what}`);
  if (!ok) fail++;
};

async function newStudent(browser, tag) {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/ro/auth/register`, { waitUntil: "networkidle" });
  const decline = page.getByRole("button", { name: "Respinge" });
  if (await decline.isVisible().catch(() => false)) await decline.click();

  check((await page.getByText("Confirmă parola").count()) === 0, `[${tag}] formularul nu mai are „Confirmă parola”`);
  check((await page.getByText("Materii (poți alege").count()) === 0, `[${tag}] formularul nu mai are lista de materii`);
  const email = `qa-elev-${tag.toLowerCase()}-${Date.now()}@qa-elev.ro`;
  await page.getByPlaceholder("Numele tău").fill(`QA Elev ${tag}`);
  await page.getByPlaceholder("tu@exemplu.ro").fill(email);
  await page.selectOption("#birth-day", "15");
  await page.selectOption("#birth-month", "5");
  await page.selectOption("#birth-year", "2012");
  // O adresă nouă la fiecare rulare: o adresă primește doar câteva e-mailuri de acord pe zi (parent-consent-server.ts).
  await page.locator("#parent-email").fill(`parinte-${tag.toLowerCase()}-${Date.now()}@qa-parinte.ro`);
  await page.getByPlaceholder("Minimum 8 caractere").fill("qa-parola-123");
  if (tag === "A") await page.screenshot({ path: `${OUT}A-1-formular.png` });
  await page.getByRole("button", { name: "Creează cont" }).click();
  // Doar panoul real: adresa paginii de intrare conține și ea „dashboard” (în callbackUrl).
  await page.waitForURL((u) => /\/dashboard\/?$/.test(u.pathname), { timeout: 60000 }).catch(() => {
    throw new Error(`[${tag}] după înscriere nu a ajuns pe panou, ci pe ${page.url()}`);
  });
  await page.waitForLoadState("networkidle");

  // Asistentul de început: materia, apoi testul scurt.
  await page.getByRole("button", { name: /Matematica cl\. VIII/ }).click({ timeout: 30000 }).catch(async (e) => {
    await page.screenshot({ path: `${OUT}${tag}-eroare-materia.png`, fullPage: true });
    console.log(`[${tag}] butoane pe panou:`, JSON.stringify(await page.locator("main button").allTextContents()));
    throw e;
  });
  await page.getByRole("button", { name: "Începe testul ▶" }).click();
  await page.waitForURL(/\/dashboard\/practice/, { timeout: 60000 });
  await page.getByText("Ultimul pas").waitFor({ timeout: 30000 });
  return { ctx, page, errors, email };
}

const browser = await chromium.launch();

// ── A: un buton ──
{
  const { ctx, page, errors } = await newStudent(browser, "A");
  check(await page.getByText("Ești în clasa a VIII-a?").isVisible(), "[A] clasa propusă: a VIII-a (din data nașterii)");
  check(await page.getByText("Am ales-o după data nașterii").isVisible(), "[A] spune că e aleasă după data nașterii");
  const summary = (await page.getByText("Am bifat ce ar fi trebuit predat").textContent()) ?? "";
  check(/\d+ (de )?lecții|o lecție/.test(summary), `[A] numără lecțiile bifate („${summary.trim().slice(0, 90)}…”)`);
  const confirm = page.getByRole("button", { name: "Da, e corect — începe testul" });
  const box = await confirm.boundingBox();
  check(box && box.y + box.height <= page.viewportSize().height, "[A] butonul de confirmare e pe primul ecran");
  await page.screenshot({ path: `${OUT}A-2-ultimul-pas.png` });

  await confirm.click();
  await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 60000 });
  await page.getByText(/Întrebarea 1 din/).waitFor();
  check(await page.getByText("Întrebarea 1 din 5").isVisible(), "[A] primul test are 5 întrebări");
  check(await page.getByText("fără cronometru").isVisible(), "[A] primul test e fără cronometru");
  await page.waitForTimeout(800);
  // Bara de sus (cu ceasul probei) rămâne; bannerul mare și anunțul despre acordul părintelui, nu.
  check((await page.locator("main").getByText("Proba gratuită").count()) === 0, "[A] bannerul mare al probei nu apare în test");
  check((await page.locator("main").getByText("Am trimis un email").count()) === 0, "[A] anunțul despre acordul părintelui nu apare în test");
  check((await page.evaluate(() => window.scrollY)) === 0, "[A] testul se deschide de sus (bara de sus vizibilă)");
  const answers = page.locator("button", { hasText: /^\s*[A-D]\./ });
  const n = await answers.count();
  const last = n ? await answers.nth(n - 1).boundingBox() : null;
  const head = await page.locator("main h1").boundingBox();
  const qText = await page.locator("main p.whitespace-pre-line").first().boundingBox();
  const hasFigure = (await page.locator('main img[alt^="Figura"]').count()) > 0;
  check(head && head.y <= 90, `[A] titlul testului începe sus, imediat sub bara de sus (y=${Math.round(head?.y ?? -1)})`);
  // Bara de jos (meniul elevului) are 62 px. O întrebare scurtă trebuie să-și arate toate răspunsurile;
  // una lungă sau cu figură nu poate pe un telefon — atunci doar raportăm.
  const fits = n >= 2 && last && last.y + last.height <= page.viewportSize().height - 62;
  const longQuestion = hasFigure || (qText && qText.height > 120);
  if (longQuestion && !fits) console.log(`ℹ [A] întrebare lungă/cu figură (text ${Math.round(qText?.height ?? 0)} px, figură: ${hasFigure ? "da" : "nu"}): răspunsurile cer derulare`);
  else check(fits, `[A] toate cele ${n} răspunsuri pe primul ecran`);
  await page.screenshot({ path: `${OUT}A-3-prima-grila.png` });

  // Termină primul test (răspunde cu prima variantă la fiecare întrebare).
  for (let i = 0; i < 5; i++) {
    await answers.first().click();
    const submit = page.getByRole("button", { name: "Trimite răspunsul" });
    if (await submit.isVisible().catch(() => false)) await submit.click();
    const next = page.getByRole("button", { name: /Următoarea întrebare|rezultat|Termină/i }).last();
    await next.waitFor({ timeout: 30000 });
    await next.click();
    await page.waitForTimeout(600);
  }
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${OUT}A-4-dupa-test.png` });

  // Al doilea test: cel obișnuit.
  await page.goto(`${BASE}/ro/dashboard/practice?start=quick&domain=matematica-v-viii`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 60000 });
  await page.getByText(/Întrebarea 1 din/).waitFor();
  check(await page.getByText("Întrebarea 1 din 15").isVisible(), "[A] al doilea test: 15 întrebări, ca înainte");
  check((await page.getByText("fără cronometru").count()) === 0, "[A] al doilea test are cronometru");
  // Spațiul de sus, micșorat pe telefon: meniul nu are voie să acopere primul titlu al paginii.
  for (const path of ["/ro/dashboard", "/ro/dashboard/practice", "/ro/dashboard/settings"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const overlap = await page.evaluate(() => {
      const menu = [...document.querySelectorAll("button")].find((b) => {
        const r = b.getBoundingClientRect();
        return getComputedStyle(b).position === "fixed" && r.left < 80 && r.top < 80 && r.width > 0;
      });
      const first = [...document.querySelectorAll("main h1, main h2, main p, main button, main a")].find((e) => e.getBoundingClientRect().height > 0);
      if (!menu || !first) return null;
      const m = menu.getBoundingClientRect(), f = first.getBoundingClientRect();
      return m.bottom > f.top && m.right > f.left ? `${Math.round(m.bottom - f.top)}px` : "";
    });
    await page.screenshot({ path: `${OUT}A-5${path.replace(/\//g, "_")}.png` });
    check(overlap === "" || overlap === null, `[A] ${path}: meniul nu acoperă începutul paginii${overlap ? ` (suprapunere ${overlap})` : ""}`);
  }
  check(errors.length === 0, `[A] fără erori în pagină${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  await ctx.close();
}

// ── B: lista completă ──
{
  const { ctx, page, errors } = await newStudent(browser, "B");
  // Cardul „Test scurt” de sub listă descrie același test pe care îl dă serverul unui elev nou.
  await page.getByText(/5 întrebări/).first().waitFor({ timeout: 30000 }).catch(() => {});
  check((await page.getByText(/5 întrebări/).count()) > 0 && (await page.locator("main").getByText("fără cronometru").count()) > 0,
    "[B] cardul testului scurt arată 5 întrebări, fără cronometru");
  await page.getByRole("button", { name: "Vreau să schimb bifele" }).click();
  check(await page.getByText("Materia parcursă la școală").isVisible(), "[B] se deschide lista completă");
  check(await page.getByText("Înainte de prima sesiune").isVisible(), "[B] lista spune de ce nu a pornit testul");
  await page.screenshot({ path: `${OUT}B-1-lista.png`, fullPage: true });
  await page.getByRole("button", { name: "Salvează și continuă" }).click();
  await page.waitForURL(/\/dashboard\/practice\/[^/?]+$/, { timeout: 60000 });
  await page.getByText(/Întrebarea 1 din/).waitFor();
  check(await page.getByText("Întrebarea 1 din 5").isVisible(), "[B] după „Salvează și continuă” pornește primul test (5 întrebări)");
  check(errors.length === 0, `[B] fără erori în pagină${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  await ctx.close();
}

await browser.close();
console.log(fail ? `\n${fail} verificări picate` : "\ntoate verificările au trecut");
process.exit(fail ? 1 : 0);
