/**
 * Campaign conversion tracking — UTM + per-voucher attribution.
 *
 * Flow (mirrors the referral cookie pattern):
 *   1. A marketing short-link (/evaluare, /bac, or any URL with utm_* params)
 *      stamps a one-shot `tutor_campaign` cookie with the attribution.
 *   2. On signup, the register API reads the cookie and writes a CampaignSignup
 *      row linked to the new user (isTest-stamped so synthetic accounts don't
 *      pollute conversion stats), then clears the cookie.
 *   3. Activation (100% voucher at signup, /api/activate, or Stripe) is reflected
 *      either via `activatedAt` or — robustly — by joining the attributed user's
 *      live subscription status at report time.
 *
 * The serialize/parse/summarize helpers are pure so they're unit-testable.
 */

import { prisma } from "@/lib/prisma";
import { resolveIsTest } from "@/lib/notifications/test-account";
import { logger } from "@/lib/logger";

/** One-shot attribution cookie set by marketing landing routes. */
export const CAMPAIGN_COOKIE = "tutor_campaign";

/** 30 days — long enough to survive a register-later visit, short enough to expire. */
export const CAMPAIGN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const FIELD_MAX = 200;

export interface CampaignAttribution {
  campaign?: string;
  voucher?: string;
  landingPath?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

const ATTR_KEYS: (keyof CampaignAttribution)[] = [
  "campaign",
  "voucher",
  "landingPath",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
  "utmTerm",
];

function clean(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, FIELD_MAX);
  return t.length ? t : undefined;
}

/** Compact, length-capped JSON for the cookie value. Empty attribution → "". */
export function serializeAttribution(a: CampaignAttribution): string {
  const out: Record<string, string> = {};
  for (const k of ATTR_KEYS) {
    const c = clean(a[k]);
    if (c) out[k] = c;
  }
  return Object.keys(out).length ? JSON.stringify(out) : "";
}

/** Safe parse of the cookie value — never throws; whitelists + caps fields. */
export function parseAttribution(raw: string | undefined | null): CampaignAttribution | null {
  if (!raw) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const src = obj as Record<string, unknown>;
  const out: CampaignAttribution = {};
  for (const k of ATTR_KEYS) {
    const c = clean(src[k]);
    if (c) out[k] = c;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Build attribution from a landing URL's query params. `campaign` defaults to
 * the explicit `campaign` param, else `utm_campaign`. Pass an explicit
 * `defaults` (e.g. campaign + voucher from the /evaluare route) to seed it.
 */
export function attributionFromParams(
  params: URLSearchParams,
  landingPath: string,
  defaults: CampaignAttribution = {}
): CampaignAttribution {
  const g = (k: string) => clean(params.get(k) ?? undefined);
  const attr: CampaignAttribution = {
    landingPath,
    ...defaults,
    campaign: defaults.campaign ?? g("campaign") ?? g("utm_campaign"),
    voucher: defaults.voucher ?? g("voucher"),
    utmSource: g("utm_source") ?? defaults.utmSource,
    utmMedium: g("utm_medium") ?? defaults.utmMedium,
    utmCampaign: g("utm_campaign") ?? defaults.utmCampaign,
    utmContent: g("utm_content") ?? defaults.utmContent,
    utmTerm: g("utm_term") ?? defaults.utmTerm,
  };
  // Drop empties so serialize stays compact.
  for (const k of ATTR_KEYS) if (!attr[k]) delete attr[k];
  return attr;
}

/**
 * Persist a CampaignSignup for a freshly registered user. Best-effort — a
 * tracking write must never block or fail signup. Idempotent per user (unique
 * userId; duplicate calls are swallowed).
 */
export async function recordCampaignSignup(
  userId: string,
  email: string | null | undefined,
  attr: CampaignAttribution,
  opts: { activated?: boolean } = {}
): Promise<void> {
  try {
    await prisma.campaignSignup.create({
      data: {
        userId,
        isTest: resolveIsTest(email),
        campaign: attr.campaign ?? null,
        voucherCode: attr.voucher ?? null,
        landingPath: attr.landingPath ?? null,
        utmSource: attr.utmSource ?? null,
        utmMedium: attr.utmMedium ?? null,
        utmCampaign: attr.utmCampaign ?? null,
        utmContent: attr.utmContent ?? null,
        utmTerm: attr.utmTerm ?? null,
        activatedAt: opts.activated ? new Date() : null,
      },
    });
  } catch (err) {
    logger.error("Campaign signup record failed", err, { userId });
  }
}

/**
 * Stamp `activatedAt` on a user's campaign attribution when they convert
 * (voucher redemption / Stripe). Best-effort, only fills the first activation.
 */
export async function markCampaignActivated(userId: string): Promise<void> {
  try {
    await prisma.campaignSignup.updateMany({
      where: { userId, activatedAt: null },
      data: { activatedAt: new Date() },
    });
  } catch (err) {
    logger.error("Campaign activation mark failed", err, { userId });
  }
}

// ─── Reporting (pure) ───

export interface CampaignReportRow {
  campaign: string | null;
  voucherCode: string | null;
  /** Converted = the attributed user is currently a paying/trialing subscriber. */
  converted: boolean;
}

export interface CampaignReportBucket {
  key: string;
  signups: number;
  converted: number;
  /** 0..1, rounded to 4 decimals. 0 when no signups. */
  conversionRate: number;
}

export interface CampaignReport {
  byCampaign: CampaignReportBucket[];
  byVoucher: CampaignReportBucket[];
  totals: { signups: number; converted: number; conversionRate: number };
}

const DIRECT = "(direct)";
const NO_VOUCHER = "(none)";

function bucketize(
  rows: CampaignReportRow[],
  keyOf: (r: CampaignReportRow) => string
): CampaignReportBucket[] {
  const map = new Map<string, { signups: number; converted: number }>();
  for (const r of rows) {
    const key = keyOf(r);
    const b = map.get(key) ?? { signups: 0, converted: 0 };
    b.signups += 1;
    if (r.converted) b.converted += 1;
    map.set(key, b);
  }
  return Array.from(map.entries())
    .map(([key, b]) => ({
      key,
      signups: b.signups,
      converted: b.converted,
      conversionRate: b.signups ? Math.round((b.converted / b.signups) * 1e4) / 1e4 : 0,
    }))
    .sort((a, b) => b.signups - a.signups || a.key.localeCompare(b.key));
}

/** Aggregate attributed signups into per-campaign + per-voucher funnel buckets. */
export function summarizeCampaignSignups(rows: CampaignReportRow[]): CampaignReport {
  const signups = rows.length;
  const converted = rows.reduce((n, r) => n + (r.converted ? 1 : 0), 0);
  return {
    byCampaign: bucketize(rows, (r) => r.campaign || DIRECT),
    byVoucher: bucketize(rows, (r) => r.voucherCode || NO_VOUCHER),
    totals: {
      signups,
      converted,
      conversionRate: signups ? Math.round((converted / signups) * 1e4) / 1e4 : 0,
    },
  };
}
