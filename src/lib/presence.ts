/**
 * Presence: when an account was last on the site, how many times it came, and for how long.
 *
 * Two sources, never mixed over the same stretch of time:
 *   • from the moment recording started — real stays (`UserVisit`), written by a quiet signal the
 *     page sends every minute while it is in front;
 *   • before that — an estimate rebuilt from work the platform already stored (answers, lessons,
 *     exams), clustered by the same 30-minute rule.
 *
 * The split point is kept in a `Setting` row rather than derived from the oldest surviving visit:
 * a retention purge would otherwise move it forward silently and make the reading rebuild estimates
 * over stretches it had really measured. A period touching the estimated stretch is reported as
 * estimated, and the admin table marks it — a number nobody can check is worse than an honest "≈".
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/** A stay ends after this long without a trace; the next trace starts a new one (the Umami rule). */
export const VISIT_GAP_MS = 30 * 60_000;
/** The last trace is not the moment the person left. One minute is the cheapest honest guess. */
export const VISIT_TAIL_MS = 60_000;
/** A signal closer than this to the previous one changes nothing — tabs and reloads are not visits. */
export const PING_MIN_INTERVAL_MS = 20_000;
/**
 * How far back the "last subject" line looks. Unbounded, it pairs yesterday's sign-in with work from
 * six months ago as if they were one fact — and it made the admin list sort every historical row of
 * every account on the page (measured: 61 ms and a 4 MB disk sort for 20 accounts).
 */
export const TRACE_WINDOW_MS = 90 * 24 * 60 * 60_000;
/** Where the start of recording is remembered, so a purge of old stays cannot move it. */
const TRACKING_KEY = "presence.trackingStartedAt";
/**
 * A fixed id for that row. The table's uniqueness is `(userId, key)`, and in Postgres two NULL
 * `userId`s do not collide — so a plain insert would write one row per opened stay and the reading
 * could pick a later one, quietly moving the start of recording forward. The primary key does collide,
 * which is what makes „write once, then never again" true.
 */
const TRACKING_ROW_ID = "presence-tracking-start";

export type Presence = { visits: number; ms: number };

/**
 * Stays out of a sorted list of activity moments. Pure: the estimate and its tests run on this, and
 * so would any later report. `gapMs` closes a stay, `tailMs` is added once per stay.
 */
export function clusterVisits(sortedMs: number[], gapMs = VISIT_GAP_MS, tailMs = VISIT_TAIL_MS): Presence {
  if (sortedMs.length === 0) return { visits: 0, ms: 0 };
  let visits = 1;
  let ms = 0;
  let start = sortedMs[0];
  let prev = sortedMs[0];
  for (let i = 1; i < sortedMs.length; i++) {
    const at = sortedMs[i];
    if (at - prev > gapMs) {
      ms += prev - start + tailMs;
      visits++;
      start = at;
    }
    prev = at;
  }
  ms += prev - start + tailMs;
  return { visits, ms };
}

/** Adds up stays, clipping one that began before the window so the period's number stays the period's. */
export function sumVisits(
  rows: { startedAt: Date; lastSeenAt: Date }[],
  from: Date,
  tailMs = VISIT_TAIL_MS,
): Presence {
  let visits = 0;
  let ms = 0;
  for (const r of rows) {
    // A stay that ended before the window is not this period's, even if a caller passes it in.
    if (r.lastSeenAt.getTime() < from.getTime()) continue;
    visits++;
    const start = Math.max(r.startedAt.getTime(), from.getTime());
    ms += Math.max(0, r.lastSeenAt.getTime() - start) + tailMs;
  }
  return { visits, ms };
}

const RO_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Bucharest",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const RO_HOUR = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", hour12: false });

/**
 * Midnight of the Romanian day `now` falls in, as a real instant. „Azi" must mean the calendar day
 * the admin is living in — a rolling 24 hours would fold in half of yesterday evening and give a
 * different answer at 10:00 than at 18:00 for activity that did not change. Both offsets are tried,
 * so the clock change needs no table of dates.
 */
export function startOfRomanianDay(now = new Date()): Date {
  const ymd = RO_DAY.format(now);
  for (const offset of ["+03:00", "+02:00"]) {
    const candidate = new Date(`${ymd}T00:00:00${offset}`);
    if (RO_DAY.format(candidate) === ymd && RO_HOUR.format(candidate) === "00") return candidate;
  }
  return new Date(now.getTime() - 24 * 60 * 60_000);
}

/**
 * Records a signal: extends the stay in progress, or opens a new one.
 *
 * Serialised per account, because two open tabs signal in the same second and the naive
 * read-then-write opens two stays for one person. The lock is an advisory one keyed on the account
 * id — deliberately NOT `FOR NO KEY UPDATE` on the `User` row, which is what the checkout takes:
 * a presence signal must never make a payment callback wait.
 *
 * The throttle is checked before the transaction opens, so the many signals that change nothing cost
 * one indexed read. May throw (a transaction can time out); every caller must treat that as nothing.
 */
export async function recordPing(userId: string, now = new Date()): Promise<"extended" | "opened" | "ignored"> {
  const last = await prisma.userVisit.findFirst({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, lastSeenAt: true },
  });
  if (last && now.getTime() - last.lastSeenAt.getTime() < PING_MIN_INTERVAL_MS) return "ignored";

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`presence:${userId}`})::bigint)`;

    const fresh = await tx.userVisit.findFirst({
      where: { userId },
      orderBy: { lastSeenAt: "desc" },
      select: { id: true, lastSeenAt: true },
    });
    const since = fresh ? now.getTime() - fresh.lastSeenAt.getTime() : Infinity;

    if (fresh && since <= VISIT_GAP_MS) {
      if (since < PING_MIN_INTERVAL_MS) return "ignored";
      await tx.userVisit.update({
        where: { id: fresh.id },
        data: { lastSeenAt: now, pings: { increment: 1 } },
      });
      return "extended";
    }

    const exists = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) return "ignored";

    await tx.userVisit.create({ data: { userId, startedAt: now, lastSeenAt: now } });
    // The first stay ever also fixes the moment from which numbers are measured rather than rebuilt.
    // `skipDuplicates` so a race writes it once and later stays leave it where it is.
    await tx.setting.createMany({
      data: [{ id: TRACKING_ROW_ID, key: TRACKING_KEY, value: now.toISOString() }],
      skipDuplicates: true,
    });
    return "opened";
  });
}

/** The moment real recording began; before it there are no stays to count, only the estimate. */
export async function trackingStart(): Promise<Date | null> {
  // By id first; by key, oldest first, as a net for any row written before the id was fixed.
  const row =
    (await prisma.setting.findUnique({ where: { id: TRACKING_ROW_ID }, select: { value: true } })) ??
    (await prisma.setting.findFirst({
      where: { key: TRACKING_KEY },
      orderBy: { createdAt: "asc" },
      select: { value: true },
    }));
  if (row && typeof row.value === "string") {
    const at = new Date(row.value);
    if (!isNaN(at.getTime())) return at;
  }
  // Recorded before the setting existed: fall back to the oldest stay still on record.
  const first = await prisma.userVisit.findFirst({ orderBy: { startedAt: "asc" }, select: { startedAt: true } });
  return first?.startedAt ?? null;
}

/**
 * Every moment of work between two instants, for the given accounts. No subject is read here — the
 * estimate only needs the times, and joining for a column nobody uses doubles the query's cost.
 */
async function activityBetween(userIds: string[], from: Date, to: Date): Promise<{ userId: string; at: Date }[]> {
  if (userIds.length === 0) return [];
  return prisma.$queryRaw<{ userId: string; at: Date }[]>`
    SELECT a."userId", a."createdAt" AS at
      FROM "Attempt" a
     WHERE a."userId" IN (${Prisma.join(userIds)}) AND a."createdAt" >= ${from} AND a."createdAt" < ${to}
    UNION ALL
    SELECT lp."userId", lp."updatedAt" AS at
      FROM "LessonProgress" lp
     WHERE lp."userId" IN (${Prisma.join(userIds)}) AND lp."updatedAt" >= ${from} AND lp."updatedAt" < ${to}
    UNION ALL
    SELECT es."userId", es."startedAt" AS at
      FROM "ExamSession" es
     WHERE es."userId" IN (${Prisma.join(userIds)}) AND es."startedAt" >= ${from} AND es."startedAt" < ${to}
    ORDER BY 1, 2`;
}

export type PresenceReport = {
  /** Per account: stays and time inside the period. */
  byUser: Map<string, Presence>;
  /** True when part of the period predates real recording, so the numbers are partly rebuilt. */
  estimated: boolean;
  /** When measuring began; null while nothing has ever been recorded. */
  trackingStartedAt: Date | null;
};

/** Stays and time per account over [from, now] — real where it exists, rebuilt where it doesn't. */
export async function presenceFor(userIds: string[], from: Date, now = new Date()): Promise<PresenceReport> {
  const byUser = new Map<string, Presence>();
  if (userIds.length === 0) return { byUser, estimated: false, trackingStartedAt: null };
  for (const id of userIds) byUser.set(id, { visits: 0, ms: 0 });

  const anchor = await trackingStart();
  const estimated = !anchor || anchor > from;

  // Real stays, added up by the database: one row per account, so a wide period in a busy month
  // cannot be cut short by a row cap. `firstStart` is used below to heal a stay across the seam.
  let real: { userId: string; visits: number; ms: number; firstStart: Date }[] = [];
  if (anchor) {
    real = await prisma.$queryRaw<{ userId: string; visits: number; ms: number; firstStart: Date }[]>`
      SELECT "userId",
             COUNT(*)::int AS visits,
             COALESCE(SUM(EXTRACT(EPOCH FROM GREATEST("lastSeenAt" - GREATEST("startedAt", ${from}), interval '0')) * 1000), 0)::double precision AS ms,
             MIN("startedAt") AS "firstStart"
        FROM "UserVisit"
       WHERE "userId" IN (${Prisma.join(userIds)}) AND "lastSeenAt" >= ${from}
       GROUP BY "userId"`;
  }
  const firstRealStart = new Map(real.map((r) => [r.userId, r.firstStart.getTime()]));

  if (estimated) {
    const until = anchor && anchor < now ? anchor : now;
    const rows = await activityBetween(userIds, from, until);
    const perUser = new Map<string, number[]>();
    for (const r of rows) {
      const list = perUser.get(r.userId) ?? [];
      list.push(r.at.getTime());
      perUser.set(r.userId, list);
    }
    for (const [userId, times] of perUser) {
      times.sort((a, b) => a - b);
      const got = clusterVisits(times);
      // One stay can straddle the moment recording began: work at 09:58, first signal at 10:01. Both
      // sides would count it, so the rebuilt side gives its last one up — the measured one is truer.
      const firstStart = firstRealStart.get(userId);
      const lastTrace = times[times.length - 1];
      if (got.visits > 0 && firstStart !== undefined && firstStart - lastTrace <= VISIT_GAP_MS) got.visits -= 1;
      const acc = byUser.get(userId);
      if (acc) {
        acc.visits += got.visits;
        acc.ms += got.ms;
      }
    }
  }

  for (const r of real) {
    const acc = byUser.get(r.userId);
    if (!acc) continue;
    acc.visits += r.visits;
    acc.ms += Math.round(r.ms) + r.visits * VISIT_TAIL_MS;
  }

  return { byUser, estimated, trackingStartedAt: anchor };
}

export type LastTrace = { at: Date; domainId: string | null; domainName: string | null };

/**
 * The last trace of work per account within the last {@link TRACE_WINDOW_MS}, with the subject it was
 * on. The window is the point: paired with a sign-in date, an unbounded "last subject" reads as if
 * the person had just studied something they last touched half a year ago.
 */
export async function lastTraceFor(userIds: string[], now = new Date()): Promise<Map<string, LastTrace>> {
  const out = new Map<string, LastTrace>();
  if (userIds.length === 0) return out;
  const since = new Date(now.getTime() - TRACE_WINDOW_MS);

  const rows = await prisma.$queryRaw<{ userId: string; at: Date; domainId: string | null; name: string | null }[]>`
    WITH ev AS (
      SELECT a."userId", a."createdAt" AS at, q."domainId"
        FROM "Attempt" a JOIN "Question" q ON q."id" = a."questionId"
       WHERE a."userId" IN (${Prisma.join(userIds)}) AND a."createdAt" >= ${since}
      UNION ALL
      SELECT lp."userId", lp."updatedAt" AS at, l."domainId"
        FROM "LessonProgress" lp JOIN "Lesson" l ON l."id" = lp."lessonId"
       WHERE lp."userId" IN (${Prisma.join(userIds)}) AND lp."updatedAt" >= ${since}
      UNION ALL
      SELECT es."userId", es."startedAt" AS at, es."domainId"
        FROM "ExamSession" es
       WHERE es."userId" IN (${Prisma.join(userIds)}) AND es."startedAt" >= ${since}
    )
    SELECT DISTINCT ON (ev."userId") ev."userId", ev.at, ev."domainId", d."name"
      FROM ev LEFT JOIN "Domain" d ON d."id" = ev."domainId"
     ORDER BY ev."userId", ev.at DESC`;

  for (const r of rows) out.set(r.userId, { at: r.at, domainId: r.domainId, domainName: r.name });
  return out;
}

/** The last time each account was seen on the site, measured — the freshest thing presence knows. */
export async function lastSeenFor(userIds: string[]): Promise<Map<string, Date>> {
  const out = new Map<string, Date>();
  if (userIds.length === 0) return out;
  const rows = await prisma.$queryRaw<{ userId: string; at: Date }[]>`
    SELECT "userId", MAX("lastSeenAt") AS at
      FROM "UserVisit"
     WHERE "userId" IN (${Prisma.join(userIds)})
     GROUP BY "userId"`;
  for (const r of rows) out.set(r.userId, r.at);
  return out;
}

/**
 * Drops stays older than `days`. Presence is behavioural data about people — some of them children —
 * so it is kept for a season, not forever. Safe to run at any time: the moment recording began lives
 * in its own setting, so deleting old stays does not move it and does not turn measured stretches
 * back into estimates.
 */
export async function purgeOldVisits(days = 400, now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60_000);
  const { count } = await prisma.userVisit.deleteMany({ where: { lastSeenAt: { lt: cutoff } } });
  return count;
}
