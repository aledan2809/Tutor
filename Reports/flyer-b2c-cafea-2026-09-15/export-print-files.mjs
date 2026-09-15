// Re-export script for the eTUTOR.ro "cafea" flyer — regenerates the print
// files (RGB PNG + CMYK JPG + PDF, with-bleed and trim-only) from flyer.html.
// Run again any time flyer.html is edited (copy text, colors, price, etc.).
//
// v3: ONE page only (Alex, 15.09: "flyerul se face doar pe fata, nu si pe
// verso") — flyer.html has a single `.page` div with everything folded in.
//
// v3.4 (15.09, size re-check): every output is now the EXACT physical size.
// Before, the trim PNG was 1241 px wide (105.07 mm instead of 105) because the
// crop was "canvas minus 2 × bleed" on a canvas that was itself 1 px too wide,
// and Chromium's page.pdf() wrote a 327.12 × 426 pt page (115.4 × 150.3 mm,
// thin white strips on three edges) with the trim box equal to the page —
// nothing a print shop could cut to. Now: pixel sizes are computed from the
// millimetres, and the PDFs are assembled with pdf-lib, so the page boxes are
// exact (MediaBox 115 × 150 mm, TrimBox 105 × 140 mm, BleedBox = page).
//
// Usage:  node export-print-files.mjs
// (run from anywhere — all paths below are absolute)
//
// Dependencies: `playwright` (with Chromium downloaded) and `sharp`, borrowed
// read-only from REAL/package.json; `pdf-lib`, borrowed from Offer/package.json.
// None of them is a Tutor dependency.
//
// Pipeline:
//   1. Chromium renders flyer.html at 600dpi (deviceScaleFactor = 600/96) and
//      screenshots the page; the screenshot is cropped to exactly 115 × 150 mm.
//   2. sharp makes the 300dpi files from that master: RGB PNG (digital preview
//      / email / WhatsApp), tagged CMYK JPEG (print shops that ask for CMYK),
//      and the 105 × 140 mm trim-only PNG ("what you'll actually hold").
//   3. pdf-lib wraps the 600dpi image in two PDFs with exact page boxes:
//      one with bleed (+ TrimBox for the cut) and one at trim size. The image
//      stays RGB inside the PDF on purpose: a CMYK image without an embedded
//      output profile is shown with shifted colours by most viewers, and the
//      print shop's RIP converts RGB with its own profile anyway.
//
// NOTE on the CMYK JPEG: sharp/libvips silently drops back to sRGB if you
// set output metadata (density) without also giving it a colour-managed ICC
// tag — the fix is `icc: 'cmyk'` in the withMetadata() call below. That
// embeds a generic CMYK ICC profile; if your print shop wants a named one
// instead (ISO Coated v2 / FOGRA39 / SWOP) or none at all, say so and this
// line is the one to change.
import { createRequire } from "module";
import { writeFile } from "fs/promises";
const requireReal = createRequire("/Users/danciulescu/Projects/REAL/package.json");
const requireOffer = createRequire("/Users/danciulescu/Projects/Offer/package.json");
const { chromium } = requireReal("playwright");
const sharp = requireReal("sharp");
const { PDFDocument } = requireOffer("pdf-lib");
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FLYER = `file://${path.join(HERE, "flyer.html")}`;
const OUT_DIR = HERE;

const PAGE_MM = { w: 115, h: 150 }; // 105 × 140 finished + 5 mm bleed each side
const BLEED_MM = 5;
const TRIM_MM = { w: PAGE_MM.w - 2 * BLEED_MM, h: PAGE_MM.h - 2 * BLEED_MM };
const MASTER_DPI = 600;
const DPI = 300;
const px = (mm, dpi) => Math.round((mm / 25.4) * dpi);
const pt = (mm) => (mm / 25.4) * 72;

const browser = await chromium.launch();
// The viewport is whole CSS px (435 × 567); the page is 434.65 × 566.93, so the
// screenshot carries a sliver past the right/bottom edge — cropped off below.
const page = await browser.newPage({ viewport: { width: 435, height: 567 }, deviceScaleFactor: MASTER_DPI / 96 });
await page.goto(FLYER, { waitUntil: "networkidle" });
const shot = await page.screenshot();
await browser.close();

const master = await sharp(shot)
  .extract({ left: 0, top: 0, width: px(PAGE_MM.w, MASTER_DPI), height: px(PAGE_MM.h, MASTER_DPI) })
  .png()
  .toBuffer();
const bleed300 = await sharp(master)
  .resize(px(PAGE_MM.w, DPI), px(PAGE_MM.h, DPI), { fit: "fill", kernel: "lanczos3" })
  .png()
  .toBuffer();

async function out(name, promise) {
  await promise;
  console.log("wrote", name);
}

await out(
  "eTUTOR-flyer-115x150mm-CU-bleed-RGB-300dpi.png",
  sharp(bleed300).withMetadata({ density: DPI }).png().toFile(path.join(OUT_DIR, "eTUTOR-flyer-115x150mm-CU-bleed-RGB-300dpi.png"))
);
await out(
  "eTUTOR-flyer-115x150mm-CU-bleed-CMYK-300dpi.jpg",
  sharp(bleed300)
    .toColourspace("cmyk")
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
    .withMetadata({ density: DPI, icc: "cmyk" })
    .toFile(path.join(OUT_DIR, "eTUTOR-flyer-115x150mm-CU-bleed-CMYK-300dpi.jpg"))
);
await out(
  "eTUTOR-flyer-105x140mm-FARA-bleed-RGB-300dpi.png",
  sharp(bleed300)
    .extract({ left: px(BLEED_MM, DPI), top: px(BLEED_MM, DPI), width: px(TRIM_MM.w, DPI), height: px(TRIM_MM.h, DPI) })
    .withMetadata({ density: DPI })
    .png()
    .toFile(path.join(OUT_DIR, "eTUTOR-flyer-105x140mm-FARA-bleed-RGB-300dpi.png"))
);

async function pdfFrom(jpeg, pageMm, trimInsetMm, name) {
  const doc = await PDFDocument.create();
  doc.setTitle("eTUTOR.ro — flyer „cât o cafea”");
  doc.setCreator("export-print-files.mjs");
  const img = await doc.embedJpg(jpeg);
  const W = pt(pageMm.w);
  const H = pt(pageMm.h);
  const p = doc.addPage([W, H]);
  p.drawImage(img, { x: 0, y: 0, width: W, height: H });
  p.setBleedBox(0, 0, W, H);
  if (trimInsetMm) {
    const b = pt(trimInsetMm);
    p.setTrimBox(b, b, W - 2 * b, H - 2 * b);
  } else {
    p.setTrimBox(0, 0, W, H);
  }
  await writeFile(path.join(OUT_DIR, name), await doc.save());
  console.log("wrote", name);
}

const masterJpg = await sharp(master).jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).toBuffer();
const trimMasterJpg = await sharp(master)
  .extract({
    left: px(BLEED_MM, MASTER_DPI),
    top: px(BLEED_MM, MASTER_DPI),
    width: px(TRIM_MM.w, MASTER_DPI),
    height: px(TRIM_MM.h, MASTER_DPI),
  })
  .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
  .toBuffer();
await pdfFrom(masterJpg, PAGE_MM, BLEED_MM, "eTUTOR-flyer-115x150mm-CU-bleed.pdf");
await pdfFrom(trimMasterJpg, TRIM_MM, 0, "eTUTOR-flyer-105x140mm-FARA-bleed.pdf");

console.log("done");
