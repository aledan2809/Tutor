import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { withErrorHandler } from "@/lib/api-handler";
import { loadAccess } from "@/lib/access-server";
import { presenceFor, lastTraceFor, lastSeenFor, startOfRomanianDay } from "@/lib/presence";

async function _GET(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  // Every row also reads the account's access: a page stays small whatever the query asks for.
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
  const search = searchParams.get("search") || "";
  const onlyFreeForever = searchParams.get("freeForever") === "1";
  // Presence period: the three the table offers. Anything else falls back to 7 — a free number here
  // would let one call sweep the whole activity history of every account on the page.
  const askedDays = parseInt(searchParams.get("days") || "7");
  const days = [1, 7, 30].includes(askedDays) ? askedDays : 7;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            // Invited field staff have no email, only a username — findable by it too.
            { username: { contains: search, mode: "insensitive" as const } },
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
        username: true,
        image: true,
        isSuperAdmin: true,
        isBanned: true,
        bannedReason: true,
        subscriptionStatus: true,
        subscriptionPlanId: true,
        subscriptionEndsAt: true,
        lastLoginAt: true,
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

  // Presence for exactly the accounts on this page: how often they came in the chosen period, for how
  // long, and the last subject they worked on — the two reads are scoped to these ids, not the table.
  const ids = users.map((u) => u.id);
  const now = new Date();
  // „Azi" means the Romanian calendar day, not a rolling 24 hours — otherwise the same cell answers
  // differently at 10:00 and at 18:00 for activity that did not change.
  const from = days === 1 ? startOfRomanianDay(now) : new Date(now.getTime() - days * 86_400_000);

  // Presence must never cost the page: banning, „Gratuit permanent" and the voucher trail all live
  // here, and none of them should become unreachable because a cosmetic column could not be read.
  let presence = { byUser: new Map<string, { visits: number; ms: number }>(), estimated: false, trackingStartedAt: null as Date | null };
  let traces = new Map<string, { at: Date; domainName: string | null }>();
  let seen = new Map<string, Date>();
  let presenceFailed = false;
  try {
    [presence, traces, seen] = await Promise.all([presenceFor(ids, from, now), lastTraceFor(ids, now), lastSeenFor(ids)]);
  } catch (error) {
    presenceFailed = true;
    console.error("[admin/users] presence could not be read:", error);
  }

  // What each listed account gets right now (trial day, pause, paid…): one page, so a handful of reads.
  const withAccess = await Promise.all(
    users.map(async ({ stripeSubscriptionId, voucherRedemptions, pendingVoucherCode, ...u }) => ({
      ...u,
      access: await loadAccess(u.id),
      paysByCard: stripeSubscriptionId !== null,
      presence: {
        visits: presence.byUser.get(u.id)?.visits ?? 0,
        ms: presence.byUser.get(u.id)?.ms ?? 0,
        // The freshest evidence that the account was here: a signed-in session lasts 30 days without
        // signing in again, so the sign-in stamp alone can be a month stale while the person studies.
        lastSeenAt: seen.get(u.id) ?? null,
        // The last trace answers „on what", and carries its own moment so the table cannot pair
        // yesterday's sign-in with a subject last touched months ago.
        lastTraceAt: traces.get(u.id)?.at ?? null,
        lastDomain: traces.get(u.id)?.domainName ?? null,
      },
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

  return NextResponse.json({
    users: withAccess,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    presence: {
      days,
      estimated: presence.estimated,
      trackingStartedAt: presence.trackingStartedAt,
      failed: presenceFailed,
    },
  });
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
