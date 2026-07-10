import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";
import { allowedChannels, clampChannelWrite } from "@/lib/plan-channels";
import { sanitizeChannelOrder } from "@/lib/escalation/config";

/**
 * Per-child notification delegation, set by a parent.
 *
 * - `managedByParent` lives in the CHILD's `notifDelegation` Setting (guardian-writable
 *   only), so the child read-path stays single-user.
 * - the channels themselves live in the child's existing `NotificationPreference` row.
 *
 * Only a verified guardian of the child may read or write here.
 */
async function guard(childId: string) {
  const session = await getSession();
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!(await isGuardianOf(session.user.id, childId))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const };
}

async function readState(childId: string) {
  const [setting, prefs, child] = await Promise.all([
    prisma.setting.findUnique({ where: { userId_key: { userId: childId, key: "notifDelegation" } } }),
    prisma.notificationPreference.findUnique({ where: { userId: childId } }),
    prisma.user.findUnique({ where: { id: childId }, select: { subscriptionStatus: true } }),
  ]);
  const managedByParent = (setting?.value as { managedByParent?: boolean } | undefined)?.managedByParent === true;
  return {
    managedByParent,
    channels: {
      push: prefs?.push ?? true,
      email: prefs?.email ?? true,
      whatsapp: prefs?.whatsapp ?? true,
      sms: prefs?.sms ?? true,
    },
    channelOrder: prefs?.channelOrder ?? [],
    allowedChannels: allowedChannels(child?.subscriptionStatus),
  };
}

async function _GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const g = await guard(childId);
  if (g.error) return g.error;
  return NextResponse.json(await readState(childId));
}

async function _PUT(req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const g = await guard(childId);
  if (g.error) return g.error;

  const body = (await req.json()) as {
    managedByParent?: boolean;
    push?: boolean;
    email?: boolean;
    whatsapp?: boolean;
    sms?: boolean;
    channelOrder?: unknown;
  };

  if (typeof body.managedByParent === "boolean") {
    await prisma.setting.upsert({
      where: { userId_key: { userId: childId, key: "notifDelegation" } },
      update: { value: { managedByParent: body.managedByParent } },
      create: { userId: childId, key: "notifDelegation", value: { managedByParent: body.managedByParent } },
    });
  }

  // Clamp the child's channels to the child's plan (a parent can't enable a metered
  // channel the child's package doesn't include).
  const child = await prisma.user.findUnique({ where: { id: childId }, select: { subscriptionStatus: true } });
  const { applied } = clampChannelWrite(
    { push: body.push, email: body.email, whatsapp: body.whatsapp, sms: body.sms },
    child?.subscriptionStatus,
  );
  const cleanOrder = sanitizeChannelOrder(body.channelOrder);
  const prefUpdate: Record<string, unknown> = { ...applied };
  if (cleanOrder) prefUpdate.channelOrder = cleanOrder;
  if (Object.keys(prefUpdate).length > 0) {
    await prisma.notificationPreference.upsert({
      where: { userId: childId },
      update: prefUpdate,
      create: { userId: childId, ...prefUpdate },
    });
  }

  return NextResponse.json(await readState(childId));
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
