/**
 * Who may reach a domain's content.
 *
 * Pure (no IO) so the same rule is shared by the client picker and the server.
 *
 * Until 2026-09-05 this rule was `classifyDomainSlug(slug) === null`: a domain was
 * private because of how it was NAMED. That made chimie, biologie, istorie and
 * geografie private although nobody chose it, made the genuinely private verticals
 * (aviation, licență) depend on the same coincidence, and meant renaming a URL
 * silently changed who could reach the content. The decision now lives in the
 * database as `Domain.visibility`.
 *
 * These predicates answer from the SESSION, whose enrollments are cached for up to
 * five minutes (src/lib/auth.ts REFRESH_MS). That is fine for deciding what to draw
 * in a picker. It is NOT the access gate — a revoked enrollment would keep working
 * for those five minutes. Content routes must go through `resolveDomainOrForbid`
 * (src/lib/domain-gate.ts), which re-reads the enrollment from the database.
 */

export type DomainVisibility = "PUBLIC" | "PRIVATE";

export interface DomainAccessUser {
  isSuperAdmin?: boolean;
  email?: string | null;
  enrollments?: { domainId: string; roles: readonly string[] }[];
}

/** The parts of a Domain the rule needs — deliberately not the whole record. */
export interface DomainAccessTarget {
  id: string;
  visibility: DomainVisibility;
  isActive?: boolean;
}

/**
 * Only the superadmin sees every domain, private ones included.
 *
 * Two grants that used to live here are gone on purpose:
 * - an email allowlist (`RESTRICTED_DOMAIN_ALLOWLIST`), which opened EVERY
 *   restricted domain to its single entry and meant shipping code to add a student;
 * - "any enrollment with the ADMIN role" — inherited from the old rule and caught
 *   by the 2026-09-05 audit: an admin of subject X could read the private subject Y
 *   (progress, leaderboard, bibliography) and see it listed. An admin of X is an
 *   admin of X. They reach Y like anyone else: through an enrollment in Y.
 */
export function canSeePrivateDomains(user: DomainAccessUser | null | undefined): boolean {
  return user?.isSuperAdmin === true;
}

/** Does the session say this user is enrolled in this domain? */
export function isEnrolledIn(
  user: DomainAccessUser | null | undefined,
  domainId: string
): boolean {
  return user?.enrollments?.some((e) => e.domainId === domainId) ?? false;
}

/**
 * Should this domain appear to this user — in a picker, a catalog, a list?
 *
 * A private domain the user is not enrolled in must not appear at all: not greyed
 * out, not with a lock, not by name. That is what "private" was chosen to mean.
 */
export function canListDomain(
  user: DomainAccessUser | null | undefined,
  domain: DomainAccessTarget
): boolean {
  if (canSeePrivateDomains(user)) return true;
  if (domain.isActive === false) return false;
  if (domain.visibility === "PUBLIC") return true;
  return isEnrolledIn(user, domain.id);
}
