import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { isPaidSubscriber } from "@/lib/escalation/segmentation";
import {
  summarizeCampaignSignups,
  type CampaignReportRow,
} from "@/lib/campaign-attribution";

/**
 * GET /api/admin/campaigns — SuperAdmin campaign conversion funnel.
 *
 * Aggregates real (non-test) campaign-attributed signups into per-campaign and
 * per-voucher buckets. "Converted" is read LIVE from the attributed user's
 * subscription status (active/trialing & unexpired) so it captures conversions
 * from any path — signup voucher, /api/activate, or Stripe — without coupling to
 * a write-site.
 */
async function _GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const signups = await prisma.campaignSignup.findMany({
    where: { isTest: false },
    select: {
      campaign: true,
      voucherCode: true,
      user: { select: { subscriptionStatus: true, subscriptionEndsAt: true } },
    },
  });

  const rows: CampaignReportRow[] = signups.map((s) => ({
    campaign: s.campaign,
    voucherCode: s.voucherCode,
    converted: isPaidSubscriber(s.user),
  }));

  return NextResponse.json(summarizeCampaignSignups(rows));
}

export const GET = withErrorHandler(_GET);
