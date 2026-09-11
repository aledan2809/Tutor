import { prisma } from "@/lib/prisma";
import { FirmeManager, type FirmaRand } from "@/components/admin/firme-manager";

/**
 * Firmele care ne plătesc prin factură separată — condițiile comerciale și ce s-a
 * consumat pe ele luna asta.
 *
 * De ce la superadmin și nu în panoul firmei: clientul trebuie să VADĂ ce plătește,
 * dar tarifele se schimbă în contract, nu din aplicație de către el.
 */
export const dynamic = "force-dynamic";

export default async function FirmePage() {
  const firme = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      meteredIncluded: true,
      billingPlan: true,
      billingAmount: true,
      billingCurrency: true,
      billingPeriod: true,
      billingStartsAt: true,
      billingNote: true,
      billingEntity: true,
      domains: { select: { id: true } },
    },
  });

  // Începutul lunii curente, în ora locală a serverului — aceeași fereastră pe care
  // o va avea și factura.
  const acum = new Date();
  const inceputLuna = new Date(acum.getFullYear(), acum.getMonth(), 1);

  const randuri: FirmaRand[] = await Promise.all(
    firme.map(async (f) => {
      const domainIds = f.domains.map((d) => d.id);
      /*
       * Cursanții unei firme NU sunt `User.organizationId` — ăla e câmpul
       * administratorilor. Omul e legat de client prin ÎNSCRIEREA la materia lui,
       * deci se numără de acolo. (Verificat pe producție: firma Poștei are 3 materii
       * și zero membri, dar cursanți reali.)
       */
      const inscrisLaFirma = {
        enrollments: { some: { isActive: true, domainId: { in: domainIds } } },
      } as const;

      /*
       * Legătura se pune în interogare, nu se aduce lista de identificatori în memorie
       * ca s-o trimitem înapoi într-un `in`. Pe demonstrația de acum diferența e zero
       * (doi cursanți), dar exact firma asta vorbește despre mii de oameni — iar
       * varianta cu listă ar fi crescut liniar cu ei, în fiecare încărcare a paginii.
       */
      const cursanti =
        domainIds.length === 0 ? 0 : await prisma.user.count({ where: inscrisLaFirma });

      const consum =
        domainIds.length === 0
          ? []
          : await prisma.escalationEvent.groupBy({
              by: ["channel"],
              where: {
                user: inscrisLaFirma,
                isTest: false,
                sentAt: { gte: inceputLuna },
                channel: { in: ["WHATSAPP", "SMS"] },
              },
              _count: true,
            });

      return {
        id: f.id,
        name: f.name,
        slug: f.slug,
        materii: domainIds.length,
        cursanti,
        meteredIncluded: f.meteredIncluded,
        billingPlan: f.billingPlan,
        billingAmount: f.billingAmount,
        billingCurrency: f.billingCurrency,
        billingPeriod: f.billingPeriod,
        billingStartsAt: f.billingStartsAt ? f.billingStartsAt.toISOString().slice(0, 10) : null,
        billingNote: f.billingNote,
        billingEntity: f.billingEntity,
        whatsappLunaAsta: consum.find((c) => c.channel === "WHATSAPP")?._count ?? 0,
        smsLunaAsta: consum.find((c) => c.channel === "SMS")?._count ?? 0,
      };
    })
  );

  return <FirmeManager firme={randuri} luna={inceputLuna.toISOString().slice(0, 7)} />;
}
