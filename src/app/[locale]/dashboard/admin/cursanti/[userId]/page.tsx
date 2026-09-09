import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

/**
 * Fișa unui cursant: fiecare lecție și fiecare grilă, cu momentul lor.
 *
 * Tabloul de ansamblu spune „2/6 la modulul 2". Managerul care vede asta întreabă
 * imediat următorul lucru — „la ce a greșit?" — iar dacă răspunsul nu există,
 * cifra rămâne o notă, nu o informație pe baza căreia se poate face ceva.
 *
 * De-aia pagina asta arată întrebările pe care le-a ratat ÎNAINTEA celor pe care
 * le-a nimerit: greșelile sunt lucrul care se poate corecta.
 */
export const dynamic = "force-dynamic";

function moment(d: Date): string {
  return d.toLocaleString("ro-RO", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default async function FisaCursantPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ materie?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  const { userId } = await params;
  const { materie } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, username: true },
  });
  if (!user) notFound();

  // Materiile pe care ACEST administrator are voie să le vadă. Fără filtrul ăsta,
  // oricine cu un id de utilizator ar citi rezultatele oricui.
  const isSuperAdmin = session.user.isSuperAdmin === true;
  const domenii = await prisma.domain.findMany({
    where: {
      isActive: true,
      enrollments: { some: { userId, isActive: true } },
      ...(isSuperAdmin
        ? {}
        : {
            OR: [
              ...(session.user.organizationId
                ? [{ organizationId: session.user.organizationId }]
                : []),
              {
                enrollments: {
                  some: { userId: session.user.id, isActive: true, roles: { has: "ADMIN" } },
                },
              },
            ],
          }),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  if (domenii.length === 0) notFound();

  const active = domenii.find((d) => d.id === materie) ?? domenii[0];

  const [recipient, lectii, raspunsuri] = await Promise.all([
    prisma.recipient.findFirst({
      where: { userId, domainId: active.id },
      select: {
        lastName: true, firstName: true, jobTitle: true, badgeNo: true,
        phone: true, county: true, city: true, postOffice: true,
        invitedAt: true, openedAt: true,
      },
    }),
    prisma.lesson.findMany({
      where: { domainId: active.id, isPublished: true },
      orderBy: { order: "asc" },
      select: {
        id: true, title: true, topic: true,
        progress: {
          where: { userId },
          select: { status: true, completedAt: true },
        },
      },
    }),
    prisma.attempt.findMany({
      where: { userId, voided: false, question: { domainId: active.id } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, answer: true, isCorrect: true, createdAt: true,
        question: { select: { content: true, topic: true, correctAnswer: true } },
      },
    }),
  ]);

  const gresite = raspunsuri.filter((a) => !a.isCorrect);
  const corecte = raspunsuri.filter((a) => a.isCorrect);
  const nume = recipient
    ? `${recipient.lastName} ${recipient.firstName}`
    : user.name || user.email || user.username || "Fără identitate";

  const detalii = recipient
    ? [
        recipient.jobTitle,
        recipient.badgeNo ? `marca ${recipient.badgeNo}` : null,
        recipient.postOffice,
        [recipient.city, recipient.county].filter(Boolean).join(", ") || null,
        recipient.phone,
      ].filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/admin/cursanti?materie=${active.id}`}
        className="text-sm text-gray-400 hover:text-white"
      >
        ← Înapoi la cursanți
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">{nume}</h1>
        {detalii.length > 0 && (
          <p className="mt-1 text-sm text-gray-400">{detalii.join(" · ")}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">{active.name}</p>
      </div>

      {domenii.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {domenii.map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/admin/cursanti/${userId}?materie=${d.id}`}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                d.id === active.id
                  ? "border-blue-600 bg-blue-600/15 text-blue-300"
                  : "border-gray-700 text-gray-300 hover:border-gray-500"
              }`}
            >
              {d.name}
            </Link>
          ))}
        </div>
      )}

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-base font-semibold text-white">Lecții</h2>
        <ul className="mt-3 space-y-2">
          {lectii.map((l) => {
            const p = l.progress[0];
            const gata = p?.status === "COMPLETED";
            return (
              <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className={gata ? "text-gray-200" : "text-gray-500"}>
                  {gata ? "✓" : "○"} {l.title}
                </span>
                <span className="text-xs text-gray-500">
                  {gata && p?.completedAt ? moment(p.completedAt) : "necitită"}
                </span>
              </li>
            );
          })}
          {lectii.length === 0 && <li className="text-sm text-gray-500">Materia n-are lecții.</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-white">Grile</h2>
          <p className="text-sm text-gray-400 tabular-nums">
            {corecte.length} corecte din {raspunsuri.length}
          </p>
        </div>

        {raspunsuri.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">N-a răspuns la nicio grilă încă.</p>
        ) : (
          <>
            {/* Greșelile primele: ele se pot corecta, celelalte doar se confirmă. */}
            {gresite.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-red-300">
                  A greșit ({gresite.length})
                </h3>
                <ul className="mt-2 space-y-3">
                  {gresite.map((a) => (
                    <li key={a.id} className="rounded-lg border border-red-900/50 bg-red-950/20 p-3">
                      <p className="text-sm text-gray-200">{a.question.content}</p>
                      <p className="mt-1.5 text-xs text-gray-400">
                        Modulul: {a.question.topic} · {moment(a.createdAt)}
                      </p>
                      <p className="mt-1 text-xs">
                        <span className="text-red-300">a ales {a.answer}</span>
                        <span className="text-gray-500"> · corect era {a.question.correctAnswer}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {corecte.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  A nimerit ({corecte.length})
                </h3>
                <ul className="mt-2 space-y-2">
                  {corecte.map((a) => (
                    <li key={a.id} className="text-sm text-gray-400">
                      <span className="text-emerald-400">✓</span> {a.question.content}
                      <span className="ml-1 text-xs text-gray-600">· {moment(a.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
