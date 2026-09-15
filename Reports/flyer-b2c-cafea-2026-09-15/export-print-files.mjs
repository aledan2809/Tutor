// Re-export script for the eTUTOR.ro "cafea" flyer — regenerates the 4 print
// files (RGB PNG + CMYK JPG, per side) + the 2-page PDF from flyer.html.
// Run again any time flyer.html is edited (copy text, colors, price, etc.).
//
// Usage:  node export-print-files.mjs
// (run from anywhere — all paths below are absolute)
//
// Dependencies: needs `playwright` (with the Chromium browser already
// downloaded) and `sharp` on this machine. Neither is a Tutor dependency —
// this script borrows them, read-only, from another local project
// (REAL/package.json) that already has both installed, so nothing was added
// to Tutor's own package.json/node_modules. If that project ever moves or
// its deps change, either:
//   (a) point REQUIRE_FROM below at any other local project that has
//       `playwright` + `sharp` in its node_modules, or
//   (b) run `npm install playwright sharp && npx playwright install chromium`
//       in a throwaway folder and point REQUIRE_FROM at its package.json.
//
// Pipeline (mirrors Reports/flyer-posta-2026-09-15/ in the REAL project):
//   1. Chromium renders flyer.html at 300dpi (deviceScaleFactor = 300/96,
//      since Chromium's CSS "mm" unit is fixed at a 96dpi baseline) and
//      screenshots each side in isolation (?side=fata / ?side=verso — see
//      the small <script> at the bottom of flyer.html).
//   2. sharp stamps 300dpi density onto a plain RGB PNG (digital preview /
//      email / WhatsApp use) and converts a second copy to a tagged 4-channel
//      CMYK JPEG (print-ready — most RO print shops ask for CMYK + 300dpi).
//   3. Playwright's own page.pdf() produces a 2-page PDF (front, then back)
//      at the true 115x140mm page size — the single file to hand a print
//      shop that wants recto/verso in one PDF instead of two images.
//
// NOTE on the CMYK JPEG: sharp/libvips silently drops back to sRGB if you
// set output metadata (density) without also giving it a colour-managed ICC
// tag — verified empirically while building this. The fix is `icc: 'cmyk'`
// in the withMetadata() call below. That embeds a generic CMYK ICC profile;
// REAL's own reference file has NO embedded profile at all. Most print
// shops handle a generic-tagged CMYK JPEG fine, but if yours specifically
// asks for "no profile" or a named one (ISO Coated v2 / FOGRA39 / SWOP),
// say so and this line is the one to change.
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

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 435, height: 567 }, deviceScaleFactor: SCALE });

const sides = [
  { name: "fata", url: `${FLYER}?side=fata` },
  { name: "verso", url: `${FLYER}?side=verso` },
];

// 5mm bleed at 300dpi, in pixels — cropped off each edge for the "what you'll
// actually hold" trim-size files (Alex flagged the with-bleed ones as "not
// 10.5x14cm" — they aren't meant to be; this second set is).
const BLEED_PX = Math.round((5 / 25.4) * DPI);

for (const { url, name } of sides) {
  await page.goto(url, { waitUntil: "networkidle" });
  const rawPng = await page.screenshot();
  const meta = await sharp(rawPng).metadata();
  console.log(name, "raw px (115x150mm, WITH bleed):", meta.width, "x", meta.height);

  const pngOut = path.join(OUT_DIR, `eTUTOR-flyer-${name}-115x150mm-CU-bleed-RGB-300dpi.png`);
  await sharp(rawPng).withMetadata({ density: DPI }).png().toFile(pngOut);
  console.log("wrote", pngOut);

  const jpgOut = path.join(OUT_DIR, `eTUTOR-flyer-${name}-115x150mm-CU-bleed-CMYK-300dpi.jpg`);
  await sharp(rawPng)
    .toColourspace("cmyk")
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
    .withMetadata({ density: DPI, icc: "cmyk" })
    .toFile(jpgOut);
  console.log("wrote", jpgOut);

  // Trim-size (105x140mm, NO bleed) — crop the 5mm ring off each edge. This is
  // the "what you'll actually hold" size to check on screen; most print shops
  // still want the WITH-bleed file above, but a few want trim-only instead.
  const trimmed = sharp(rawPng).extract({
    left: BLEED_PX,
    top: BLEED_PX,
    width: meta.width - 2 * BLEED_PX,
    height: meta.height - 2 * BLEED_PX,
  });
  const trimMeta = await trimmed.clone().metadata();
  console.log(name, "trimmed px (105x140mm, NO bleed):", trimMeta.width, "x", trimMeta.height);

  const trimPngOut = path.join(OUT_DIR, `eTUTOR-flyer-${name}-105x140mm-FARA-bleed-RGB-300dpi.png`);
  await trimmed.clone().withMetadata({ density: DPI }).png().toFile(trimPngOut);
  console.log("wrote", trimPngOut);
}

await page.goto(FLYER, { waitUntil: "networkidle" });
const pdfOut = path.join(OUT_DIR, "eTUTOR-flyer-fata-verso-105x140-bleed5-300dpi.pdf");
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
