/**
 * Editarea textelor paginii `/posta`, din panou.
 *
 * Cerut de user: „mai sunt lucruri ce trebuie editate, că nu toate sună bine". Până
 * acum orice virgulă de pe pagina care ajunge la client cerea o livrare de cod.
 *
 * Doar superadmin — e material de vânzare, nu conținut de curs.
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CHEIE_POSTA, RO } from "@/lib/posta-copy";
import { EditorPosta } from "./editor";

export const dynamic = "force-dynamic";

export default async function PaginaEditorPosta({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/signin`);
  if (session.user.isSuperAdmin !== true) redirect(`/${locale}/dashboard`);

  const rand = await prisma.pageCopy
    .findUnique({ where: { key: CHEIE_POSTA }, select: { data: true, updatedAt: true, updatedBy: true } })
    .catch(() => null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Pagina pentru Poșta Română</h1>
      <p className="mt-2 text-sm text-gray-400">
        Textele de mai jos sunt exact cele de pe{" "}
        <a href={`/${locale}/posta`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
          pagina publică
        </a>{" "}
        și din PDF-ul generat din ea. Ce lași necompletat rămâne textul original — nu poți
        strica pagina golind un câmp.
      </p>
      {rand?.updatedAt ? (
        <p className="mt-1 text-xs text-gray-500">
          Ultima modificare: {new Date(rand.updatedAt).toLocaleString("ro-RO")}
          {rand.updatedBy ? ` · ${rand.updatedBy}` : ""}
        </p>
      ) : (
        <p className="mt-1 text-xs text-gray-500">Nimic editat încă — pagina arată textul din cod.</p>
      )}

      <EditorPosta
        implicit={RO}
        salvat={(rand?.data as Record<string, unknown> | undefined) ?? {}}
        locale={locale}
      />
    </div>
  );
}
