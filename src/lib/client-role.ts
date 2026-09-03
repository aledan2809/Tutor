/**
 * Which of the three client roles a user is, decided in ONE place.
 *
 * The sidebar used to decide this inline, and the help page would have had to
 * decide it again — two copies of a rule that is already subtle (a parent who
 * also studies is a student; a family tutor holds WATCHER, not INSTRUCTOR). A
 * second copy drifts, and the drift shows up as somebody seeing the wrong menu.
 *
 * Pure: no prisma, no React, so it is unit-testable under the node-only vitest
 * setup and importable from both server and client components.
 */

export type ClientRole = "student" | "parent" | "meditator" | "admin";

export interface ClientRoleUser {
  isSuperAdmin: boolean;
  /**
   * Explicit intent captured at signup. Nullable on purpose: every account that
   * predates the column keeps the enrollment-derived behaviour, so nothing
   * changes for anyone until they are reclassified.
   */
  accountRole?: "STUDENT" | "PARENT" | "TUTOR" | null;
  enrollments?: { roles: string[] }[] | null;
}

export interface ClientRoleOpts {
  /** A paid Family/Trio plan grants seats, not a role — a payer can be a parent
   *  before any WATCHER enrollment exists. */
  hasFamilyPlan?: boolean;
  /** `Guardian{relation:"TUTOR"}` — the tutor a family bought a seat for. */
  isFamilyTutor?: boolean;
}

const has = (user: ClientRoleUser, role: string) =>
  !!user.enrollments?.some((e) => e.roles.includes(role));

export function resolveClientRole(
  user: ClientRoleUser,
  opts: ClientRoleOpts = {}
): ClientRole {
  if (user.isSuperAdmin || has(user, "ADMIN")) return "admin";

  // Explicit intent wins over inference. Without it a self-registered parent is
  // indistinguishable from a student, because signing up with a subject always
  // granted STUDENT — which is exactly why they were seeing the student menu.
  if (user.accountRole === "PARENT") return "parent";

  // Someone who actually studies gets the learner menu even if they also watch a
  // sibling — hiding Grile from a learner is the one failure mode worth avoiding.
  if (has(user, "STUDENT")) return "student";

  if (has(user, "INSTRUCTOR")) return "meditator";

  const watches = has(user, "WATCHER") || !!opts.hasFamilyPlan;
  if (watches) return opts.isFamilyTutor ? "meditator" : "parent";

  return "student";
}
