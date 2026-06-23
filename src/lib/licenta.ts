/**
 * "Licență — Rareș": a private study material. Implemented as a restricted
 * Domain (slug "licenta-rares" does not classify to any curriculum level → the
 * existing domain-access rules make it visible only to admins + the allowlisted
 * student), so the whole practice engine (sessions, scoring, question renderer)
 * works unchanged. This module owns the constants + the domain/enrollment
 * bootstrap + the access predicate.
 */
import { prisma } from "@/lib/prisma";
import { canSeeRestrictedDomains, type DomainAccessUser } from "@/lib/domain-access";
import { LICENTA_DOMAIN_SLUG, LICENTA_STUDENT_EMAIL } from "@/lib/licenta-constants";

export { LICENTA_DOMAIN_SLUG, LICENTA_STUDENT_EMAIL };

/** Who may upload/generate/see the licență material: admins + the allowlisted student. */
export function canUseLicenta(user: DomainAccessUser | null | undefined): boolean {
  return canSeeRestrictedDomains(user);
}

/**
 * Idempotently ensure the private domain exists and the target student is
 * enrolled. Returns the domain id and the student id (null if the student
 * account doesn't exist yet).
 */
export async function ensureLicentaDomainAndStudent(): Promise<{
  domainId: string;
  studentId: string | null;
}> {
  let domain = await prisma.domain.findUnique({ where: { slug: LICENTA_DOMAIN_SLUG } });
  if (!domain) {
    domain = await prisma.domain.create({
      data: {
        name: "Licență — Rareș",
        slug: LICENTA_DOMAIN_SLUG,
        description: "Material privat de studiu pentru licență (grile generate din document).",
        icon: "🎓",
        isActive: true,
      },
    });
  }

  const student = await prisma.user.findUnique({
    where: { email: LICENTA_STUDENT_EMAIL },
    select: { id: true },
  });
  if (student) {
    await prisma.enrollment.upsert({
      where: { userId_domainId: { userId: student.id, domainId: domain.id } },
      create: { userId: student.id, domainId: domain.id, roles: ["STUDENT"], isActive: true },
      update: { isActive: true },
    });
  }

  return { domainId: domain.id, studentId: student?.id ?? null };
}
