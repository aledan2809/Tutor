import { prisma } from "@/lib/prisma";
import { normalizeJoinCode } from "@/lib/join-code";
import { isJoinCodeUsable } from "@/lib/join-code-policy";
import { logAudit } from "@/lib/audit";

/**
 * Răscumpărarea unui cod de acces → înscriere activă ca STUDENT.
 *
 * A fost mutată aici din `/api/domains/join` fiindcă are acum doi apelanți: ruta
 * de dinainte (cineva cu cont, care tastează codul) și intrarea pe link, fără cont
 * (`guest-access` din `auth.ts`). Două copii ale regulilor ar fi însemnat că, într-o
 * zi, una dintre ele uită să reseteze rolurile sau să numere folosirea — iar asta se
 * observă abia când e prea târziu.
 *
 * Regulile, neschimbate față de varianta de dinainte:
 * - orice eșec arată identic (`null`), ca nimeni să nu afle prin încercări care
 *   coduri au fost cândva reale;
 * - o folosire se consumă doar la o intrare REALĂ (cine e deja înscris și apasă din
 *   nou nu arde codul altcuiva);
 * - revendicarea e o singură scriere condiționată, ca doi oameni care apasă în
 *   aceeași clipă să nu treacă amândoi de ultima folosire;
 * - la reactivare rolurile se resetează la STUDENT: un cod de elev dă acces de elev.
 */
export type RedeemResult = {
  domain: { id: string; name: string; slug: string };
  alreadyEnrolled: boolean;
};

export async function redeemJoinCode(
  userId: string,
  rawCode: unknown
): Promise<RedeemResult | null> {
  const code = typeof rawCode === "string" ? normalizeJoinCode(rawCode) : null;
  if (!code) return null;

  const domain = await prisma.domain.findUnique({
    where: { joinCode: code },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      joinCodeExpiresAt: true,
      joinCodeMaxUses: true,
      joinCodeUses: true,
    },
  });
  if (!domain || !domain.isActive) return null;

  const usable = isJoinCodeUsable(
    {
      expiresAt: domain.joinCodeExpiresAt,
      maxUses: domain.joinCodeMaxUses,
      uses: domain.joinCodeUses,
    },
    new Date()
  );
  if (!usable) return null;

  const existing = await prisma.enrollment.findUnique({
    where: { userId_domainId: { userId, domainId: domain.id } },
    select: { isActive: true },
  });

  if (!existing || !existing.isActive) {
    const claimed = await prisma.domain.updateMany({
      where: {
        id: domain.id,
        ...(domain.joinCodeMaxUses !== null
          ? { joinCodeUses: { lt: domain.joinCodeMaxUses } }
          : {}),
      },
      data: { joinCodeUses: { increment: 1 } },
    });
    if (claimed.count === 0) return null;
  }

  if (!existing) {
    try {
      await prisma.enrollment.create({
        data: { userId, domainId: domain.id, roles: ["STUDENT"], isActive: true },
      });
    } catch (e) {
      // Double-submit: rândul a apărut între citire și scriere. Constrângerea de
      // unicitate e garda reală; un 500 aici s-ar citi ca „cod invalid", adică
      // exact pe dos față de ce s-a întâmplat.
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  } else if (!existing.isActive) {
    await prisma.enrollment.update({
      where: { userId_domainId: { userId, domainId: domain.id } },
      data: { isActive: true, roles: ["STUDENT"] },
    });
  }

  if (!existing || !existing.isActive) {
    await logAudit({
      action: "DOMAIN_JOIN_CODE_REDEEM",
      performedById: userId,
      targetType: "Domain",
      metadata: {
        domainId: domain.id,
        slug: domain.slug,
        reactivated: existing !== null,
      },
    });
  }

  return {
    domain: { id: domain.id, name: domain.name, slug: domain.slug },
    alreadyEnrolled: existing?.isActive === true,
  };
}
