/**
 * Parent↔child (Guardian) access control for the watcher/parent dashboard.
 *
 * A WATCHER who is a parent must see ONLY their linked children — not every
 * student in a domain (the family-plan minor-data leak). Instructors/admins keep
 * the domain-wide view (teaching), per subject (`watcherScope`); the link
 * lookups hit the DB.
 */

import { prisma } from "@/lib/prisma";

export interface ScopeEnrollment {
  domainId: string;
  roles: readonly string[];
}

/**
 * Which students a watcher may see, PER SUBJECT — not per account.
 *
 * The previous check (`watcherSeesAllStudents`, removed 2026-09-24) answered once for the whole account: a teaching role on ANY subject turned
 * on the domain-wide view on EVERY subject, including those where the person is only a parent. Found
 * 2026-08-25 putting Antonia (admin on aviation) in as Rareș's mother: on the subjects where she is
 * only his parent, the parent scoping stopped applying. A teaching role on one subject must not relax
 * a child's privacy on another.
 *
 * - `teaching`: subjects where they are INSTRUCTOR/ADMIN → every student of that subject.
 * - `watchOnly`: subjects where they are only WATCHER → their own linked children, nobody else.
 */
export function watcherScope(enrollments: readonly ScopeEnrollment[] | null | undefined): {
  teaching: string[];
  watchOnly: string[];
} {
  const teaching = new Set<string>();
  const watching = new Set<string>();
  for (const e of enrollments ?? []) {
    if (e.roles.includes("INSTRUCTOR") || e.roles.includes("ADMIN")) teaching.add(e.domainId);
    else if (e.roles.includes("WATCHER")) watching.add(e.domainId);
  }
  return { teaching: [...teaching], watchOnly: [...watching].filter((d) => !teaching.has(d)) };
}

/**
 * The subjects a watcher list may be asked for. A `domainId` from the URL is honoured only when the
 * person has a role on it — before, any subject id passed in the query was read as if it were theirs.
 */
export function requestedWatcherDomains(
  scope: { teaching: string[]; watchOnly: string[] },
  requested: string | null,
): { teaching: string[]; watchOnly: string[] } {
  const pick = (ids: string[]) => (requested ? ids.filter((d) => d === requested) : ids);
  return { teaching: pick(scope.teaching), watchOnly: pick(scope.watchOnly) };
}

/** Active child user ids linked to this parent. */
export async function getLinkedChildIds(parentId: string): Promise<string[]> {
  const links = await prisma.guardian.findMany({
    where: { parentId, status: "active" },
    select: { childId: true },
  });
  return links.map((l) => l.childId);
}

/**
 * True when `parentId` is an active PARENT of `childId`. Deliberately excludes
 * TUTOR-relation family links: everywhere the codebase grants parent powers it
 * filters `relation: PARENT` (threshold-monitor, parent-monitor, family-invite)
 * — a hired tutor accepted into the family must not pass as the parent, and a
 * write they make must not be stamped GUARDIAN (finding review 2026-08-25).
 */
export async function isParentOf(parentId: string, childId: string): Promise<boolean> {
  if (parentId === childId) return false;
  const link = await prisma.guardian.findUnique({
    where: { parentId_childId: { parentId, childId } },
    select: { status: true, relation: true },
  });
  return link?.status === "active" && link?.relation === "PARENT";
}

/** True when `parentId` is an active guardian of `childId` (any relation). */
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
