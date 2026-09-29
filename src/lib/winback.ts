/**
 * The offer to an account about to be erased for inactivity (Alex, 29.09.2026): the same −30% for as
 * long as it stays subscribed that a free week gives, never more (a bigger one would teach people to
 * wait for it). It opens with the first warning and ends on the day the account would have been
 * erased — a real deadline, stored when the warning goes out, so signing in to pay (which resets the
 * inactivity clock) doesn't take the offer away.
 */
import { prisma } from "@/lib/prisma";

export const winbackId = (userId: string) => `winback:${userId}`;

/** The open win-back window of an account, or null. */
export async function winbackOffer(userId: string, now: Date = new Date()): Promise<{ endsAt: Date } | null> {
  const row = await prisma.verificationToken.findFirst({
    where: { identifier: winbackId(userId), expires: { gt: now } },
    orderBy: { expires: "desc" },
    select: { expires: true },
  });
  return row ? { endsAt: row.expires } : null;
}
