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
import {
  baseSecondsFor,
  generateSingleQuestion,
  singlePressure,
  SINGLE_FAMILIES,
  SINGLE_TOPIC,
  type SingleFamily,
} from "@/lib/mental-single";
import {
  computeFamilyState,
  familyTier,
  pickFamily,
  readFamilyBaselines,
  FAMILY_TIME_MAX,
  type FamilyBaselines,
  type FamilyEvent,
  type FamilyState,
} from "@/lib/sprint-families";
import {
  countOfKind,
  ordinalWithinKind,
  planSlots,
  remainingOfKind,
  type SlotKind,
} from "@/lib/sprint-plan";

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
  /**
   * Which kind each generated question was — index-aligned with `questionIds`.
   * Absent on sessions started before direct operations existed; those are read
   * as all-chain, which is what they were.
   */
  questionKinds?: SlotKind[];
  /**
   * Operation family per generated question (`null` for chains) — index-aligned
   * with `questionIds`. This, not the Question row, is what the per-family
   * adaptation reads: the row can be pruned or edited, the plan cannot.
   */
  questionFamilies?: (SingleFamily | null)[];
  /** Profile the session STARTED from — what the debrief then adjusts. */
  level: number;
  timeFactor: number;
  /**
   * Per-family carry-over the session started from. Recorded here, not re-read
   * from the profile mid-session: the profile is rewritten by the debrief, and a
   * session that is still running must keep computing against the numbers it
   * actually began with or its clock would jump under the student.
   */
  familyBaselines?: FamilyBaselines;
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
  /**
   * Per-operation-family carry-over for the direct half of the drill. Empty for
   * a student who has never done one — `computeFamilyState` then starts every
   * family at the gentlest setting.
   */
  families: FamilyBaselines;
}

const DEFAULT_PROFILE: SprintProfileValues = {
  level: LEVEL_MIN,
  timeFactor: 1,
  sessions: 0,
  families: {},
};

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
  if (!row) return { ...DEFAULT_PROFILE, families: {} };
  return {
    level: Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, Math.round(row.level))),
    timeFactor: Math.min(TIME_FACTOR_MAX, Math.max(TIME_FACTOR_MIN, row.timeFactor)),
    sessions: row.sessions,
    families: readFamilyBaselines(row.families),
  };
}

export async function saveSprintProfile(
  userId: string,
  domainId: string,
  next: { level: number; timeFactor: number; families?: FamilyBaselines }
): Promise<void> {
  const level = Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, Math.round(next.level)));
  const timeFactor = Math.min(TIME_FACTOR_MAX, Math.max(TIME_FACTOR_MIN, next.timeFactor));
  // Re-read through the same guard the load path uses, so a caller cannot write
  // a shape the reader would later reject.
  const families = next.families ? readFamilyBaselines(next.families) : undefined;
  await prisma.sprintProfile.upsert({
    where: { userId_domainId: { userId, domainId } },
    create: {
      userId,
      domainId,
      level,
      timeFactor,
      sessions: 1,
      ...(families ? { families: families as unknown as object } : {}),
    },
    update: {
      level,
      timeFactor,
      sessions: { increment: 1 },
      ...(families ? { families: families as unknown as object } : {}),
    },
  });
}

/**
 * The metadata a fresh sprint starts with.
 *
 * A function, not an object literal inlined in the route, because two of these
 * fields are load-bearing in a way that is invisible at the call site: without
 * `familyBaselines` the engine reads `{}` and every operation restarts at the
 * gentlest level, so the drill forgets between sessions everything it learned
 * within them; and the PRESENCE of `questionKinds` is what distinguishes a
 * session that knows about direct operations from one that predates them.
 * Both were omitted the first time this was wired, and neither failure is
 * visible from the outside — the sprint runs, it just quietly does not learn.
 */
export function buildInitialSprintMetadata(
  profile: SprintProfileValues,
  total: number,
  plannedDuration: number
): SprintMetadata {
  return {
    duration: plannedDuration,
    totalQuestions: total,
    questionIds: [],
    questionSeconds: [],
    questionKinds: [],
    questionFamilies: [],
    level: profile.level,
    timeFactor: profile.timeFactor,
    familyBaselines: profile.families,
  };
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
 * The family, difficulty and clock for the next DIRECT operation.
 *
 * Deliberately not routed through `resolveQuestionShape`. A chain's budget comes
 * off the session's 45s→12s ramp, i.e. from WHERE the question sits; a direct
 * operation's comes from the operation itself — `7 × 8` and `73 × 46` are both
 * "one multiplication" and are not remotely the same amount of work, so handing
 * them the ramp's current value would make one a formality and the other
 * impossible, and neither would measure anything.
 *
 * The global `timeFactor` is NOT applied here either: the per-family clock
 * multiplier already carries this student's personal pacing for that operation,
 * both what previous sessions settled on and what this one has done so far.
 * Multiplying by both would count the same personalisation twice.
 */
export function resolveSingleShape(
  singleIndex: number,
  singleTotal: number,
  families: FamilyState,
  family: SingleFamily
): { tier: Tier; seconds: number } {
  const tier = familyTier(families, family);
  const base = baseSecondsFor(family, tier);
  const scaled = base * singlePressure(singleIndex, singleTotal) * families[family].timeScale;
  // Bounded by what this operation is worth at its hardest personal setting, so
  // a bad patch cannot turn a tier-1 addition into a 40-second question.
  return {
    tier,
    seconds: Math.min(
      Math.round(base * FAMILY_TIME_MAX),
      Math.max(SPRINT_MIN_SECONDS, Math.round(scaled))
    ),
  };
}

/**
 * Generate and persist ONE question for a running sprint.
 */
async function createSprintQuestion(
  domainId: string,
  createdById: string,
  tier: Tier,
  index: number,
  kind: SlotKind,
  family: SingleFamily | null
): Promise<Question> {
  const generated =
    kind === "single" && family
      ? generateSingleQuestion(family, tier)
      : generateChainQuestion(tier);

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
      // Direct operations carry their own topic so a later reader (reports, the
      // debrief, anything that samples the bank) can tell the two drills apart
      // without re-parsing the expression.
      topic: kind === "single" ? SINGLE_TOPIC : SPRINT_TOPIC,
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
/**
 * Which kind each generated question was.
 *
 * A session started before direct operations existed has no `questionKinds`;
 * every question in it was a chain, and it is read that way so the numbers an
 * old debrief produces do not change under it.
 */
export function slotKindsOf(meta: SprintMetadata): SlotKind[] {
  if (!Array.isArray(meta.questionKinds)) return meta.questionIds.map(() => "chain" as SlotKind);
  const plan = planSlots(meta.totalQuestions);
  return meta.questionIds.map((_, i) => meta.questionKinds?.[i] ?? plan[i] ?? "chain");
}

export function isLegacyAllChain(meta: SprintMetadata): boolean {
  return !Array.isArray(meta.questionKinds);
}

/** How many chain slots the session's plan contains. */
export function chainTotalOf(meta: SprintMetadata): number {
  if (isLegacyAllChain(meta)) return meta.totalQuestions;
  return Math.max(1, countOfKind(planSlots(meta.totalQuestions), "chain"));
}

/** How many direct-operation slots the session's plan contains. */
export function singleTotalOf(meta: SprintMetadata): number {
  if (isLegacyAllChain(meta)) return 0;
  return countOfKind(planSlots(meta.totalQuestions), "single");
}

interface SlotInfo {
  kind: SlotKind;
  family: SingleFamily | null;
  budgetSeconds: number;
  /** 0-based position among the slots of its own kind. */
  ordinal: number;
}

function slotIndex(meta: SprintMetadata): Map<string, SlotInfo> {
  const kinds = slotKindsOf(meta);
  const counters: Record<SlotKind, number> = { single: 0, chain: 0 };
  const out = new Map<string, SlotInfo>();
  meta.questionIds.forEach((id, i) => {
    const kind = kinds[i] ?? "chain";
    out.set(id, {
      kind,
      family: meta.questionFamilies?.[i] ?? null,
      budgetSeconds: meta.questionSeconds[i] ?? 0,
      ordinal: counters[kind]++,
    });
  });
  return out;
}

/**
 * First attempt per question, in answer order.
 *
 * There is no unique constraint on (sessionId, questionId), and the client
 * deliberately allows re-submitting a question whose response was lost. A
 * second row for the same question is not a second answer — counting it would
 * promote the student a tier early and tighten the clock again off a single
 * dropped response. Both folds are pure, which is worth nothing if their input
 * can contain a phantom event.
 */
function firstAttempts<T extends { questionId: string }>(attempts: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const a of attempts) {
    if (seen.has(a.questionId)) continue;
    seen.add(a.questionId);
    out.push(a);
  }
  return out;
}

export interface SprintAttemptRow {
  questionId: string;
  isCorrect: boolean;
  answer: string;
  timeSpent: number | null;
}

/**
 * Rebuild the CHAIN adaptation's input: each answered chain paired with the
 * clock it was given.
 *
 * Direct operations are excluded on purpose. This fold drives the chain ramp —
 * its `plannedTier` is a chain tier — and a fast answer on `47 + 38` says
 * nothing about whether the next `25 × 5 − 40 ÷ 8 − 95` should be harder. The
 * two drills are adapted by the two folds that actually govern them.
 */
export function buildChainEvents(
  meta: SprintMetadata,
  attempts: readonly SprintAttemptRow[]
): SprintEvent[] {
  const slots = slotIndex(meta);
  const chainTotal = chainTotalOf(meta);
  const lastOrdinal = Math.max(0, chainTotal - 1);
  const maxPlannedTier = tierForIndex(lastOrdinal, chainTotal, meta.level);

  const out: SprintEvent[] = [];
  for (const a of firstAttempts(attempts)) {
    const slot = slots.get(a.questionId);
    if (!slot || slot.kind !== "chain") continue;
    out.push({
      correct: a.isCorrect,
      timedOut: a.answer === SPRINT_TIMEOUT_SENTINEL,
      timeSpentMs: a.timeSpent ?? 0,
      budgetSeconds: slot.budgetSeconds,
      plannedTier: tierForIndex(slot.ordinal, chainTotal, meta.level),
      // The offset applies to the question about to be generated, so each step
      // is clamped against THAT question's planned tier, not the one just
      // answered.
      nextPlannedTier: tierForIndex(
        Math.min(slot.ordinal + 1, lastOrdinal),
        chainTotal,
        meta.level
      ),
      maxPlannedTier,
    });
  }
  return out;
}

/** Rebuild the PER-FAMILY adaptation's input: each answered direct operation. */
export function buildFamilyEvents(
  meta: SprintMetadata,
  attempts: readonly SprintAttemptRow[]
): FamilyEvent[] {
  const slots = slotIndex(meta);
  const out: FamilyEvent[] = [];
  for (const a of firstAttempts(attempts)) {
    const slot = slots.get(a.questionId);
    if (!slot || slot.kind !== "single" || !slot.family) continue;
    if (!SINGLE_FAMILIES.includes(slot.family)) continue;
    out.push({
      family: slot.family,
      correct: a.isCorrect,
      timedOut: a.answer === SPRINT_TIMEOUT_SENTINEL,
      timeSpentMs: a.timeSpent ?? 0,
      budgetSeconds: slot.budgetSeconds,
    });
  }
  return out;
}

/**
 * Back-compat alias — the chain fold was the only one before direct operations
 * existed, and the debrief route still asks for "the sprint events".
 */
export const buildSprintEvents = buildChainEvents;

export interface NextSprintQuestion {
  done: boolean;
  question?: Question;
  seconds?: number;
  /** 0-based position of this question in the sprint. */
  index?: number;
  answered: number;
  total: number;
  live: LiveState;
  /** Direct operation or chain. */
  kind?: SlotKind;
  /** Which operation family, when this is a direct operation. */
  family?: SingleFamily | null;
  /** Per-family state as it stands right now — what the debrief reports on. */
  families: FamilyState;
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
    // Postgres return either order, and both folds ARE order-sensitive (streaks).
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { questionId: true, isCorrect: true, answer: true, timeSpent: true },
  });

  const live = computeLiveState(buildChainEvents(meta, attempts));
  const families = computeFamilyState(
    buildFamilyEvents(meta, attempts),
    meta.familyBaselines ?? {}
  );
  const answeredIds = new Set(attempts.map((a) => a.questionId));
  const answered = answeredIds.size;
  const total = meta.totalQuestions;

  if (answered >= total) {
    return { done: true, answered, total, live, families };
  }

  const kinds = slotKindsOf(meta);

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
        kind: kinds[pendingIdx] ?? "chain",
        family: meta.questionFamilies?.[pendingIdx] ?? null,
        answered,
        total,
        live,
        families,
      };
    }
    // The row is gone (pruned, manual delete) — fall through and generate a
    // replacement rather than dead-ending the session.
  }

  const index = meta.questionIds.length;
  const plan = planSlots(total);
  // A sprint that was already running when direct operations shipped has no
  // `questionKinds`. Giving it one now would flip it mid-run from "20 chains"
  // to "10 chains + 10 singles", and the chain ramp is indexed by the total —
  // so its clock and difficulty would jump between two questions, under a
  // student who is being timed. It finishes as the drill it started as.
  const legacy = isLegacyAllChain(meta) && meta.questionIds.length > 0;
  const kind: SlotKind = legacy ? "chain" : (plan[index] ?? "chain");

  let tier: Tier;
  let seconds: number;
  let family: SingleFamily | null = null;

  if (kind === "single") {
    family = pickFamily(
      families,
      Math.random,
      // Lets the picker force a family that has not come up yet when the slots
      // left have run down to the ones still unmeasured — a family that was
      // never asked cannot be reported on afterwards.
      remainingOfKind(plan, index, "single")
    );
    const shape = resolveSingleShape(
      ordinalWithinKind(plan, index),
      Math.max(1, countOfKind(plan, "single")),
      families,
      family
    );
    tier = shape.tier;
    seconds = shape.seconds;
  } else {
    const shape = resolveQuestionShape(
      legacy ? index : ordinalWithinKind(plan, index),
      legacy ? total : Math.max(1, countOfKind(plan, "chain")),
      { level: meta.level, timeFactor: meta.timeFactor },
      live
    );
    tier = shape.tier;
    seconds = shape.seconds;
  }

  const question = await createSprintQuestion(
    domainId,
    learningSession.userId,
    tier,
    index,
    kind,
    family
  );

  await prisma.session.update({
    where: { id: learningSession.id },
    data: {
      metadata: {
        ...meta,
        questionIds: [...meta.questionIds, question.id],
        questionSeconds: [...meta.questionSeconds, seconds],
        // Written as full arrays rather than appended to a possibly-absent one,
        // so a session that started before these fields existed still ends up
        // with entries aligned to every id it holds.
        // A legacy session is left legacy — writing these fields is exactly
        // what would flip its shape mid-run.
        ...(legacy
          ? {}
          : {
              questionKinds: [...kinds, kind],
              questionFamilies: [
                ...meta.questionIds.map((_, i) => meta.questionFamilies?.[i] ?? null),
                family,
              ],
            }),
      } as unknown as object,
    },
  });

  return { done: false, question, seconds, index, kind, family, answered, total, live, families };
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
