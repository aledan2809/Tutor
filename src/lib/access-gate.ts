/**
 * The API side of the pause (access.ts): routes a paused account may not use answer 403 with
 * `paused: true`, so the page can show the pause screen instead of a generic error.
 */
import { NextResponse } from "next/server";
import type { Access } from "@/lib/access";
import { loadAccess, loadPauseStartsAt } from "@/lib/access-server";

type Paused = Extract<Access, { kind: "paused" }>;

export function pausedResponse(access: Paused, extra: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json(
    {
      error: "Contul e în pauză: proba gratuită s-a încheiat. Tot ce ai lucrat e păstrat.",
      paused: true,
      payer: access.payer,
      ...extra,
    },
    { status: 403 },
  );
}

/**
 * The account's pause, or null when it isn't paused. While the pause is switched off no account is
 * paused, so this costs one cached read — it sits on routes called for every answered question.
 */
export async function accountPaused(userId: string): Promise<Paused | null> {
  if (!(await loadPauseStartsAt())) return null;
  // With the pause on, this runs on every answered question. An account found not paused is
  // remembered for a few seconds; a paused one never is, so a family that has just paid isn't
  // refused for a moment longer (review r6, F2).
  const seen = notPausedAt.get(userId);
  if (seen !== undefined && Date.now() - seen < NOT_PAUSED_TTL_MS) return null;
  const access = await loadAccess(userId);
  if (access?.kind === "paused") {
    notPausedAt.delete(userId);
    return access;
  }
  if (notPausedAt.size >= NOT_PAUSED_MAX) notPausedAt.clear();
  notPausedAt.set(userId, Date.now());
  return null;
}

const NOT_PAUSED_TTL_MS = 15_000;
const NOT_PAUSED_MAX = 10_000;
const notPausedAt = new Map<string, number>();

/** A 403 for an account in pause, or null to go on. `bypass` for staff who are never paused. */
export async function refuseIfPaused(userId: string, opts?: { bypass?: boolean }): Promise<NextResponse | null> {
  if (opts?.bypass) return null;
  const paused = await accountPaused(userId);
  return paused ? pausedResponse(paused) : null;
}
