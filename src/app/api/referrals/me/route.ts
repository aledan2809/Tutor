export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { getReferralStats } from "@/lib/referral";
import { loadConsentFacts } from "@/lib/parent-consent-server";
import { mayShowPrices } from "@/lib/price-visibility";

// Current user's referral stats: code, share URL, counts, earnings, list.
// Also returns the two-sided welcome voucher if this user was themselves referred.
async function _GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // A money commission: not for a learner who may be a minor (before the stats, which create the link).
  const facts = await loadConsentFacts(session.user.id);
  if (!facts || !mayShowPrices(facts)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stats = await getReferralStats(session.user.id);

  const welcome = await prisma.setting.findUnique({
    where: { userId_key: { userId: session.user.id, key: "referral_welcome_voucher" } },
    select: { value: true },
  });

  return NextResponse.json({ ...stats, welcomeVoucher: welcome?.value ?? null });
}

export const GET = withErrorHandler(_GET);
