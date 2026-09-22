import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { withErrorHandler } from "@/lib/api-handler";
import { loadAccess } from "@/lib/access-server";

async function _GET(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  // Every row also reads the account's access: a page stays small whatever the query asks for.
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
  const search = searchParams.get("search") || "";
  const onlyFreeForever = searchParams.get("freeForever") === "1";
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            // Also by code: typing V126S answers „who used this code" without leaving the list.
            { voucherRedemptions: { some: { voucher: { code: { contains: search, mode: "insensitive" as const } } } } },
            { pendingVoucherCode: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(onlyFreeForever ? { freeForever: true } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isSuperAdmin: true,
        isBanned: true,
        bannedReason: true,
        subscriptionStatus: true,
        subscriptionPlanId: true,
        subscriptionEndsAt: true,
        // Only whether a card pays it: the subscription's id has no business leaving the server.
        stripeSubscriptionId: true,
        // A code kept on the account since signup, not used yet.
        pendingVoucherCode: true,
        freeForever: true,
        createdAt: true,
        // The code this account used (the free year, or the discount at the card payment): what it was
        // and when. The first use is the one kept (api/activate, api/stripe/callback).
        voucherRedemptions: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { createdAt: true, voucher: { select: { code: true, discountPercent: true } } },
        },
        enrollments: {
          select: {
            roles: true,
            domain: { select: { id: true, name: true, slug: true } },
          },
        },
        subscriptionPlan: { select: { name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // How long a kept code is still good for — one read for the whole page.
  const keptCodes = [...new Set(users.flatMap((u) => (u.pendingVoucherCode ? [u.pendingVoucherCode] : [])))];
  const keptVouchers = keptCodes.length
    ? await prisma.voucher.findMany({
        where: { code: { in: keptCodes } },
        select: { code: true, discountPercent: true, expiresAt: true, isActive: true },
      })
    : [];
  const keptByCode = new Map(keptVouchers.map((v) => [v.code, v]));

  // What each listed account gets right now (trial day, pause, paid…): one page, so a handful of reads.
  const withAccess = await Promise.all(
    users.map(async ({ stripeSubscriptionId, voucherRedemptions, pendingVoucherCode, ...u }) => ({
      ...u,
      access: await loadAccess(u.id),
      paysByCard: stripeSubscriptionId !== null,
      // The code behind this account's access — „who got what, from which code, until when".
      voucherUsed: voucherRedemptions[0]
        ? { code: voucherRedemptions[0].voucher.code, percent: voucherRedemptions[0].voucher.discountPercent, at: voucherRedemptions[0].createdAt }
        : null,
      voucherKept: pendingVoucherCode
        ? {
            code: pendingVoucherCode,
            percent: keptByCode.get(pendingVoucherCode)?.discountPercent ?? null,
            expiresAt: keptByCode.get(pendingVoucherCode)?.expiresAt ?? null,
            gone: !keptByCode.get(pendingVoucherCode)?.isActive,
          }
        : null,
    })),
  );

  return NextResponse.json({ users: withAccess, total, page, totalPages: Math.ceil(total / limit) });
}

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  // Note: platform "admin" is granted per-domain via the Enroll flow (ADMIN
  // enrollment role), NOT here — the create-user dialog has no domain picker, so
  // an "admin" value would silently produce a powerless account. Only "user" vs
  // "superadmin" are meaningful at account-creation time.
  role: z.enum(["user", "superadmin"]).default("user"),
});

async function _POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      isSuperAdmin: parsed.data.role === "superadmin",
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
