/**
 * parent-landing.ts — the facts the parents' page (/parinte) shows, computed rather than typed.
 *
 * Alex's decisions of 16.09.2026: every visitor sees the „cât o cafea" offer; the code differs by
 * channel so the flyer and the site can be measured apart — V126S for people who came from the
 * flyer (eTutor.ro/cafea), ONV126S for everyone else, same conditions. Both codes are read from
 * the database before anything is shown: once a code has expired (30.11.2026) the page stops
 * advertising the discount by itself, with no deploy.
 *
 * The reminder chain comes from the engine's own ladder, filtered by what this server can send,
 * so the page can't promise a channel that is off (it used to say „WhatsApp" only while the
 * server sent on Telegram, email and SMS too).
 *
 * Pure (no DB): the page loads the rows and calls these.
 */
import type { EscalationChannel } from "@prisma/client";
import type { EscalationLevel } from "@/lib/escalation/config";
import type { ServerChannelAvailability } from "@/lib/escalation/channel-availability";
import {
  discountedMinorUnits,
  normalizeVoucherCode,
  previewAppliesToPlan,
  previewVoucher,
  type VoucherForCheckout,
} from "@/lib/voucher-checkout";

/** Campaign name stamped by /cafea (see src/app/cafea/route.ts). */
export const FLYER_CAMPAIGN = "flyer-cafea";

type Env = Record<string, string | undefined>;

/** The code printed on the flyer. Same env as /cafea, so a reprint with a new code needs no deploy. */
export function flyerVoucherCode(env: Env = process.env): string {
  return normalizeVoucherCode(env.CAFEA_VOUCHER) || "V126S";
}

/** The site's own code — same conditions as the flyer's, measured separately. */
export function onlineVoucherCode(env: Env = process.env): string {
  return normalizeVoucherCode(env.PARENT_ONLINE_VOUCHER) || "ONV126S";
}

export type LandingChannel = "flyer" | "site";

/**
 * Came from the flyer? Either the QR link's code is still in the URL, or /cafea's campaign
 * cookie says so (the parent opened the page again later, without the query string).
 */
export function resolveLandingChannel(input: {
  voucherParam?: string | string[] | null;
  campaign?: string | null;
  flyerCode: string;
  onlineCode: string;
}): { channel: LandingChannel; code: string } {
  const param = Array.isArray(input.voucherParam) ? input.voucherParam[0] : input.voucherParam;
  if (normalizeVoucherCode(param) === input.flyerCode || input.campaign === FLYER_CAMPAIGN) {
    return { channel: "flyer", code: input.flyerCode };
  }
  return { channel: "site", code: input.onlineCode };
}

/**
 * The code a signed-in parent is offered (a visitor without an account keeps resolveLandingChannel's).
 *
 * - The code kept on the account wins over how they reached the page: signup forgets the flyer's
 *   cookie, so a flyer parent who comes back through the site's menu would otherwise pay with
 *   ONV126S and overwrite the V126S kept since signup.
 * - A code this account has already used is swapped for the other one: each works once per
 *   account and the two are the same offer (Alex, 16.09.2026). Both used → no code.
 *
 * The channel stays the one they came through (the flyer's steps, the flyer's wording); `swapped`
 * tells the page not to call the other code „the one from the flyer" or „the online one".
 */
export function pickLandingCode(input: {
  channel: LandingChannel;
  flyerCode: string;
  onlineCode: string;
  pendingCode?: string | null;
  usedCodes?: ReadonlySet<string>;
}): { channel: LandingChannel; code: string | null; swapped: boolean } {
  const used = input.usedCodes ?? new Set<string>();
  const kept = normalizeVoucherCode(input.pendingCode);
  const channel: LandingChannel =
    kept === input.flyerCode ? "flyer" : kept === input.onlineCode ? "site" : input.channel;
  const own = channel === "flyer" ? input.flyerCode : input.onlineCode;
  const other = channel === "flyer" ? input.onlineCode : input.flyerCode;
  if (!used.has(own)) return { channel, code: own, swapped: false };
  if (!used.has(other)) return { channel, code: other, swapped: true };
  return { channel, code: null, swapped: false };
}

export type LandingOffer = {
  code: string;
  percentOff: number;
  recurring: boolean;
  expiresAt: Date | null;
  normalMinor: number;
  discountedMinor: number;
};

/**
 * The discount the hero may promise on Family, or null (then the page shows the normal price and
 * no code). A code is promised only when checkout would accept it on Family for a new account.
 */
export function familyLandingOffer(
  voucher: (VoucherForCheckout & { code: string }) | null,
  familyPriceMinor: number | null,
  now: Date = new Date(),
): LandingOffer | null {
  if (familyPriceMinor === null || familyPriceMinor <= 0) return null;
  const check = previewVoucher(voucher, { alreadyUsedByUser: false, now });
  if (!check.ok || !previewAppliesToPlan(check.preview, "FAMILY")) return null;
  return {
    code: check.preview.code,
    percentOff: check.preview.discountPercent,
    recurring: check.preview.recurring,
    expiresAt: check.preview.expiresAt,
    normalMinor: familyPriceMinor,
    discountedMinor: discountedMinorUnits(familyPriceMinor, check.preview.discountPercent),
  };
}

/**
 * Where the page's buttons go. Signup carries the plan and the code; `start=free` is the
 * no-card path (the account is created, the parent goes on to add the child, pays later).
 */
export function landingSignupHref(
  locale: "ro" | "en",
  opts: { code: string | null; start?: "pay" | "free" },
): string {
  const q = new URLSearchParams({ plan: "FAMILY" });
  if (opts.code) q.set("voucher", opts.code);
  if (opts.start === "free") q.set("start", "free");
  return `/${locale}/auth/register?${q.toString()}`;
}

/**
 * The page's two buttons for this visitor. Someone already signed in has no use for the signup
 * form (it used to send them there and lose the code): paying goes straight to Abonament, with
 * Family and the code preselected, and trying goes to the family page, where the child is added.
 */
export function landingButtonHrefs(
  locale: "ro" | "en",
  opts: { code: string | null; signedIn: boolean },
): { pay: string; free: string } {
  if (!opts.signedIn) {
    return {
      pay: landingSignupHref(locale, { code: opts.code }),
      free: landingSignupHref(locale, { code: opts.code, start: "free" }),
    };
  }
  const q = new URLSearchParams({ plan: "FAMILY" });
  if (opts.code) q.set("voucher", opts.code);
  return { pay: `/${locale}/dashboard/packages?${q.toString()}`, free: `/${locale}/dashboard/family` };
}

/** Channels a free account also gets; the others are paid for per message (see plan-channels.ts). */
const METERED: ReadonlySet<EscalationChannel> = new Set<EscalationChannel>(["WHATSAPP", "SMS"]);

export type ChainStep = {
  channel: EscalationChannel;
  paid: boolean;
  maxPerDay?: number;
};

/** The engine's ladder as the page shows it: only channels this server can send on. */
export function reminderChainForDisplay(
  levels: readonly EscalationLevel[],
  available: ServerChannelAvailability,
): ChainStep[] {
  const on: Record<EscalationChannel, boolean> = {
    PUSH: true,
    TELEGRAM: available.telegram,
    EMAIL: available.email,
    WHATSAPP: available.whatsapp,
    SMS: available.sms,
    CALL: false,
  };
  // No minutes here: a study reminder waits by its time of day (CASCADE_GRACE_MINUTES), not by the
  // ladder's delayMinutes, so the page takes the wait from there (see chainStepTiming).
  return levels
    .filter((l) => on[l.channel])
    .map((l) => ({
      channel: l.channel,
      paid: METERED.has(l.channel),
      ...(l.maxPerDay != null ? { maxPerDay: l.maxPerDay } : {}),
    }));
}
