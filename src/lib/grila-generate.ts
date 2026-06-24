/**
 * Grilă generation from arbitrary document text (PDF / DOCX / TXT).
 *
 * The passage-grounded prompt + Groq→Gemini caller mirror the proven admin
 * PDF-ingest pipeline, kept here as a self-contained helper so the private
 * "Licență" feature reuses the same generation quality without importing from
 * an API route. Extraction adds DOCX/TXT on top of the existing PDF ingest.
 */
import mammoth from "mammoth";
import { ingestPDF, cleanText, segmentPassages, type IngestPassage } from "@/lib/pdf-ingest";

export type DocFileType = "pdf" | "docx" | "txt";

export function fileTypeFromName(name: string): DocFileType | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt") return "txt";
  return null;
}

/** Extract + segment any supported document into coherent passages. */
export async function extractAndSegment(buffer: Buffer, type: DocFileType): Promise<IngestPassage[]> {
  if (type === "pdf") {
    const r = await ingestPDF(buffer);
    return r.passages;
  }
  let raw: string;
  if (type === "docx") {
    const { value } = await mammoth.extractRawText({ buffer });
    raw = value || "";
  } else {
    raw = buffer.toString("utf8");
  }
  return segmentPassages(cleanText(raw));
}

export interface GeneratedGrila {
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  sourceQuote?: string;
  difficulty?: number;
}

export async function callTextAI(prompt: string): Promise<string> {
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
    } catch {
      /* fall through */
    }
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
    } catch {
      /* fall through */
    }
  }

  throw new Error("All AI providers failed");
}

const GENERATE_PROMPT = `You are an expert exam question creator for Romanian education.
Based on the PASSAGE below (from a student's bachelor's thesis / licență), generate exactly {COUNT} grounded multiple-choice grilă questions so the student knows the material thoroughly.

MANDATORY RULES:
- Every question MUST be answerable using ONLY the passage text. Do NOT add facts, dates, names or numbers that are not present verbatim in the passage. If the passage doesn't support a clean question, generate fewer — never invent.
- Include a "sourceQuote" field with the VERBATIM excerpt from the passage that supports the answer.
- 4 options (a, b, c, d) — EXACTLY one correct; the other three must be plausible but clearly wrong per the passage (no "all of the above", no two-correct, no option that is also true).
- Keep all four options roughly the SAME length and style — the correct answer must NOT be the longest or most detailed (no length cue that leaks the answer).
- Mix Bloom levels: remember, understand, apply, analyze.
- Write everything in Romanian, keeping diacritics (ă, î, â, ș, ț).
- Difficulty target: {DIFFICULTY}/5

Return ONLY valid JSON:
{{"questions": [{{"content": "...", "options": ["a) ...", "b) ...", "c) ...", "d) ..."], "correctAnswer": "a) ...", "explanation": "...", "sourceQuote": "verbatim text from passage", "difficulty": 3}}]}}

PASSAGE:
{PASSAGE}`;

/** Generate grounded grilă questions from a single passage. Returns [] on parse failure. */
export async function generateGrilaFromPassage(
  passage: IngestPassage,
  count: number,
  difficulty: number
): Promise<GeneratedGrila[]> {
  const prompt = GENERATE_PROMPT.replace("{COUNT}", String(count))
    .replace("{DIFFICULTY}", String(difficulty))
    .replace("{PASSAGE}", passage.text.substring(0, 8000));

  const aiResponse = await callTextAI(prompt);
  const clean = aiResponse.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        /* */
      }
    }
  }
  if (!parsed) return [];
  const obj = parsed as Record<string, unknown>;
  const arr = Array.isArray(parsed) ? parsed : (obj.questions as unknown[]) || (obj.items as unknown[]) || [];
  return (arr as Record<string, unknown>[])
    .filter((q) => q.content)
    .map((q) => ({
      content: String(q.content),
      options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
      correctAnswer: String(q.correctAnswer ?? ""),
      explanation: q.explanation ? String(q.explanation) : undefined,
      sourceQuote: q.sourceQuote ? String(q.sourceQuote) : undefined,
      difficulty: typeof q.difficulty === "number" ? q.difficulty : undefined,
    }))
    .filter((q) => q.correctAnswer);
}
