import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

/**
 * POST /api/activate — voucher-based activation (no Stripe needed for 100% vouchers).
 *
 * Body: { voucherCode, domainSlugs[] }
 *  - 100% voucher  → enroll the user in the chosen subjects (STUDENT) + set
 *    subscriptionStatus="active" (1 year) + atomically redeem the voucher. Access granted.
 *  - < 100% voucher → returns { requiresPayment, discountPercent } so the UI can route to
 *    the card/Stripe checkout (dormant until Stripe keys are configured).
 *
 * This is the "checkout up to payment → voucher cancels the amount → access" flow for
 * the no-Stripe (100%) case. Real card payment stays on /api/admin/stripe/checkout.
 */
const schema = z.object({
  voucherCode: z.string().min(1).max(50),
  domainSlugs: z.array(z.string()).min(1),
});

async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  const code = parsed.data.voucherCode.toUpperCase();
  const userId = session.user.id;

  // Resolve chosen subjects to real, active domains
  const domains = await prisma.domain.findMany({
    where: { slug: { in: parsed.data.domainSlugs }, isActive: true },
    select: { id: true, slug: true, name: true },
  });
  if (domains.length === 0) {
    return NextResponse.json({ error: "Nicio materie validă selectată" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUnique({ where: { code } });
    if (!voucher || !voucher.isActive) return { error: "Voucher inexistent sau inactiv", status: 404 };
    if (voucher.expiresAt && voucher.expiresAt < new Date()) return { error: "Voucher expirat", status: 400 };
    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses)
      return { error: "Voucher epuizat (limită de utilizări atinsă)", status: 400 };

    // < 100% → needs the Stripe card flow (not handled here)
    if (voucher.discountPercent < 100) {
      return { requiresPayment: true, discountPercent: voucher.discountPercent };
    }

    // 100% → redeem atomically (guard against races on maxUses)
    await tx.voucher.update({
      where: {
        id: voucher.id,
        ...(voucher.maxUses !== null ? { usedCount: { lt: voucher.maxUses } } : {}),
      },
      data: { usedCount: { increment: 1 } },
    });

    // Enroll in chosen subjects (idempotent via composite unique)
    for (const d of domains) {
      await tx.enrollment.upsert({
        where: { userId_domainId: { userId, domainId: d.id } },
        create: { userId, domainId: d.id, roles: ["STUDENT"], isActive: true },
        update: { isActive: true },
      });
    }

    // Mark subscription active (1 year — tester/grandfathered access)
    const endsAt = new Date();
    endsAt.setFullYear(endsAt.getFullYear() + 1);
    await tx.user.update({
      where: { id: userId },
      data: { subscriptionStatus: "active", subscriptionEndsAt: endsAt },
    });

    return {
      success: true,
      status: "active",
      activated: domains.map((d) => d.name),
      voucherCode: voucher.code,
    };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status as number });
  }
  if ("requiresPayment" in result) {
    return NextResponse.json(result);
  }
  return NextResponse.json(result);
}

export const POST = withErrorHandler(_POST);
