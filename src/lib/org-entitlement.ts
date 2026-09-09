/**
 * Cine plătește pentru un elev: el însuși sau firma care l-a înscris.
 *
 * `plan-features.ts` decide ce funcții deschide un abonament de CONSUMATOR. Regula
 * aia e corectă pentru un elev de liceu care își cumpără singur pachetul, și
 * greșită pentru un agent înscris de firma lui într-o materie a firmei: acolo
 * clientul e firma, nu omul.
 *
 * Găsit la proba de dinaintea publicării cursului „Agent imobiliar": cele opt
 * lecții erau publicate și apăreau în lista agentului, dar deschiderea oricăreia
 * răspundea 403 „face parte dintr-un pachet". Publicat, vizibil, necitibil.
 *
 * Regula e îngustă intenționat: se aplică DOAR materiilor care aparțin unei
 * organizații ȘI doar elevilor înscriși activ în ele. La momentul scrierii, o
 * singură materie din 17 are organizație (`agent-imobiliar`, REAL); toate
 * celelalte — aviația lui Rareș, materiile de bacalaureat — trec prin exact
 * aceeași poartă ca înainte.
 */

import { prisma } from "./prisma";

/**
 * Accesul elevului la materia asta e plătit de o organizație?
 *
 * Adevărat doar când materia aparține unei organizații și omul are o înscriere
 * activă în ea. Nu se uită la roluri: un agent înscris ca elev e exact cazul.
 */
export async function isOrgProvidedAccess(userId: string, domainId: string): Promise<boolean> {
  if (!userId || !domainId) return false;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_domainId: { userId, domainId } },
    select: { isActive: true, domain: { select: { organizationId: true } } },
  });

  return Boolean(enrollment?.isActive && enrollment.domain.organizationId);
}

/**
 * Are omul ăsta MĂCAR O materie plătită de o firmă?
 *
 * Regula de mai sus lucrează pe o materie anume, ceea ce e corect pentru ruta care
 * deschide o lecție. Dar poarta de abonament a PAGINII de lecții rulează înainte de
 * a se ști despre ce materie e vorba — deci întreba doar de pachetul consumatorului
 * și răspundea „funcție inclusă într-un pachet".
 *
 * Efectul, măsurat pe producție 2026-09-09: contul demonstrativ al Poștei
 * (`subscriptionStatus` gol, ca al oricărui angajat înscris de firmă) primea ecranul
 * de vânzare în locul cursului. Aceeași boală ca la reparația de pe lecția
 * individuală — „publicat, vizibil, necitibil" — doar cu un nivel mai sus.
 *
 * La fel de îngustă: doar înscrieri ACTIVE, doar în materii care aparțin unei
 * organizații. Un elev care își cumpără singur pachetul trece prin exact aceeași
 * poartă ca înainte.
 */
export async function hasAnyOrgProvidedAccess(userId: string): Promise<boolean> {
  if (!userId) return false;

  const found = await prisma.enrollment.findFirst({
    where: { userId, isActive: true, domain: { organizationId: { not: null } } },
    select: { id: true },
  });

  return found !== null;
}
