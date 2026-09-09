import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "./invite-form";

/**
 * Trimiterea unei invitații la curs, pe WhatsApp, dintr-un singur ecran.
 *
 * Se folosește în fața clientului: îi ceri numărul, apeși, îi sună telefonul.
 * De-aia formularul e scurt și de-aia răspunsul e mereu explicit — într-o
 * întâlnire, „nu s-a întâmplat nimic" e cel mai prost lucru care poate apărea.
 *
 * Listăm doar materiile cu cod de acces emis: fără cod n-ai ce trimite, iar o
 * materie oferită în listă și refuzată la apăsare e exact genul de surpriză pe
 * care n-o vrei cu clientul de față.
 */
export default async function AdminInvitatiiPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const isSuperAdmin = session.user.isSuperAdmin === true;

  const domains = await prisma.domain.findMany({
    where: {
      isActive: true,
      joinCode: { not: null },
      ...(isSuperAdmin
        ? {}
        : {
            // Un administrator vede materiile organizației lui sau pe cele unde
            // e administrator numit.
            OR: [
              ...(session.user.organizationId
                ? [{ organizationId: session.user.organizationId }]
                : []),
              { enrollments: { some: { userId: session.user.id, isActive: true, roles: { has: "ADMIN" } } } },
            ],
          }),
    },
    select: {
      id: true,
      name: true,
      joinCode: true,
      joinCodeUses: true,
      joinCodeMaxUses: true,
      joinCodeExpiresAt: true,
      organization: { select: { name: true } },
      courses: {
        where: { isPublished: true },
        select: { title: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  if (domains.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-white">Trimite invitație</h1>
        <p className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-6 text-sm text-gray-300">
          Nicio materie cu cod de acces emis. Emite un cod din pagina materiei și
          revino aici.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trimite invitație</h1>
        <p className="mt-2 text-sm text-gray-400">
          Omul primește pe WhatsApp un mesaj cu buton. Apasă și intră direct în curs
          — fără cont, fără parolă, fără cod de tastat.
        </p>
      </div>

      <InviteForm
        domains={domains.map((d) => ({
          id: d.id,
          name: d.name,
          course: d.courses[0]?.title ?? d.name,
          org: d.organization?.name ?? null,
          code: d.joinCode as string,
          uses: d.joinCodeUses,
          maxUses: d.joinCodeMaxUses,
          expiresAt: d.joinCodeExpiresAt ? d.joinCodeExpiresAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
