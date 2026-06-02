import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { ingestPDF, ingestFromURL, type IngestPassage } from "@/lib/pdf-ingest";
import { screenBatch, type QuestionForMesh } from "@/lib/content-quality-mesh";

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
- Every question MUST be derivable from the passage text
- Include a "sourceQuote" field with the VERBATIM excerpt from the passage that supports the question
- Mix Bloom levels: remember, understand, apply, analyze
- 4 options (a, b, c, d) — exactly one correct
- Keep Romanian diacritics (ă, î, â, ș, ț)
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

  if (!domainId) {
    return NextResponse.json({ error: "Missing domainId" }, { status: 400 });
  }
  if (!file && !url) {
    return NextResponse.json({ error: "Provide a PDF file or URL" }, { status: 400 });
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

  // 2. Generate questions from passages (limit to first 10 passages to stay within budget)
  const passagesToProcess = ingestResult.passages.slice(0, 10);
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

  // 3. Save as DRAFT
  const maxOrder = await prisma.question.aggregate({
    where: { domainId },
    _max: { bookOrder: true },
  });
  const baseOrder = (maxOrder._max.bookOrder ?? -1) + 1;

  const created = await prisma.question.createMany({
    data: allQuestions.map((q, idx) => ({
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
      createdById: session!.user.id,
    })),
  });

  // 4. Mesh screening
  let meshScreened = 0;
  let meshFlagged = 0;
  try {
    const meshInput: QuestionForMesh[] = allQuestions.map(q => ({
      content: q.content,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      sourceText: q.sourceText,
    }));

    const meshResults = await screenBatch(meshInput);

    const createdRows = await prisma.question.findMany({
      where: { domainId, createdById: session!.user.id, bookOrder: { gte: baseOrder } },
      orderBy: { bookOrder: "asc" },
      select: { id: true },
    });

    for (let i = 0; i < Math.min(createdRows.length, meshResults.length); i++) {
      const mesh = meshResults[i];
      await prisma.question.update({
        where: { id: createdRows[i].id },
        data: {
          meshConfidence: mesh.confidence,
          meshFlags: mesh.flags.length > 0 ? JSON.parse(JSON.stringify(mesh.flags)) : undefined,
        },
      });
      meshScreened++;
      if (mesh.flags.length > 0) meshFlagged++;
    }
  } catch (err) {
    console.error("[ingest-pdf] Mesh screening failed:", (err as Error).message);
  }

  return NextResponse.json({
    generated: created.count,
    passages: ingestResult.passages.length,
    passagesProcessed: passagesToProcess.length,
    totalPages: ingestResult.totalPages,
    rawChars: ingestResult.rawCharCount,
    cleanChars: ingestResult.cleanCharCount,
    meshScreened,
    meshFlagged,
  });
}

export const POST = withErrorHandler(_POST);
