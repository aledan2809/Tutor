/**
 * PDF Ingest & Clean — Tier 5 Content Quality Mesh
 *
 * Pipeline: fetch PDF (curl-style) → pdf-parse text extraction →
 *   OCR artifact cleanup → coherent passage segmentation
 *
 * Cleanup handles:
 *   - Spaced letters: "Tr a i a n" → "Traian"
 *   - Soft-hyphens (\u00AD)
 *   - Redundant whitespace
 *   - Page headers/footers noise
 *   - Recap/blank segments filtered out
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface IngestPassage {
  id: string;
  text: string;
  sourcePage: number | null;
  title: string | null;
}

export interface IngestResult {
  passages: IngestPassage[];
  totalPages: number;
  rawCharCount: number;
  cleanCharCount: number;
}

// ── PDF Fetch ────────────────────────────────────────────────────────────

/**
 * Fetch PDF from URL via fetch (not WebFetch — handles large files + JS-gated viewers).
 * manuale.edu.ro viewer returns 403 without proper headers.
 */
export async function fetchPDF(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/pdf,*/*",
      "Referer": url,
    },
  });
  if (!res.ok) throw new Error(`PDF fetch failed: ${res.status} ${res.statusText}`);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// ── Text Extraction ──────────────────────────────────────────────────────

export async function extractText(buffer: Buffer): Promise<{ text: string; pages: number }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const data = await pdfParse(buffer);
  return { text: data.text || "", pages: data.numpages || 0 };
}

// ── OCR Artifact Cleanup ─────────────────────────────────────────────────

/**
 * Fix spaced-out letters typical of OCR artifacts.
 * E.g., "T r a i a n" → "Traian", "D a c i a" → "Dacia"
 * Heuristic: sequences of single chars separated by spaces, length >= 3
 */
function fixSpacedLetters(text: string): string {
  // Match sequences like "X y z a b" (single char + space repeated 3+ times)
  return text.replace(
    /\b([\wăâîșțĂÂÎȘȚ](?:\s[\wăâîșțĂÂÎȘȚ]){2,})\b/gu,
    (match) => {
      // Only collapse if each "word" is a single character
      const parts = match.split(/\s+/);
      if (parts.every(p => p.length === 1)) {
        return parts.join("");
      }
      return match;
    }
  );
}

/**
 * Clean OCR artifacts and normalize text.
 */
export function cleanText(raw: string): string {
  let text = raw;

  // 1. Remove soft-hyphens
  text = text.replace(/\u00AD/g, "");

  // 2. Remove zero-width spaces and other invisible chars
  text = text.replace(/[\u200B\u200C\u200D\uFEFF]/g, "");

  // 3. Fix spaced-out letters (OCR artifact)
  text = fixSpacedLetters(text);

  // 4. Normalize whitespace: collapse multiple spaces to one
  text = text.replace(/[ \t]+/g, " ");

  // 5. Normalize line endings
  text = text.replace(/\r\n/g, "\n");

  // 6. Remove page number lines (common: standalone numbers, or "Pagina X")
  text = text.replace(/^\s*\d{1,4}\s*$/gm, "");
  text = text.replace(/^\s*Pagina?\s+\d+\s*$/gim, "");

  // 7. Remove repeated header/footer patterns (lines appearing identically on many "pages")
  // Simple heuristic: remove very short lines that appear 3+ times
  const lineCount = new Map<string, number>();
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && trimmed.length < 80) {
      lineCount.set(trimmed, (lineCount.get(trimmed) || 0) + 1);
    }
  }
  const repeatedHeaders = new Set<string>();
  for (const [line, count] of lineCount) {
    if (count >= 3 && line.length < 60) repeatedHeaders.add(line);
  }
  if (repeatedHeaders.size > 0) {
    text = lines.filter(l => !repeatedHeaders.has(l.trim())).join("\n");
  }

  // 8. Collapse 3+ blank lines into 2
  text = text.replace(/\n{3,}/g, "\n\n");

  // 9. Trim
  text = text.trim();

  return text;
}

// ── Passage Segmentation ─────────────────────────────────────────────────

/**
 * Segment cleaned text into coherent passages (lesson-sized chunks).
 * Filters out:
 *   - Recapitulative sections (marked by "Recapitulare", "Evaluare", blank-heavy)
 *   - Very short segments (< 100 chars)
 *   - Table-of-contents style lines
 */
export function segmentPassages(text: string): IngestPassage[] {
  // Split on double newlines (paragraph boundaries) or heading patterns
  const rawBlocks = text.split(/\n{2,}/);

  const passages: IngestPassage[] = [];
  let currentPassage = "";
  let currentTitle: string | null = null;
  let passageIndex = 0;

  const HEADING_RE = /^(?:(?:Lecția|Capitolul|Tema|Unitatea|Modulul)\s+(?:\d+|[IVXLC]+)[.:)\s]|(?:\d+\.)+\s+[A-ZĂÂÎȘȚ])/i;
  const RECAP_RE = /^(?:Recapitulare|Evaluare|Test de evaluare|Fișă de lucru|Completează|Exerciții recapitulative)/i;
  const TOC_RE = /^\s*(?:Cuprins|Table of Contents|CUPRINS)\s*$/i;

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Skip TOC
    if (TOC_RE.test(trimmed)) continue;

    // Skip recap/evaluation sections
    if (RECAP_RE.test(trimmed)) continue;

    // Skip blocks that are mostly blanks/dots (fill-in exercises)
    const blankRatio = (trimmed.match(/[_.…]{3,}/g) || []).length / Math.max(1, trimmed.split(/\s+/).length);
    if (blankRatio > 0.3) continue;

    // Detect heading → flush current passage, start new
    if (HEADING_RE.test(trimmed) && currentPassage.length > 100) {
      passages.push({
        id: `p-${passageIndex++}`,
        text: currentPassage.trim(),
        sourcePage: null,
        title: currentTitle,
      });
      currentPassage = "";
      currentTitle = trimmed.split("\n")[0].substring(0, 200);
    }

    if (!currentTitle && HEADING_RE.test(trimmed)) {
      currentTitle = trimmed.split("\n")[0].substring(0, 200);
    }

    currentPassage += (currentPassage ? "\n\n" : "") + trimmed;
  }

  // Flush last passage
  if (currentPassage.trim().length > 100) {
    passages.push({
      id: `p-${passageIndex}`,
      text: currentPassage.trim(),
      sourcePage: null,
      title: currentTitle,
    });
  }

  // Quality filter: keep only coherent EXPLANATORY prose. Drops answer-key
  // fragments, exercise/option lists and stubs that yield ungrounded or
  // context-dependent questions (root cause of high-confidence false negatives).
  return passages.filter(p => isQualityPassage(p.text));
}

/**
 * A usable source passage is coherent explanatory prose — not an answer key,
 * exercise/option list, or short stub. These criteria drop the inputs that
 * produced ungrounded / context-dependent high-confidence questions.
 */
function isQualityPassage(text: string): boolean {
  const t = text.trim();
  if (t.length < 250) return false;

  const words = t.split(/\s+/).filter(w => /[a-zăâîșțA-ZĂÂÎȘȚ]/.test(w));
  if (words.length < 45) return false;

  // Answer-key / exercise density: lines that are bare option/answer markers.
  const lines = t.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length >= 4) {
    const markerLines = lines.filter(l => /^(?:[a-dA-D][).]|\d+[).])\s*/.test(l)).length;
    if (markerLines / lines.length > 0.35) return false;
  }

  // Must read like sentences: enough sentence-ending punctuation across the text.
  const sentenceEnders = (t.match(/[.!?:](?:\s|$)/g) || []).length;
  if (sentenceEnders < 2) return false;

  return true;
}

// ── Full Pipeline ────────────────────────────────────────────────────────

/**
 * Full ingest pipeline: buffer → extract → clean → segment
 */
export async function ingestPDF(buffer: Buffer): Promise<IngestResult> {
  const { text: rawText, pages } = await extractText(buffer);
  const cleanedText = cleanText(rawText);
  const passages = segmentPassages(cleanedText);

  return {
    passages,
    totalPages: pages,
    rawCharCount: rawText.length,
    cleanCharCount: cleanedText.length,
  };
}

/**
 * Ingest from URL: fetch → extract → clean → segment
 */
export async function ingestFromURL(url: string): Promise<IngestResult> {
  const buffer = await fetchPDF(url);
  return ingestPDF(buffer);
}
