import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || "http://localhost:8000";
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".jfif", ".webp", ".bmp", ".tiff", ".tif"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

async function processImageOCR(buffer: Buffer, fileName: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)]);
  formData.append("file", blob, fileName);

  const res = await fetch(`${OCR_SERVICE_URL}/ocr`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`OCR service error: ${res.status}`);
  const data = await res.json();
  return data.text || data.result || "";
}

async function extractQuestionsWithAI(
  ocrText: string
): Promise<Array<{ content: string; options?: string[]; correctAnswer: string; explanation?: string; subject?: string; topic?: string; difficulty?: number }>> {
  // Use OpenAI or Anthropic via environment
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No AI API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)");

  const isAnthropic = !process.env.OPENAI_API_KEY && !!process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `You are an expert at extracting exam questions from OCR text.
Extract each separate question from the provided text. Return ONLY valid JSON array.
Each element: {content, options (array if multiple choice), correctAnswer, explanation, subject, topic, difficulty}.
- subject: the broad subject area (e.g. "Mathematics", "Aviation Safety", "Physics")
- topic: the specific topic within the subject (e.g. "Algebra", "Emergency Procedures", "Thermodynamics")
- difficulty: 1-5 (1=very easy, 3=medium, 5=very hard)
If you cannot determine the correct answer, use "To be determined".
Detect subject/topic/difficulty from the question content and context.`;

  let text: string;

  if (isAnthropic) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Extract all questions from this OCR text:\n\n${ocrText}` }],
      }),
    });
    const data = await res.json();
    text = data.content?.[0]?.text || "";
  } else {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract all questions from this OCR text:\n\n${ocrText}` },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });
    const data = await res.json();
    text = data.choices?.[0]?.message?.content || "";
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error("AI did not return valid JSON");
  }

  const arr = Array.isArray(parsed) ? parsed : parsed.questions || [];
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("No questions extracted");

  return arr.map((q: Record<string, unknown>) => ({
    content: String(q.content || ""),
    options: Array.isArray(q.options) ? q.options.map(String) : undefined,
    correctAnswer: String(q.correctAnswer || "To be determined"),
    explanation: q.explanation ? String(q.explanation) : undefined,
    subject: q.subject ? String(q.subject) : undefined,
    topic: q.topic ? String(q.topic) : undefined,
    difficulty: typeof q.difficulty === "number" ? Math.min(5, Math.max(1, q.difficulty)) : undefined,
  }));
}

async function parsePDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

function extractQuestionsFromText(text: string): Array<{ content: string; correctAnswer: string }> {
  // Split by common question patterns (numbered questions)
  const blocks = text.split(/(?=\d+[\.\)]\s)/).filter((b) => b.trim().length > 20);

  return blocks.map((block) => {
    const lines = block.trim().split("\n");
    return {
      content: lines[0]?.replace(/^\d+[\.\)]\s*/, "").trim() || block.trim().substring(0, 200),
      correctAnswer: lines.slice(1).join("\n").trim() || "To be filled",
    };
  });
}

async function _POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const domainId = formData.get("domainId") as string;
  const subject = (formData.get("subject") as string) || "";
  const topic = (formData.get("topic") as string) || "";
  const difficulty = parseInt((formData.get("difficulty") as string) || "0");

  if (!file || !domainId) {
    return NextResponse.json({ error: "Missing required fields: file, domainId" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();
  let questions: Array<{ content: string; correctAnswer: string; options?: string[] }> = [];

  if (fileName.endsWith(".pdf")) {
    const text = await parsePDF(buffer);
    questions = extractQuestionsFromText(text);
  } else if (fileName.endsWith(".docx")) {
    const text = await parseDOCX(buffer);
    questions = extractQuestionsFromText(text);
  } else if (fileName.endsWith(".csv")) {
    const text = buffer.toString("utf-8");
    const rows = parseCSV(text);
    questions = rows
      .filter((r) => r.content || r.question)
      .map((r) => ({
        content: r.content || r.question || "",
        correctAnswer: r.correctAnswer || r.answer || "",
        options: r.options ? r.options.split("|") : undefined,
      }));
  } else if (IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
    if (buffer.length > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image too large. Maximum size is 10MB." }, { status: 400 });
    }

    let ocrText: string;
    try {
      ocrText = await processImageOCR(buffer, file.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OCR processing failed";
      console.error("[bulk-import] OCR failed:", msg);
      return NextResponse.json({ error: `Failed to process image: ${msg}` }, { status: 500 });
    }

    if (!ocrText || ocrText.trim().length < 10) {
      return NextResponse.json({ error: "Could not extract readable text from image. Try a clearer image." }, { status: 400 });
    }

    let aiQuestions;
    try {
      aiQuestions = await extractQuestionsWithAI(ocrText);
      aiQuestions = aiQuestions.filter((q) => q.content?.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI extraction failed";
      console.error("[bulk-import] AI extraction failed:", msg);
      return NextResponse.json({ error: `Failed to extract questions: ${msg}` }, { status: 500 });
    }

    if (aiQuestions.length === 0) {
      return NextResponse.json({ error: "No valid questions could be extracted from the image." }, { status: 400 });
    }

    const created = await prisma.question.createMany({
      data: aiQuestions.map((q) => ({
        domainId,
        subject: q.subject || subject || "General",
        topic: q.topic || topic || "General",
        difficulty: q.difficulty || difficulty || 3,
        type: q.options ? "MULTIPLE_CHOICE" as const : "OPEN" as const,
        content: q.content,
        options: q.options ? (q.options as string[]) : undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || undefined,
        source: "MANUAL" as const,
        status: "DRAFT" as const,
        createdById: session!.user.id,
      })),
    });

    return NextResponse.json({ imported: created.count, total: aiQuestions.length, fromImage: true });
  } else {
    return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, CSV, or Image (PNG/JPEG/JFIF/WebP)." }, { status: 400 });
  }

  if (questions.length === 0) {
    return NextResponse.json({ error: "No questions could be extracted from the file." }, { status: 400 });
  }

  // Bulk create - manual content gets approved directly
  const created = await prisma.question.createMany({
    data: questions.map((q) => ({
      domainId,
      subject: subject || "General",
      topic: topic || "General",
      difficulty: difficulty || 3,
      type: q.options ? "MULTIPLE_CHOICE" as const : "OPEN" as const,
      content: q.content,
      options: q.options ? (q.options as string[]) : undefined,
      correctAnswer: q.correctAnswer,
      source: "MANUAL" as const,
      status: "APPROVED" as const,
      createdById: session!.user.id,
    })),
  });

  return NextResponse.json({ imported: created.count, total: questions.length });
}

export const POST = withErrorHandler(_POST);
