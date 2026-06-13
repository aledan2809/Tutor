/**
 * Telegram account-connect wiring for Tutor.
 *
 * Thin glue between @aledan/telegram's pure connect-flow core and Tutor's
 * Postgres storage. No Redis here (Tutor has none) — connect tokens live in
 * the `TelegramConnectToken` table and single-use is guaranteed by an atomic
 * row-deleting `delete` (the DB row lock makes two concurrent /start with the
 * same nonce resolve to exactly one win).
 *
 * The webhook route stays a thin shell: parse → handleConnectUpdate(seams).
 */

import { prisma } from "@/lib/prisma";
import {
  TelegramClient,
  mintConnectNonce,
  buildConnectLink,
  type ConnectSeams,
} from "@aledan/telegram";

/** The app's extended Prisma client type (injectable for tests). */
type Db = typeof prisma;

/** TTL for a connect deep link (default 15 min). */
export const CONNECT_TOKEN_TTL_SEC = Math.max(
  60,
  parseInt(process.env.TELEGRAM_LINK_TTL_SEC || "900", 10) || 900,
);

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export function telegramNudgesEnabled(): boolean {
  return telegramConfigured() && process.env.FEATURE_TELEGRAM_NUDGES === "true";
}

export function getBotUsername(): string | null {
  return process.env.TELEGRAM_BOT_USERNAME || null;
}

/** TelegramClient from env, or null when the bot token isn't configured. */
export function getTelegramClient(): TelegramClient | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;
  return new TelegramClient({
    botToken,
    webhookSecretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
  });
}

/**
 * Mint + persist a single-use connect token for `userId`, return the
 * `t.me/<bot>?start=<nonce>` deep link (or null when the bot username is
 * not configured).
 */
export async function createConnectLink(
  userId: string,
  db: Db = prisma,
): Promise<{ url: string; expiresInSec: number } | null> {
  const bot = getBotUsername();
  if (!bot) return null;
  // Opportunistic cleanup: drop this user's stale tokens so abandoned links
  // don't accumulate (no Redis TTL / cron — the table self-prunes on mint).
  await db.telegramConnectToken
    .deleteMany({ where: { userId, expiresAt: { lt: new Date() } } })
    .catch(() => {});
  const nonce = mintConnectNonce();
  const expiresAt = new Date(Date.now() + CONNECT_TOKEN_TTL_SEC * 1000);
  await db.telegramConnectToken.create({ data: { nonce, userId, expiresAt } });
  return { url: buildConnectLink(bot, nonce), expiresInSec: CONNECT_TOKEN_TTL_SEC };
}

/**
 * Storage seams for @aledan/telegram handleConnectUpdate. Accepts an
 * injectable prisma client so the behavior is unit-testable with a fake.
 */
export function makeConnectSeams(db: Db = prisma): ConnectSeams {
  return {
    // Atomic single-use: delete the row (throws P2025 if missing/already used);
    // honor expiry; never throw on the not-found path.
    async consumeToken(nonce: string): Promise<string | null> {
      try {
        const tok = await db.telegramConnectToken.delete({ where: { nonce } });
        if (tok.expiresAt.getTime() < Date.now()) return null; // expired → treat as invalid
        return tok.userId;
      } catch {
        return null; // missing / already consumed
      }
    },

    async bindChat(userId, { chatId, username }) {
      const chat = String(chatId);
      // Re-binding a chat to a new account: clear it off any prior owner first
      // (telegramChatId is @unique — a naked update would hit the constraint).
      await db.$transaction([
        db.user.updateMany({
          where: { telegramChatId: chat, NOT: { id: userId } },
          data: { telegramChatId: null, telegramUsername: null, telegramLinkedAt: null },
        }),
        db.user.update({
          where: { id: userId },
          data: { telegramChatId: chat, telegramUsername: username, telegramLinkedAt: new Date() },
        }),
      ]);
    },

    async unbindChat(chatId) {
      await db.user.updateMany({
        where: { telegramChatId: String(chatId) },
        data: { telegramChatId: null, telegramUsername: null, telegramLinkedAt: null },
      });
    },
  };
}
