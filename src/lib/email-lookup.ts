import { prisma } from "@/lib/prisma";

/**
 * Finds the account for an email the person typed, whatever the capitals. Emails are stored
 * lowercase, so the exact lowercase match is the normal case. The second look is a safety net for a
 * row stored with capitals by a path that didn't lowercase it: `lower(email) = $1`, not Prisma's
 * case-insensitive mode — that one becomes ILIKE, where "_" in an address is a wildcard. Two rows
 * differing only in capitals → nobody (never guess which one).
 */
export async function findUserIdByEmail(typed: string): Promise<string | null> {
  const email = typed.trim().toLowerCase();
  if (!email) return null;
  const exact = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exact) return exact.id;
  const rows = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "User" WHERE lower(email) = ${email} LIMIT 2`;
  return rows.length === 1 ? rows[0].id : null;
}

type RawDb = { $queryRaw: typeof prisma.$queryRaw };

/**
 * Whether any account already uses this email, whatever the capitals. Every path that creates an
 * account asks this, not an exact match: a row kept with capitals must block a lowercase twin, which
 * the sign-in lookup above would then prefer. (No index on lower(email): a scan of the user table is
 * about a millisecond at this size, and Prisma can't declare an expression index.)
 */
export async function emailTaken(typed: string, db: RawDb = prisma): Promise<boolean> {
  const email = typed.trim().toLowerCase();
  if (!email) return false;
  const rows = await db.$queryRaw<{ one: number }[]>`SELECT 1 AS one FROM "User" WHERE lower(email) = ${email} LIMIT 1`;
  return rows.length > 0;
}
