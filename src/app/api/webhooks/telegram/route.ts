import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import {
  getTelegramClient,
  makeConnectSeams,
  getBotUsername,
} from "@/lib/telegram/connect";
import { handleConnectUpdate } from "@aledan/telegram";

export const dynamic = "force-dynamic";

/**
 * Telegram webhook — receives /start <token> (connect) and /stop (disconnect).
 * Thin shell over @aledan/telegram: parseWebhook verifies the secret header
 * (fail-closed), handleConnectUpdate runs the private-chat-only opt-in flow
 * over Tutor's Postgres seams.
 *
 * Always returns 200 on flow decisions so Telegram doesn't retry; only an
 * unexpected seam error bubbles to a 500 (then Telegram retries, which is
 * correct for transient DB failures).
 */
async function _POST(req: NextRequest) {
  const client = getTelegramClient();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  // Fail-closed: without a configured secret we cannot authenticate Telegram,
  // so we refuse to process (prevents an open, unauthenticated link endpoint).
  if (!client || !secret) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 503 });
  }

  // Fail-CLOSED on the secret: the lib's parseWebhook skips verification when
  // the header is absent, so we must require its presence + match ourselves
  // (a missing header must NOT be treated as "trusted"). Otherwise anyone who
  // learns the URL could POST /stop and unbind arbitrary chats.
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  if (!secretHeader || secretHeader !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const rawBody = await req.text();
  const update = client.parseWebhook(rawBody, secretHeader); // defense-in-depth re-check
  if (!update) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const outcome = await handleConnectUpdate(update, makeConnectSeams());

  // Best-effort reply to the user (never block the 200 on a reply failure).
  const chatId =
    update.message?.chat?.id ?? null;
  if (chatId != null) {
    const bot = getBotUsername();
    let reply: string | null = null;
    if (outcome.action === "linked") {
      reply =
        "✅ Cont conectat! De acum vei primi mementourile eTutor aici, pe Telegram — gratuit.\n\n" +
        "Trimite /stop oricând pentru a te dezabona.";
    } else if (outcome.action === "unlinked") {
      reply = "Te-ai dezabonat de la mementourile Telegram. Le poți reactiva oricând din setări.";
    } else if (outcome.action === "ignored" && outcome.reason === "invalid-token") {
      reply =
        "Linkul de conectare a expirat sau a fost deja folosit. " +
        (bot ? "Generează unul nou din setările eTutor (Notificări)." : "Generează unul nou din setările eTutor.");
    }
    if (reply) {
      await client.sendText(chatId, reply).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(_POST);
