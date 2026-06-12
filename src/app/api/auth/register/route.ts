import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { attributeReferral, grantWelcomeVoucher, REFERRAL_COOKIE } from "@/lib/referral";
import { logger } from "@/lib/logger";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  domainSlug: z.string().optional(), // legacy single-select
  domainSlugs: z.array(z.string()).optional(), // multi-select
  voucherCode: z.string().min(1).max(50).optional(), // campaign links (?voucher=)
});

async function _POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, domainSlug, domainSlugs, voucherCode } = parsed.data;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // Create user
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      emailVerified: new Date(), // Auto-verify for credentials signup
    },
  });

  // Auto-enroll in selected domain(s) as STUDENT. Supports multi-select
  // (domainSlugs[]) and the legacy single domainSlug.
  const slugs = Array.from(
    new Set([...(domainSlugs ?? []), ...(domainSlug ? [domainSlug] : [])])
  );
  let enrolledCount = 0;
  if (slugs.length) {
    const found = await prisma.domain.findMany({
      where: { slug: { in: slugs } },
      select: { id: true },
    });
    if (found.length) {
      await prisma.enrollment.createMany({
        data: found.map((d) => ({ userId: user.id, domainId: d.id, roles: ["STUDENT"] as const })),
        skipDuplicates: true,
      });
      enrolledCount = found.length;
    }
  }

  // ─── Campaign voucher (best-effort — never blocks signup) ───
  // 100% voucher → redeem atomically + activate subscription (same semantics as
  // POST /api/activate, including the ≥1 enrolled subject requirement). < 100%
  // voucher → NOT redeemed here (it applies at payment time); the client routes
  // the user to /dashboard/activare with the code prefilled.
  let voucherApplied = false;
  let voucherDiscount: number | null = null;
  if (voucherCode && enrolledCount > 0) {
    try {
      const code = voucherCode.toUpperCase();
      await prisma.$transaction(async (tx) => {
        const voucher = await tx.voucher.findUnique({ where: { code } });
        if (!voucher || !voucher.isActive) return;
        if (voucher.expiresAt && voucher.expiresAt < new Date()) return;
        if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) return;
        if (voucher.discountPercent < 100) {
          // Reported to the client so the success screen can say "applies at payment".
          voucherDiscount = voucher.discountPercent;
          return;
        }

        await tx.voucher.update({
          where: {
            id: voucher.id,
            ...(voucher.maxUses !== null ? { usedCount: { lt: voucher.maxUses } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        const endsAt = new Date();
        endsAt.setFullYear(endsAt.getFullYear() + 1);
        await tx.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "active", subscriptionEndsAt: endsAt },
        });
        voucherApplied = true;
      });
    } catch (err) {
      logger.error("Signup voucher apply failed", err, { userId: user.id });
    }
  }

  // ─── Referral attribution (best-effort — never blocks signup) ───
  const refCode = req.cookies.get(REFERRAL_COOKIE)?.value;
  if (refCode) {
    try {
      const result = await attributeReferral({ referredUserId: user.id, code: refCode });
      if (result.created && result.promoterId) {
        await grantWelcomeVoucher({ referredUserId: user.id, promoterId: result.promoterId });
      }
    } catch (err) {
      logger.error("Referral attribution failed", err, { userId: user.id });
    }
  }

  // ─── Lazy-save: claim the demo Magic Quiz into the new account (best-effort) ───
  const demoQuizId = req.cookies.get("tutor_demo_quiz")?.value;
  if (demoQuizId) {
    try {
      // Only claim an unclaimed, still-valid quiz.
      await prisma.magicQuiz.updateMany({
        where: { id: demoQuizId, userId: null },
        data: { userId: user.id },
      });
    } catch (err) {
      logger.error("Demo quiz claim failed", err, { userId: user.id });
    }
  }

  const res = NextResponse.json({
    success: true,
    message: "Account created. You can now sign in.",
    voucherApplied,
    voucherDiscount,
  }, { status: 201 });

  // Consume the one-shot cookies regardless of outcome.
  if (refCode) {
    res.cookies.set(REFERRAL_COOKIE, "", { path: "/", maxAge: 0 });
  }
  if (demoQuizId) {
    res.cookies.set("tutor_demo_quiz", "", { path: "/", maxAge: 0 });
  }
  return res;
}

export const POST = withErrorHandler(_POST);
