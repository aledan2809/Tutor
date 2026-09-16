export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { loadVoucherPreview, serializePreview } from "@/lib/voucher-preview-server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * The discount code kept on the account until payment (User.pendingVoucherCode).
 *
 * POST { code } — checks the code for this account and, if a discount may be shown, keeps it.
 *   A parent who came from the flyer (V126S) or the site (ONV126S) and tries first without a card
 *   finds the code already filled in on the packages page, days later.
 * DELETE — forgets it (the parent cleared the field).
 *
 * Refusals answer with the same stable codes as checkout, so the page shows the same message.
 *
 * Those distinct answers also tell a guesser which codes exist — including free-access codes,
 * which /dashboard/activare turns into paid access. A parent types a code once or twice, so a
 * small budget per account costs nobody anything and makes guessing through here pointless.
 */
const bodySchema = z.object({ code: z.string().min(1).max(50) });
const CHECKS_PER_ACCOUNT = { maxRequests: 10, windowMs: 10 * 60_000 };

async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(`voucher-pending:${session.user.id}`, CHECKS_PER_ACCOUNT).allowed) {
    return NextResponse.json({ error: "Too many attempts", code: "VOUCHER_TOO_MANY" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const result = await loadVoucherPreview(parsed.data.code, session.user.id);
  if (!result || !result.ok) {
    const code = result && !result.ok ? result.code : "VOUCHER_INVALID";
    return NextResponse.json({ error: result && !result.ok ? result.message : "Invalid voucher code", code }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pendingVoucherCode: result.preview.code },
  });
  return NextResponse.json({ preview: serializePreview(result.preview) });
}

async function _DELETE() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.update({ where: { id: session.user.id }, data: { pendingVoucherCode: null } });
  return NextResponse.json({ cleared: true });
}

export const POST = withErrorHandler(_POST);
export const DELETE = withErrorHandler(_DELETE);
