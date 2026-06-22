/**
 * Access control for non-curriculum ("restricted") practice domains.
 *
 * Curriculum subjects (Capacitate / BAC — slugs that classify to an exam level)
 * are open to enrolled students as before. Non-curriculum verticals (e.g.
 * `aviation`, slug doesn't classify) are restricted: visible/practiceable only
 * for admins/superadmins, an explicit user allowlist, or a user actually
 * enrolled in that specific domain. Pure (no IO) so it's shared by the client
 * picker and the server session routes.
 */

import { classifyDomainSlug } from "./exam-level";

/** Specific users (by email) allowed to practice restricted domains. */
export const RESTRICTED_DOMAIN_ALLOWLIST = ["raresdanciulescu9@gmail.com"];

/** A domain is restricted when its slug is non-curriculum (no exam level). */
export function isRestrictedDomainSlug(slug: string): boolean {
  return classifyDomainSlug(slug) === null;
}

export interface DomainAccessUser {
  isSuperAdmin?: boolean;
  email?: string | null;
  enrollments?: { domainId: string; roles: readonly string[] }[];
}

/** May this user see restricted domains in pickers at all? */
export function canSeeRestrictedDomains(user: DomainAccessUser | null | undefined): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.enrollments?.some((e) => e.roles.includes("ADMIN"))) return true;
  return user.email != null && RESTRICTED_DOMAIN_ALLOWLIST.includes(user.email);
}

/**
 * Server-side gate for practicing a specific domain. Curriculum domains stay
 * open; a restricted domain requires see-restricted rights OR an active
 * enrollment in that exact domain (so existing enrolled users aren't broken).
 */
export function canAccessDomain(
  user: DomainAccessUser | null | undefined,
  domainSlug: string,
  domainId: string
): boolean {
  if (!isRestrictedDomainSlug(domainSlug)) return true;
  if (canSeeRestrictedDomains(user)) return true;
  return user?.enrollments?.some((e) => e.domainId === domainId) ?? false;
}
