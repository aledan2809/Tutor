// Re-export script for the eTUTOR.ro "cafea" flyer — regenerates the print
// files (RGB PNG + CMYK JPG, with-bleed and trim-only + a PDF) from flyer.html.
// Run again any time flyer.html is edited (copy text, colors, price, etc.).
//
// v3: ONE page only (Alex, 15.09: "flyerul se face doar pe fata, nu si pe
// verso") — the old fata/verso split + the export loop over both are gone;
// flyer.html itself now has a single `.page` div with everything folded in
// (QR + legal footer moved off the old verso onto this one face).
//
// Usage:  node export-print-files.mjs
// (run from anywhere — all paths below are absolute)
//
// Dependencies: needs `playwright` (with the Chromium browser already
// downloaded) and `sharp` on this machine. Neither is a Tutor dependency —
// this script borrows them, read-only, from another local project
// (REAL/package.json) that already has both installed. See git history of
// this file (v1/v2) for the fallback instructions if that project moves.
//
// Pipeline:
//   1. Chromium renders flyer.html at 300dpi (deviceScaleFactor = 300/96)
//      and screenshots the one page.
//   2. sharp stamps 300dpi density onto a plain RGB PNG (digital preview /
//      email / WhatsApp use) and converts a second copy to a tagged 4-channel
//      CMYK JPEG (print-ready — most RO print shops ask for CMYK + 300dpi).
//      A third variant crops the 5mm bleed ring off each edge for the
//      "what you'll actually hold" 105x140mm trim-size file.
//   3. Playwright's own page.pdf() produces a 1-page PDF at the true
//      115x150mm page size.
//
// NOTE on the CMYK JPEG: sharp/libvips silently drops back to sRGB if you
// set output metadata (density) without also giving it a colour-managed ICC
// tag — the fix is `icc: 'cmyk'` in the withMetadata() call below. That
// embeds a generic CMYK ICC profile; if your print shop wants a named one
// instead (ISO Coated v2 / FOGRA39 / SWOP) or none at all, say so and this
// line is the one to change.
import { createRequire } from "module";
const REQUIRE_FROM = "/Users/danciulescu/Projects/REAL/package.json";
const require = createRequire(REQUIRE_FROM);
const { chromium } = require("playwright");
const sharp = require("sharp");
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FLYER = `file://${path.join(HERE, "flyer.html")}`;
const OUT_DIR = HERE;
const DPI = 300;
const SCALE = DPI / 96;
// 5mm bleed at 300dpi, in pixels — cropped off each edge for the trim-size file.
const BLEED_PX = Math.round((5 / 25.4) * DPI);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 435, height: 567 }, deviceScaleFactor: SCALE });

await page.goto(FLYER, { waitUntil: "networkidle" });
const rawPng = await page.screenshot();
const meta = await sharp(rawPng).metadata();
console.log("raw px (115x150mm, WITH bleed):", meta.width, "x", meta.height);

const pngOut = path.join(OUT_DIR, "eTUTOR-flyer-115x150mm-CU-bleed-RGB-300dpi.png");
await sharp(rawPng).withMetadata({ density: DPI }).png().toFile(pngOut);
console.log("wrote", pngOut);

const jpgOut = path.join(OUT_DIR, "eTUTOR-flyer-115x150mm-CU-bleed-CMYK-300dpi.jpg");
await sharp(rawPng)
  .toColourspace("cmyk")
  .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
  .withMetadata({ density: DPI, icc: "cmyk" })
  .toFile(jpgOut);
console.log("wrote", jpgOut);

const trimmed = sharp(rawPng).extract({
  left: BLEED_PX,
  top: BLEED_PX,
  width: meta.width - 2 * BLEED_PX,
  height: meta.height - 2 * BLEED_PX,
});
const trimPngOut = path.join(OUT_DIR, "eTUTOR-flyer-105x140mm-FARA-bleed-RGB-300dpi.png");
await trimmed.clone().withMetadata({ density: DPI }).png().toFile(trimPngOut);
console.log("wrote", trimPngOut, "(check its own file size for the true 105x140mm px dims — sharp's own .metadata() here would misleadingly report the pre-crop size)");

const pdfOut = path.join(OUT_DIR, "eTUTOR-flyer-115x150mm-CU-bleed.pdf");
await page.pdf({
  path: pdfOut,
  width: "115mm",
  height: "150mm",
  printBackground: true,
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
});
console.log("wrote", pdfOut);

await browser.close();
console.log("done");
