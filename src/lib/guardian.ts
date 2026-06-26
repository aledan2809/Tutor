/**
 * Parent↔child (Guardian) access control for the watcher/parent dashboard.
 *
 * A WATCHER who is a parent must see ONLY their linked children — not every
 * student in a domain (the family-plan minor-data leak). Instructors/admins keep
 * the domain-wide view (teaching). `watcherSeesAllStudents` is pure; the link
 * lookups hit the DB.
 */

import { prisma } from "@/lib/prisma";

export interface GuardianScopeUser {
  enrollments?: { roles: readonly string[] }[];
}

/**
 * Whether this user legitimately sees all students in their domains. True for
 * instructors/admins (teaching); false for a pure parent watcher, who is scoped
 * to their linked children.
 */
export function watcherSeesAllStudents(
  user: GuardianScopeUser | null | undefined
): boolean {
  return (
    user?.enrollments?.some(
      (e) => e.roles.includes("INSTRUCTOR") || e.roles.includes("ADMIN")
    ) ?? false
  );
}

/** Active child user ids linked to this parent. */
export async function getLinkedChildIds(parentId: string): Promise<string[]> {
  const links = await prisma.guardian.findMany({
    where: { parentId, status: "active" },
    select: { childId: true },
  });
  return links.map((l) => l.childId);
}

/** True when `parentId` is an active guardian of `childId`. */
export async function isGuardianOf(parentId: string, childId: string): Promise<boolean> {
  // Defense-in-depth: nobody is their own guardian (blocks a self-link from ever
  // granting parent powers over one's own account, e.g. the tone-restriction control).
  if (parentId === childId) return false;
  const link = await prisma.guardian.findUnique({
    where: { parentId_childId: { parentId, childId } },
    select: { status: true },
  });
  return link?.status === "active";
}
