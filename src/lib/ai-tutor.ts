import { AIRouter, getProjectPreset } from "ai-router";
import type { AIRequest, AIResponse } from "ai-router";
import { callClaudeCli } from "@/lib/claude-cli";

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
  /**
   * Enunțurile care există deja pentru acest subiect.
   *
   * Ruta de completare trimitea doar NUMĂRUL de grile existente, deci la a doua
   * trecere modelul rescria din aceeași lecție fără să știe ce scrisese. Rezultat
   * măsurat pe lotul de 62: două perechi de enunțuri aproape identice, ambele cu
   * chei DIFERITE — același răspuns marcat corect într-o grilă și greșit în alta.
   */
  avoid?: readonly string[];
}): Promise<AIResponse> {
  const { domain, subject, topic, count, difficulty, type, language = "en", material, avoid } = params;

  const typeInstruction =
    type === "MULTIPLE_CHOICE"
      ? `Each question must have exactly 4 options (A, B, C, D) with one correct answer.`
      : `Each question must be open-ended, expecting a written answer.`;

  const systemPrompt = `You are an expert educational content creator for the "${domain}" domain.
Generate exam questions that are accurate, clear, and well-structured.
Always respond with valid JSON only, no markdown wrapping.
Keep every string on ONE line: a raw newline inside a JSON string is invalid JSON, and
asking for "markdown" in the question text is what produced them. Use \\n if a break is
truly needed.`;

  const materialBlock = material
    ? `

The questions must test THIS material and nothing outside it. Do not ask about
neighbouring subjects, however related — if the material does not cover it, it is
not a question for this test. Where the material gives figures, scripts or named
steps, prefer questions that check those.

Each question must STAND ALONE. The student sees only the question and its options —
never this material. So:
- do NOT write "conform materialului", "potrivit lecției", "în textul de mai sus", or
  any phrase that points at something the student cannot see;
- do NOT rely on a figure, list or example being visible;
- spell out the context inside the question itself. Instead of "Care este ținta
  zilnică recomandată?", write "Câte conversații noi pe zi recomandă programul, ca
  țintă în primele șase luni?".
- exactly one option may be defensible as correct;

The four options must be indistinguishable to someone who has not learned the material.
This is measured, and every previous attempt failed it in a NEW way — so treat all of
the following as hard requirements, not style advice:

- SAME LENGTH. Correct was the longest option in 71% of an earlier batch (chance 25%).
- SAME SYNTAX. After length was balanced, the leak simply moved: correct carried +47%
  more commas and +23% more clauses than the distractors, and a student choosing "the
  option with the most commas" scored 57%. If the correct answer is a three-part
  enumeration, every distractor is a three-part enumeration. If it has a subordinate
  clause ("care...", "dacă..."), so do the others. Same number of listed items, same
  sentence shape.
- SAME GRAMMAR. Every option must fit the stem grammatically — gender, number, tense,
  case. A judge allowed to use ONLY grammatical agreement scored 45%.
- SAME SPECIFICITY. If the correct answer names figures, thresholds or concrete steps,
  the distractors name figures, thresholds and concrete steps too — different ones,
  wrong ones. Never pair a concrete correct answer with vague distractors, and never
  write a distractor that leans on "conform standardelor/legislației" instead of saying
  something definite.
- DISTRACTORS THAT ARE TRUE. This is the requirement everything else depends on, and it
  is not the obvious one. Do NOT write three false statements. A false statement is
  recognisable, and that is exactly how the last two batches failed: six judges shown
  ONLY the four options — no question at all — scored 95-100%, and one restricted to
  formal defects scored 62 out of 62. Asking for "plausible" distractors did not fix it;
  the model kept writing falsehoods and calling them plausible.

  Instead: **each distractor must be a statement that is TRUE of this material, but that
  answers a DIFFERENT question.** Take another real fact, step, figure or rule from the
  lesson and use it where it does not belong — the right document at the wrong stage, the
  correct duty of the other party, the real deadline for a different act, the true
  procedure for a different type of client, the actual figure for a different period.

  Two consequences you must accept:
    - The STEM now has to carry the discriminating condition. If your four options are all
      true, only a precise question separates them: name the stage, the party, the moment,
      the document type. A vague stem with true options is a broken item and is rejected
      as having several correct answers — that rejection is the sign your stem was lazy,
      not that the rule is wrong.
    - You may still use a precise beginner's misconception instead of a true-elsewhere
      fact, but only a specific one that a real learner holds. Never an absurd, unethical
      or self-marking option: no "garantat", "automat", "exclusiv", "interzis", no invented
      pressure tactics, no option that is obviously the dishonest choice in a course about
      honest practice.

  The test: hide the question. A reader who knows the subject well must find all four
  options defensible as statements, and must NOT be able to tell which one you marked.
  A separate judge is shown exactly that, and the item is discarded when it can.

  Three patterns were found repeatedly in the last batch and each one hands the answer
  away for free — none of them may appear:
    - a distractor that CONTRADICTS A FIGURE GIVEN IN THE STEM. The stem said the split
      was 40%; two distractors announced 30% and 50% in their own text and were struck
      out by reading, with no arithmetic.
    - a distractor propped up by an INVENTED RULE OR AUTHORITY — "conform baremului
      standard", "cota minimă garantată prin contract", "conform legislației". Real
      alternatives do not need a fictional regulation to sound possible.
    - a distractor that DECLARES ITS OWN DISHONESTY — "să sugereze că…", "astfel încât
      presiunea să pară că…", "să informeze că prețul va crește automat". In a question
      about ethical practice, a student simply drops every option containing a verb of
      fabrication and the ethical one is left. A wrong answer must be wrong on the FACTS,
      never wrong on the morals.

The test: if someone reads only your four options, with the question hidden, they must
NOT be able to tell which one you marked correct. A separate judge is shown exactly that
and the item is discarded when it can.

A question that fails any of these is discarded by an independent judge before it is
stored, so writing them that way wastes the attempt.

--- MATERIAL ---
${material.slice(0, 12000)}
--- END MATERIAL ---`
    : "";

  const avoidBlock =
    avoid && avoid.length
      ? `

These questions already exist for this topic. Do NOT write another question on the same
point, in any wording — a near-duplicate with a different key marks the same answer right
in one question and wrong in the other. Pick different facts from the material.

${avoid.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

  const userPrompt = `Generate ${count} ${type === "MULTIPLE_CHOICE" ? "multiple choice" : "open"} questions for:
- Subject: ${subject}
- Topic: ${topic}
- Difficulty: ${difficulty}/5
- Language: ${language === "ro" ? "Romanian" : "English"}

${typeInstruction}${materialBlock}${avoidBlock}

Respond with a JSON array of objects with this structure:
${
  type === "MULTIPLE_CHOICE"
    ? `[{
  "content": "Question text, one line",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The correct option text",
  "explanation": "Why this is correct"
}]`
    : `[{
  "content": "Question text, one line",
  "correctAnswer": "Expected answer or key points",
  "explanation": "Detailed explanation"
}]`
}`;

  // The CLI first, then the router.
  //
  // Not a preference — a measurement, 2026-09-05 on this box: groq answers but its
  // daily token budget is spent by mid-afternoon (and a prompt carrying a lesson is
  // large), gemini 404s on a model Google retired for new keys, mistral is
  // rate-limited. The CLI runs on the subscription, so it neither meters nor runs
  // out the way a free tier does. The router stays as the fallback for the moment
  // one of those recovers, and for any box without the CLI.
  const cli = await callClaudeCli(
    `${systemPrompt}\n\n${userPrompt}\n\nRăspunde EXCLUSIV cu JSON valid, fără markdown, fără text în afara JSON-ului.`,
    // Un timeout aici cade tăcut pe furnizorul de rezervă, care e limitat de cotă —
    // adică zero grile după minute de așteptare, cu un mesaj de eroare care arată a
    // problemă de cotă, nu a limită proprie. Apelantul cere acum în tranșe mici (4),
    // deci 300s sunt largi pentru o tranșă; erau prea puțini pentru opt deodată.
    { timeoutMs: 300_000 }
  );
  if (cli.ok && cli.text) {
    return { content: cli.text, provider: "claude-cli", model: "sonnet" } as unknown as AIResponse;
  }

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
