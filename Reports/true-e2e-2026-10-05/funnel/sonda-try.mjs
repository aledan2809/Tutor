import { createRequire } from "node:module";
const { chromium, devices } = createRequire("/Users/danciulescu/Projects/Tester-Gateway/package.json")("playwright");
const OUT = "/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/funnel";
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ro-RO" });
const page = await ctx.newPage();
const errs = []; page.on("response", (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url().slice(0, 90)}`); });
const dump = async (label) => {
  const i = await page.evaluate(() => {
    const H = window.innerHeight;
    const els = [...document.querySelectorAll("a,button,[role=button],input[type=submit]")].map((e) => { const r = e.getBoundingClientRect(); return { txt: (e.innerText || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 60), href: e.getAttribute("href") || "", top: Math.round(r.top), vis: r.width > 0 && r.height > 0 }; }).filter((e) => e.vis && e.txt);
    return { url: location.href, title: document.title, h1: [...document.querySelectorAll("h1,h2")].slice(0, 3).map((h) => h.innerText.trim().slice(0, 70)), above: els.filter((e) => e.top >= 0 && e.top < H).map((e) => `${e.txt}${e.href ? " →" + e.href : ""} @${e.top}`), textStart: document.body.innerText.replace(/\s+/g, " ").slice(0, 400) };
  });
  console.log(`\n### ${label}: ${i.url}\n title: ${i.title}\n h: ${i.h1.join(" | ")}\n text: ${i.textStart}\n above-fold: ${i.above.join(" · ")}`);
  await page.screenshot({ path: `${OUT}/try-${label}.png` });
};
await page.goto("https://etutor.ro/ro/try", { waitUntil: "networkidle" }); await page.waitForTimeout(800); await dump("01-try");
// click the first obvious start button if any
const btn = page.locator("button, a").filter({ hasText: /începe|start|încearcă|alege|matematic/i }).first();
if (await btn.count()) { await btn.click().catch(() => {}); await page.waitForTimeout(2500); await dump("02-after-first-tap"); }
const btn2 = page.locator("button, a").filter({ hasText: /începe|start|încearcă|continu/i }).first();
if (await btn2.count()) { await btn2.click().catch(() => {}); await page.waitForTimeout(2500); await dump("03-after-second-tap"); }
console.log("\n4xx/5xx:", errs.slice(0, 8));
await browser.close();
