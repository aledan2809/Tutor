import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { logAudit } from "@/lib/audit";
import { withErrorHandler } from "@/lib/api-handler";
import { ACCESS_TRIAL_SETTING, forgetPauseSwitch, loadPauseStartsAt } from "@/lib/access-server";

/**
 * The platform switch for the 7-day trial and the day-8 pause (Alex, 16.09.2026).
 *
 * Off (no row): nothing is paused; an account past its first week keeps today's free tier.
 * On: accounts older than the switch get their 7 days from the moment it was turned on; after
 * them, a family that hasn't paid is paused. Accounts marked „Gratuit permanent" are never touched.
 *
 * Turning it on again while it is on doesn't restart anyone's week.
 */
async function _GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  forgetPauseSwitch();
  const [startsAt, freeForever, withoutOwnPlan] = await Promise.all([
    loadPauseStartsAt(),
    prisma.user.count({ where: { freeForever: true } }),
    // An upper bound: children of paying families, company learners and tutors are in this count
    // but are never paused (access.ts decides per account).
    prisma.user.count({
      where: {
        isSuperAdmin: false,
        freeForever: false,
        // Most accounts never had a subscription (NULL): a plain NOT IN would leave them out.
        OR: [{ subscriptionStatus: null }, { subscriptionStatus: { notIn: ["active", "trialing"] } }],
      },
    }),
  ]);

  return NextResponse.json({
    enabled: startsAt !== null,
    startsAt: startsAt?.toISOString() ?? null,
    counts: { freeForever, withoutOwnPlan },
  });
}

const putSchema = z.object({ enabled: z.boolean() });

async function _PUT(req: NextRequest) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Trimite { enabled: true | false }." }, { status: 400 });
  }

  forgetPauseSwitch();
  const current = await loadPauseStartsAt();

  if (parsed.data.enabled) {
    if (!current) {
      const startsAt = new Date();
      await prisma.appSetting.upsert({
        where: { key: ACCESS_TRIAL_SETTING },
        create: { key: ACCESS_TRIAL_SETTING, value: { startsAt: startsAt.toISOString() }, updatedById: session!.user.id },
        update: { value: { startsAt: startsAt.toISOString() }, updatedById: session!.user.id },
      });
      await logAudit({
        action: "ACCESS_TRIAL_ON",
        performedById: session!.user.id,
        targetType: "AppSetting",
        metadata: { startsAt: startsAt.toISOString() },
      });
    }
  } else if (current) {
    await prisma.appSetting.deleteMany({ where: { key: ACCESS_TRIAL_SETTING } });
    await logAudit({
      action: "ACCESS_TRIAL_OFF",
      performedById: session!.user.id,
      targetType: "AppSetting",
      metadata: { startedAt: current.toISOString() },
    });
  }

  forgetPauseSwitch();
  const startsAt = await loadPauseStartsAt();
  return NextResponse.json({ enabled: startsAt !== null, startsAt: startsAt?.toISOString() ?? null });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
