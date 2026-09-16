#!/usr/bin/env node
// Builds the self-contained mockup of /ro/parinte for flyer visitors and photographs it.
//   node Reports/landing-parinte-cafea-2026-09-16/build-macheta.mjs
// 1. web-sized copies of the flyer photo and of the flyer itself (assets/)
// 2. macheta-landing-parinte-cafea.html = macheta.src.html with the images inlined (one file to open)
// 3. capturi/: phone (390 px) and desktop (1440 px) screenshots — full page + scrolled slices
// sharp + playwright are borrowed from REAL's node_modules (same as the flyer's export script).
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const sharp = require("sharp");
const { chromium } = require("playwright");

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FLYER_DIR = path.join(DIR, "..", "flyer-b2c-cafea-2026-09-15");
const ASSETS = path.join(DIR, "assets");
const SHOTS = path.join(DIR, "capturi");
mkdirSync(ASSETS, { recursive: true });
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

await sharp(path.join(FLYER_DIR, "foto-mama-cafea.jpg"))
  .resize({ width: 1200 })
  .jpeg({ quality: 80, progressive: true, mozjpeg: true })
  .toFile(path.join(ASSETS, "mama-cafea-web.jpg"));
await sharp(path.join(FLYER_DIR, "eTUTOR-flyer-105x140mm-FARA-bleed-RGB-300dpi.png"))
  .resize({ width: 480 })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(path.join(ASSETS, "flyer-thumb.jpg"));

let html = readFileSync(path.join(DIR, "macheta.src.html"), "utf8");
for (const rel of ["assets/mama-cafea-web.jpg", "assets/flyer-thumb.jpg"]) {
  const b64 = readFileSync(path.join(DIR, rel)).toString("base64");
  const before = html.length;
  html = html.split(`src="${rel}"`).join(`src="data:image/jpeg;base64,${b64}"`);
  if (html.length === before) throw new Error(`image not referenced in the mockup: ${rel}`);
}
const OUT = path.join(DIR, "macheta-landing-parinte-cafea.html");
writeFileSync(OUT, html);
console.log(`mockup: ${OUT} (${Math.round(html.length / 1024)} KB)`);

const browser = await chromium.launch();
async function shoot({ name, width, height, dpr, mobile }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  await page.goto(`file://${OUT}`);
  await page.waitForLoadState("load");
  await page.screenshot({ path: path.join(SHOTS, `${name}-pagina-intreaga.png`), fullPage: true });
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  let i = 1;
  for (let y = 0; y < total; y += height - 60) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(380); // the sticky bar slides in
    await page.screenshot({ path: path.join(SHOTS, `${name}-${String(i).padStart(2, "0")}.png`) });
    i += 1;
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`${name}: page ${width}x${total}, ${i - 1} slices, horizontal overflow ${overflow}px`);
  // First screen as a visitor sees it (no review layer), for both channels: is the price + main
  // button above the fold, and does the code chip still fit inside the price card?
  for (const canal of ["site", "flyer"]) {
    await page.goto(`file://${OUT}?notes=off&canal=${canal}`);
    await page.waitForLoadState("load");
    await page.screenshot({ path: path.join(SHOTS, `${name}-primul-ecran-${canal}.png`) });
    const fold = await page.evaluate(() => {
      const box = (sel) => document.querySelector(sel).getBoundingClientRect();
      const card = box(".hero .price-card");
      const chip = box(".hero .code-chip");
      return {
        code: document.querySelector(".hero .code-name").textContent,
        priceCardBottom: Math.round(card.bottom),
        mainButtonBottom: Math.round(box(".hero .btn").bottom),
        chipInsideCard: chip.right <= card.right - 4,
        viewport: window.innerHeight,
      };
    });
    console.log(`${name} (${canal}): first screen`, JSON.stringify(fold));
  }
  if (name === "calculator") {
    await page.goto(`file://${OUT}?notes=off&canal=flyer`);
    await page.waitForLoadState("load");
    await page.locator("#pasi").screenshot({ path: path.join(SHOTS, `${name}-pasi-flyer.png`) });
    await page.goto(`file://${OUT}?notes=off&canal=site`);
    await page.waitForLoadState("load");
    await page.locator("#pasi").screenshot({ path: path.join(SHOTS, `${name}-pasi-site.png`) });
  }
  await ctx.close();
}
await shoot({ name: "telefon", width: 390, height: 844, dpr: 2, mobile: true });
await shoot({ name: "calculator", width: 1440, height: 900, dpr: 1, mobile: false });
await browser.close();
