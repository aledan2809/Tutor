import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { ingestPDF, ingestFromURL, type IngestPassage } from "@/lib/pdf-ingest";
import { screenBatchWithFix, type QuestionForMesh } from "@/lib/content-quality-mesh";

/**
 * POST /api/admin/questions/ingest-pdf
 *
 * Full Tier 5 pipeline: PDF → extract → clean → segment → generate questions → mesh screen
 *
 * Input (FormData):
 *   file?: File (PDF)
 *   url?: string (PDF URL, e.g. manuale.edu.ro)
 *   domainId: string
 *   subject: string
 *   topic: string
 *   count?: number (questions per passage, default 5)
 *   difficulty?: number (1-5, default 3)
 */

async function callTextAI(prompt: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // Groq (preferred — free tier)
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "";
      }
    } catch { /* fall through */ }
  }

  // Gemini fallback
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    } catch { /* fall through */ }
  }

  throw new Error("All AI providers failed");
}

const GENERATE_PROMPT = `You are an expert exam question creator for Romanian education.
Based on the PASSAGE below, generate exactly {COUNT} grounded multiple-choice questions.

MANDATORY RULES:
- Every question MUST be answerable using ONLY the passage text. Do NOT add facts, dates, names or numbers that are not present verbatim in the passage. If the passage doesn't support a clean question, generate fewer — never invent.
- Include a "sourceQuote" field with the VERBATIM excerpt from the passage that supports the answer.
- 4 options (a, b, c, d) — EXACTLY one correct; the other three must be plausible but clearly wrong per the passage (no "all of the above", no two-correct, no option that is also true).
- Keep all four options roughly the SAME length and style — the correct answer must NOT be the longest or most detailed (no length cue that leaks the answer).
- Avoid bare named-entity recall with no context (e.g. "Who/when X?" with nothing else); prefer questions whose answer is grounded by the quote.
- Mix Bloom levels: remember, understand, apply, analyze.
- Keep Romanian diacritics (ă, î, â, ș, ț).
- Difficulty target: {DIFFICULTY}/5

Return ONLY valid JSON:
{{"questions": [{{"content": "...", "options": ["a) ...", "b) ...", "c) ...", "d) ..."], "correctAnswer": "a) ...", "explanation": "...", "sourceQuote": "verbatim text from passage", "difficulty": 3}}]}}

PASSAGE:
{PASSAGE}`;

async function generateFromPassage(
  passage: IngestPassage,
  count: number,
  difficulty: number
): Promise<Array<{ content: string; options?: string[]; correctAnswer: string; explanation?: string; sourceQuote?: string; difficulty?: number }>> {
  const prompt = GENERATE_PROMPT
    .replace("{COUNT}", String(count))
    .replace("{DIFFICULTY}", String(difficulty))
    .replace("{PASSAGE}", passage.text.substring(0, 8000));

  const aiResponse = await callTextAI(prompt);
  const clean = aiResponse.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) try { parsed = JSON.parse(match[0]); } catch { /* */ }
  }

  if (!parsed) return [];
  const arr = Array.isArray(parsed) ? parsed : parsed.questions || parsed.items || [];
  return arr.filter((q: Record<string, unknown>) => q.content);
}

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB

// Basic SSRF guard for the URL ingest path: public http(s) only, no internal
// hosts. (Literal-host check — does not resolve DNS; admin-gated route.)
function isSafeFetchUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (host === "[::1]" || host === "metadata.google.internal") return false;
  if (/^(127\.|10\.|169\.254\.|192\.168\.|0\.0\.0\.0$)/.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  return true;
}

async function _POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const url = formData.get("url") as string | null;
  const domainId = formData.get("domainId") as string;
  const subject = (formData.get("subject") as string) || "General";
  const topic = (formData.get("topic") as string) || "General";
  const count = parseInt((formData.get("count") as string) || "5");
  const difficulty = parseInt((formData.get("difficulty") as string) || "3");
  // Coverage window: process the whole book by chunking calls across passage
  // ranges (each call stays under the HTTP/nginx timeout). Default 10 passages.
  const passageOffset = Math.max(0, parseInt((formData.get("passageOffset") as string) || "0") || 0);
  const maxPassages = Math.min(60, Math.max(1, parseInt((formData.get("maxPassages") as string) || "10") || 10));

  if (!domainId) {
    return NextResponse.json({ error: "Missing domainId" }, { status: 400 });
  }
  if (!file && !url) {
    return NextResponse.json({ error: "Provide a PDF file or URL" }, { status: 400 });
  }
  if (file && file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: `PDF too large (${Math.round(file.size / 1024 / 1024)} MB, max 25 MB)` },
      { status: 413 }
    );
  }
  if (url && !isSafeFetchUrl(url)) {
    return NextResponse.json(
      { error: "URL must be a public http(s) address" },
      { status: 400 }
    );
  }

  // 1. Ingest PDF
  let ingestResult;
  try {
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      ingestResult = await ingestPDF(buffer);
    } else {
      ingestResult = await ingestFromURL(url!);
    }
  } catch (err) {
    return NextResponse.json(
      { error: `PDF ingest failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  if (ingestResult.passages.length === 0) {
    return NextResponse.json({ error: "No usable passages found in PDF" }, { status: 400 });
  }

  // 2. Generate questions from a passage window (chunked full-book coverage).
  const passagesToProcess = ingestResult.passages.slice(passageOffset, passageOffset + maxPassages);
  const allQuestions: Array<{
    content: string; options?: string[]; correctAnswer: string;
    explanation?: string; sourceQuote?: string; difficulty?: number;
    passageTitle?: string; sourceText?: string;
  }> = [];

  for (const passage of passagesToProcess) {
    try {
      const questions = await generateFromPassage(passage, Math.min(count, 10), difficulty);
      for (const q of questions) {
        allQuestions.push({
          ...q,
          passageTitle: passage.title || undefined,
          sourceText: passage.text.substring(0, 3000),
        });
      }
    } catch (err) {
      console.error(`[ingest-pdf] Generation failed for passage "${passage.title}":`, (err as Error).message);
    }
  }

  if (allQuestions.length === 0) {
    return NextResponse.json({ error: "No questions generated from passages" }, { status: 500 });
  }

  // 3. Screen + fix BEFORE persisting, then gate on quality. screenBatchWithFix
  // runs the 3-lens mesh, auto-repairs fixable flags (max 2 rounds), and marks
  // unfixable / mandatory-defect questions as "escalate".
  const meshInput: QuestionForMesh[] = allQuestions.map(q => ({
    content: q.content,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    sourceText: q.sourceText,
  }));
  const screened = await screenBatchWithFix(meshInput, 2);

  // Quality gate: keep high-confidence (clean) + review-prioritized (minor flags,
  // human gate), but DISCARD "escalate" — unfixable hallucination / mandatory
  // defect / very low score — so the kept set is the 97%+ candidate bucket.
  // Apply any auto-fix to the kept content. Nothing is ever auto-published.
  type Kept = (typeof allQuestions)[number] & { meshConfidence: number; meshFlags: unknown[] };
  const kept: Kept[] = [];
  let highConfidence = 0, reviewPrioritized = 0, discarded = 0, autoFixed = 0;

  for (let i = 0; i < allQuestions.length; i++) {
    const s = screened[i];
    if (!s) { discarded++; continue; }
    const { result, fixedQuestion, fixRounds } = s;

    if (result.recommendation === "escalate") { discarded++; continue; }

    const base = allQuestions[i];
    const merged = fixedQuestion
      ? {
          ...base,
          content: fixedQuestion.content ?? base.content,
          options: fixedQuestion.options ?? base.options,
          correctAnswer: fixedQuestion.correctAnswer ?? base.correctAnswer,
          explanation: fixedQuestion.explanation ?? base.explanation,
        }
      : base;
    if (fixRounds > 0) autoFixed++;

    kept.push({ ...merged, meshConfidence: result.confidence, meshFlags: result.flags });
    if (result.recommendation === "high-confidence") highConfidence++;
    else reviewPrioritized++;
  }

  if (kept.length === 0) {
    return NextResponse.json({
      generated: allQuestions.length, kept: 0, highConfidence: 0,
      reviewPrioritized: 0, discarded, autoFixed,
      note: "All generated questions were discarded by the quality gate",
    });
  }

  // 4. Persist kept questions as DRAFT — allocate bookOrder + create rows in a
  // single Serializable transaction (TOCTOU-safe). Mesh confidence + flags are
  // written at creation; createdIds[i] aligns with kept[i].
  let createdIds: string[];
  try {
    createdIds = await prisma.$transaction(
      async (tx) => {
        const maxOrder = await tx.question.aggregate({
          where: { domainId },
          _max: { bookOrder: true },
        });
        const baseOrder = (maxOrder._max.bookOrder ?? -1) + 1;

        const ids: string[] = [];
        for (let idx = 0; idx < kept.length; idx++) {
          const q = kept[idx];
          const row = await tx.question.create({
            data: {
              domainId,
              subject,
              topic,
              difficulty: q.difficulty || difficulty,
              type: "MULTIPLE_CHOICE" as const,
              content: q.content,
              options: q.options ? (q.options as string[]) : undefined,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || null,
              sourceReference: q.sourceQuote ? `Source: "${q.sourceQuote.substring(0, 200)}"` : null,
              source: "AI_GENERATED" as const,
              status: "DRAFT" as const,
              bookOrder: baseOrder + idx,
              qNumberInBook: idx + 1,
              meshConfidence: q.meshConfidence,
              meshFlags: q.meshFlags.length > 0 ? JSON.parse(JSON.stringify(q.meshFlags)) : undefined,
              createdById: session!.user.id,
            },
            select: { id: true },
          });
          ids.push(row.id);
        }
        return ids;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 }
    );
  } catch (err) {
    if ((err as { code?: string }).code === "P2034") {
      return NextResponse.json(
        { error: "Concurrent ingest on this domain — please retry" },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json({
    generated: allQuestions.length,
    kept: createdIds.length,
    highConfidence,
    reviewPrioritized,
    discarded,
    autoFixed,
    cleanRate: Math.round((highConfidence / createdIds.length) * 100),
    passagesTotal: ingestResult.passages.length,
    passageWindow: `${passageOffset}-${passageOffset + passagesToProcess.length}`,
    passagesProcessed: passagesToProcess.length,
    totalPages: ingestResult.totalPages,
    cleanChars: ingestResult.cleanCharCount,
  });
}

export const POST = withErrorHandler(_POST);
