/**
 * Who has the last word on a child's schedule and subjects (Alex, 16.09.2026): what a parent sets or
 * changes is locked for the child; what the child set stays theirs until a parent changes it. There
 * is no request flow — moving a study hour is a one-minute talk between them.
 *
 * A lock holds only while the adult who set it is still an active PARENT of the child. When the
 * link is removed or the account is gone, the item goes back to the child. A hired tutor in the
 * family can help with the schedule but doesn't get the parent's last word (guardian.ts isParentOf).
 */
import { prisma } from "@/lib/prisma";

export type LockOwner = { id: string; name: string | null };

/**
 * The adults among `setByIds` who are still active parents of this child — the ones whose word
 * locks. With `relation: "TUTOR"`, the family's tutors among them instead: they only get named.
 */
export async function activeSetters(
  childId: string,
  setByIds: Iterable<string | null | undefined>,
  relation: "PARENT" | "TUTOR" = "PARENT",
): Promise<Map<string, LockOwner>> {
  const ids = [...new Set([...setByIds].filter((x): x is string => typeof x === "string" && x.length > 0))];
  const owners = new Map<string, LockOwner>();
  if (ids.length === 0) return owners;
  const links = await prisma.guardian.findMany({
    where: { childId, parentId: { in: ids }, status: "active", relation },
    select: { parent: { select: { id: true, name: true } } },
  });
  for (const l of links) owners.set(l.parent.id, l.parent);
  return owners;
}

/** Said to the child when they try to change what a guardian set. */
export function lockedText(owner: LockOwner | null, what: "reminder" | "subject"): string {
  const who = owner?.name?.trim() || "Părintele tău";
  return what === "reminder"
    ? `${who} a stabilit acest program. Ca să-l schimbați, vorbiți împreună.`
    : `${who} a scos această materie. Ca s-o adaugi înapoi, vorbiți împreună.`;
}

/**
 * How the guardian's page labels an item: the child's own, set by this viewer, by the other parent,
 * or by the family's tutor (whose items don't lock).
 */
export function setByLabel(
  setById: string | null,
  viewerId: string,
  owners: Map<string, LockOwner>,
  tutors: Map<string, LockOwner> = new Map(),
): { setBy: "child" | "you" | "guardian" | "tutor"; setByName: string | null } {
  if (setById && setById === viewerId && (owners.has(setById) || tutors.has(setById))) return { setBy: "you", setByName: null };
  if (setById && owners.has(setById)) return { setBy: "guardian", setByName: owners.get(setById)?.name ?? null };
  if (setById && tutors.has(setById)) return { setBy: "tutor", setByName: tutors.get(setById)?.name ?? null };
  return { setBy: "child", setByName: null };
}
