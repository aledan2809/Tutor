import type { AccountRole, EnrollmentRole } from "@prisma/client";

/**
 * What signup offers, and what each choice grants.
 *
 * TUTOR is deliberately absent from the sign-up form. An INSTRUCTOR enrollment
 * grants a domain-wide view of every student in that domain — names, emails,
 * progress — so a self-service "I am a tutor" checkbox would hand anyone the
 * records of other people's children. Tutors are added by the family that pays
 * for them (the Trio seat) or by an admin. The AccountRole enum still carries
 * TUTOR because the reclassification script and admins set it.
 */
export const SIGNUP_ROLES = ["STUDENT", "PARENT"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export function isSignupRole(v: unknown): v is SignupRole {
  return typeof v === "string" && (SIGNUP_ROLES as readonly string[]).includes(v);
}

/**
 * The enrollment rows a new account gets.
 *
 * A parent picks their CHILD's subjects, not their own: WATCHER is per-domain, so
 * without at least one the child would never appear in their monitoring list.
 * That is why both roles require a subject rather than only the student.
 */
export function enrollmentsForSignup(
  role: SignupRole,
  domainIds: string[]
): { domainId: string; roles: EnrollmentRole[] }[] {
  const enrollmentRole: EnrollmentRole = role === "PARENT" ? "WATCHER" : "STUDENT";
  return domainIds.map((domainId) => ({ domainId, roles: [enrollmentRole] }));
}

/** The signup choice, as stored on the account. */
export function accountRoleForSignup(role: SignupRole): AccountRole {
  return role;
}
