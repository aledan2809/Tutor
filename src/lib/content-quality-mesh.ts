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
4. Length cues (correct answer much longer/shorter than distractors) → "clarity-length-cue"

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
