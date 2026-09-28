import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { GUARDIAN_RELATION, INVITE_TARGET_ROLE } from "@/lib/family";

const schema = z.object({
  childId: z.string().min(1),
  password: z
    .string()
    .min(8, "Parola trebuie să aibă cel puțin 8 caractere")
    .max(72, "Parola trebuie să aibă cel mult 72 de caractere"),
});

/**
 * POST: a parent sets a new password for a child's account made from „Familia mea” (Alex, 28.09.2026).
 * The child signs in with a username and has no email to reset it with, so the family's parents do it:
 * the parent who made it and the parents they invited. A child who joined with an account of their
 * own keeps it their own. Every session of the child ends (sessionVersion), as after any password change.
 */
async function _POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Date invalide";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { childId, password } = parsed.data;

  const link = await prisma.guardian.findFirst({
    where: { parentId: session.user.id, childId, relation: GUARDIAN_RELATION.PARENT, status: "active" },
    select: { child: { select: { id: true, createdByParentId: true } } },
  });
  const creator = link?.child.createdByParentId ?? null;
  // Only the family that made the account: the parent who made it, or a parent that parent invited.
  // Any other adult who gets linked to the child (a family code typed by the child) must not be able
  // to take the account over — it has no email to take it back with.
  const allowed =
    creator !== null &&
    (creator === session.user.id ||
      (await prisma.familyInvite.findFirst({
        where: { inviterId: creator, acceptedById: session.user.id, targetRole: INVITE_TARGET_ROLE.PARENT, status: "accepted" },
        select: { id: true },
      })) !== null);
  // Same answer whatever the reason: nothing to learn about someone else's child.
  if (!allowed) {
    return NextResponse.json({ error: "Parola acestui cont o schimbă doar părinții care l-au făcut." }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: childId },
    data: { password: await bcrypt.hash(password, 12), sessionVersion: { increment: 1 } },
  });
  await logAudit({ action: "CHILD_PASSWORD_SET", performedById: session.user.id, targetUserId: childId, targetType: "User" });
  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(_POST);
