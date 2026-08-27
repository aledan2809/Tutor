/**
 * The gate every AI-generated question must pass before it is stored.
 *
 * This exists because it did not. The quality mesh was built for the PDF
 * ingestion pipeline and wired into `from-content`, `bulk-import`,
 * `ingest-pdf` and `mesh-fix` — but never into the two `ai-generate` routes,
 * which is where 787 questions came from. A sweep of the 254 published ones on
 * 2026-08-27 found 24 defective (9.4%): answers off by a factor of ten, options
 * where the true value was absent entirely, and questions with two identical
 * options. A student reported several of them and was told he was wrong.
 *
 * Fail-CLOSED on purpose. If no judge can be reached, nothing is stored and the
 * caller is told why. An unreachable verifier must never read as "approved" —
 * that is precisely the failure mode that produced the bank this cleans up
 * after, and it is also how a sweep of my own reported 85 unchecked questions
 * as clean.
 */

import { finalJudge, type QuestionForMesh } from "@/lib/content-quality-mesh";

export interface GateCandidate {
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string | null;
}

export interface GateRejection {
  content: string;
  defect: string;
  reason: string;
}

export interface GateOutcome<T extends GateCandidate> {
  kept: T[];
  rejected: GateRejection[];
}

/** Judges run in parallel, but not unboundedly — each one may spawn a CLI. */
const CONCURRENCY = 3;

export async function gateGeneratedQuestions<T extends GateCandidate>(
  candidates: readonly T[]
): Promise<GateOutcome<T>> {
  const kept: T[] = [];
  const rejected: GateRejection[] = [];

  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const slice = candidates.slice(i, i + CONCURRENCY);
    const verdicts = await Promise.all(
      slice.map(async (q) => {
        const forMesh: QuestionForMesh = {
          content: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? undefined,
        };
        try {
          return await finalJudge(forMesh);
        } catch (err) {
          // An exception is not a pass. Same rule as an unreachable judge.
          return {
            pass: false,
            defect: "judge-error",
            reason: (err as Error)?.message?.slice(0, 200) ?? "judge threw",
          };
        }
      })
    );

    verdicts.forEach((v, k) => {
      const q = slice[k];
      if (v.pass) kept.push(q);
      else
        rejected.push({
          content: q.content.slice(0, 200),
          defect: v.defect ?? "unspecified",
          reason: v.reason || "no reason given",
        });
    });
  }

  return { kept, rejected };
}

/**
 * A one-line summary an admin can act on, rather than a silent count.
 * Discarding work without saying what was discarded is how a bad generator
 * stays invisible.
 */
export function describeGateOutcome(outcome: GateOutcome<GateCandidate>): string {
  const total = outcome.kept.length + outcome.rejected.length;
  if (outcome.rejected.length === 0) return `Toate cele ${total} întrebări au trecut verificarea.`;
  const byDefect = outcome.rejected.reduce<Record<string, number>>((acc, r) => {
    acc[r.defect] = (acc[r.defect] ?? 0) + 1;
    return acc;
  }, {});
  const parts = Object.entries(byDefect).map(([d, n]) => `${n}× ${d}`);
  return `${outcome.kept.length} din ${total} au trecut. Respinse: ${parts.join(", ")}.`;
}
