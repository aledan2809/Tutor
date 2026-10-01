/**
 * The parent's daily digest (Alex, 01.10.2026: „da, fă și rezumatul zilnic adevărat în eTutor”).
 *
 * A parent who picks „Rezumat zilnic la ora …” (selfAlertMode DIGEST) gets no alert about a child on any
 * device during the day — parent-monitor.ts and threshold-monitor.ts keep the in-app rows only — and
 * instead ONE message a day, at the chosen time in their own time zone, through their usual channel order:
 * the reminders the child ignored (with their times), the ones they answered, the study sessions, what is
 * still unanswered, and the other alerts of the day. Nothing to tell, no message. The chosen time is kept
 * even inside quiet hours: the parent chose it.
 *
 * Each parent's day is claimed once (a Setting row of the parent: the day and when it was checked), so
 * overlapping runs can't send it twice, and the e-mail carries an idempotency key for the same day. The
 * digest covers the time since the previous one, so nothing between two digests is lost; a failure before
 * the message exists gives the day back to the next run.
 */
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { withCronLease } from "@/lib/cron-lease";
import { pausedUserIds } from "@/lib/access-server";
import { deliverParentAlert } from "./parent-monitor";

export const DIGEST_MODE = "DIGEST";
const DEFAULT_TZ = "Europe/Bucharest";
const CLAIM_KEY = "parentDigest";
const DAY_MS = 24 * 60 * 60 * 1000;
/** The window starts at the previous digest unless that is older than this (the parent left DIGEST meanwhile). */
const MAX_WINDOW_MS = 2 * DAY_MS;
/**
 * A time late in the evening can fall after the day's last run (the cron runs every 15 minutes): the runs
 * just after midnight still send it, for the day it belongs to.
 */
const CATCH_UP_MIN = 3 * 60;
const DIGEST_LINK = { url: "/dashboard/watcher", label: "Vezi detaliile" };
/** Alerts that aren't about a reminder, kept in the app during the day and listed in the digest. */
const OTHER_ALERT_TYPES = ["threshold_alert", "curriculum_lag"];

/** Whether this user chose the daily digest: no alerts about a child on their devices during the day. */
export async function prefersDailyDigest(userId: string): Promise<boolean> {
  const p = await prisma.notificationPreference.findUnique({ where: { userId }, select: { selfAlertMode: true } });
  return p?.selfAlertMode === DIGEST_MODE;
}

/** The time zone to use: the parent's own, or Bucharest when it is missing or not a real one. */
export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz) return DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

/** Local calendar date (YYYY-MM-DD) and minutes since midnight of `now` in `tz`. */
export function localDayAndMinutes(now: Date, tz: string): { day: string; minutes: number } {
  const day = now.toLocaleDateString("en-CA", { timeZone: tz });
  const [h, m] = now
    .toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false })
    .split(":")
    .map(Number);
  return { day, minutes: (h % 24) * 60 + m };
}

/**
 * Pure: the day whose digest is due now, or null. Today's, once the chosen time („HH:MM”) has come;
 * yesterday's, in the first hours after midnight, when the time fell after yesterday's last run.
 */
export function digestSlot(at: string, now: Date, tz: string): string | null {
  const [ah, am] = String(at ?? "20:00").split(":").map(Number);
  const atMin = (Number.isFinite(ah) ? ah : 20) * 60 + (Number.isFinite(am) ? am : 0);
  const { day, minutes } = localDayAndMinutes(now, tz);
  if (minutes >= atMin) return day;
  if (minutes + 24 * 60 - atMin <= CATCH_UP_MIN) {
    // A minute before local midnight is still yesterday (the window is before 03:00, so no clock change in it).
    return localDayAndMinutes(new Date(now.getTime() - (minutes + 1) * 60_000), tz).day;
  }
  return null;
}

export type ChildDay = {
  name: string | null;
  /** Reminders ignored: when each one started. */
  ignored: string[];
  /** …of which the child came back to later. */
  answeredLater: number;
  /** Reminders answered right away. */
  answered: number;
  /** Study sessions started. */
  sessions: number;
  /** Reminders still without an answer: when they started. */
  unanswered: string[];
  /** Reminders from before this digest, unanswered then, answered since: when they started. */
  answeredSince: string[];
};

/** „20 de remindere”: in Romanian a number from 20 up takes „de”, unless it ends in 01–19. */
const num = (n: number, noun: string) => `${n}${n >= 20 && (n % 100 === 0 || n % 100 >= 20) ? " de" : ""} ${noun}`;
const list = (xs: string[]) => xs.join(", ");

/** Pure: the digest text, or null when there is nothing to tell. */
export function digestText(children: ChildDay[], others: string[] = []): { title: string; message: string } | null {
  const lines: string[] = [];
  const told: (string | null)[] = [];
  for (const c of children) {
    const parts: string[] = [];
    const n = c.ignored.length;
    if (n > 0) {
      parts.push(`${n === 1 ? "un reminder ignorat" : `${num(n, "remindere")} ignorate`} (${list(c.ignored)})`);
      if (c.answeredLater > 0) {
        parts.push(
          n === 1
            ? "a revenit mai târziu la el"
            : `a revenit mai târziu la ${c.answeredLater === 1 ? "unul" : c.answeredLater} dintre ele`,
        );
      }
    }
    if (c.answered > 0) parts.push(`a răspuns la ${c.answered === 1 ? "un reminder" : num(c.answered, "remindere")}`);
    if (c.sessions > 0) parts.push(c.sessions === 1 ? "o sesiune de studiu" : `${num(c.sessions, "sesiuni")} de studiu`);
    if (c.answeredSince.length > 0) {
      parts.push(
        `a răspuns între timp ${c.answeredSince.length === 1 ? "la reminderul" : "la reminderele"} de la ${list(c.answeredSince)}`,
      );
    }
    if (parts.length === 0) continue;
    let line = `${c.name ?? "Copilul"}: ${parts.join("; ")}.`;
    if (c.unanswered.length > 0) {
      line += ` Încă fără răspuns: ${c.unanswered.length === 1 ? "reminderul" : "reminderele"} de la ${list(c.unanswered)}.`;
    }
    lines.push(line);
    told.push(c.name);
  }
  const otherTitles = [...new Set(others.map((o) => o.trim()).filter(Boolean))];
  if (otherTitles.length > 0) lines.push(`Alte alerte: ${otherTitles.join("; ")}.`);
  if (lines.length === 0) return null;
  const only = told.length === 1 ? told[0] : null;
  return { title: only ? `Rezumatul zilei pe eTutor.ro: ${only}` : "Rezumatul zilei pe eTutor.ro", message: lines.join("\n") };
}

/** „19:00”, or „30.09 19:00” when it wasn't on the digest's own day. */
function whenLabel(d: Date, tz: string, day: string): string {
  const time = d.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
  const date = d.toLocaleDateString("en-CA", { timeZone: tz });
  return date === day ? time : `${date.slice(8, 10)}.${date.slice(5, 7)} ${time}`;
}

/** What each linked child did since `since`, for this parent. */
async function childrenDay(parentId: string, since: Date, tz: string, day: string): Promise<ChildDay[]> {
  const links = await prisma.guardian.findMany({
    where: { parentId, status: "active", relation: "PARENT" },
    select: { childId: true, child: { select: { name: true } } },
  });
  const out: ChildDay[] = [];
  for (const l of links) {
    const episodes = await prisma.parentEscalation.findMany({
      where: { parentId, childId: l.childId, OR: [{ createdAt: { gte: since } }, { resolvedAt: { gte: since } }] },
      orderBy: { openedFor: "asc" },
      select: { status: true, openedFor: true, parentAlertRung: true, createdAt: true },
    });
    const fresh = episodes.filter((e) => e.createdAt >= since);
    // A lapse opens with its first alert (rung ≥ 1); a prompt answer is recorded straight as resolved.
    const lapses = fresh.filter((e) => e.parentAlertRung >= 1);
    const label = (e: { openedFor: Date }) => whenLabel(e.openedFor, tz, day);
    const sessions = await prisma.session.count({ where: { userId: l.childId, startedAt: { gte: since } } });
    out.push({
      name: l.child.name,
      ignored: lapses.map(label),
      answeredLater: lapses.filter((e) => e.status === "resolved_positive").length,
      answered: fresh.filter((e) => e.parentAlertRung === 0 && e.status === "resolved_positive").length,
      sessions,
      unanswered: lapses.filter((e) => e.status === "awaiting_parent" || e.status === "authorized").map(label),
      // Told as unanswered in an earlier digest, answered since.
      answeredSince: episodes
        .filter((e) => e.createdAt < since && e.parentAlertRung >= 1 && e.status === "resolved_positive")
        .map(label),
    });
  }
  return out;
}

/** The other alerts the parent got in the app since `since` (thresholds, curriculum lag): their titles. */
async function otherAlerts(parentId: string, since: Date): Promise<string[]> {
  const rows = await prisma.notification.findMany({
    where: { userId: parentId, type: { in: OTHER_ALERT_TYPES }, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { title: true },
    take: 20,
  });
  return rows.map((r) => r.title);
}

type ClaimValue = { day?: string; checkedAtMs?: number } | null;

/**
 * Claims this parent's digest for `day`: the previous value when it was free, null when it was taken.
 * Days only move forward, so a time changed after the digest doesn't send it again. Atomic on one row:
 * a second run waits on it, then finds the day taken.
 */
async function claimDay(parentId: string, day: string, nowMs: number): Promise<{ prev: ClaimValue } | null> {
  await prisma.$executeRaw`
    INSERT INTO "Setting" ("id", "userId", "key", "value", "updatedAt")
    VALUES (${randomUUID()}, ${parentId}, ${CLAIM_KEY}, '{}'::jsonb, NOW())
    ON CONFLICT ("userId", "key") DO NOTHING`;
  const rows = await prisma.$queryRaw<{ prev: ClaimValue }[]>`
    WITH old AS (SELECT "value" AS prev FROM "Setting" WHERE "userId" = ${parentId} AND "key" = ${CLAIM_KEY})
    UPDATE "Setting" AS s
    SET "value" = jsonb_build_object('day', ${day}::text, 'checkedAtMs', ${nowMs}::bigint),
        "updatedAt" = NOW()
    FROM old
    WHERE s."userId" = ${parentId} AND s."key" = ${CLAIM_KEY}
      AND COALESCE(s."value"->>'day', '') COLLATE "C" < ${day}::text COLLATE "C"
    RETURNING old.prev`;
  return rows.length === 0 ? null : { prev: rows[0].prev };
}

/** Gives the day back after a failure before the message existed (only if no later run took it since). */
async function releaseDay(parentId: string, prev: ClaimValue, day: string, nowMs: number): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Setting"
    SET "value" = ${JSON.stringify(prev ?? {})}::jsonb, "updatedAt" = NOW()
    WHERE "userId" = ${parentId} AND "key" = ${CLAIM_KEY}
      AND "value"->>'day' = ${day}::text AND ("value"->>'checkedAtMs')::bigint = ${nowMs}::bigint`;
}

/** Sends the digests that are due. Called from the 15-minute cron; one run at a time. */
export async function runParentDigests(now: Date = new Date()): Promise<{ ran: boolean; sent: number; empty: number }> {
  const run = await withCronLease("parent-digests", 30 * 60_000, async () => {
    let sent = 0;
    let empty = 0;
    const nowMs = now.getTime();
    const prefs = await prisma.notificationPreference.findMany({
      where: { selfAlertMode: DIGEST_MODE },
      select: { userId: true, selfAlertAt: true, timezone: true },
    });
    const paused = await pausedUserIds(prefs.map((p) => p.userId), now);
    for (const p of prefs) {
      try {
        if (paused.has(p.userId)) continue;
        const tz = safeTimeZone(p.timezone);
        const day = digestSlot(p.selfAlertAt, now, tz);
        if (!day) continue;
        const claim = await claimDay(p.userId, day, nowMs);
        if (!claim) continue;
        let built: { text: { title: string; message: string } | null; rowId: string | null };
        try {
          const prevMs = Number(claim.prev?.checkedAtMs ?? 0);
          const since = new Date(prevMs > 0 && nowMs - prevMs <= MAX_WINDOW_MS ? prevMs : nowMs - DAY_MS);
          const text = digestText(await childrenDay(p.userId, since, tz, day), await otherAlerts(p.userId, since));
          const rowId = text
            ? (
                await prisma.notification.create({
                  data: {
                    userId: p.userId,
                    type: "parent_alert",
                    title: text.title,
                    message: text.message,
                    metadata: { alertType: "daily_digest", day, delivered: false },
                  },
                })
              ).id
            : null;
          built = { text, rowId };
        } catch (err) {
          // Nothing exists yet: the next run tries the same day again, over the same window.
          await releaseDay(p.userId, claim.prev, day, nowMs).catch(() => undefined);
          throw err;
        }
        if (!built.text || !built.rowId) {
          empty++;
          continue;
        }
        const delivered = await deliverParentAlert(
          p.userId,
          built.text.title,
          built.text.message,
          0,
          DIGEST_LINK,
          `etutor:digest:${p.userId}:${day}`,
          { ignoreQuietHours: true },
        );
        if (delivered) {
          await prisma.notification.update({
            where: { id: built.rowId },
            data: { metadata: { alertType: "daily_digest", day, delivered: true } },
          });
          sent++;
        }
      } catch (err) {
        console.error("parent digest failed for one parent", p.userId, err);
      }
    }
    return { sent, empty };
  });
  return run.ran ? { ran: true, ...run.result } : { ran: false, sent: 0, empty: 0 };
}
