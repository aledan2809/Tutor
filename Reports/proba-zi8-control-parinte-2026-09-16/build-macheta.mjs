#!/usr/bin/env node
// Photographs the mockup of the free trial, day 8 and the parent-set schedule.
//   node Reports/proba-zi8-control-parinte-2026-09-16/build-macheta.mjs
// The mockup has no images, so macheta.src.html is already the file to open; this only makes the
// screenshots in capturi/ (desktop 1440 px + phone 390 px, whole page and one per chapter).
// playwright is borrowed from REAL's node_modules (same as the landing mockup's script).
import { createRequire } from "node:module";
import { mkdirSync, rmSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const { chromium } = require("playwright");

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, "macheta.src.html");
const OUT = path.join(DIR, "macheta-proba-zi8-control-parinte.html");
const SHOTS = path.join(DIR, "capturi");
copyFileSync(SRC, OUT);
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
for (const view of [
  { name: "calculator", width: 1440, height: 900, dpr: 1, mobile: false },
  { name: "telefon", width: 390, height: 844, dpr: 2, mobile: true },
]) {
  const ctx = await browser.newContext({
    viewport: { width: view.width, height: view.height },
    deviceScaleFactor: view.dpr,
    isMobile: view.mobile,
    hasTouch: view.mobile,
  });
  const page = await ctx.newPage();
  await page.goto(`file://${OUT}`);
  await page.waitForLoadState("load");
  await page.screenshot({ path: path.join(SHOTS, `${view.name}-pagina-intreaga.png`), fullPage: true });
  const chapters = await page.$$("section.chapter");
  for (let i = 0; i < chapters.length; i++) {
    await chapters[i].screenshot({ path: path.join(SHOTS, `${view.name}-capitol-${i + 1}.png`) });
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`${view.name}: ${chapters.length} chapters, horizontal overflow ${overflow}px`);
  await ctx.close();
}
await browser.close();
console.log(`mockup: ${OUT}\nshots: ${SHOTS}`);
