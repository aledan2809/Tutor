/**
 * Magic Quiz — public, no-auth quiz generation from arbitrary text.
 *
 * Faza 0 / Tier 0 (Viral Layer): exposes the "any text → adaptive quiz" magic
 * as a public demo. Self-contained provider cascade (Gemini → Mistral → Groq)
 * so it never touches the authenticated admin generation path. Grounded: the
 * model must derive questions ONLY from the provided text (no invented facts).
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface MagicQuestion {
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const MAGIC_MAX_QUESTIONS = 5;
export const MAGIC_MIN_CHARS = 50;
export const MAGIC_MAX_CHARS = 6000;

// ─── Tier 1: persistence (duel + lazy-save + certificate) ───

export const MAGIC_QUIZ_TTL_DAYS = 90;

/** A question as served publicly for the duel — correct answer stripped. */
export interface MagicQuestionPublic {
  content: string;
  options: string[];
}

/**
 * Validate + sanitize a quiz coming from the client before persisting.
 * Returns a clean MagicQuestion[] (≤5) or null if the shape is invalid.
 */
export function sanitizeQuizForSave(raw: unknown): MagicQuestion[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: MagicQuestion[] = [];
  for (const q of raw.slice(0, MAGIC_MAX_QUESTIONS)) {
    if (!q || typeof q !== "object") return null;
    const o = q as Record<string, unknown>;
    const content = typeof o.content === "string" ? o.content.trim() : "";
    const options = Array.isArray(o.options)
      ? o.options.filter((x) => typeof x === "string").map((x) => (x as string).trim())
      : [];
    const correctIndex = typeof o.correctIndex === "number" ? o.correctIndex : -1;
    const explanation = typeof o.explanation === "string" ? o.explanation.trim() : "";
    if (!content || content.length > 1000) return null;
    if (options.length !== 4 || options.some((x) => !x || x.length > 500)) return null;
    if (correctIndex < 0 || correctIndex > 3) return null;
    out.push({ content, options, correctIndex, explanation: explanation.slice(0, 1000) });
  }
  return out.length > 0 ? out : null;
}

/** Persist a generated quiz so a friend can take it / it can be claimed at signup. */
export async function persistMagicQuiz(input: {
  questions: MagicQuestion[];
  language: string;
  sharerScore: number;
  creatorName?: string | null;
  at?: Date;
}): Promise<{ id: string }> {
  const total = input.questions.length;
  const at = input.at ?? new Date();
  const expiresAt = new Date(at.getTime() + MAGIC_QUIZ_TTL_DAYS * 24 * 60 * 60 * 1000);
  const name = (input.creatorName || "").trim().slice(0, 60) || null;
  const score = Math.max(0, Math.min(total, Math.round(input.sharerScore)));

  const row = await prisma.magicQuiz.create({
    data: {
      questions: input.questions as unknown as Prisma.InputJsonValue,
      language: input.language === "en" ? "en" : "ro",
      sharerScore: score,
      total,
      creatorName: name,
      expiresAt,
    },
    select: { id: true },
  });
  return { id: row.id };
}

/** Public duel view — questions WITHOUT correct answers. Null if missing/expired. */
export async function getMagicQuizPublic(id: string, now?: Date): Promise<{
  id: string;
  questions: MagicQuestionPublic[];
  language: string;
  creatorName: string | null;
  sharerScore: number;
  total: number;
} | null> {
  const row = await prisma.magicQuiz.findUnique({
    where: { id },
    select: {
      id: true,
      questions: true,
      language: true,
      creatorName: true,
      sharerScore: true,
      total: true,
      expiresAt: true,
    },
  });
  if (!row) return null;
  if (row.expiresAt.getTime() < (now ?? new Date()).getTime()) return null;

  const full = (row.questions as unknown as MagicQuestion[]) || [];
  return {
    id: row.id,
    questions: full.map((q) => ({ content: q.content, options: q.options })),
    language: row.language,
    creatorName: row.creatorName,
    sharerScore: row.sharerScore,
    total: row.total,
  };
}

/** Score a duel attempt server-side (correct answers never reach the friend's browser). */
export async function scoreMagicQuiz(
  id: string,
  answers: number[],
  now?: Date
): Promise<{
  score: number;
  total: number;
  sharerScore: number;
  creatorName: string | null;
  results: { correctIndex: number; chosen: number; isCorrect: boolean; explanation: string }[];
} | null> {
  const row = await prisma.magicQuiz.findUnique({
    where: { id },
    select: { questions: true, total: true, sharerScore: true, creatorName: true, expiresAt: true },
  });
  if (!row) return null;
  if (row.expiresAt.getTime() < (now ?? new Date()).getTime()) return null;

  const full = (row.questions as unknown as MagicQuestion[]) || [];
  const results = full.map((q, i) => {
    const chosen = typeof answers[i] === "number" ? answers[i] : -1;
    return {
      correctIndex: q.correctIndex,
      chosen,
      isCorrect: chosen === q.correctIndex,
      explanation: q.explanation,
    };
  });
  const score = results.filter((r) => r.isCorrect).length;

  // Count the take (best-effort; never block scoring on the counter).
  try {
    await prisma.magicQuiz.update({ where: { id }, data: { takenCount: { increment: 1 } } });
  } catch {
    /* ignore */
  }

  return { score, total: row.total, sharerScore: row.sharerScore, creatorName: row.creatorName, results };
}

function buildPrompt(text: string, count: number, language: "ro" | "en"): string {
  const langName = language === "ro" ? "Romanian" : "English";
  return `You are an expert exam question creator. Based ONLY on the CONTENT below, generate exactly ${count} multiple-choice questions.

Rules:
- Questions MUST be derived from the content — do NOT invent facts not in the text.
- Each question tests understanding of a specific concept from the content.
- Exactly 4 options per question; exactly one correct.
- "correctIndex" is the 0-based index (0..3) of the correct option.
- Include a short "explanation" (1-2 sentences) referencing the content.
- Language: ${langName}. Keep Romanian diacritics (ă, î, â, ș, ț) if content is Romanian.
- Mix recall, comprehension and application.

Return ONLY a valid JSON array (no markdown, no prose):
[{"content":"question text","options":["opt1","opt2","opt3","opt4"],"correctIndex":0,"explanation":"why"}]

CONTENT:
${text}`;
}

async function callTextAI(prompt: string): Promise<{ raw: string; provider: string }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // Gemini (best for grounding on long content)
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
        if (text) return { raw: text, provider: "gemini" };
      }
    } catch {
      /* fall through */
    }
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
        const text = data.choices?.[0]?.message?.content || "";
        if (text) return { raw: text, provider: "mistral" };
      }
    } catch {
      /* fall through */
    }
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
        const text = data.choices?.[0]?.message?.content || "";
        if (text) return { raw: text, provider: "groq" };
      }
    } catch {
      /* fall through */
    }
  }

  throw new Error("All AI providers unavailable");
}

function parseQuestions(raw: string): MagicQuestion[] {
  const clean = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("AI returned non-JSON");
    parsed = JSON.parse(match[0]);
  }

  const arr: unknown[] = Array.isArray(parsed)
    ? parsed
    : (parsed as { questions?: unknown[]; items?: unknown[] })?.questions ||
      (parsed as { items?: unknown[] })?.items ||
      [];

  const out: MagicQuestion[] = [];
  for (const q of arr) {
    const o = q as Record<string, unknown>;
    const options = Array.isArray(o.options) ? (o.options as unknown[]).map((x) => String(x)) : [];
    if (typeof o.content !== "string" || options.length !== 4) continue;

    // correctIndex may come as index or as the answer text — normalize both.
    let correctIndex = -1;
    if (typeof o.correctIndex === "number") {
      correctIndex = o.correctIndex;
    } else if (typeof o.correctAnswer === "string") {
      correctIndex = options.findIndex((opt) => opt.trim() === (o.correctAnswer as string).trim());
    }
    if (correctIndex < 0 || correctIndex > 3) continue;

    // Models (esp. Mistral) tend to put the correct answer first → always index 0,
    // which makes the demo trivially gameable ("always pick A"). Shuffle option
    // positions and remap the correct index so answers are spread across A-D.
    const correctOption = options[correctIndex];
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const shuffledCorrect = shuffled.indexOf(correctOption);

    out.push({
      content: o.content,
      options: shuffled,
      correctIndex: shuffledCorrect >= 0 ? shuffledCorrect : correctIndex,
      explanation: typeof o.explanation === "string" ? o.explanation : "",
    });
  }
  return out;
}

export async function generateQuizFromText(params: {
  text: string;
  count?: number;
  language?: "ro" | "en";
}): Promise<{ questions: MagicQuestion[]; provider: string }> {
  const count = Math.min(params.count ?? MAGIC_MAX_QUESTIONS, MAGIC_MAX_QUESTIONS);
  const language = params.language === "en" ? "en" : "ro";
  const text =
    params.text.length > MAGIC_MAX_CHARS
      ? params.text.slice(0, MAGIC_MAX_CHARS) + "\n[...]"
      : params.text;

  const { raw, provider } = await callTextAI(buildPrompt(text, count, language));
  const questions = parseQuestions(raw).slice(0, count);
  if (questions.length === 0) throw new Error("Could not generate questions from this text");
  return { questions, provider };
}
