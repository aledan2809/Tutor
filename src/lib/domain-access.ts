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
 * Admins see every domain, private ones included.
 *
 * There is deliberately no email allowlist any more. One used to live here
 * (`RESTRICTED_DOMAIN_ALLOWLIST`) and it granted its single entry access to EVERY
 * restricted domain at once, not just their own — and adding a student meant
 * shipping code. Access is now an enrollment, which is data.
 */
export function canSeePrivateDomains(user: DomainAccessUser | null | undefined): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.enrollments?.some((e) => e.roles.includes("ADMIN")) ?? false;
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
