import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".jfif", ".webp", ".bmp", ".tiff", ".tif"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

type ExtractedQuestion = { content: string; options?: string[]; correctAnswer: string; explanation?: string; subject?: string; topic?: string; difficulty?: number };

// ─── Step 1: Vision AI reads image → plain text transcription ───
const STEP1_PROMPT = `You are a handwriting recognition expert. Read this image of a handwritten/printed page.
TRANSCRIBE every line of text EXACTLY as written. Include all numbers, symbols, equations, diagrams described in words.
Do NOT interpret, summarize, or invent text. Only write what you can actually see.
If a word is unclear, write [unclear] instead of guessing.
Keep the original language (Romanian/English). Fix obvious letter recognition only.
Output plain text, preserving the structure of the page.`;

// ─── Step 2: Text AI transforms transcription → structured questions ───
const STEP2_PROMPT = `You are an expert at creating exam questions from study notes, exercises, and handwritten pages.
Below is a TRANSCRIPTION of a handwritten page. Transform it into structured exam questions.

Rules:
- If it's already a question with options → extract as-is with correct answer
- If it's a math/physics problem → formulate clearly, COMPUTE the correct answer
- If it's study notes about a method → create "Ce este...?" or "Descrieți..." question with options
- If it's an exercise with numbers → create "Calculați: ..." question
- For physics: use correct formulas (F=ma, P=UI, V=IR, etc.) to compute answers
- Generate 4 multiple choice options (a, b, c, d) for each question where possible
- Keep Romanian, fix diacritics (ă, î, â, ș, ț)
- difficulty: 1=trivial, 2=easy, 3=medium, 4=hard, 5=very hard

Return JSON: {"questions": [{"content": "...", "options": ["a","b","c","d"], "correctAnswer": "...", "explanation": "...", "subject": "...", "topic": "...", "difficulty": 3}]}
Return ONLY valid JSON, no markdown.

TRANSCRIPTION:
`;

async function callVisionAI(base64: string, prompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // 1. Gemini
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64 } }] }],
          generationConfig: { temperature: 0.1 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) { console.log("[bulk-import] Gemini Vision OK"); return text; }
      } else { console.error("[bulk-import] Gemini:", res.status); }
    } catch (e) { console.error("[bulk-import] Gemini error:", (e as Error).message); }
  }

  // 2. Groq (fast, free, reliable)
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }] }],
          temperature: 0.1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";
        if (text) { console.log("[bulk-import] Groq Vision OK"); return text; }
      } else { console.error("[bulk-import] Groq:", res.status); }
    } catch (e) { console.error("[bulk-import] Groq error:", (e as Error).message); }
  }

  // 3. Mistral Pixtral with retry
  if (mistralKey) {
    for (let i = 0; i < 3; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 10000 * i));
      try {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralKey}` },
          body: JSON.stringify({
            model: "pixtral-12b-2409",
            messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }] }],
            temperature: 0.1,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || "";
          if (text) { console.log("[bulk-import] Mistral Vision OK"); return text; }
        } else if (res.status === 429 && i < 2) {
          console.log("[bulk-import] Mistral 429, retry...");
        } else { console.error("[bulk-import] Mistral:", res.status); break; }
      } catch (e) { console.error("[bulk-import] Mistral error:", (e as Error).message); }
    }
  }

  throw new Error("All vision providers failed. Try again in a minute.");
}

async function callTextAI(prompt: string): Promise<string> {
  const mistralKey = process.env.MISTRAL_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // Mistral text (separate from vision, different rate limit)
  if (mistralKey) {
    try {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralKey}` },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2, response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";
        if (text) { console.log("[bulk-import] Mistral Text OK"); return text; }
      }
    } catch { /* fall through */ }
  }

  // Groq text
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2, response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";
        if (text) { console.log("[bulk-import] Groq Text OK"); return text; }
      }
    } catch { /* fall through */ }
  }

  throw new Error("Text AI failed");
}

async function extractQuestionsFromImage(buffer: Buffer): Promise<ExtractedQuestion[]> {
  const base64 = buffer.toString("base64");

  // STEP 1: Transcribe image → plain text
  console.log("[bulk-import] Step 1: Transcribing...");
  const transcription = await callVisionAI(base64, STEP1_PROMPT);
  console.log("[bulk-import] Transcription:", transcription.length, "chars");
  console.log("[bulk-import] Preview:", transcription.substring(0, 200));

  if (transcription.length < 20) throw new Error("Could not read text from image");

  // STEP 2: Transform transcription → structured questions
  console.log("[bulk-import] Step 2: Structuring questions...");
  const questionsJson = await callTextAI(STEP2_PROMPT + transcription);
  if (!questionsJson) throw new Error("Failed to create questions from transcription");

  // Parse
  const cleanText = questionsJson.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let parsed;
  try {
    parsed = JSON.parse(cleanText);
  } catch {
    const objMatch = cleanText.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { parsed = JSON.parse(objMatch[0]); } catch { /* fall through */ }
    }
    if (!parsed) {
      console.error("[bulk-import] Parse failed:", cleanText.substring(0, 300));
      throw new Error("AI did not return valid JSON");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arr: any[] = Array.isArray(parsed) ? parsed : parsed.questions || parsed.items || [];
  if (arr.length === 0) {
    console.error("[bulk-import] Empty questions from:", JSON.stringify(parsed).substring(0, 300));
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

// ─── Document parsers ───

async function parsePDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
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
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
}

function extractQuestionsFromText(text: string): Array<{ content: string; correctAnswer: string }> {
  const blocks = text.split(/(?=\d+[\.\)]\s)/).filter((b) => b.trim().length > 20);
  return blocks.map((block) => {
    const lines = block.trim().split("\n");
    return {
      content: lines[0]?.replace(/^\d+[\.\)]\s*/, "").trim() || block.trim().substring(0, 200),
      correctAnswer: lines.slice(1).join("\n").trim() || "To be filled",
    };
  });
}

// ─── Main handler ───

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

  // Save all uploaded files for reprocessing
  try {
    const fs = await import("fs");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, `${Date.now()}_${file.name}`), buffer);
  } catch { /* ignore save errors */ }

  if (fileName.endsWith(".pdf")) {
    let text = await parsePDF(buffer);

    // If PDF is scanned (very little text extracted), use AI Vision
    if (text.trim().length < 200 && buffer.length > 10000) {
      console.log("[bulk-import] Scanned PDF detected — using AI Vision on PDF");
      const base64 = buffer.toString("base64");
      const geminiKey = process.env.GEMINI_API_KEY;

      if (!geminiKey) {
        return NextResponse.json({ error: "Scanned PDF detected but no AI Vision provider configured (GEMINI_API_KEY needed)" }, { status: 400 });
      }

      // Gemini supports PDF natively — send full document, extract questions in batches
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [
              { text: STEP2_PROMPT + "\n[This is a scanned PDF with exam questions. Extract ALL questions you can find.]" },
              { inline_data: { mime_type: "application/pdf", data: base64 } }
            ] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("[bulk-import] Gemini PDF error:", res.status, errText.substring(0, 200));
          return NextResponse.json({ error: `AI Vision failed (${res.status}). PDF may be too large — try splitting into smaller files.` }, { status: 500 });
        }

        const data = await res.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleanText = aiText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

        let parsed;
        try {
          parsed = JSON.parse(cleanText);
        } catch {
          const match = cleanText.match(/\{[\s\S]*\}/);
          if (match) try { parsed = JSON.parse(match[0]); } catch { /* */ }
        }

        if (!parsed) {
          return NextResponse.json({ error: "AI could not extract questions from scanned PDF", raw: cleanText.substring(0, 300) }, { status: 500 });
        }

        const arr = Array.isArray(parsed) ? parsed : parsed.questions || parsed.items || [];
        if (arr.length === 0) {
          return NextResponse.json({ error: "No questions found in scanned PDF" }, { status: 400 });
        }

        const created = await prisma.question.createMany({
          data: arr.map((q: Record<string, unknown>) => ({
            domainId,
            subject: (q.subject as string) || subject || "General",
            topic: (q.topic as string) || topic || "General",
            difficulty: (typeof q.difficulty === "number" ? Math.min(5, Math.max(1, q.difficulty as number)) : difficulty) || 3,
            type: (Array.isArray(q.options) ? "MULTIPLE_CHOICE" : "OPEN") as "MULTIPLE_CHOICE" | "OPEN",
            content: String(q.content || ""),
            options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
            correctAnswer: String(q.correctAnswer || "To be determined"),
            explanation: q.explanation ? String(q.explanation) : undefined,
            source: "MANUAL" as const,
            status: "DRAFT" as const,
            createdById: session!.user.id,
          })).filter((q: { content: string }) => q.content.trim()),
        });

        return NextResponse.json({ imported: created.count, total: arr.length, fromScannedPDF: true });
      } catch (err) {
        console.error("[bulk-import] Scanned PDF processing failed:", err);
        return NextResponse.json({ error: "Failed to process scanned PDF: " + (err instanceof Error ? err.message : "Unknown error") }, { status: 500 });
      }
    }

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
      console.error("[bulk-import] Failed:", msg);
      return NextResponse.json({ error: `Failed to extract questions: ${msg}` }, { status: 500 });
    }

    if (aiQuestions.length === 0) {
      return NextResponse.json({ error: "No questions found in image." }, { status: 400 });
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
