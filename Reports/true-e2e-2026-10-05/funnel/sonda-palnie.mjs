// Sondă read-only pe producție: ce vede un vizitator pe telefon, fără scroll, pe paginile de intrare.
import { createRequire } from "node:module";
const { chromium, devices } = createRequire("/Users/danciulescu/Projects/Tester-Gateway/package.json")("playwright");
const OUT = "/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/funnel";
const pages = ["/ro", "/ro/parinte", "/ro/posta", "/ro/grile", "/ro/preturi", "/ro/auth/signin", "/ro/auth/register", "/ro/dashboard", "/ro/grile/grile-bacalaureat-romana"];
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
const page = await ctx.newPage();
for (const p of pages) {
  const t0 = Date.now();
  const resp = await page.goto("https://etutor.ro" + p, { waitUntil: "networkidle", timeout: 30000 }).catch((e) => null);
  const ms = Date.now() - t0;
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const H = window.innerHeight;
    const els = [...document.querySelectorAll("a,button,[role=button],input[type=submit]")].map((e) => {
      const r = e.getBoundingClientRect();
      const txt = (e.innerText || e.value || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 60);
      return { txt, href: e.getAttribute("href") || "", top: Math.round(r.top), h: Math.round(r.height), vis: r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden" };
    }).filter((e) => e.vis && e.txt);
    const above = els.filter((e) => e.top >= 0 && e.top < H);
    const cookie = [...document.querySelectorAll("*")].find((e) => /cookie/i.test(e.id + " " + e.className + " " + (e.getAttribute("aria-label") || "")) && e.getBoundingClientRect().height > 40);
    const cr = cookie ? cookie.getBoundingClientRect() : null;
    const body = document.body.innerText;
    return {
      title: document.title, lang: document.documentElement.lang, scrollH: document.documentElement.scrollHeight, H,
      above: above.map((e) => `${e.txt}${e.href ? " →" + e.href : ""} @${e.top}/${e.h}px`),
      cookieBanner: cr ? `top=${Math.round(cr.top)} h=${Math.round(cr.height)}` : null,
      says: { gratuit: /gratuit/i.test(body), faraCard: /f[ăa]r[ăa] card/i.test(body), sapteZile: /7 zile/i.test(body), creeazaCont: /creeaz[ăa] cont|cont nou|înregistr/i.test(body), englishLeak: /\b(Sign in|Sign up|Create account|Password|Email address)\b/.test(body) },
      h1: [...document.querySelectorAll("h1")].map((h) => h.innerText.trim().slice(0, 80)),
    };
  });
  const slug = p.replace(/[^a-z0-9]+/gi, "_") || "home";
  await page.screenshot({ path: `${OUT}/${slug}-mobil.png` });
  console.log(`\n### ${p} → ${page.url()} (${resp ? resp.status() : "?"} , ${ms} ms, scroll ${info.scrollH}/${info.H}px, lang=${info.lang})`);
  console.log(`title: ${info.title}`); console.log(`h1: ${info.h1.join(" | ")}`);
  console.log(`cookie banner: ${info.cookieBanner}`); console.log(`texte: ${JSON.stringify(info.says)}`);
  console.log(`butoane/linkuri vizibile fără scroll (${info.above.length}):`); for (const a of info.above) console.log("   - " + a);
}
await browser.close();
