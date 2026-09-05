import { AIRouter, getProjectPreset } from "ai-router";
import type { AIRequest, AIResponse } from "ai-router";

const tutorPreset = {
  ...getProjectPreset("default"),
  projectName: "Tutor",
  // groq-first: measured 2026-09-05 on the VPS — claude-cli exits 1, gemini 404s
  // (gemini-2.5-flash retired for new keys), mistral is rate-limited, groq answers.
  // The rest stay listed so the router picks them up again when they recover.
  defaultProvider: "groq" as const,
  providers: ["groq" as const, "mistral" as const, "gemini" as const, "claude" as const],
};

const router = new AIRouter(tutorPreset);

export async function generateQuestions(params: {
  domain: string;
  subject: string;
  topic: string;
  count: number;
  difficulty: number;
  type: "MULTIPLE_CHOICE" | "OPEN";
  language?: "en" | "ro";
  /**
   * The material these questions must test.
   *
   * Without it the model has only a subject and a topic string to go on, and it
   * writes plausible questions about the field rather than about the lesson: the
   * first run for "Fundamentele meseriei" produced questions on land-registry
   * extracts and property valuation — correct, and belonging to two other modules.
   * A module's test that does not test the module's lesson makes "passed" mean
   * nothing about having read it.
   */
  material?: string;
}): Promise<AIResponse> {
  const { domain, subject, topic, count, difficulty, type, language = "en", material } = params;

  const typeInstruction =
    type === "MULTIPLE_CHOICE"
      ? `Each question must have exactly 4 options (A, B, C, D) with one correct answer.`
      : `Each question must be open-ended, expecting a written answer.`;

  const systemPrompt = `You are an expert educational content creator for the "${domain}" domain.
Generate exam questions that are accurate, clear, and well-structured.
Always respond with valid JSON only, no markdown wrapping.`;

  const materialBlock = material
    ? `

The questions must test THIS material and nothing outside it. Do not ask about
neighbouring subjects, however related — if the material does not cover it, it is
not a question for this test. Where the material gives figures, scripts or named
steps, prefer questions that check those.

--- MATERIAL ---
${material.slice(0, 12000)}
--- END MATERIAL ---`
    : "";

  const userPrompt = `Generate ${count} ${type === "MULTIPLE_CHOICE" ? "multiple choice" : "open"} questions for:
- Subject: ${subject}
- Topic: ${topic}
- Difficulty: ${difficulty}/5
- Language: ${language === "ro" ? "Romanian" : "English"}

${typeInstruction}${materialBlock}

Respond with a JSON array of objects with this structure:
${
  type === "MULTIPLE_CHOICE"
    ? `[{
  "content": "Question text in markdown",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The correct option text",
  "explanation": "Why this is correct"
}]`
    : `[{
  "content": "Question text in markdown",
  "correctAnswer": "Expected answer or key points",
  "explanation": "Detailed explanation"
}]`
}`;

  const request: AIRequest = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    taskHint: "generation",
    speedVsQuality: 0.1,
    languageHint: language === "ro" ? "ro" : "en",
    temperature: 0.7,
    // gpt-oss spends the first slice of the budget reasoning; a small cap returns
    // an empty string rather than an error.
    maxTokens: 6000,
  };

  return router.chat(request);
}
