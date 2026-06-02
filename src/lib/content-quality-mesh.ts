/**
 * Content Quality Mesh — Track A (GATED)
 *
 * Architecture: 3 adversarial lenses run in parallel via Groq (AIRouter cascade),
 * then an orchestrator aggregates scores. Human stays in the loop on flagged items.
 *
 * Lenses:
 *   1. Grounding  — is the question derived from the source text?
 *   2. Single-correct — is there exactly one correct answer?
 *   3. Distractor+Clarity — are distractors plausible but wrong? Is wording clear?
 *
 * Calibration rules (verdict v2):
 *   - Single-lens flag (especially 'single' on câte/când/cine) = advisory, not auto-fail
 *   - Do NOT penalize verbatim recall on "câte"
 *   - Per-item blinding: no cross-item reasoning; dedup is separate
 *   - Each lens names the defect class
 *   - accidentally-true-distractor + named-entity → mandatory human review
 *   - Grounding weighted 2x
 */

// ── Types ────────────────────────────────────────────────────────────────

export type DefectClass =
  | "grounding-weak"
  | "grounding-hallucination"
  | "multiple-correct"
  | "no-correct"
  | "accidentally-true-distractor"
  | "named-entity-thin"
  | "distractor-implausible"
  | "clarity-ambiguous"
  | "clarity-length-cue";

export interface LensFlag {
  lens: "grounding" | "single-correct" | "distractor-clarity";
  defectClass: DefectClass;
  confidence: number; // 0-1
  details: string;
}

export interface MeshResult {
  confidence: number; // 0-1 overall quality score
  flags: LensFlag[];
  requiresHumanReview: boolean;
  recommendation: "high-confidence" | "review-prioritized" | "escalate";
}

export interface QuestionForMesh {
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  sourceText?: string; // the passage the question was derived from
}

// ── AI Provider (Groq cascade, same as magic-quiz) ──────────────────────

async function callGroqJSON(systemPrompt: string, userPrompt: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  // 1. Groq (preferred — free tier)
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";
        if (text) return text;
      }
    } catch { /* fall through */ }
  }

  // 2. Gemini fallback
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
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

  // 3. Mistral fallback
  if (mistralKey) {
    try {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralKey}` },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "";
      }
    } catch { /* fall through */ }
  }

  throw new Error("[mesh] All AI providers failed");
}

function safeParseJSON(text: string): Record<string, unknown> | null {
  try {
    const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    return JSON.parse(clean);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* */ }
    }
    return null;
  }
}

// ── Lens Prompts ─────────────────────────────────────────────────────────

const GROUNDING_SYSTEM = `You are a GROUNDING VERIFIER for educational quiz questions.
Your job: check if the question + correct answer are factually derivable from the source text.

IMPORTANT CALIBRATIONS:
- Questions asking "câte" (how many), "când" (when), "cine" (who) that recall verbatim facts from the source are VALID — do NOT flag them.
- Only flag if the answer contains facts NOT present in (or contradicting) the source.
- Name the specific defect: "grounding-weak" (answer loosely supported) or "grounding-hallucination" (answer contradicts or invents facts).
- Evaluate THIS question ALONE — do not compare with other questions (per-item blinding).

Return JSON: {"flag": true/false, "defectClass": "grounding-weak"|"grounding-hallucination"|null, "confidence": 0.0-1.0, "details": "explanation"}`;

const SINGLE_CORRECT_SYSTEM = `You are a SINGLE-CORRECT ANSWER VERIFIER for multiple-choice questions.
Your job: verify exactly one option is correct and the rest are clearly wrong.

IMPORTANT CALIBRATIONS:
- For "câte/când/cine" factual-recall questions, the answer is typically unambiguous — do NOT over-flag these.
- Flag "accidentally-true-distractor" if a distractor is technically also correct.
- Flag "multiple-correct" if 2+ options could be correct.
- Flag "no-correct" if the marked correct answer is actually wrong.
- Evaluate THIS question ALONE — do not reference other questions (per-item blinding).
- A single-lens flag here on câte/când/cine type questions should be ADVISORY (lower confidence).

Return JSON: {"flag": true/false, "defectClass": "multiple-correct"|"no-correct"|"accidentally-true-distractor"|null, "confidence": 0.0-1.0, "details": "explanation"}`;

const DISTRACTOR_CLARITY_SYSTEM = `You are a DISTRACTOR & CLARITY VERIFIER for educational quiz questions.
Your job: check distractor quality and question clarity.

Check for:
1. Distractors too implausible (obviously wrong, no student would pick them) → "distractor-implausible"
2. Named-entity questions with thin source coverage (e.g., "Who ruled in 1859?" with no context) → "named-entity-thin"
3. Ambiguous wording that could confuse students → "clarity-ambiguous"
4. Length cue → "clarity-length-cue". ALWAYS compare the length of the correct option against the distractors. A length cue exists when the correct option is noticeably longer (or shorter) than the distractors AND that length difference is what signals it as correct — a classic test-writing tell that lets a student guess by picking the longest/most-detailed option.
   - DO flag: the correct answer is a fuller, more-qualified or more-detailed phrase while the distractors are short and terse, so length alone reveals the answer.
   - DO NOT flag: the correct answer is simply a long proper noun or a technically required full term (e.g. a place name like "Ulpia Traiana Sarmizegetusa", a chemical/scientific name, a full law title) while distractors are short — that length is natural, not a cue.

Evaluate THIS question ALONE — no cross-item reasoning.

Return JSON: {"flag": true/false, "defectClass": "distractor-implausible"|"named-entity-thin"|"clarity-ambiguous"|"clarity-length-cue"|null, "confidence": 0.0-1.0, "details": "explanation"}`;

// ── Lens Runners ─────────────────────────────────────────────────────────

function formatQuestionForLens(q: QuestionForMesh): string {
  const parts = [`Question: ${q.content}`];
  if (q.options?.length) {
    parts.push("Options:\n" + q.options.map((o, i) => `  ${String.fromCharCode(97 + i)}) ${o}`).join("\n"));
  }
  parts.push(`Correct answer: ${q.correctAnswer}`);
  if (q.explanation) parts.push(`Explanation: ${q.explanation}`);
  if (q.sourceText) parts.push(`\nSource text (excerpt):\n${q.sourceText.substring(0, 3000)}`);
  return parts.join("\n");
}

interface RawLensResult {
  flag: boolean;
  defectClass: string | null;
  confidence: number;
  details: string;
}

async function runLens(
  systemPrompt: string,
  lensName: "grounding" | "single-correct" | "distractor-clarity",
  question: QuestionForMesh
): Promise<LensFlag | null> {
  try {
    const userPrompt = formatQuestionForLens(question);
    const raw = await callGroqJSON(systemPrompt, userPrompt);
    const parsed = safeParseJSON(raw) as RawLensResult | null;
    if (!parsed) return null;

    if (parsed.flag && parsed.defectClass) {
      return {
        lens: lensName,
        defectClass: parsed.defectClass as DefectClass,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        details: parsed.details || "No details provided",
      };
    }
    return null; // no flag
  } catch (err) {
    console.error(`[mesh] ${lensName} lens error:`, (err as Error).message);
    return null; // lens failure = no flag (fail-open, human reviews anyway)
  }
}

// ── Orchestrator ─────────────────────────────────────────────────────────

const MANDATORY_HUMAN_DEFECTS: DefectClass[] = [
  "accidentally-true-distractor",
  "named-entity-thin",
  "grounding-hallucination",
];

/**
 * Run the 3-lens mesh on a single question.
 * Returns MeshResult with confidence score, flags, and recommendation.
 */
export async function screenQuestion(question: QuestionForMesh): Promise<MeshResult> {
  // Run all 3 lenses in parallel
  const [groundingFlag, singleFlag, distractorFlag] = await Promise.all([
    runLens(GROUNDING_SYSTEM, "grounding", question),
    runLens(SINGLE_CORRECT_SYSTEM, "single-correct", question),
    runLens(DISTRACTOR_CLARITY_SYSTEM, "distractor-clarity", question),
  ]);

  const flags: LensFlag[] = [];
  if (groundingFlag) flags.push(groundingFlag);
  if (singleFlag) flags.push(singleFlag);
  if (distractorFlag) flags.push(distractorFlag);

  // Score calculation: grounding weighted 2x
  // Start at 1.0, subtract per flag weighted by confidence and lens weight
  let score = 1.0;
  for (const f of flags) {
    const weight = f.lens === "grounding" ? 0.4 : 0.2; // grounding 2x
    score -= weight * f.confidence;
  }
  score = Math.max(0, Math.min(1, score));

  // Calibration: single-lens advisory rule
  // If only ONE lens flagged (especially single-correct on câte/când/cine), boost score
  if (flags.length === 1 && flags[0].lens === "single-correct") {
    score = Math.max(score, 0.7); // advisory, not auto-fail
  }

  // Check mandatory human review defects
  const hasMandatoryReview = flags.some(f =>
    MANDATORY_HUMAN_DEFECTS.includes(f.defectClass)
  );

  // Determine recommendation
  let recommendation: MeshResult["recommendation"];
  if (flags.length === 0 || score >= 0.85) {
    recommendation = "high-confidence";
  } else if (hasMandatoryReview || score < 0.5) {
    recommendation = "escalate";
  } else {
    recommendation = "review-prioritized";
  }

  const requiresHumanReview = recommendation !== "high-confidence";

  return { confidence: Math.round(score * 100) / 100, flags, requiresHumanReview, recommendation };
}

// ── Fix Prompt ──────────────────────────────────────────────────────────

const FIX_SYSTEM = `You are a quiz question FIXER for Romanian educational content.
You receive a flagged question with specific defect descriptions and must fix it.

Rules:
- Fix ONLY the identified defect — do not rewrite the entire question
- Keep the question grounded in the source text (sourceQuote must remain verbatim)
- Maintain Romanian diacritics (ă, î, â, ș, ț)
- Return the FULL fixed question as JSON

Return JSON:
{"content": "fixed question text", "options": ["a) ...", "b) ...", "c) ...", "d) ..."], "correctAnswer": "a) ...", "explanation": "...", "sourceQuote": "unchanged verbatim quote"}`;

/**
 * Attempt to auto-fix a flagged question based on defect details.
 * Returns fixed question fields or null if fix fails.
 */
export async function attemptFix(
  question: QuestionForMesh,
  flags: LensFlag[]
): Promise<Partial<QuestionForMesh> | null> {
  if (flags.length === 0) return null;

  const defectSummary = flags.map(f =>
    `[${f.lens}] ${f.defectClass} (confidence ${Math.round(f.confidence * 100)}%): ${f.details}`
  ).join("\n");

  const userPrompt = `Fix this question based on the defects found:

DEFECTS:
${defectSummary}

QUESTION:
${formatQuestionForLens(question)}

Return the fixed version as JSON.`;

  try {
    const raw = await callGroqJSON(FIX_SYSTEM, userPrompt);
    const parsed = safeParseJSON(raw);
    if (!parsed || !parsed.content) return null;

    return {
      content: parsed.content as string,
      options: (parsed.options as string[]) || question.options,
      correctAnswer: (parsed.correctAnswer as string) || question.correctAnswer,
      explanation: (parsed.explanation as string) || question.explanation,
      sourceText: question.sourceText, // preserve source context
    };
  } catch (err) {
    console.error("[mesh] Fix attempt failed:", (err as Error).message);
    return null;
  }
}

/**
 * Screen a question with fix→re-verify loop.
 * Max 2 fix rounds; if still flagged after 2 rounds → escalate to human.
 */
export async function screenWithFixLoop(
  question: QuestionForMesh,
  maxRounds = 2
): Promise<{ result: MeshResult; fixedQuestion: QuestionForMesh | null; fixRounds: number }> {
  let current = question;
  let result = await screenQuestion(current);
  let fixRounds = 0;

  // Only attempt fixes on non-mandatory-review defects with fixable flags
  while (
    result.flags.length > 0 &&
    fixRounds < maxRounds &&
    !result.flags.some(f => MANDATORY_HUMAN_DEFECTS.includes(f.defectClass))
  ) {
    const fixed = await attemptFix(current, result.flags);
    if (!fixed || !fixed.content) break; // fix failed, stop

    fixRounds++;
    current = { ...current, ...fixed };
    result = await screenQuestion(current);

    // If score improved enough, stop
    if (result.confidence >= 0.85 && result.flags.length === 0) break;
  }

  return {
    result,
    fixedQuestion: fixRounds > 0 ? current : null,
    fixRounds,
  };
}

/**
 * Run mesh on a batch of questions. Returns results in same order.
 * Processes sequentially to respect rate limits on free-tier providers.
 */
export async function screenBatch(
  questions: QuestionForMesh[]
): Promise<MeshResult[]> {
  const results: MeshResult[] = [];
  for (const q of questions) {
    try {
      const result = await screenQuestion(q);
      results.push(result);
    } catch (err) {
      console.error("[mesh] Screening failed for question, defaulting to review:", (err as Error).message);
      // Fail-safe: if mesh fails, send to review (not auto-approve)
      results.push({
        confidence: 0,
        flags: [],
        requiresHumanReview: true,
        recommendation: "review-prioritized",
      });
    }
  }
  return results;
}

/**
 * Screen batch WITH fix loop. Returns results + any fixed question data.
 * Use this for ingest-pdf and from-content pipelines where auto-fix is desired.
 */
export async function screenBatchWithFix(
  questions: QuestionForMesh[],
  maxRounds = 2
): Promise<Array<{ result: MeshResult; fixedQuestion: QuestionForMesh | null; fixRounds: number }>> {
  const results: Array<{ result: MeshResult; fixedQuestion: QuestionForMesh | null; fixRounds: number }> = [];
  for (const q of questions) {
    try {
      const r = await screenWithFixLoop(q, maxRounds);
      results.push(r);
    } catch (err) {
      console.error("[mesh] Screen+fix failed for question:", (err as Error).message);
      results.push({
        result: { confidence: 0, flags: [], requiresHumanReview: true, recommendation: "review-prioritized" },
        fixedQuestion: null,
        fixRounds: 0,
      });
    }
  }
  return results;
}

// ── Deterministic missing-context guard ──────────────────────────────────
// Questions that reference an exercise/figure/table not included in the prompt
// cannot be answered standalone — root cause of high-confidence false negatives.
const MISSING_CONTEXT_RE =
  /\b(?:de mai (?:jos|sus)|din (?:exerci[țt]iul|figura|imaginea|tabelul|textul de|exemplul de|schema)|în (?:figura|imaginea|tabelul|schema)|figura al[ăa]turat[ăa]|al[ăa]turat[ăa]|urm[ăa]torul exerci[țt]iu|exerci[țt]iul urm[ăa]tor|exemplul de mai)\b/i;

export function hasMissingContextRef(content: string): boolean {
  return MISSING_CONTEXT_RE.test(content);
}

// ── Stage-2 high-precision judge (final gate before "ready without human") ──
// Conservative by design: FAIL (→ demote to human review) on ANY doubt, and
// fail-CLOSED on parse/network error. This protects the auto-keep bucket.
// Judge A — re-solves the question from the Source and verifies the marked
// answer. Catches wrong-answer (marked option contradicts the Source) and
// ungrounded / garbled-source questions.
const JUDGE_A_SYSTEM = `You are a STRICT ANSWER-VERIFIER for a Romanian quiz question. SOLVE the question yourself using ONLY the Source text, then check the marked correct answer against your solution.

FAIL if ANY holds:
- The marked correct option is NOT what the Source supports — re-read the Source: if it states a different answer or the marked option contradicts it → defect "wrong-answer".
- The answer is not derivable from the Source ALONE (needs outside facts, or a computation whose inputs are not in the Source, or data referenced but not shown) → defect "grounding".
- The Source quote is garbled, truncated or broken (nonsensical equalities like "3000 = 30 = 750", cut-off sentences, an answer-key fragment) so the answer cannot be verified → defect "grounding".
- Another option is also defensibly correct → defect "multiple-correct".

Be conservative: if you cannot CONFIRM the marked answer from the Source, FAIL.

Return JSON: {"verdict":"PASS"|"FAIL","reason":"short","defect":"wrong-answer"|"grounding"|"multiple-correct"|null}`;

// Judge B — usability for a student seeing the item with no extra context.
const JUDGE_B_SYSTEM = `You are a STRICT USABILITY EXAMINER for a Romanian quiz question that a student will see with NO extra context.

FAIL if ANY holds:
- It references missing/external context (an exercise, figure, table, image, a list "de mai jos/sus", or undefined symbols such as a, b, c, n, d, e that are not defined within the question itself) → defect "missing-context".
- It is not a real, self-contained question (an answer-key fragment, a heading, or a meta/administrative item) → defect "not-a-question".
- Length cue: the correct option is conspicuously longer/more detailed than the distractors in a way that leaks it (a naturally long proper noun is fine) → defect "length-cue".
- Wording is ambiguous or grammatically broken enough to confuse which option is intended → defect "ambiguous".

Be conservative: any doubt → FAIL.

Return JSON: {"verdict":"PASS"|"FAIL","reason":"short","defect":"missing-context"|"not-a-question"|"length-cue"|"ambiguous"|null}`;

async function runJudge(
  system: string,
  question: QuestionForMesh
): Promise<{ pass: boolean; reason: string; defect: string | null }> {
  try {
    const raw = await callGroqJSON(system, formatQuestionForLens(question));
    const parsed = safeParseJSON(raw) as { verdict?: string; reason?: string; defect?: string } | null;
    if (!parsed || !parsed.verdict) return { pass: false, reason: "judge parse failed", defect: null };
    return { pass: String(parsed.verdict).toUpperCase() === "PASS", reason: parsed.reason || "", defect: (parsed.defect as string) || null };
  } catch (err) {
    return { pass: false, reason: `judge error: ${(err as Error).message}`, defect: null };
  }
}

// Stage-2 ensemble: a question is "ready without human review" ONLY if BOTH
// judges PASS. Fail-closed on doubt/error → demote to human review.
export async function finalJudge(
  question: QuestionForMesh
): Promise<{ pass: boolean; reason: string; defect: string | null }> {
  if (hasMissingContextRef(question.content)) {
    return { pass: false, reason: "References external/missing context", defect: "missing-context" };
  }
  const [a, b] = await Promise.all([
    runJudge(JUDGE_A_SYSTEM, question),
    runJudge(JUDGE_B_SYSTEM, question),
  ]);
  if (!a.pass) return a;
  if (!b.pass) return b;
  return { pass: true, reason: "", defect: null };
}
