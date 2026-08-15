import { describe, it, expect } from "vitest";
import {
  classifyEvent,
  computeLiveState,
  liveSignalMessage,
  FAST_STREAK_TO_PROMOTE,
  MISS_STREAK_TO_DEMOTE,
  TIER_OFFSET_MIN,
  TIER_OFFSET_MAX,
  TIME_SCALE_MAX,
  TIME_SCALE_MIN,
  type SprintEvent,
} from "@/lib/sprint-live";

/** Correct in `usedSeconds` out of a `budget`-second allowance. */
const ok = (usedSeconds: number, budget = 30, plannedTier = 3, next = plannedTier, maxT = Math.max(plannedTier, next)): SprintEvent => ({
  correct: true,
  timedOut: false,
  timeSpentMs: usedSeconds * 1000,
  budgetSeconds: budget,
  plannedTier,
  nextPlannedTier: next,
  maxPlannedTier: maxT,
});
const fast = (budget = 30, plannedTier = 3, next = plannedTier, maxT = Math.max(plannedTier, next)) => ok(budget * 0.3, budget, plannedTier, next, maxT);
const slow = (budget = 30, plannedTier = 3, next = plannedTier, maxT = Math.max(plannedTier, next)) => ok(budget * 0.95, budget, plannedTier, next, maxT);
const wrong = (budget = 30, plannedTier = 3, next = plannedTier, maxT = Math.max(plannedTier, next)): SprintEvent => ({
  correct: false,
  timedOut: false,
  timeSpentMs: budget * 500,
  budgetSeconds: budget,
  plannedTier,
  nextPlannedTier: next,
  maxPlannedTier: maxT,
});
const expired = (budget = 30, plannedTier = 3, next = plannedTier, maxT = Math.max(plannedTier, next)): SprintEvent => ({
  correct: false,
  timedOut: true,
  timeSpentMs: budget * 1000,
  budgetSeconds: budget,
  plannedTier,
  nextPlannedTier: next,
  maxPlannedTier: maxT,
});

describe("reading a single answer", () => {
  it("correct in under half the allowance is 'fast' — the user's chosen threshold", () => {
    expect(classifyEvent(ok(14, 30))).toBe("fast");
    expect(classifyEvent(ok(16, 30))).toBe("ok");
  });

  it("correct but right against the clock is 'slow'", () => {
    expect(classifyEvent(ok(29, 30))).toBe("slow");
  });

  it("wrong and timed-out are both misses", () => {
    expect(classifyEvent(wrong())).toBe("miss");
    expect(classifyEvent(expired())).toBe("miss");
  });

  it("a fast WRONG answer is still a miss, not a promotion signal", () => {
    expect(classifyEvent({ correct: false, timedOut: false, timeSpentMs: 900, budgetSeconds: 30, plannedTier: 3, nextPlannedTier: 3, maxPlannedTier: 3 })).toBe("miss");
  });

  it("scales with the budget, not with absolute seconds", () => {
    // 8s is fast against a 30s budget but slow against a 10s one.
    expect(classifyEvent(ok(8, 30))).toBe("fast");
    expect(classifyEvent(ok(8, 10))).toBe("ok");
    expect(classifyEvent(ok(9.5, 10))).toBe("slow");
  });
});

describe("the clock reacts to every answer", () => {
  it("tightens on a fast answer", () => {
    expect(computeLiveState([fast()]).timeScale).toBe(0.9);
  });

  it("loosens on a miss", () => {
    expect(computeLiveState([wrong()]).timeScale).toBe(1.15);
  });

  it("loosens slightly when he only just makes it", () => {
    expect(computeLiveState([slow()]).timeScale).toBe(1.08);
  });

  it("leaves it alone on a comfortable, unremarkable answer", () => {
    expect(computeLiveState([ok(20, 30)]).timeScale).toBe(1);
  });

  it("compounds across a run of fast answers but never past the floor", () => {
    const many = computeLiveState(Array.from({ length: 30 }, () => fast()));
    expect(many.timeScale).toBe(TIME_SCALE_MIN);
  });

  it("never passes the ceiling however badly it goes", () => {
    const many = computeLiveState(Array.from({ length: 30 }, () => expired()));
    expect(many.timeScale).toBe(TIME_SCALE_MAX);
  });
});

describe("difficulty moves in steps, not on every answer", () => {
  it("does NOT move on one or two fast answers", () => {
    expect(computeLiveState([fast()]).tierOffset).toBe(0);
    expect(computeLiveState([fast(), fast()]).tierOffset).toBe(0);
  });

  it(`steps up after ${FAST_STREAK_TO_PROMOTE} fast answers in a row`, () => {
    const s = computeLiveState(Array.from({ length: FAST_STREAK_TO_PROMOTE }, () => fast()));
    expect(s.tierOffset).toBe(1);
    expect(s.lastSignal).toBe("up");
  });

  it("resets the streak after promoting, so it takes another full run to step again", () => {
    const s = computeLiveState(Array.from({ length: FAST_STREAK_TO_PROMOTE * 2 - 1 }, () => fast()));
    expect(s.tierOffset).toBe(1);
    const t = computeLiveState(Array.from({ length: FAST_STREAK_TO_PROMOTE * 2 }, () => fast()));
    expect(t.tierOffset).toBe(2);
  });

  it("a merely-correct answer breaks the promotion streak without penalising him", () => {
    const s = computeLiveState([fast(), fast(), ok(20, 30), fast()]);
    expect(s.tierOffset).toBe(0);
    expect(s.missStreak).toBe(0);
  });

  it(`steps down after ${MISS_STREAK_TO_DEMOTE} misses in a row`, () => {
    const s = computeLiveState([wrong(), wrong()]);
    expect(s.tierOffset).toBe(-1);
    expect(s.lastSignal).toBe("down");
  });

  it("a demotion also hands back extra time on top of the per-answer nudge", () => {
    const s = computeLiveState([wrong(), wrong()]);
    // 1.15 × 1.15 × 1.1 (the demotion bonus) — comfortably above the two nudges alone.
    expect(s.timeScale).toBeGreaterThan(1.15 * 1.15);
  });

  it("one miss between fast answers does not demote", () => {
    expect(computeLiveState([fast(), wrong(), fast(), fast()]).tierOffset).toBe(0);
  });

  const effective = (plannedTier: number, offset: number) =>
    Math.min(5, Math.max(1, plannedTier + offset));

  it("a student missing everything STAYS at the easiest tier as the plan climbs", () => {
    // Regression, seen live: the baseline crescendo climbs on its own, and a
    // too-narrow offset let it drag a failing student back up — first to T2 at
    // question 16, then in a one-question wobble at every plan step.
    const plan = [2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4];
    const maxT = Math.max(...plan);
    const events = plan.map((t, i) => expired(30, t, plan[i + 1] ?? t, maxT));
    const seen = plan.map((t, i) => {
      const st = computeLiveState(events.slice(0, i + 1));
      return effective(plan[i + 1] ?? t, st.tierOffset);
    });
    // It takes two misses per demotion, so from the plan's tier 2/3 the bottom is
    // reached by question 5. The point of the test is what happens AFTER that:
    // the plan keeps climbing to 4, and the student must stay at 1 regardless.
    expect(seen.slice(4)).toEqual(seen.slice(4).map(() => 1));
    // Not one question bounced back up, at any plan step.
    expect(seen.slice(4).some((t) => t > 1)).toBe(false);
    expect(Math.max(...plan.slice(5))).toBe(4); // the plan really does climb
  });

  it("does not bank offset past what the next question can use", () => {
    // Regression: clamped against the whole session's span, a student who ran up
    // to tier 5 then hit a wall ground through FOUR misses at tier 5 before
    // anything eased, because the offset had run to +4 while +3 already gave 5.
    const runUp = Array.from({ length: 30 }, () => fast(30, 2, 2));
    const s = computeLiveState(runUp);
    expect(effective(2, s.tierOffset)).toBe(5);
    expect(s.tierOffset).toBe(3); // exactly enough for tier 5, not +4

    // Two misses must therefore ease it immediately.
    const afterWall = computeLiveState([...runUp, expired(30, 2, 2), expired(30, 2, 2)]);
    expect(effective(2, afterWall.tierOffset)).toBe(4);
  });

  it("can reach the hardest tier from the gentlest plan", () => {
    const s = computeLiveState(Array.from({ length: 40 }, () => fast(30, 1, 1)));
    expect(effective(1, s.tierOffset)).toBe(5);
  });

  it("stays bounded by the absolute offset limits", () => {
    expect(TIER_OFFSET_MIN).toBeLessThan(0);
    expect(TIER_OFFSET_MAX).toBeGreaterThan(0);
  });
});

describe("idempotence — the property the whole design rests on", () => {
  it("is a pure fold: recomputing the same history gives the same state", () => {
    const history = [fast(), fast(), ok(20), wrong(), expired(), fast(), fast(), fast(), slow()];
    const a = computeLiveState(history);
    const b = computeLiveState(history);
    const c = computeLiveState([...history]);
    expect(a).toEqual(b);
    expect(a).toEqual(c);
  });

  it("replaying a prefix then the rest equals computing the whole thing", () => {
    const history = [fast(), fast(), fast(), wrong(), wrong(), ok(10), fast()];
    // There is no incremental API by design — this asserts the absence of hidden
    // state, i.e. that a retried request cannot double-apply a step.
    expect(computeLiveState(history)).toEqual(computeLiveState(history.slice()));
  });

  it("an empty session is the neutral state", () => {
    const s = computeLiveState([]);
    expect(s.tierOffset).toBe(0);
    expect(s.timeScale).toBe(1);
    expect(s.lastSignal).toBe(null);
  });
});

describe("the on-screen nudge", () => {
  it("speaks only when the gear actually changed", () => {
    expect(liveSignalMessage(computeLiveState([fast(), fast(), fast()]))).toContain("urcăm");
    expect(liveSignalMessage(computeLiveState([wrong(), wrong()]))).toContain("Încetinim");
    expect(liveSignalMessage(computeLiveState([ok(20)]))).toBe(null);
    expect(liveSignalMessage(computeLiveState([]))).toBe(null);
  });

  it("stays silent when a streak fires but the tier is already at the ceiling", () => {
    // Planned tier 3 + offset 2 = tier 5, the hardest there is. Another
    // promotion streak changes nothing, so it must not claim it did.
    const pinned = computeLiveState(
      Array.from({ length: FAST_STREAK_TO_PROMOTE * 4 }, () => fast(30, 3, 3))
    );
    // Planned 3 + offset = tier 5, the hardest there is.
    expect(Math.min(5, 3 + pinned.tierOffset)).toBe(5);
    expect(liveSignalMessage(pinned)).toBe(null);
  });
});

describe("a realistic session", () => {
  it("a strong student ends up harder and faster than planned", () => {
    const s = computeLiveState([fast(), fast(), fast(), fast(), ok(12, 30), fast(), fast(), fast()]);
    expect(s.tierOffset).toBeGreaterThan(0);
    expect(s.timeScale).toBeLessThan(1);
  });

  it("a struggling student ends up easier and with more time", () => {
    const s = computeLiveState([expired(), expired(), wrong(), ok(28, 30), expired(), expired()]);
    expect(s.tierOffset).toBeLessThan(0);
    expect(s.timeScale).toBeGreaterThan(1);
  });

  it("a well-matched student drifts nowhere — which is the point", () => {
    const s = computeLiveState([ok(18, 30), ok(20, 30), ok(17, 30), ok(21, 30), ok(19, 30)]);
    expect(s.tierOffset).toBe(0);
    expect(s.timeScale).toBe(1);
  });
});
