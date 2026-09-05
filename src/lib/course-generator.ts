/**
 * Turning a prompt into a course.
 *
 * Two steps, deliberately separate:
 *   1. `planCourse`  — the prompt becomes an outline: title + modules, each with a
 *                      summary and what its lesson should teach. Cheap, and it is
 *                      what a human reviews before anything is written.
 *   2. `writeModule`  — one module becomes a lesson in Markdown. Questions are NOT
 *                      generated here: they go through `generateQuestions` and then
 *                      the fail-closed judge in question-gate.ts, the same path the
 *                      existing admin generator uses. There is no second, laxer road
 *                      into the question bank.
 *
 * Nothing here writes to the database. The caller decides what to keep, which is
 * what makes a generated course reviewable rather than merely produced.
 */

import { AIRouter, getProjectPreset } from "ai-router";
import type { AIRequest } from "ai-router";

const router = new AIRouter({
  ...getProjectPreset("default"),
  projectName: "Tutor",
  defaultProvider: "claude" as const,
  providers: ["claude" as const, "gemini" as const, "mistral" as const],
});

export interface PlannedModule {
  order: number;
  title: string;
  summary: string;
  /** What the lesson for this module must cover — the brief for step 2. */
  lessonBrief: string;
}

export interface CoursePlan {
  title: string;
  description: string;
  modules: PlannedModule[];
}

/** Lower and upper bounds on what a course may be, so a bad answer fails loudly. */
const MIN_MODULES = 2;
const MAX_MODULES = 20;

function parseJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

/** Step 1 — the outline. Throws rather than returning a half-plan. */
export async function planCourse(params: {
  prompt: string;
  language?: "ro" | "en";
  maxModules?: number;
}): Promise<CoursePlan> {
  const { prompt, language = "ro", maxModules = 12 } = params;

  const request: AIRequest = {
    messages: [
      {
        role: "system",
        content:
          "Ești un proiectant de curriculum. Transformi un brief într-o structură de curs. " +
          "Răspunzi EXCLUSIV cu JSON valid, fără markdown, fără explicații în afara JSON-ului.",
      },
      {
        role: "user",
        content: `Din brieful de mai jos, propune structura unui curs.

Reguli:
- Între ${MIN_MODULES} și ${maxModules} module, în ordinea în care trebuie parcurse.
- Fiecare modul: un titlu scurt (max 60 de caractere), un rezumat de 1-2 propoziții, și "lessonBrief" — ce anume trebuie să acopere lecția modulului, în 2-4 propoziții.
- Dacă brieful enumeră deja module, PĂSTREAZĂ-LE ca atare: titlurile și ordinea lui, nu ale tale.
- Limba: ${language === "ro" ? "română" : "engleză"}.

Răspunde cu exact această formă:
{"title":"...","description":"...","modules":[{"order":1,"title":"...","summary":"...","lessonBrief":"..."}]}

BRIEF:
${prompt}`,
      },
    ],
    jsonMode: true,
    taskHint: "generation",
    speedVsQuality: 0.1,
    languageHint: language,
    temperature: 0.4,
    maxTokens: 4000,
  };

  const res = await router.chat(request);
  const parsed = parseJson(res.content ?? "") as Partial<CoursePlan>;

  if (!parsed || typeof parsed.title !== "string" || !Array.isArray(parsed.modules)) {
    throw new Error("Planul întors nu are forma așteptată (title + modules).");
  }
  if (parsed.modules.length < MIN_MODULES || parsed.modules.length > MAX_MODULES) {
    throw new Error(`Planul are ${parsed.modules.length} module — în afara intervalului ${MIN_MODULES}-${MAX_MODULES}.`);
  }

  const modules: PlannedModule[] = parsed.modules.map((m, i) => {
    const title = String((m as PlannedModule).title ?? "").trim();
    if (!title) throw new Error(`Modulul ${i + 1} n-are titlu.`);
    return {
      order: i + 1, // renumerotat de noi: ordinea listei e adevărul, nu câmpul întors
      title: title.slice(0, 60),
      summary: String((m as PlannedModule).summary ?? "").trim(),
      lessonBrief: String((m as PlannedModule).lessonBrief ?? "").trim(),
    };
  });

  // Două module cu același titlu ar produce două module cu același questionTopic,
  // deci un test comun — exact eroarea tăcută pe care questionTopic o previne.
  const seen = new Set<string>();
  for (const m of modules) {
    const key = m.title.toLowerCase();
    if (seen.has(key)) throw new Error(`Două module au același titlu: „${m.title}”.`);
    seen.add(key);
  }

  return {
    title: String(parsed.title).trim(),
    description: String(parsed.description ?? "").trim(),
    modules,
  };
}

/** Step 2 — the lesson text for one module. Markdown, no front matter, no title line. */
export async function writeModuleLesson(params: {
  coursePrompt: string;
  courseTitle: string;
  module: PlannedModule;
  language?: "ro" | "en";
}): Promise<{ title: string; summary: string; contentMarkdown: string }> {
  const { coursePrompt, courseTitle, module: mod, language = "ro" } = params;

  const request: AIRequest = {
    messages: [
      {
        role: "system",
        content:
          "Scrii materialul de curs pentru un modul. Markdown curat, fără titlu de nivel 1 " +
          "(titlul e pus de aplicație), fără preambul de tipul „în această lecție vom învăța”. " +
          "Răspunzi EXCLUSIV cu JSON valid.",
      },
      {
        role: "user",
        content: `Cursul: „${courseTitle}”
Modulul ${mod.order}: „${mod.title}”
Ce trebuie să acopere: ${mod.lessonBrief || mod.summary}

Cerințe:
- 400-900 de cuvinte, în ${language === "ro" ? "română" : "engleză"}.
- Un concept explicat pe rând, cu un exemplu concret pentru fiecare. Cifre reale acolo unde brieful le cere.
- Structurează cu subtitluri de nivel 2 (##) și liste unde ajută.
- Termină cu o secțiune „## De reținut” — 3-5 puncte.
- Fără cuvântul „AI” ca etichetă și fără promisiuni de rezultate.

Context (brieful întregului curs, pentru ton și domeniu):
${coursePrompt.slice(0, 3000)}

Răspunde cu: {"title":"...","summary":"o propoziție","contentMarkdown":"..."}`,
      },
    ],
    jsonMode: true,
    taskHint: "generation",
    speedVsQuality: 0.1,
    languageHint: language,
    temperature: 0.6,
    maxTokens: 4000,
  };

  const res = await router.chat(request);
  const parsed = parseJson(res.content ?? "") as { title?: string; summary?: string; contentMarkdown?: string };

  const content = String(parsed?.contentMarkdown ?? "").trim();
  if (content.length < 400) {
    throw new Error(`Lecția pentru „${mod.title}” a ieșit prea scurtă (${content.length} caractere).`);
  }

  return {
    title: String(parsed?.title ?? mod.title).trim() || mod.title,
    summary: String(parsed?.summary ?? mod.summary).trim(),
    contentMarkdown: content,
  };
}

/** URL-safe slug from a title, with a suffix to keep it unique. */
export function courseSlug(title: string, suffix: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `${base || "curs"}-${suffix}`;
}
