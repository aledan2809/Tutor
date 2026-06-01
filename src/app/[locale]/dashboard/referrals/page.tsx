import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getReferralStats } from "@/lib/referral";
import { prisma } from "@/lib/prisma";
import { ReferralsClient } from "./referrals-client";

export const metadata: Metadata = {
  title: "Invite & Earn - Tutor",
  description: "Invite others and earn a perpetual 50% commission on every subscription.",
};

export const dynamic = "force-dynamic";

export default async function ReferralsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const stats = await getReferralStats(session.user.id);
  const welcome = await prisma.setting.findUnique({
    where: { userId_key: { userId: session.user.id, key: "referral_welcome_voucher" } },
    select: { value: true },
  });

  return (
    <ReferralsClient
      locale={locale}
      stats={stats}
      welcomeVoucher={(welcome?.value as { code: string; discountPercent: number } | null) ?? null}
    />
  );
}
