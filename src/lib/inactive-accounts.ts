/**
 * Accounts left in the pause (trial over, nothing paid) with nobody signing in for 12 months are
 * erased (Alex, 29.09.2026) — a retention limit the Privacy policy states, and a real reason to come
 * back. Before that: warnings 30 days, 7 days and 1 day ahead.
 *
 *  - „Activity" is the family's: every account joined to this one by parent links, however far (a
 *    co-parent of the same child included). A parent who still signs in keeps the child's account and
 *    the other parent's, and the other way round.
 *  - The pause itself counts as a start: 12 months of pause, never 12 months since some older visit.
 *    12 calendar months in Bucharest, to the end of that day (29 February becomes 1 March).
 *  - An adult (price-visibility.ts) is warned with the offer: the same −30% for as long as they stay
 *    subscribed that a free week gives, until the day the account would be erased (winback.ts) — unless
 *    they switched off our messages about prices (access-messages.ts): then the warning comes plain. A
 *    learner who may be a child is never shown an offer: with a parent in the account the parent is the
 *    one warned; alone, they get a plain warning (signing in keeps the account).
 *  - Nobody who still pays anything is touched: a card subscription, or an extra subject or seat bought
 *    next to a cancelled plan — then the family isn't really gone, and a person would have to stop it.
 *    „Gratuit permanent", staff, company learners, guests and banned accounts are left out too (a ban
 *    is kept: erasing it would let the same person sign up again).
 *  - Never erased without the last warning (Alex: „notificat pe email de cateva ori inainte”): the
 *    erasure waits for the day the „day" warning named, at least a day after it went out. A warning
 *    counts only once a transport accepted it (an address that keeps refusing mail: after
 *    WARNING_SEND_ATTEMPTS tries); an account with no address can't be told, and its warnings are only
 *    recorded. A sweep that finds an account past its date with no last warning sends that one first.
 *  - Payments made in the past stay, without the person (account-erasure.ts --keep-payments).
 *
 * dueInactiveWarning, inactiveEraseAt, warningEraseOn, warningCycle and warningEmail are pure;
 * runInactiveAccounts reads, sends, records and erases.
 */
import { prisma } from "@/lib/prisma";
import { sendAppEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { escapeHtml } from "@/lib/sanitize";
import { withCronLease } from "@/lib/cron-lease";
import { resolveIsTest } from "@/lib/notifications/test-account";
import { loadAccess } from "@/lib/access-server";
import { loadConsentFacts } from "@/lib/parent-consent-server";
import { mayShowPrices } from "@/lib/price-visibility";
import { TRIAL_PAYMENT_PERCENT } from "@/lib/checkout-price";
import { ERASED_PAYMENTS_HOLDER_ID, eraseAccount } from "@/lib/account-erasure";
import { winbackId } from "@/lib/winback";
import { runningAddons } from "@/lib/checkout-facts";
import { ACCESS_MESSAGES_PAGE, ACCESS_MESSAGES_SETTING, accessMessagesOff } from "@/lib/access-messages";
import { bucharestDateAYearLater, endOfBucharestDate, endOfBucharestDay } from "@/lib/bucharest-day";
import { inMessageWindow } from "@/lib/message-window";

export type InactiveStage = "month" | "week" | "day";
/** Days before the erasure each warning goes out. */
export const WARN_DAYS_BEFORE: Record<InactiveStage, number> = { month: 30, week: 7, day: 1 };
const LATEST_FIRST: InactiveStage[] = ["day", "week", "month"];
/** Sends of one warning refused by every transport before it counts as given anyway (a dead address). */
export const WARNING_SEND_ATTEMPTS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Inside the 20-minute lease, with room to finish the account in hand. */
const RUN_BUDGET_MS = 15 * 60_000;
/** Where the sweep stopped: the next run carries on from there, so no account is never reached. */
const CURSOR_KEY = "inactiveSweepCursor";

export const inactiveWarningId = (userId: string, stage: InactiveStage) => `inactive-warning:${userId}:${stage}`;
const failId = (userId: string, stage: InactiveStage) => `inactive-warning-fail:${userId}:${stage}`;

/** 12 calendar months after the last sign of life, to the end of that day in Bucharest. */
export function inactiveEraseAt(lastActivity: Date): Date {
  const { y, m, d } = bucharestDateAYearLater(lastActivity);
  return endOfBucharestDate(y, m, d);
}

/**
 * The warning due now, or null: the latest one that applies, never an earlier one after a later. Past
 * the date with no last warning sent, that one is due: the account is never erased without it.
 */
export function dueInactiveWarning(eraseAt: Date, now: Date, sent: ReadonlySet<InactiveStage>): InactiveStage | null {
  const daysLeft = (eraseAt.getTime() - now.getTime()) / DAY_MS;
  for (let i = 0; i < LATEST_FIRST.length; i++) {
    const stage = LATEST_FIRST[i];
    if (daysLeft > WARN_DAYS_BEFORE[stage]) continue;
    return LATEST_FIRST.slice(0, i + 1).some((s) => sent.has(s)) ? null : stage;
  }
  return null;
}

/** The date a warning names: the erasure day, and never less than a day after the warning goes out. */
export function warningEraseOn(eraseAt: Date, now: Date): Date {
  return new Date(Math.max(eraseAt.getTime(), endOfBucharestDay(new Date(now.getTime() + DAY_MS)).getTime()));
}

/** The date a warning's record names (its token ends with it). */
function namedDate(token: string): number {
  return Number(token.split(":").pop());
}

/**
 * The warnings of the current cycle, from their records: those naming this erasure date or a later one
 * (a sign-in moves the date forward, so the warnings before it no longer count), and the date the last
 * one named — the erasure waits for it. `finalOn` is null while the last warning hasn't gone out.
 */
export function warningCycle(
  records: { identifier: string; token: string }[],
  userId: string,
  eraseAt: Date,
): { sent: Set<InactiveStage>; finalOn: number | null } {
  const current = records.filter((m) => namedDate(m.token) >= eraseAt.getTime());
  const sent = new Set(
    (Object.keys(WARN_DAYS_BEFORE) as InactiveStage[]).filter((s) => current.some((m) => m.identifier === inactiveWarningId(userId, s))),
  );
  const finals = current.filter((m) => m.identifier === inactiveWarningId(userId, "day")).map((m) => namedDate(m.token));
  return { sent, finalOn: finals.length ? Math.max(...finals) : null };
}

const DATE = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "long", year: "numeric" });

export function warningEmail(input: {
  stage: InactiveStage;
  eraseAt: Date;
  /** An adult who may be shown the offer (and didn't switch our price messages off). */
  adult: boolean;
  /** Children whose accounts go with this one (named to their parent only). */
  children: string[];
  baseUrl: string;
  /** The package the offer leads to: Family for a parent, Elev for an adult who learns. */
  plan?: "FAMILY" | "ELEV";
}) {
  const on = DATE.format(input.eraseAt);
  const kids =
    input.children.length === 0
      ? ""
      : ` Odată cu el se șterge și contul ${input.children.length === 1 ? "copilului" : "copiilor"}: ${input.children
          .map((n) => escapeHtml(n.replace(/[\r\n]+/g, " ").trim().slice(0, 80)))
          .join(", ")}.`;
  const button = (href: string, label: string) =>
    `<p><a href="${href}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a></p>`;
  const subject =
    input.stage === "day" ? `Ultima zi: contul tău de pe eTutor.ro se șterge pe ${on}` : `Contul tău de pe eTutor.ro se șterge pe ${on}`;
  const intro = `<p>Bună ziua,</p>
<p>Contul tău de pe eTutor.ro e în pauză și nimeni nu a mai intrat în el de aproape un an. Ca să nu păstrăm date de care nu mai ai nevoie, ștergem conturile nefolosite după 12 luni: al tău se șterge după <strong>${on}</strong>, cu tot ce s-a lucrat în el.${kids}</p>`;
  const keep = `<p>Dacă vrei să-l păstrezi, e de ajuns să intri în cont până atunci.</p>`;
  const offer = input.adult
    ? `<p>Iar dacă vrei să continui, ai −${TRIAL_PAYMENT_PERCENT}% cât timp rămâi abonat, dacă activezi până pe ${on}, inclusiv. Anulezi oricând.</p>
${button(`${input.baseUrl}/ro/dashboard/packages?plan=${input.plan ?? "FAMILY"}`, `Reactivez cu −${TRIAL_PAYMENT_PERCENT}%`)}
<p style="color:#888;font-size:12px;">Nu mai vrei oferte de la noi? Le oprești din <a href="${input.baseUrl}/ro${ACCESS_MESSAGES_PAGE}" style="color:#888;">Setări → Notificări</a>. Anunțul despre ștergerea contului îl primești oricum.</p>`
    : button(`${input.baseUrl}/ro/auth/signin`, "Intru în cont");
  return {
    subject,
    html: `${intro}
${keep}
${offer}
<p style="color:#888;font-size:12px;">eTutor.ro</p>`,
  };
}

/** The family of an account: every account joined to it by active parent links, however far. */
async function familyOf(userId: string): Promise<string[]> {
  const family = new Set([userId]);
  let frontier = [userId];
  while (frontier.length && family.size < 100) {
    const links = await prisma.guardian.findMany({
      where: { OR: [{ parentId: { in: frontier } }, { childId: { in: frontier } }], status: "active", relation: "PARENT" },
      select: { parentId: true, childId: true },
    });
    const next: string[] = [];
    for (const l of links) {
      for (const id of [l.parentId, l.childId]) {
        if (!family.has(id)) {
          family.add(id);
          next.push(id);
        }
      }
    }
    frontier = next;
  }
  return [...family];
}

/** The last sign of life in a family: an account made, a sign-in, a page in front of someone, an answer. */
export async function lastFamilyActivity(ids: string[]): Promise<Date> {
  const [users, visit, attempt] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: ids } }, select: { createdAt: true, lastLoginAt: true } }),
    prisma.userVisit.aggregate({ where: { userId: { in: ids } }, _max: { lastSeenAt: true } }),
    prisma.attempt.aggregate({ where: { userId: { in: ids } }, _max: { createdAt: true } }),
  ]);
  const times = [
    ...users.flatMap((u) => [u.createdAt, u.lastLoginAt]),
    visit._max.lastSeenAt,
    attempt._max.createdAt,
  ].filter((d): d is Date => d instanceof Date);
  return new Date(Math.max(0, ...times.map((d) => d.getTime())));
}

export type InactiveRunResult = { warned: number; erased: number; skippedTest: number; failed: number };

type Candidate = { id: string; email: string | null };

async function loadCursor(): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key: CURSOR_KEY }, select: { value: true } });
  const after = (row?.value as { after?: unknown } | null)?.after;
  return typeof after === "string" ? after : null;
}
async function saveCursor(after: string | null) {
  await prisma.appSetting.upsert({ where: { key: CURSOR_KEY }, create: { key: CURSOR_KEY, value: { after } }, update: { value: { after } } });
}

/** Cron: warn and erase. Warnings only between 9:00 and 20:00; erasures at any hour. */
export async function runInactiveAccounts(now: Date = new Date()): Promise<{ ran: boolean } & InactiveRunResult> {
  const empty = { warned: 0, erased: 0, skippedTest: 0, failed: 0 };
  const run = await withCronLease("inactive-accounts", 20 * 60_000, async () => {
    const r: InactiveRunResult = { ...empty };
    const started = Date.now();
    const mayWarn = inMessageWindow(now);
    // A wide first cut: nobody in the account itself signed in (or was made) within the window of the
    // first warning, and it could be paused at all. The family and the pause are checked one by one.
    const cutoff = new Date(now.getTime() - (365 - WARN_DAYS_BEFORE.month - 1) * DAY_MS);
    const baseUrl = process.env.AUTH_URL || "https://etutor.ro";
    // Page by page from where the last run stopped; at the end of the list, the next run starts over.
    // „After this id", not a row cursor: an account erased on the way doesn't end the walk.
    let cursor = await loadCursor();
    while (Date.now() - started < RUN_BUDGET_MS) {
      const page: Candidate[] = await prisma.user.findMany({
        where: {
          ...(cursor ? { id: { gt: cursor } } : {}),
          NOT: { id: ERASED_PAYMENTS_HOLDER_ID },
          isSuperAdmin: false,
          freeForever: false,
          isBanned: false,
          isGuest: false,
          organizationId: null,
          OR: [{ accountRole: null }, { accountRole: { not: "TUTOR" } }],
          createdAt: { lte: cutoff },
          AND: [{ OR: [{ lastLoginAt: null }, { lastLoginAt: { lte: cutoff } }] }],
          stripeSubscriptionId: null,
        },
        select: { id: true, email: true },
        orderBy: { id: "asc" },
        take: 200,
      });
      let done = 0;
      for (const c of page) {
        if (Date.now() - started >= RUN_BUDGET_MS) break;
        await sweepOne(c, now, mayWarn, baseUrl, r);
        cursor = c.id;
        done++;
      }
      if (done < page.length) break; // out of time: carry on from here next run
      if (page.length < 200) {
        cursor = null;
        break;
      }
    }
    await saveCursor(cursor);
    return r;
  });
  return run.ran ? { ran: true, ...run.result } : { ran: false, ...empty };
}

async function sweepOne(c: Candidate, now: Date, mayWarn: boolean, baseUrl: string, r: InactiveRunResult): Promise<void> {
  try {
    const access = await loadAccess(c.id, now);
    if (!access || access.kind !== "paused") return;
    const family = await familyOf(c.id);
    // Everyone in the family must be paused too: a paying or covered member keeps the family.
    for (const id of family) {
      if (id === c.id) continue;
      const a = await loadAccess(id, now);
      if (a && a.kind !== "paused") return;
    }
    // Still paying for something (an extra subject or seat outlives a cancelled plan): not gone.
    for (const id of family) {
      if ((await runningAddons(id)).length > 0) return;
      if (id !== c.id && (await prisma.user.count({ where: { id, stripeSubscriptionId: { not: null } } })) > 0) return;
    }
    const last = new Date(Math.max((await lastFamilyActivity(family)).getTime(), access.since.getTime()));
    const eraseAt = inactiveEraseAt(last);

    const { sent, finalOn } = warningCycle(
      await prisma.verificationToken.findMany({
        where: { identifier: { startsWith: `inactive-warning:${c.id}:` } },
        select: { identifier: true, token: true },
      }),
      c.id,
      eraseAt,
    );

    // Erased once the last warning went out and the day it named is over.
    if (finalOn !== null && now.getTime() >= finalOn) {
      const erased = await eraseAccount(c.id, "INACTIVE", { activitySince: last, keepPayments: true });
      if (erased.erased) r.erased++;
      else if (erased.why === "legal-unavailable" || erased.why === "has-payments") r.failed++;
      return;
    }
    if (!mayWarn) return;

    const stage = dueInactiveWarning(eraseAt, now, sent);
    if (!stage) return;
    const on = warningEraseOn(eraseAt, now);

    const facts = await loadConsentFacts(c.id);
    const adult = facts !== null && mayShowPrices(facts);
    // A learner who may be a child, with a parent in the account: the parent is the one warned.
    if (!adult && facts?.isChild) return;
    // The offer only to an adult who didn't switch our price messages off.
    const optOut = adult
      ? await prisma.setting.findUnique({ where: { userId_key: { userId: c.id, key: ACCESS_MESSAGES_SETTING } }, select: { value: true } })
      : null;
    const offer = adult && !accessMessagesOff(optOut?.value);
    // Named to the parent: only the children who go with this account (no other parent keeps them).
    const children = adult
      ? (
          await prisma.guardian.findMany({
            where: { parentId: c.id, status: "active", relation: "PARENT" },
            select: {
              child: {
                select: {
                  name: true,
                  username: true,
                  _count: { select: { guardianLinks: { where: { status: "active", relation: "PARENT" } } } },
                },
              },
            },
          })
        )
          .filter((g) => g.child._count.guardianLinks === 1)
          .map((g) => g.child.name?.trim() || g.child.username || "copilul")
      : [];

    const record = async () => {
      await prisma.verificationToken.create({
        data: { identifier: inactiveWarningId(c.id, stage), token: `inactive:${c.id}:${stage}:${on.getTime()}`, expires: new Date(on.getTime() + 30 * DAY_MS) },
      });
      if (offer) await openWinback(c.id, on, now);
    };

    // Test accounts, and accounts with no address to write to: recorded, never mailed.
    if (!c.email || resolveIsTest(c.email)) {
      await record();
      r.skippedTest++;
      return;
    }
    const { subject, html } = warningEmail({ stage, eraseAt: on, adult: offer, children, baseUrl, plan: facts?.accountRole === "STUDENT" ? "ELEV" : "FAMILY" });
    if (await sendAppEmail({ to: c.email, subject, html })) {
      // Counted only once a transport took it.
      await record();
      await prisma.verificationToken.deleteMany({ where: { identifier: failId(c.id, stage) } });
      r.warned++;
      return;
    }
    r.failed++;
    const tries = (await prisma.verificationToken.count({ where: { identifier: failId(c.id, stage) } })) + 1;
    await prisma.verificationToken.create({
      data: { identifier: failId(c.id, stage), token: `fail:${c.id}:${stage}:${tries}:${Date.now()}`, expires: new Date(on.getTime() + 60 * DAY_MS) },
    });
    if (tries >= WARNING_SEND_ATTEMPTS) {
      logger.error("Inactive-account warning refused by every transport, counted as given", undefined, { userId: c.id, stage, tries });
      await record();
    } else {
      logger.warn("Inactive-account warning not accepted; retried next hour", { userId: c.id, stage, tries });
    }
  } catch (err) {
    r.failed++;
    logger.error("Inactive-account sweep failed for one account", err, { userId: c.id });
  }
}

/** The win-back offer lasts to the end of the latest day a warning named — never ends before it. */
async function openWinback(userId: string, until: Date, now: Date) {
  const open = await prisma.verificationToken.findFirst({
    where: { identifier: winbackId(userId), expires: { gt: now } },
    orderBy: { expires: "desc" },
    select: { token: true, expires: true },
  });
  if (!open) {
    await prisma.verificationToken.create({ data: { identifier: winbackId(userId), token: `winback:${userId}:${until.getTime()}`, expires: until } });
  } else if (open.expires < until) {
    await prisma.verificationToken.updateMany({ where: { token: open.token }, data: { expires: until } });
  }
}
