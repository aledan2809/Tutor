import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const schema = z.object({
  domainId: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  count: z.number().int().min(1).max(30).default(10),
  difficulty: z.number().int().min(1).max(5).default(3),
  language: z.enum(["en", "ro"]).default("ro"),
});

const GENERATE_FROM_CONTENT_PROMPT = `You are an expert exam question creator. Based on the THEORY/CONTENT below, generate exactly {COUNT} multiple-choice exam questions.

Rules:
- Questions MUST be derived from the content — do NOT invent facts not in the text
- Each question tests understanding of a specific concept from the content
- Generate 4 options (a, b, c, d) for each question
- Exactly one option is correct
- Include a brief explanation referencing the content
- Difficulty target: {DIFFICULTY}/5 (1=trivial, 5=very hard)
- Language: {LANGUAGE}
- Mix question types: factual recall, comprehension, application, analysis
- Keep Romanian diacritics (ă, î, â, ș, ț) if content is in Romanian

Return ONLY valid JSON array (no markdown):
[{{"content": "question text", "options": ["a) ...", "b) ...", "c) ...", "d) ..."], "correctAnswer": "a) ...", "explanation": "...", "difficulty": 3}}]

THEORY/CONTENT:
{CONTENT}`;

async function callTextAI(prompt: string): Promise<string> {
  const mistralKey = process.env.MISTRAL_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // Gemini (best for long content)
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
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) return text;
      }
    } catch { /* fall through */ }
  }

  // Mistral
  if (mistralKey) {
    try {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralKey}` },
        body: JSON.stringify({
          model: "mistral-small-latest",
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

  // Groq
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

  throw new Error("All AI providers failed");
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

async function _POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const textContent = formData.get("content") as string | null;
  const metaJson = formData.get("meta") as string | null;

  let meta = { domainId: "", subject: "", topic: "", count: 10, difficulty: 3, language: "ro" as const };
  if (metaJson) {
    try {
      meta = { ...meta, ...JSON.parse(metaJson) };
    } catch { /* use defaults */ }
  }

  const parsed = schema.safeParse(meta);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters", details: parsed.error.flatten() }, { status: 400 });
  }

  const { domainId, subject, topic, count, difficulty, language } = parsed.data;

  // Extract content from file or use provided text
  let content = textContent || "";

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".pdf")) {
      content = await parsePDF(buffer);
    } else if (fileName.endsWith(".docx")) {
      content = await parseDOCX(buffer);
    } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      content = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, DOCX, TXT, or MD." },
        { status: 400 }
      );
    }
  }

  if (!content || content.trim().length < 50) {
    return NextResponse.json(
      { error: "Content too short. Provide at least 50 characters of theory text." },
      { status: 400 }
    );
  }

  // Truncate very long content to ~15k chars to stay within AI context limits
  const truncated = content.length > 15000 ? content.substring(0, 15000) + "\n[...truncated]" : content;

  const prompt = GENERATE_FROM_CONTENT_PROMPT
    .replace("{COUNT}", String(count))
    .replace("{DIFFICULTY}", String(difficulty))
    .replace("{LANGUAGE}", language === "ro" ? "Romanian" : "English")
    .replace("{CONTENT}", truncated);

  const aiResponse = await callTextAI(prompt);

  // Parse response
  const cleanText = aiResponse.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let questions: Array<{
    content: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    difficulty?: number;
  }>;

  try {
    const raw = JSON.parse(cleanText);
    questions = Array.isArray(raw) ? raw : raw.questions || raw.items || [];
  } catch {
    const match = cleanText.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        questions = JSON.parse(match[0]);
      } catch {
        return NextResponse.json({ error: "AI returned invalid JSON", raw: cleanText.substring(0, 500) }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "AI returned invalid JSON", raw: cleanText.substring(0, 500) }, { status: 500 });
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "AI returned empty results" }, { status: 500 });
  }

  // Save as DRAFT
  const created = await prisma.question.createMany({
    data: questions.map((q) => ({
      domainId,
      subject,
      topic,
      difficulty: q.difficulty || difficulty,
      type: "MULTIPLE_CHOICE" as const,
      content: q.content,
      options: q.options ? (q.options as string[]) : undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || null,
      source: "AI_GENERATED" as const,
      status: "DRAFT" as const,
      createdById: session!.user.id,
    })),
  });

  return NextResponse.json({
    generated: created.count,
    contentLength: content.length,
    truncated: content.length > 15000,
  });
}

export const POST = withErrorHandler(_POST);
