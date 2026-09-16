import type { Metadata } from "next";
import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CAMPAIGN_COOKIE, parseAttribution } from "@/lib/campaign-attribution";
import {
  CASCADE_GRACE_MINUTES,
  ESCALATION_LEVELS,
  ESCALATION_PRESETS,
  NUDGE_MAX_AGE_HOURS,
  ON_TIME_WINDOW_MIN,
  PARENT_ALERT_STALL_MIN,
  PARENT_RENOTIFY_MIN,
  QUIET_HOURS_DEFAULT,
} from "@/lib/escalation/config";
import { serverChannelAvailability } from "@/lib/escalation/channel-availability";
import { FAMILY_INVITE_TTL_DAYS, FAMILY_PLANS, childDiscountPercent, type FamilyPlanKey } from "@/lib/family";
import { FREE_TRIAL_DAYS, checkoutTrialDays } from "@/lib/free-trial";
import { fmtPrice } from "@/lib/pricing";
import {
  familyLandingOffer,
  flyerVoucherCode,
  landingButtonHrefs,
  onlineVoucherCode,
  reminderChainForDisplay,
  resolveLandingChannel,
} from "@/lib/parent-landing";
import { landingCopy, landingMeta, type LandingFacts } from "@/components/parinte/landing-copy";
import { ParentLanding, type OtherPlanRow } from "@/components/parinte/parent-landing";

/**
 * /parinte — the page the flyer „cât o cafea" leads to (eTutor.ro/cafea redirects here) and the
 * site's page for parents. Rewritten 16.09.2026 from the approved mockup
 * (Reports/landing-parinte-cafea-2026-09-16): everyone sees the coffee offer, with the flyer's code
 * (V126S) for flyer visitors and the site's code (ONV126S) for everyone else.
 *
 * Nothing on it is typed by hand that the app knows better: channels and minutes come from the
 * engine, prices and the codes' conditions from the database, the free days from the trial rule
 * and the Family plan. Reading cookies + the database makes the page dynamic, which is what an
 * offer with an end date needs.
 */
export const dynamic = "force-dynamic";

const OTHER_PLAN_KEYS: FamilyPlanKey[] = ["FAMILY_DUO", "TRIO", "FAMILY_TRIO"];
const OG_IMAGE = "/images/parinte/og-parinte.jpg";

/** Shared by the page and its metadata within one request. */
const loadMonthlyFamilyPlans = cache(() =>
  prisma.subscriptionPlan.findMany({
    where: { isActive: true, interval: "MONTH", familyPlanKey: { in: ["FAMILY", ...OTHER_PLAN_KEYS] } },
    select: { familyPlanKey: true, name: true, price: true, trialDays: true },
    orderBy: { price: "asc" },
  }),
);

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lp = locale === "en" ? "en" : "ro";
  const family = (await loadMonthlyFamilyPlans()).find((p) => p.familyPlanKey === "FAMILY") ?? null;
  // Link previews are fetched without a session: describe what a new account gets.
  const meta = landingMeta(lp, family ? checkoutTrialDays(family.trialDays, new Date()) : 0);
  const url = `/${lp}/parinte`;
  return {
    // Absolute: the root layout's template would append „| Tutor" to a title that already names eTutor.ro.
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "eTutor.ro",
      locale: lp === "en" ? "en_GB" : "ro_RO",
      url,
      title: meta.title,
      description: meta.description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: meta.imageAlt }],
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description, images: [OG_IMAGE] },
  };
}

export default async function ParintePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const lp = locale === "en" ? "en" : "ro";

  const flyerCode = flyerVoucherCode();
  const onlineCode = onlineVoucherCode();
  const campaign = parseAttribution((await cookies()).get(CAMPAIGN_COOKIE)?.value)?.campaign ?? null;
  const { channel, code: channelCode } = resolveLandingChannel({
    voucherParam: query.voucher,
    campaign,
    flyerCode,
    onlineCode,
  });

  const session = await auth();
  const signedInUserId = session?.user?.id ?? null;

  const [vouchers, plans, account] = await Promise.all([
    prisma.voucher.findMany({
      where: { code: { in: [flyerCode, onlineCode] } },
      select: {
        id: true,
        code: true,
        discountPercent: true,
        isActive: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        recurring: true,
        oncePerUser: true,
        planKey: true,
      },
    }),
    loadMonthlyFamilyPlans(),
    signedInUserId ? prisma.user.findUnique({ where: { id: signedInUserId }, select: { createdAt: true } }) : null,
  ]);

  const family = plans.find((p) => p.familyPlanKey === "FAMILY") ?? null;
  const now = new Date();
  const voucherFor = (code: string) => vouchers.find((v) => v.code === code) ?? null;
  const offer = familyLandingOffer(voucherFor(channelCode), family?.price ?? null, now);

  // Both codes live and on identical terms → the page may say the flyer's and the site's are the same deal.
  const flyerOffer = familyLandingOffer(voucherFor(flyerCode), family?.price ?? null, now);
  const onlineOffer = familyLandingOffer(voucherFor(onlineCode), family?.price ?? null, now);
  const fv = voucherFor(flyerCode);
  const ov = voucherFor(onlineCode);
  const codesAlike = Boolean(
    flyerOffer &&
      onlineOffer &&
      fv &&
      ov &&
      fv.discountPercent === ov.discountPercent &&
      fv.recurring === ov.recurring &&
      fv.oncePerUser === ov.oncePerUser &&
      fv.planKey === ov.planKey &&
      (fv.expiresAt?.getTime() ?? null) === (ov.expiresAt?.getTime() ?? null),
  );

  // What checkout would give this visitor: a new account gets the Family plan's free days (at most
  // FREE_TRIAL_DAYS); a signed-in account gets what is left of its own.
  const signedIn = Boolean(account);
  const freeTrialDays = family ? checkoutTrialDays(family.trialDays, account?.createdAt ?? now, now) : 0;

  const facts: LandingFacts = {
    freeTrialDays,
    trialTotalDays: FREE_TRIAL_DAYS,
    chain: reminderChainForDisplay(ESCALATION_LEVELS, serverChannelAvailability(process.env)),
    graceMorningMin: CASCADE_GRACE_MINUTES.morning,
    graceEveningMin: CASCADE_GRACE_MINUTES.evening,
    quietStart: QUIET_HOURS_DEFAULT.start,
    quietEnd: QUIET_HOURS_DEFAULT.end,
    gentleEmailAfterMin: ESCALATION_PRESETS.BLAND[1]?.delayMinutes ?? 0,
    standardStepMin: ESCALATION_PRESETS.STANDARD[1]?.delayMinutes ?? 0,
    insistentStepMin: ESCALATION_PRESETS.INSISTENT[1]?.delayMinutes ?? 0,
    parentAlertAfterMin: PARENT_ALERT_STALL_MIN,
    parentRenotifyMin: PARENT_RENOTIFY_MIN,
    nudgeMaxAgeHours: NUDGE_MAX_AGE_HOURS,
    onTimeWindowMin: ON_TIME_WINDOW_MIN,
    inviteValidDays: FAMILY_INVITE_TTL_DAYS,
    secondChildPct: childDiscountPercent(2),
    thirdChildPct: childDiscountPercent(3),
  };

  const copy = landingCopy(lp, {
    facts,
    offer,
    channel,
    familyNormalMinor: family?.price ?? null,
    codesAlike,
    flyerCode,
    onlineCode,
    codeFamilyOnly: voucherFor(channelCode)?.planKey === "FAMILY",
    signedIn,
  });

  const otherPlans: OtherPlanRow[] = OTHER_PLAN_KEYS.flatMap((key) => {
    const plan = plans.find((p) => p.familyPlanKey === key);
    if (!plan) return [];
    const seats = FAMILY_PLANS[key];
    return [
      {
        key,
        name: plan.name,
        seats: copy.offer.seats(seats.maxParents, seats.maxChildren, seats.features.tutorAccess ? seats.maxTutors : 0),
        price: fmtPrice(plan.price / 100, lp),
      },
    ];
  });

  const code = offer?.code ?? null;
  const hrefs = landingButtonHrefs(lp, { code, signedIn });
  return (
    <ParentLanding
      locale={lp}
      copy={copy}
      facts={facts}
      channel={channel}
      code={code}
      payHref={hrefs.pay}
      freeHref={hrefs.free}
      otherPlans={otherPlans}
    />
  );
}
