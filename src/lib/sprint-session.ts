/**
 * DB layer for the "Sprint de calcul" sessions — the timed, crescendo chained
 * mental-arithmetic drill in the private Aptitudini Aviație domain.
 *
 * Unlike every other session type, a sprint does NOT draw from a fixed bank: the
 * questions are generated fresh for each run. That is deliberate — the exercise
 * trains fast computation, and a chain the student has met before is recalled
 * rather than computed, which quietly turns the drill into a memory test.
 *
 * The generated rows are still real `Question` rows (so attempts, scoring, XP
 * and progress all work unchanged), tagged with `sourceReference = "sprint:…"`
 * and a topic of their own so the generic selectors never serve them inside an
 * untimed session.
 */

import { prisma } from "@/lib/prisma";
import type { Prisma, Question } from "@prisma/client";
import {
  generateChainQuestion,
  secondsForIndex,
  tierForIndex,
  SPRINT_MIN_SECONDS,
  SPRINT_SUBJECT,
  SPRINT_TOPIC,
  type Tier,
} from "@/lib/mental-chain";
import {
  computeLiveState,
  type LiveState,
  type SprintEvent,
} from "@/lib/sprint-live";

// Re-exported so the server modules keep a single import site for sprint bits.
export { SPRINT_TIMEOUT_ANSWER, SPRINT_DOMAIN_SLUG } from "@/lib/mental-chain";
import { SPRINT_TIMEOUT_ANSWER as SPRINT_TIMEOUT_SENTINEL } from "@/lib/mental-chain";
import { LEVEL_MAX, LEVEL_MIN, TIME_FACTOR_MAX, TIME_FACTOR_MIN } from "@/lib/sprint-adapt";

export const SPRINT_SESSION_TYPE = "sprint";

/** Tag prefix on generated rows — the handle for both exclusion and pruning. */
export const SPRINT_SOURCE_PREFIX = "sprint:";

/** Abandoned sprints leave unanswered rows behind; drop them after this long. */
const ORPHAN_PRUNE_DAYS = 7;

/** A pending-feedback sprint older than this stops blocking a new one. */
export const FEEDBACK_BLOCK_DAYS = 7;

export interface SprintMetadata {
  duration: number;
  /** How many questions the sprint is planned to run for. */
  totalQuestions: number;
  /**
   * Questions generated SO FAR. A sprint is built one question at a time — the
   * next one's difficulty and clock depend on how the previous ones went — so
   * this grows as the session runs rather than being fixed at the start.
   */
  questionIds: string[];
  /** Per-question clock actually given, index-aligned with `questionIds`. */
  questionSeconds: number[];
  /** Profile the session STARTED from — what the debrief then adjusts. */
  level: number;
  timeFactor: number;
  sprintFeedback?: {
    difficulty: string;
    time: string;
    at: string;
  };
}

// ─── Profile ───

export interface SprintProfileValues {
  level: number;
  timeFactor: number;
  sessions: number;
}

const DEFAULT_PROFILE: SprintProfileValues = { level: LEVEL_MIN, timeFactor: 1, sessions: 0 };

/**
 * Current adaptive state, defaulting to the gentlest setting for a student who
 * has never done a sprint. Values are re-clamped on read so a bad row (manual
 * edit, a future bug) can't hand the generator an out-of-range level.
 */
export async function loadSprintProfile(
  userId: string,
  domainId: string
): Promise<SprintProfileValues> {
  const row = await prisma.sprintProfile.findUnique({
    where: { userId_domainId: { userId, domainId } },
  });
  if (!row) return { ...DEFAULT_PROFILE };
  return {
    level: Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, Math.round(row.level))),
    timeFactor: Math.min(TIME_FACTOR_MAX, Math.max(TIME_FACTOR_MIN, row.timeFactor)),
    sessions: row.sessions,
  };
}

export async function saveSprintProfile(
  userId: string,
  domainId: string,
  next: { level: number; timeFactor: number }
): Promise<void> {
  const level = Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, Math.round(next.level)));
  const timeFactor = Math.min(TIME_FACTOR_MAX, Math.max(TIME_FACTOR_MIN, next.timeFactor));
  await prisma.sprintProfile.upsert({
    where: { userId_domainId: { userId, domainId } },
    create: { userId, domainId, level, timeFactor, sessions: 1 },
    update: { level, timeFactor, sessions: { increment: 1 } },
  });
}

// ─── Generation ───

/**
 * The difficulty and clock for question `index`, given the session's plan and
 * how the answers have gone so far.
 *
 * The plan (a crescendo from the student's stored level, and a 45s→12s ramp) is
 * the baseline; the live state shifts it — up to ±2 tiers and ×0.6..1.6 on the
 * clock — so a session that is going well gets harder and tighter in real time,
 * and one that is going badly eases off.
 */
export function resolveQuestionShape(
  index: number,
  total: number,
  profile: { level: number; timeFactor: number },
  live: LiveState
): { tier: Tier; seconds: number } {
  const plannedTier = tierForIndex(index, total, profile.level);
  const tier = Math.min(5, Math.max(1, plannedTier + live.tierOffset)) as Tier;
  const plannedSeconds = secondsForIndex(index, total, profile.timeFactor);
  // Bounded above by the session's OPENING allowance: the multiplier is wide
  // enough to undo the whole ramp, and without this ceiling a bad patch late in
  // a session could hand out more time than the warm-up question had, which
  // stops being a speed drill.
  const openingSeconds = secondsForIndex(0, total, profile.timeFactor);
  const seconds = Math.min(
    openingSeconds,
    Math.max(SPRINT_MIN_SECONDS, Math.round(plannedSeconds * live.timeScale))
  );
  return { tier, seconds };
}

/**
 * Generate and persist ONE question for a running sprint.
 */
async function createSprintQuestion(
  domainId: string,
  createdById: string,
  tier: Tier,
  index: number
): Promise<Question> {
  const generated = generateChainQuestion(tier);

  // A per-question tag lets us read the row back without depending on createMany
  // returning ids (and gives pruning a precise handle).
  const batchTag = `${SPRINT_SOURCE_PREFIX}${crypto.randomUUID()}`;

  // `create`, not `createMany` + read-back: the read-back matched on
  // `sourceReference`, which has no index, so it scanned the whole Question
  // table (exam banks included) — once per answer, inside the request the
  // student is waiting on in a speed drill.
  return prisma.question.create({
    data: {
      domainId,
      subject: SPRINT_SUBJECT,
      topic: SPRINT_TOPIC,
      difficulty: generated.difficulty,
      type: "MULTIPLE_CHOICE" as const,
      content: generated.content,
      options: generated.options,
      correctAnswer: generated.correctAnswer,
      explanation: generated.explanation,
      source: "MANUAL" as const,
      // NOT "PUBLISHED" on purpose. Every other place that serves questions to a
      // student — exam simulations, the daily challenge, the placement
      // assessment, streak recovery, the public quiz — selects on
      // `status: "PUBLISHED"`, and these rows are always the newest in the
      // domain, so several of those (which order by createdAt desc) would serve
      // nothing but generated arithmetic, untimed. APPROVED says exactly what
      // these are: real, answerable rows that are not part of the servable bank.
      // Answering still works — the answer route looks a question up by id.
      status: "APPROVED" as const,
      sourceReference: batchTag,
      bookOrder: index,
      createdById,
    },
  });
}

/**
 * Drop generated rows from abandoned sprints. Strictly limited to sprint-tagged
 * questions that are old AND were never answered — anything the student
 * actually attempted is history and stays.
 */
export async function pruneOrphanSprintQuestions(domainId: string): Promise<number> {
  const cutoff = new Date(Date.now() - ORPHAN_PRUNE_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.question.deleteMany({
    where: {
      domainId,
      sourceReference: { startsWith: SPRINT_SOURCE_PREFIX },
      createdAt: { lt: cutoff },
      attempts: { none: {} },
      // DailyChallenge.question cascades on delete, so a generated row that was
      // ever picked as a challenge would take the challenge AND every student's
      // attempts on it down with it. Keeping them as APPROVED should stop that
      // selection happening at all; this is the second lock on the same door.
      dailyChallenges: { none: {} },
    },
  });
  return count;
}

/**
 * Rebuild the live-adaptation input from what actually happened: each answered
 * question paired with the clock it was given.
 */
export function buildSprintEvents(
  meta: SprintMetadata,
  attempts: readonly { questionId: string; isCorrect: boolean; answer: string; timeSpent: number | null }[]
): SprintEvent[] {
  const budgetOf = new Map<string, number>();
  const plannedTierOf = new Map<string, number>();
  meta.questionIds.forEach((id, i) => {
    budgetOf.set(id, meta.questionSeconds[i] ?? 0);
    plannedTierOf.set(id, tierForIndex(i, meta.totalQuestions, meta.level));
  });
  // ONE event per question, first attempt wins.
  //
  // There is no unique constraint on (sessionId, questionId), and the client
  // deliberately allows re-submitting a question whose response was lost. A
  // second row for the same question is not a second answer — counting it would
  // promote the student a tier early and tighten the clock again off a single
  // dropped response. The fold being pure is worth nothing if its input can
  // contain a phantom event.
  const seen = new Set<string>();
  const out: SprintEvent[] = [];
  for (const a of attempts) {
    if (seen.has(a.questionId)) continue;
    seen.add(a.questionId);
    out.push({
      correct: a.isCorrect,
      timedOut: a.answer === SPRINT_TIMEOUT_SENTINEL,
      timeSpentMs: a.timeSpent ?? 0,
      budgetSeconds: budgetOf.get(a.questionId) ?? 0,
      plannedTier: plannedTierOf.get(a.questionId) ?? 1,
      nextPlannedTier: 0, // filled below, once the order is settled
      maxPlannedTier: 0,
    });
  }
  // The offset applies to the question about to be generated, so each step is
  // clamped against THAT question's planned tier, not the one just answered.
  const lastIndex = Math.max(0, meta.totalQuestions - 1);
  // The plan is monotonic non-decreasing, so its highest tier is its last one.
  const maxPlannedTier = tierForIndex(lastIndex, meta.totalQuestions, meta.level);
  out.forEach((e, i) => {
    e.nextPlannedTier = tierForIndex(
      Math.min(i + 1, lastIndex),
      meta.totalQuestions,
      meta.level
    );
    e.maxPlannedTier = maxPlannedTier;
  });
  return out;
}

export interface NextSprintQuestion {
  done: boolean;
  question?: Question;
  seconds?: number;
  /** 0-based position of this question in the sprint. */
  index?: number;
  answered: number;
  total: number;
  live: LiveState;
}

/**
 * What the student should answer next.
 *
 * Idempotent by construction. It first looks for a question that was already
 * generated but never answered — so a refresh, a retry, or a second tab returns
 * the SAME question rather than burning a new one and skipping ahead. Only when
 * every generated question has been answered does it create the next one, at the
 * difficulty and clock the live state calls for.
 */
export async function getOrCreateNextSprintQuestion(
  learningSession: { id: string; userId: string; domainId: string | null; metadata: Prisma.JsonValue | null }
): Promise<NextSprintQuestion> {
  // Re-read the metadata rather than trusting the caller's copy. On the answer
  // path that copy was loaded five awaits earlier (question lookup, attempt
  // create, progress upsert, XP award), and the append below is a
  // read-modify-write on a JSON column — a stale base silently drops whichever
  // question the other writer had just appended, orphaning it and leaving its
  // time budget unknown (which then reads as "slow" and loosens the clock).
  const fresh = await prisma.session.findUnique({
    where: { id: learningSession.id },
    select: { metadata: true, domainId: true },
  });
  const meta = readSprintMetadata(fresh?.metadata ?? learningSession.metadata);
  const domainId = fresh?.domainId ?? learningSession.domainId;
  if (!meta || !domainId) {
    throw new Error("sprint: session is missing its plan");
  }

  const attempts = await prisma.attempt.findMany({
    where: { sessionId: learningSession.id },
    // Tie-broken by id: two attempts in the same millisecond would otherwise let
    // Postgres return either order, and the fold IS order-sensitive (streaks).
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { questionId: true, isCorrect: true, answer: true, timeSpent: true },
  });

  const events = buildSprintEvents(meta, attempts);
  const live = computeLiveState(events);
  const answeredIds = new Set(attempts.map((a) => a.questionId));
  const answered = answeredIds.size;
  const total = meta.totalQuestions;

  if (answered >= total) {
    return { done: true, answered, total, live };
  }

  // Resume: a question was handed out but never answered.
  const pendingIdx = meta.questionIds.findIndex((id) => !answeredIds.has(id));
  if (pendingIdx >= 0) {
    const existing = await prisma.question.findUnique({ where: { id: meta.questionIds[pendingIdx] } });
    if (existing) {
      return {
        done: false,
        question: existing,
        seconds: meta.questionSeconds[pendingIdx],
        index: pendingIdx,
        answered,
        total,
        live,
      };
    }
    // The row is gone (pruned, manual delete) — fall through and generate a
    // replacement rather than dead-ending the session.
  }

  const index = meta.questionIds.length;
  const { tier, seconds } = resolveQuestionShape(
    index,
    total,
    { level: meta.level, timeFactor: meta.timeFactor },
    live
  );

  const question = await createSprintQuestion(
    domainId,
    learningSession.userId,
    tier,
    index
  );

  await prisma.session.update({
    where: { id: learningSession.id },
    data: {
      metadata: {
        ...meta,
        questionIds: [...meta.questionIds, question.id],
        questionSeconds: [...meta.questionSeconds, seconds],
      } as unknown as object,
    },
  });

  return { done: false, question, seconds, index, answered, total, live };
}

// ─── Mandatory feedback gate ───

export function readSprintMetadata(metadata: Prisma.JsonValue | null): SprintMetadata | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  return metadata as unknown as SprintMetadata;
}

export function hasSprintFeedback(metadata: Prisma.JsonValue | null): boolean {
  return Boolean(readSprintMetadata(metadata)?.sprintFeedback);
}

/**
 * The most recent finished sprint still missing its feedback, if any — the
 * student answers those two questions before starting another one. Sprints
 * older than FEEDBACK_BLOCK_DAYS are ignored so a stale one can never lock the
 * drill permanently.
 */
export async function findSprintAwaitingFeedback(
  userId: string,
  domainId: string
): Promise<{ id: string; endedAt: Date | null } | null> {
  const since = new Date(Date.now() - FEEDBACK_BLOCK_DAYS * 24 * 60 * 60 * 1000);
  const recent = await prisma.session.findMany({
    where: {
      userId,
      domainId,
      type: SPRINT_SESSION_TYPE,
      endedAt: { not: null, gte: since },
    },
    orderBy: { endedAt: "desc" },
    take: 5,
    select: { id: true, endedAt: true, metadata: true },
  });
  const pending = recent.find((s) => !hasSprintFeedback(s.metadata));
  return pending ? { id: pending.id, endedAt: pending.endedAt } : null;
}
