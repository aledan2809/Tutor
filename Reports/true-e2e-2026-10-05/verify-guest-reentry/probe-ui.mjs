// Aceeași persoană (nume+telefon identice) intră de două ori pe /acces/<cod comun>,
// din două browsere separate (= cookie pierdut). QA stack only.
import { createRequire } from "node:module";
const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");
const BASE = "http://localhost:3113", CODE = "QAE2E1005A", DIR = import.meta.dirname;
const browser = await chromium.launch();
let n = 0;
async function enter(tag) {
  const ctx = await browser.newContext({ locale: "ro-RO" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ro/acces/${CODE}`, { waitUntil: "networkidle" });
  await page.fill("#g-nume", "qa-e2e-1005-Reintrare");
  await page.fill("#g-prenume", "Ion");
  await page.fill("#g-telefon", "0799100510").catch(async () => { await page.locator("input").nth(2).fill("0799100510"); });
  n++; await page.screenshot({ path: `${DIR}/${String(n).padStart(2,"0")}-${tag}-formular.png`, fullPage: true });
  await page.locator("button", { hasText: /Intr/ }).first().click();
  await page.waitForURL((u) => u.pathname.includes("/dashboard"), { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  n++; await page.screenshot({ path: `${DIR}/${String(n).padStart(2,"0")}-${tag}-dupa.png`, fullPage: true });
  const s = await (await ctx.request.get(`${BASE}/api/auth/session`)).json();
  console.log(tag, "url:", page.url(), "user:", s?.user?.id ?? null);
  await ctx.close();
}
await enter("browser1");
await enter("browser2");
await browser.close();
