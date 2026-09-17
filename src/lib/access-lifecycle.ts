/**
 * The messages of the 7-day trial, to the parent only (approved mockup, Alex 16.09.2026):
 *  - at launch, to accounts that already existed: they have 7 days with the whole package;
 *  - 3 days before the end, the last day, and day 8 (the account is paused).
 * Each says what the child worked on, what happens next and what it costs; one button, to payment.
 *
 * Never to a child or a learner (UCPD Annex I point 28: no direct exhortation to children to buy
 * or to get their parents to), never to accounts marked „Gratuit permanent" or to anyone who pays,
 * never to a parent whose children another parent's plan already covers (loadSeatHolder), and
 * nothing while the platform switch is off (then no account is paused, and saying so would lie).
 *
 * dueLifecycleStage and lifecycleCopy are pure; runAccessLifecycle reads, sends and records.
 */
import { prisma } from "@/lib/prisma";
import type { Access } from "@/lib/access";
import { trialStartOf } from "@/lib/access";
import { loadAccess, loadPauseStartsAt, loadSeatHolder } from "@/lib/access-server";
import { teaserOffer, teaserStats, type TeaserOffer, type TeaserStats } from "@/lib/access-teaser";
import { fmtPrice } from "@/lib/pricing";
import { withCronLease } from "@/lib/cron-lease";
import { deliverParentAlert, userInQuietHours } from "@/lib/escalation/parent-monitor";
import { ACCESS_MESSAGES_PAGE, ACCESS_MESSAGES_SETTING, accessMessagesOff } from "@/lib/access-messages";
import { resolveIsTest } from "@/lib/notifications/test-account";
import { isPaidSubscriber } from "@/lib/escalation/segmentation";

export type LifecycleStage = "launch" | "three_days" | "last_day" | "paused";

export const LIFECYCLE_TYPE: Record<LifecycleStage, string> = {
  launch: "access_trial_launch",
  three_days: "access_trial_three_days",
  last_day: "access_trial_last_day",
  paused: "access_trial_paused",
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** A pause older than this gets no „your account is paused" message (the run was late or off). */
const PAUSED_MESSAGE_MAX_AGE_MS = 3 * DAY_MS;
/** Messages go out between these Bucharest hours, and never in the parent's own quiet hours. */
const SEND_FROM_HOUR = 9;
const SEND_UNTIL_HOUR = 20;

/**
 * The message this payer should get now, or null. `sent` holds the stages already sent in this
 * trial window. One message per run at most: a late run sends the most relevant one, not a burst.
 */
export function dueLifecycleStage(input: {
  access: Access;
  createdAt: Date;
  pauseStartsAt: Date | null;
  now: Date;
  sent: ReadonlySet<LifecycleStage>;
}): LifecycleStage | null {
  const { access, createdAt, pauseStartsAt, now, sent } = input;
  if (!pauseStartsAt) return null;

  if (access.kind === "paused") {
    if (sent.has("paused")) return null;
    return now.getTime() - access.since.getTime() <= PAUSED_MESSAGE_MAX_AGE_MS ? "paused" : null;
  }
  // Only the account's own week: a child's family trial belongs to the parent's messages.
  if (access.kind !== "trial" || access.via !== "own") return null;

  if (access.daysLeft <= 1) return sent.has("last_day") ? null : "last_day";
  if (access.daysLeft <= 3) return sent.has("three_days") || sent.has("last_day") ? null : "three_days";
  // An account older than the switch got its week at launch: say so once.
  const startedAtLaunch = trialStartOf(createdAt, pauseStartsAt).getTime() === pauseStartsAt.getTime();
  return startedAtLaunch && sent.size === 0 ? "launch" : null;
}

export type LifecycleKid = {
  name: string | null;
  stats: TeaserStats;
  /** False for a child who keeps practising after the parent's week (a later week of their own). */
  pausesWithParent?: boolean;
};

/** „o zi", „2 zile", „20 de zile", „101 zile", „120 de zile". */
const plural = (n: number, one: string, many: string) =>
  n === 1 ? one : n !== 0 && (n % 100 === 0 || n % 100 >= 20) ? `${n} de ${many}` : `${n} ${many}`;

function kidLine(kid: LifecycleKid): string {
  const who = kid.name?.trim() || "Copilul tău";
  const { exercises, practicedDays, weakTopics } = kid.stats;
  if (exercises === 0) return `${who} n-a exersat încă în perioada de probă.`;
  // Answers without a finished session: no „în 0 zile".
  const base =
    practicedDays === 0
      ? `${who} a rezolvat ${plural(exercises, "un exercițiu", "exerciții")} în perioada de probă.`
      : `${who} a exersat ${practicedDays === 1 ? "într-o zi" : `în ${plural(practicedDays, "o zi", "zile")}`}: ${plural(exercises, "un exercițiu", "exerciții")}.`;
  return weakTopics > 0 ? `${base} Greșește des la ${plural(weakTopics, "un capitol", "capitole")}.` : base;
}

const BUCHAREST_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" });
const BUCHAREST_TIME = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const BUCHAREST_DATE = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "long" });

/**
 * „azi la 21:30", „mâine la 09:15", „pe 28 septembrie, la 21:30" (Bucharest time). The week ends at
 * the hour it started, so „mâine" alone was wrong whenever it started in the evening: the last-day
 * message goes out after 09:00 and the pause came the same evening.
 */
export function whenWords(at: Date, now: Date): string {
  const time = BUCHAREST_TIME.format(at);
  const day = BUCHAREST_DAY.format(at);
  if (day === BUCHAREST_DAY.format(now)) return `azi la ${time}`;
  if (day === BUCHAREST_DAY.format(new Date(now.getTime() + DAY_MS))) return `mâine la ${time}`;
  return `pe ${BUCHAREST_DATE.format(at)}, la ${time}`;
}

const capitalized = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** „24,90 lei/lună cu codul V126S", or null when the plan isn't found. */
function priceWords(offer: TeaserOffer | null): string | null {
  if (!offer) return null;
  const price = `${fmtPrice(offer.price, "ro")} lei/lună`;
  return offer.code ? `${price} cu codul ${offer.code}` : price;
}

function priceLine(offer: TeaserOffer | null): string {
  const words = priceWords(offer);
  return words ? `Family: ${words}. Anulezi oricând.` : "Anulezi oricând.";
}

/** Each message says how to stop them (access-messages.ts). */
export const STOP_LINE = `Nu mai vrei aceste mesaje? Le oprești din Setări → Notificări: eTutor.ro/ro${ACCESS_MESSAGES_PAGE.split("#")[0]}`;

export type LifecycleMessage = { title: string; message: string; button: string };

/** Romanian copy for one stage (parents' channels are Romanian, like the other parent alerts). */
export function lifecycleCopy(input: LifecycleCopyInput): LifecycleMessage {
  const copy = stageCopy(input);
  return { ...copy, message: `${copy.message} ${STOP_LINE}` };
}

type LifecycleCopyInput = Parameters<typeof stageCopy>[0];

function stageCopy(input: {
  stage: LifecycleStage;
  daysLeft: number;
  kids: LifecycleKid[];
  offer: TeaserOffer | null;
  /** When the parent's week ends; the launch and last-day messages name the day and hour. */
  endsAt?: Date | null;
  now?: Date;
}): LifecycleMessage {
  const { stage, kids, offer } = input;
  const now = input.now ?? new Date();
  const shown = kids.slice(0, 3);
  const kidsText = shown.length > 0 ? shown.map(kidLine).join(" ") : "Leagă-ți copilul din „Familia mea” ca să vezi ce lucrează.";

  switch (stage) {
    case "launch":
      return {
        title: "7 zile cu tot pachetul Family",
        message:
          `${input.endsAt ? `Până ${whenWords(input.endsAt, now)}, ai` : "Ai 7 zile cu"} tot pachetul Family: remindere pe canalele gratuite, rapoarte și alerte. ` +
          "După aceea, fără abonament, contul intră în pauză. Nimic nu se șterge. " +
          priceLine(offer),
        button: "Vezi pachetul Family",
      };
    case "three_days":
      return {
        title: `Mai ai ${plural(input.daysLeft, "o zi", "zile")} din proba gratuită`,
        message: priceWords(offer)
          ? `${kidsText} Ca să vezi în continuare tot ce lucrează: ${priceWords(offer)}. Anulezi oricând.`
          : `${kidsText} Anulezi oricând.`,
        button: "Continuă cu Family",
      };
    case "last_day": {
      const when = input.endsAt ? whenWords(input.endsAt, now) : null;
      // Only the children whose access ends with the parent's week; none named when no child is linked.
      const stopping = kids.filter((k) => k.pausesWithParent !== false);
      const kidsStop =
        stopping.length === 0
          ? ""
          : stopping.length === 1
            ? `${stopping[0].name?.trim() || "copilul"} nu mai poate exersa, `
            : "copiii nu mai pot exersa, ";
      return {
        title: when ? `Proba gratuită se încheie ${when}` : "Proba gratuită se încheie în curând",
        message:
          `${kidsText} ${when ? capitalized(when) : "Atunci"}, fără abonament, contul intră în pauză: ${kidsStop}` +
          "tu nu mai vezi progresul și nu mai primești alerte. Tot ce s-a lucrat rămâne salvat și revine imediat ce activezi. " +
          priceLine(offer),
        button: "Păstrez accesul",
      };
    }
    case "paused":
      return {
        title: "Contul e în pauză",
        message:
          `Proba gratuită s-a încheiat. ${kidsText} Tot ce s-a lucrat e păstrat și revine imediat ce activezi. ` +
          priceLine(offer),
        button: "Reactivez contul",
      };
  }
}

function bucharestHour(now: Date): number {
  return Number(now.toLocaleString("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", hour12: false }));
}

const PACKAGES_URL = "/dashboard/packages?plan=FAMILY";
/** Longer than a launch run over every existing parent; a run that dies frees it after this. */
const LIFECYCLE_LEASE_MS = 30 * 60_000;

/** Cron: send the messages that are due. Runs under a lease, so two calls can't double-send. */
export async function runAccessLifecycle(now: Date = new Date()): Promise<{ ran: boolean; sent: number }> {
  const pauseStartsAt = await loadPauseStartsAt();
  if (!pauseStartsAt) return { ran: false, sent: 0 };
  const hour = bucharestHour(now);
  if (hour < SEND_FROM_HOUR || hour >= SEND_UNTIL_HOUR) return { ran: false, sent: 0 };

  // A launch run over many parents can be long; the lease outlasts it, and the record written under
  // a lock (below) keeps two runs at once from sending the same message twice.
  const run = await withCronLease("access-lifecycle", LIFECYCLE_LEASE_MS, async () => {
    // Parents who could be in their week or just past it. „Gratuit permanent" and the administrator
    // are left out here; access.ts decides for the rest. Never an account registered as a pupil.
    const recentWindow = new Date(now.getTime() - 11 * DAY_MS);
    const found = await prisma.user.findMany({
      where: {
        isSuperAdmin: false,
        freeForever: false,
        isBanned: false,
        AND: [
          { OR: [{ accountRole: "PARENT" }, { childrenLinks: { some: { relation: "PARENT", status: "active" } } }] },
          { OR: [{ accountRole: null }, { accountRole: { not: "STUDENT" } }] },
        ],
        ...(pauseStartsAt < recentWindow ? { createdAt: { gte: recentWindow } } : {}),
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        childrenLinks: {
          where: { relation: "PARENT", status: "active" },
          select: { child: { select: { id: true, name: true } } },
        },
      },
    });
    // Parents who stopped these messages (access-messages.ts).
    const stopped = new Set(
      found.length === 0
        ? []
        : (
            await prisma.setting.findMany({
              where: { key: ACCESS_MESSAGES_SETTING, userId: { in: found.map((p) => p.id) } },
              select: { userId: true, value: true },
            })
          )
            .filter((s) => accessMessagesOff(s.value))
            .map((s) => s.userId),
    );
    const parents = found.filter(
      (p) =>
        !stopped.has(p.id) &&
        // Test accounts (journey audits, demos) get nothing: no mail to addresses nobody reads.
        !resolveIsTest(p.email) &&
        // Paying for themselves: no access lookup needed, they get no message.
        !isPaidSubscriber(p),
    );

    let sent = 0;
    for (const parent of parents) {
      try {
        const access = await loadAccess(parent.id, now);
        if (!access || access.kind === "full" || access.kind === "free") continue;
        // Another parent's plan already covers the children, without a seat for this one: a price for a
        // second Family would be wrong. The dashboard tells them who has the plan instead.
        if (await loadSeatHolder(parent.id)) continue;
        const windowStart = trialStartOf(parent.createdAt, pauseStartsAt);
        const already = await prisma.notification.findMany({
          where: { userId: parent.id, type: { in: Object.values(LIFECYCLE_TYPE) }, createdAt: { gte: windowStart } },
          select: { type: true },
        });
        const sentStages = new Set(
          (Object.keys(LIFECYCLE_TYPE) as LifecycleStage[]).filter((s) => already.some((a) => a.type === LIFECYCLE_TYPE[s])),
        );
        const stage = dueLifecycleStage({ access, createdAt: parent.createdAt, pauseStartsAt, now, sent: sentStages });
        if (!stage) continue;
        // Not in the parent's quiet hours: wait for a later run rather than record a message nobody got.
        if (await userInQuietHours(parent.id)) continue;

        const statsWindow = { since: windowStart, until: now };
        const endsAt = access.kind === "trial" ? access.endsAt : null;
        const kids = await Promise.all(
          parent.childrenLinks.map(async (l) => {
            const childAccess = endsAt ? await loadAccess(l.child.id, now) : null;
            return {
              name: l.child.name,
              stats: await teaserStats(l.child.id, statsWindow),
              // A child who joined later has a later week of their own, and a covered one never pauses.
              pausesWithParent: !(
                childAccess?.kind === "full" ||
                (childAccess?.kind === "trial" && endsAt !== null && childAccess.endsAt.getTime() > endsAt.getTime())
              ),
            };
          }),
        );
        const copy = lifecycleCopy({
          stage,
          daysLeft: access.kind === "trial" ? access.daysLeft : 0,
          kids,
          offer: await teaserOffer(parent.id, "FAMILY"),
          endsAt,
          now,
        });

        // The in-app record first: it is also what keeps the next run from sending it again. Written
        // under a lock on the parent's row, so a second run at the same time waits here and then
        // finds it instead of writing (and sending) it again.
        const recorded = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${parent.id} FOR NO KEY UPDATE`;
          const twice = await tx.notification.findFirst({
            where: { userId: parent.id, type: LIFECYCLE_TYPE[stage], createdAt: { gte: windowStart } },
            select: { id: true },
          });
          if (twice) return false;
          await tx.notification.create({
            data: {
              userId: parent.id,
              type: LIFECYCLE_TYPE[stage],
              title: copy.title,
              message: copy.message,
              metadata: { stage, trialEndsAt: endsAt ? endsAt.toISOString() : null, url: PACKAGES_URL },
            },
          });
          return true;
        });
        if (!recorded) continue;
        await deliverParentAlert(parent.id, copy.title, copy.message, 0, { url: PACKAGES_URL, label: copy.button });
        sent++;
      } catch (err) {
        console.error("access lifecycle message failed", parent.id, err);
      }
    }
    return sent;
  });

  return run.ran ? { ran: true, sent: run.result } : { ran: false, sent: 0 };
}
