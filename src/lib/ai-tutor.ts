import { AIRouter, getProjectPreset } from "ai-router";
import type { AIRequest, AIResponse } from "ai-router";

const tutorPreset = {
  ...getProjectPreset("default"),
  projectName: "Tutor",
  defaultProvider: "claude" as const,
  providers: ["claude" as const, "gemini" as const, "mistral" as const],
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
}): Promise<AIResponse> {
  const { domain, subject, topic, count, difficulty, type, language = "en" } = params;

  const typeInstruction =
    type === "MULTIPLE_CHOICE"
      ? `Each question must have exactly 4 options (A, B, C, D) with one correct answer.`
      : `Each question must be open-ended, expecting a written answer.`;

  const systemPrompt = `You are an expert educational content creator for the "${domain}" domain.
Generate exam questions that are accurate, clear, and well-structured.
Always respond with valid JSON only, no markdown wrapping.`;

  const userPrompt = `Generate ${count} ${type === "MULTIPLE_CHOICE" ? "multiple choice" : "open"} questions for:
- Subject: ${subject}
- Topic: ${topic}
- Difficulty: ${difficulty}/5
- Language: ${language === "ro" ? "Romanian" : "English"}

${typeInstruction}

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
    jsonMode: true,
    taskHint: "generation",
    speedVsQuality: 0.1,
    languageHint: language === "ro" ? "ro" : "en",
    temperature: 0.7,
    maxTokens: 4000,
  };

  return router.chat(request);
}
