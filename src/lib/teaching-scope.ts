/**
 * What a teacher may reach: the subjects they TEACH, and the students enrolled in them.
 *
 * Found 2026-09-24 reviewing the watcher fix: several instructor routes trusted a `domainId` or a
 * student id straight from the request, or treated a teaching role on ANY subject as a pass for
 * every student. A teacher of one subject could list another subject's students (name, e-mail,
 * progress, failure risk), put any account in a "group" and then read it through the group pages,
 * read or cancel any child's reminder history, set alerts on any student. One rule, used everywhere:
 * a teaching role counts for its own subject only; the superadmin keeps the whole view.
 */
import { prisma } from "@/lib/prisma";

export interface TeachingUser {
  isSuperAdmin?: boolean;
  enrollments?: { domainId: string; roles: readonly string[] }[];
}

/** Subjects where this person is INSTRUCTOR or ADMIN. */
export function teachingDomainIds(user: TeachingUser | null | undefined): string[] {
  return [
    ...new Set(
      (user?.enrollments ?? [])
        .filter((e) => e.roles.includes("INSTRUCTOR") || e.roles.includes("ADMIN"))
        .map((e) => e.domainId)
    ),
  ];
}

/** May this person act on this subject as a teacher? */
export function teachesDomain(user: TeachingUser | null | undefined, domainId: string): boolean {
  return !!user?.isSuperAdmin || teachingDomainIds(user).includes(domainId);
}

/**
 * The subjects a request may address. A subject from the URL counts only if they teach it (the
 * superadmin may ask for any); without one, every subject they teach.
 */
export function scopedTeachingDomains(user: TeachingUser | null | undefined, requested: string | null): string[] {
  const own = teachingDomainIds(user);
  if (!requested) return own;
  return user?.isSuperAdmin || own.includes(requested) ? [requested] : [];
}

/**
 * Of these user ids, the ones who are active students in one of these subjects. Callers compare the
 * result with what they were given and refuse the request when something is left out — a silent
 * filter would hide the attempt.
 */
export async function studentsWithin(userIds: string[], domainIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0 || domainIds.length === 0) return new Set();
  const rows = await prisma.enrollment.findMany({
    where: { userId: { in: userIds }, domainId: { in: domainIds }, isActive: true, roles: { has: "STUDENT" } },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}

/** Does this teacher teach this student somewhere? (The superadmin always does.) */
export async function teachesStudent(user: TeachingUser | null | undefined, studentId: string): Promise<boolean> {
  if (user?.isSuperAdmin) return true;
  return (await studentsWithin([studentId], teachingDomainIds(user))).has(studentId);
}
