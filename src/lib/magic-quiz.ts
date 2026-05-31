/**
 * Magic Quiz — public, no-auth quiz generation from arbitrary text.
 *
 * Faza 0 / Tier 0 (Viral Layer): exposes the "any text → adaptive quiz" magic
 * as a public demo. Self-contained provider cascade (Gemini → Mistral → Groq)
 * so it never touches the authenticated admin generation path. Grounded: the
 * model must derive questions ONLY from the provided text (no invented facts).
 */

export interface MagicQuestion {
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const MAGIC_MAX_QUESTIONS = 5;
export const MAGIC_MIN_CHARS = 50;
export const MAGIC_MAX_CHARS = 6000;

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

    out.push({
      content: o.content,
      options,
      correctIndex,
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
