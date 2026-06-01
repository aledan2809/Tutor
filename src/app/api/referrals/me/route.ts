export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { getReferralStats } from "@/lib/referral";

// Current user's referral stats: code, share URL, counts, earnings, list.
// Also returns the two-sided welcome voucher if this user was themselves referred.
async function _GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getReferralStats(session.user.id);

  const welcome = await prisma.setting.findUnique({
    where: { userId_key: { userId: session.user.id, key: "referral_welcome_voucher" } },
    select: { value: true },
  });

  return NextResponse.json({ ...stats, welcomeVoucher: welcome?.value ?? null });
}

export const GET = withErrorHandler(_GET);
