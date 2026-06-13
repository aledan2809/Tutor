import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { createConnectLink, telegramConfigured } from "@/lib/telegram/connect";

/**
 * GET /api/telegram/link — current link status for the signed-in user.
 */
async function _GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { telegramChatId: true, telegramUsername: true, telegramLinkedAt: true },
  });
  return NextResponse.json({
    configured: telegramConfigured(),
    linked: Boolean(user?.telegramChatId),
    username: user?.telegramUsername ?? null,
    linkedAt: user?.telegramLinkedAt ?? null,
  });
}

/**
 * POST /api/telegram/link — mint a single-use connect deep link.
 * The user taps it → Telegram delivers /start <token> to our webhook.
 */
async function _POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!telegramConfigured()) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 503 });
  }
  const link = await createConnectLink(session.user.id);
  if (!link) {
    return NextResponse.json({ error: "Bot username not configured" }, { status: 503 });
  }
  return NextResponse.json(link);
}

/**
 * DELETE /api/telegram/link — unlink Telegram for the signed-in user.
 */
async function _DELETE() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramChatId: null, telegramUsername: null, telegramLinkedAt: null },
  });
  return NextResponse.json({ ok: true });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
export const DELETE = withErrorHandler(_DELETE);
