import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportForm } from "./import-form";

/** Importul listei de cursanți: se vede întâi, se scrie după. */
export const dynamic = "force-dynamic";

export default async function ImportCursantiPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  const isSuperAdmin = session.user.isSuperAdmin === true;

  const domains = await prisma.domain.findMany({
    where: {
      isActive: true,
      ...(isSuperAdmin
        ? {}
        : {
            OR: [
              ...(session.user.organizationId ? [{ organizationId: session.user.organizationId }] : []),
              { enrollments: { some: { userId: session.user.id, isActive: true, roles: { has: "ADMIN" } } } },
            ],
          }),
    },
    select: { id: true, name: true, organization: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  if (domains.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Import cursanți</h1>
        <p className="mt-4 rounded-lg border border-gray-700 bg-gray-900 px-4 py-6 text-sm text-gray-300">
          Nu administrezi nicio materie.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Import cursanți</h1>
        <p className="mt-2 text-sm text-gray-400">
          Lipește tabelul din Excel sau încarcă un CSV. Vezi întâi ce am înțeles, apoi
          apeși. Importul nu trimite niciun mesaj.
        </p>
      </div>
      <ImportForm
        domains={domains.map((d) => ({
          id: d.id,
          name: d.organization?.name ? `${d.organization.name} — ${d.name}` : d.name,
        }))}
      />
    </div>
  );
}
