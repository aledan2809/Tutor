// Sonda pâlniei, varianta parametrizată (QA local sau producție): ce vede un vizitator nou pe telefon
// (iPhone 13, 390×664 util) fără să deruleze, și dacă vreun buton principal stă sub bannerul de cookie-uri.
//   BASE=http://localhost:3113 OUT=/cale/capturi node sonda-palnie-qa.mjs [/ro /ro/parinte ...]
// Iese cu cod 1 dacă vreun buton principal e acoperit de banner sau cade sub primul ecran.
// Playwright: din node_modules-ul proiectului; PW_CHROMIUM=/cale/chromium dacă browserul e în altă parte.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium, devices } = (() => {
  for (const from of [process.cwd() + "/package.json", import.meta.url]) {
    try { return createRequire(from)("playwright"); } catch {}
  }
  return require("playwright");
})();

const BASE = (process.env.BASE || "http://localhost:3113").replace(/\/$/, "");
const OUT = process.env.OUT || new URL(".", import.meta.url).pathname + "qa-out";
mkdirSync(OUT, { recursive: true });
const pages = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/ro", "/ro/parinte", "/ro/auth/register", "/ro/auth/signin", "/ro/try", "/ro/grile", "/ro/preturi", "/ro/family/join"];

// Butoanele principale ale fiecărei pagini, după text (primul care se potrivește trebuie să fie vizibil).
const PRIMARY = /încearcă|fără cont|fă-ți cont|cont nou|creează cont|începe|intră|alătură|salvează progresul|try|create|sign in/i;

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
let bad = 0;
for (const vp of [{ name: "mobil", ...devices["iPhone 13"] }, { name: "desktop", viewport: { width: 1366, height: 768 } }]) {
  const { name, ...opts } = vp;
  // DEV=1: `next dev` needs eval, which the site CSP forbids — bypass it only in this test browser.
  const ctx = await browser.newContext({ ...opts, locale: "ro-RO", bypassCSP: process.env.DEV === "1" });
  const page = await ctx.newPage();
  for (const p of pages) {
    const resp = await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 60000 }).catch(() => null);
    await page.waitForTimeout(800);
    const info = await page.evaluate((primarySrc) => {
      const PRIMARY = new RegExp(primarySrc, "i");
      const H = window.innerHeight;
      const banner = document.querySelector('[role=dialog][aria-label*="ookie"]');
      const bTop = banner ? banner.getBoundingClientRect().top : H;
      const els = [...document.querySelectorAll("main a, main button, form button, a[href*=register], a[href*=try]")]
        .filter((e) => !(banner && banner.contains(e)))
        .map((e) => {
          const r = e.getBoundingClientRect();
          const txt = (e.innerText || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 60);
          return { txt, href: e.getAttribute("href") || "", top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), vis: r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden" };
        })
        .filter((e) => e.vis && e.txt);
      const primary = els.filter((e) => PRIMARY.test(e.txt));
      const first = primary[0] || null;
      return {
        title: document.title,
        H,
        banner: banner ? `top=${Math.round(bTop)} h=${Math.round(banner.getBoundingClientRect().height)}` : null,
        first,
        covered: primary.filter((e) => e.top < H && e.bottom > bTop).map((e) => `${e.txt} @${e.top}-${e.bottom}`),
        small: primary.filter((e) => e.top < H && e.h < 44).map((e) => `${e.txt} (${e.h}px)`),
        aboveFold: primary.filter((e) => e.top >= 0 && e.bottom <= bTop).map((e) => `${e.txt}${e.href ? " →" + e.href : ""} @${e.top}/${e.h}px`),
      };
    }, PRIMARY.source);
    const slug = (p.replace(/[^a-z0-9]+/gi, "_") || "home") + "-" + name;
    await page.screenshot({ path: `${OUT}/${slug}.png` });
    const firstOk = info.first && info.first.bottom <= (info.banner ? Number(info.banner.match(/top=(\d+)/)[1]) : info.H);
    const ok = info.covered.length === 0 && firstOk;
    if (!ok) bad++;
    console.log(`\n### [${name}] ${p} → ${page.url().replace(BASE, "")} (${resp ? resp.status() : "?"}) ${ok ? "OK" : "PROBLEMĂ"}`);
    console.log(`title: ${info.title}`);
    console.log(`banner: ${info.banner}`);
    console.log(`primul buton principal: ${info.first ? `${info.first.txt} @${info.first.top}-${info.first.bottom}` : "—"}`);
    if (info.covered.length) console.log(`ACOPERITE de banner: ${info.covered.join(" | ")}`);
    if (info.small.length) console.log(`sub 44 px: ${info.small.join(" | ")}`);
    console.log(`vizibile fără scroll: ${info.aboveFold.join(" | ") || "—"}`);
  }
  await ctx.close();
}
await browser.close();
console.log(`\n${bad ? `${bad} pagini cu probleme` : "toate paginile OK"}`);
process.exit(bad ? 1 : 0);
