import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".jfif", ".webp", ".bmp", ".tiff", ".tif"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

type ExtractedQuestion = { content: string; options?: string[]; correctAnswer: string; explanation?: string; subject?: string; topic?: string; difficulty?: number };

const VISION_PROMPT = `You are an expert at extracting exam/test questions from images.
Look at this image carefully. It contains exam questions (possibly in Romanian or English).
Extract EVERY question you can see. Return a JSON object with a "questions" array.
Each question: {content, options (array if multiple choice), correctAnswer (or "To be determined"), subject, topic, difficulty (1-5)}.
Return ONLY valid JSON, no markdown wrapping.`;

async function extractQuestionsFromImage(buffer: Buffer): Promise<ExtractedQuestion[]> {
  const base64 = buffer.toString("base64");
  const geminiKey = process.env.GEMINI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  let text = "";

  // 1. Gemini Vision (FREE) — best for image understanding
  if (!text && geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: VISION_PROMPT },
              { inline_data: { mime_type: "image/jpeg", data: base64 } },
            ],
          }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) console.log("[bulk-import] Gemini Vision OK, response length:", text.length);
      } else {
        const errBody = await res.text().catch(() => "");
        console.error("[bulk-import] Gemini Vision failed:", res.status, errBody.substring(0, 300));
      }
    } catch (e) { console.error("[bulk-import] Gemini Vision error:", (e as Error).message); }
  }

  // 2. Mistral Vision (pixtral) — fallback
  if (!text && mistralKey) {
    try {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralKey}` },
        body: JSON.stringify({
          model: "pixtral-12b-2409",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: VISION_PROMPT },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
            ],
          }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        text = data.choices?.[0]?.message?.content || "";
        if (text) console.log("[bulk-import] Mistral Vision OK, response length:", text.length);
      } else {
        const errBody = await res.text().catch(() => "");
        console.error("[bulk-import] Mistral Vision failed:", res.status, errBody.substring(0, 300));
      }
    } catch (e) { console.error("[bulk-import] Mistral Vision error:", (e as Error).message); }
  }

  if (!text) throw new Error("Vision AI failed — no provider returned results");

  // Parse JSON response
  const cleanText = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let parsed;
  try {
    parsed = JSON.parse(cleanText);
  } catch {
    const objMatch = cleanText.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { parsed = JSON.parse(objMatch[0]); } catch { /* fall through */ }
    }
    if (!parsed) {
      console.error("[bulk-import] Vision raw:", text.substring(0, 500));
      throw new Error("AI did not return valid JSON");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arr: any[] = Array.isArray(parsed) ? parsed : parsed.questions || parsed.items || [];
  if (!Array.isArray(arr) || arr.length === 0) {
    console.error("[bulk-import] Vision parsed but empty:", JSON.stringify(parsed).substring(0, 300));
    throw new Error("No questions found in image");
  }

  return arr.map((q: Record<string, unknown>) => ({
    content: String(q.content || ""),
    options: Array.isArray(q.options) ? q.options.map(String) : undefined,
    correctAnswer: String(q.correctAnswer || "To be determined"),
    explanation: q.explanation ? String(q.explanation) : undefined,
    subject: q.subject ? String(q.subject) : undefined,
    topic: q.topic ? String(q.topic) : undefined,
    difficulty: typeof q.difficulty === "number" ? Math.min(5, Math.max(1, q.difficulty)) : undefined,
  })).filter((q) => q.content.trim());
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

    let aiQuestions: ExtractedQuestion[];
    try {
      aiQuestions = await extractQuestionsFromImage(buffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Image processing failed";
      console.error("[bulk-import] Vision extraction failed:", msg);
      return NextResponse.json({ error: `Failed to extract questions: ${msg}` }, { status: 500 });
    }

    if (aiQuestions.length === 0) {
      return NextResponse.json({ error: "No questions could be found in the image. Try a clearer image with visible text." }, { status: 400 });
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
