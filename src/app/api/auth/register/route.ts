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
  domainSlug: z.string().optional(),
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

  const { name, email, password, domainSlug } = parsed.data;

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

  // Auto-enroll in selected domain as STUDENT
  if (domainSlug) {
    const domain = await prisma.domain.findUnique({
      where: { slug: domainSlug },
    });
    if (domain) {
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          domainId: domain.id,
          roles: ["STUDENT"],
        },
      });
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

  const res = NextResponse.json({
    success: true,
    message: "Account created. You can now sign in.",
  }, { status: 201 });

  // Consume the referral cookie regardless of outcome (one-shot attribution).
  if (refCode) {
    res.cookies.set(REFERRAL_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return res;
}

export const POST = withErrorHandler(_POST);
