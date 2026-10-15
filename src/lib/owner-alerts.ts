/**
 * Money alerts for the owner, on Telegram (/bani, 15.10.2026). Four card checkouts had been started and
 * abandoned without anyone seeing it, and the first real payment, a failed renewal or the day-8 pauses
 * would have gone unnoticed the same way. Sent to every platform administrator with Telegram linked to
 * eTutor's bot; the bell stays for the parents. Never throws and never holds a payment callback for long:
 * a missed alert must not turn into a broker retry (which would also repeat the alert).
 */
import { prisma } from "@/lib/prisma";
import { telegramAlertToUser } from "@/lib/notifications/service";
import { resolveIsTest } from "@/lib/notifications/test-account";

const ALERT_BUDGET_MS = 6_000;

/** „a***b@gmail.com”: enough for the owner to find the account in the admin list, not the address itself. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "(fără e-mail)";
  return email.replace(/^(.).*?(.)?@/, (_m, a: string, b: string | undefined) => `${a}***${b ?? ""}@`);
}

/** „33,20 lei”: minor units (bani) as the parent reads them. */
export function lei(minor: number, currency = "ron"): string {
  const unit = currency.toLowerCase() === "ron" ? "lei" : currency.toUpperCase();
  return `${(minor / 100).toFixed(2).replace(".", ",")} ${unit}`;
}

/** Sends `text` to the administrators; false when nobody got it (no admin with Telegram, or a send failed). */
export async function alertOwners(text: string, url = "/dashboard/admin/superadmin/users"): Promise<boolean> {
  const send = async () => {
    const admins = await prisma.user.findMany({
      where: { isSuperAdmin: true, isBanned: false, telegramChatId: { not: null } },
      select: { id: true },
    });
    const results = await Promise.all(admins.map((a) => telegramAlertToUser(a.id, { text, url, buttonLabel: "Deschide" }).catch(() => false)));
    return results.some(Boolean);
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // The lookup and the sends together, under one budget: the lifecycle cron waits for this.
    return await Promise.race([send(), new Promise<boolean>((resolve) => (timer = setTimeout(() => resolve(false), ALERT_BUDGET_MS)))]);
  } catch (err) {
    console.error("owner alert failed", err);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** The payer as the alert names them; null for a test account (journey audits, QA), which alerts nobody. */
export async function payerForAlert(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (!u || resolveIsTest(u.email)) return null;
  const first = u.name?.trim().split(/\s+/)[0];
  return first ? `${first} (${maskEmail(u.email)})` : maskEmail(u.email);
}
