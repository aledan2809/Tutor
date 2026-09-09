import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Roster, type RosterRow, type ModuleCol } from "./roster";

/**
 * Tabloul managerului: cine a făcut ce, în orice moment.
 *
 * Întrebarea clientului era „cum va ști un manager cine și ce a făcut?", iar
 * răspunsul e aici. Fiecare rând e un om cu numele lui, nu un număr de telefon —
 * pentru că invitația a purtat identitatea de pe lista lor, nu dintr-un formular
 * pus în calea omului.
 *
 * Se citește pe orizontală: starea generală, apoi, per modul, dacă a citit lecția
 * și cum a ieșit la test. Culoarea spune starea dintr-o privire; cifra spune cât.
 *
 * Datele se compun din trei surse, într-un număr fix de interogări (nu una per om,
 * altfel la mii de cursanți pagina ar muri):
 * - `Recipient` — invitația și momentele ei;
 * - `LessonProgress` — ce lecție a terminat și când;
 * - `Attempt` → `Question.topic` — răspunsurile, grupate pe modulul lor.
 */
export const dynamic = "force-dynamic";

/** Câți oameni încarcă pagina odată. Peste atât, se pagineaza (de făcut). */
const LIMIT = 300;

export default async function CursantiPage({
  searchParams,
}: {
  searchParams: Promise<{ materie?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  const { materie } = await searchParams;

  const isSuperAdmin = session.user.isSuperAdmin === true;
  const domains = await prisma.domain.findMany({
    where: {
      isActive: true,
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
    select: { id: true, name: true, organization: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  if (domains.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Cursanți</h1>
        <p className="mt-4 rounded-lg border border-gray-700 bg-gray-900 px-4 py-6 text-sm text-gray-300">
          Nu administrezi nicio materie.
        </p>
      </div>
    );
  }

  const active = domains.find((d) => d.id === materie) ?? domains[0];

  // ── modulele materiei, în ordinea cursului ────────────────────────────────
  const course = await prisma.course.findFirst({
    where: { domainId: active.id, isPublished: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      modules: {
        orderBy: { order: "asc" },
        select: { id: true, order: true, title: true, questionTopic: true },
      },
    },
  });
  const modules = course?.modules ?? [];

  const lessons = await prisma.lesson.findMany({
    where: { domainId: active.id, isPublished: true },
    select: { id: true, moduleId: true, title: true, order: true },
    orderBy: { order: "asc" },
  });

  const recipients = await prisma.recipient.findMany({
    where: { domainId: active.id },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: LIMIT,
    select: {
      id: true, lastName: true, firstName: true, jobTitle: true, badgeNo: true,
      phone: true, county: true, city: true, postOffice: true,
      invitedAt: true, openedAt: true, userId: true,
    },
  });

  const userIds = recipients.map((r) => r.userId).filter((x): x is string => x !== null);

  const [progress, attempts] = await Promise.all([
    userIds.length
      ? prisma.lessonProgress.findMany({
          where: { userId: { in: userIds }, lessonId: { in: lessons.map((l) => l.id) } },
          select: { userId: true, lessonId: true, status: true, completedAt: true },
        })
      : Promise.resolve([]),
    userIds.length
      ? prisma.attempt.findMany({
          where: { userId: { in: userIds }, voided: false, question: { domainId: active.id } },
          select: { userId: true, isCorrect: true, createdAt: true, question: { select: { topic: true } } },
        })
      : Promise.resolve([]),
  ]);

  // ── compunerea, în memorie ────────────────────────────────────────────────
  const lessonModule = new Map(lessons.map((l) => [l.id, l.moduleId]));
  const doneByUser = new Map<string, Map<string, Date>>(); // userId → moduleId → când
  for (const p of progress) {
    if (p.status !== "COMPLETED") continue;
    const mid = lessonModule.get(p.lessonId);
    if (!mid) continue;
    const m = doneByUser.get(p.userId) ?? new Map();
    const at = p.completedAt ?? new Date();
    if (!m.has(mid) || at > (m.get(mid) as Date)) m.set(mid, at);
    doneByUser.set(p.userId, m);
  }

  const topicModule = new Map(
    modules.filter((m) => m.questionTopic).map((m) => [m.questionTopic as string, m.id])
  );
  type Tally = { ok: number; total: number; last: Date };
  const scoreByUser = new Map<string, Map<string, Tally>>();
  for (const a of attempts) {
    const mid = topicModule.get(a.question.topic ?? "");
    if (!mid) continue;
    const m = scoreByUser.get(a.userId) ?? new Map<string, Tally>();
    const t = m.get(mid) ?? { ok: 0, total: 0, last: a.createdAt };
    t.total += 1;
    if (a.isCorrect) t.ok += 1;
    if (a.createdAt > t.last) t.last = a.createdAt;
    m.set(mid, t);
    scoreByUser.set(a.userId, m);
  }

  const cols: ModuleCol[] = modules.map((m) => ({ id: m.id, order: m.order, title: m.title }));

  const rows: RosterRow[] = recipients.map((r) => {
    const done = r.userId ? doneByUser.get(r.userId) : undefined;
    const sc = r.userId ? scoreByUser.get(r.userId) : undefined;
    const lectiiFacute = done?.size ?? 0;
    const testeDate = sc?.size ?? 0;

    let stare: RosterRow["stare"] = "netrimisa";
    if (r.invitedAt) stare = "trimisa";
    if (r.openedAt) stare = "apasat";
    if (r.userId) stare = "cont";
    if (lectiiFacute > 0 || testeDate > 0) stare = "invata";
    if (cols.length > 0 && lectiiFacute >= cols.length && testeDate >= cols.length) stare = "terminat";

    return {
      id: r.id,
      nume: `${r.lastName} ${r.firstName}`,
      functie: r.jobTitle,
      marca: r.badgeNo,
      unde: [r.postOffice, [r.city, r.county].filter(Boolean).join(", ") || null]
        .filter(Boolean)
        .join(" · ") || null,
      telefon: r.phone,
      stare,
      invitedAt: r.invitedAt ? r.invitedAt.toISOString() : null,
      openedAt: r.openedAt ? r.openedAt.toISOString() : null,
      moduleCells: cols.map((c) => {
        const at = done?.get(c.id) ?? null;
        const t = sc?.get(c.id) ?? null;
        return {
          moduleId: c.id,
          lectieLa: at ? at.toISOString() : null,
          corecte: t?.ok ?? null,
          total: t?.total ?? null,
          testLa: t ? t.last.toISOString() : null,
        };
      }),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cursanți</h1>
          <p className="mt-1 text-sm text-gray-400">
            {active.organization?.name ? `${active.organization.name} — ` : ""}
            {active.name} · {rows.length} {rows.length === 1 ? "persoană" : "persoane"}
          </p>
        </div>
        <Link
          href="/dashboard/admin/invitatii"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-gray-500"
        >
          Trimite invitație
        </Link>
      </div>

      {domains.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {domains.map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/admin/cursanti?materie=${d.id}`}
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

      <Roster rows={rows} cols={cols} />
    </div>
  );
}
