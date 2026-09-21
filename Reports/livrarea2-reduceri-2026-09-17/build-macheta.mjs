#!/usr/bin/env node
// Photographs the mockup of the delivery 2 discounts.
//   node Reports/livrarea2-reduceri-2026-09-17/build-macheta.mjs
// The mockup has no images, so macheta.src.html is already the file to open; this only makes the
// screenshots in capturi/ (desktop 1440 px + phone 390 px, whole page and one per chapter).
// playwright is borrowed from REAL's node_modules (same as the landing mockup's script).
import { createRequire } from "node:module";
import { mkdirSync, rmSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REAL_ROOT = process.env.REAL_PROJECT_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..", "REAL");
const require = createRequire(path.join(REAL_ROOT, "package.json"));
const { chromium } = require("playwright");

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, "macheta.src.html");
const OUT = path.join(DIR, "macheta-livrarea2-reduceri.html");
const SHOTS = path.join(DIR, "capturi");

try {
  copyFileSync(SRC, OUT);
  rmSync(SHOTS, { recursive: true, force: true });
  mkdirSync(SHOTS, { recursive: true });

  const browser = await chromium.launch();
  try {
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
  } finally {
    await browser.close();
  }
  console.log(`mockup: ${OUT}\nshots: ${SHOTS}`);
} catch (err) {
  console.error("build-macheta failed:", err.message || err);
  process.exit(1);
}
