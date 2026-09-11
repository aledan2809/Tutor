import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { agregaGreseliPeModul, procentGreseli } from "@/lib/roster-aggregate";
import { rezumaModul, type IncercareRezumat } from "@/lib/scor-reluare";

/**
 * Numere ca în românește, pe un ecran care la un client mare arată patru cifre.
 * `1234 cursanți` e greșit gramatical (de la 20 în sus se cere „de") și greu de citit
 * fără separator de mii.
 */
const nr = (n: number) => n.toLocaleString("ro-RO");
const subst = (n: number, singular: string, plural: string) =>
  n === 1 ? singular : n % 100 >= 20 || n % 100 === 0 ? `de ${plural}` : plural;
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
      // Cu ce se loghează omul — ca managerul să i-l poată spune când l-a uitat.
      user: { select: { username: true, email: true } },
    },
  });

  // TOȚI cei înscriși, nu doar cei de pe lista de invitații.
  //
  // Prima versiune lista doar destinatarii, iar cine intrase pe codul comun al
  // materiei era invizibil — deși lecțiile citite și răspunsurile lui erau scrise
  // în baza de date. Un tablou care ascunde muncă făcută e mai rău decât unul
  // care lipsește: managerul ar trage concluzia că omul n-a lucrat.
  const enrolled = await prisma.enrollment.findMany({
    where: { domainId: active.id, isActive: true },
    take: LIMIT,
    select: {
      userId: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true, username: true, isGuest: true },
      },
    },
  });

  const recipientByUser = new Map(
    recipients.filter((r) => r.userId).map((r) => [r.userId as string, r])
  );
  const userIds = Array.from(
    new Set([
      ...recipients.map((r) => r.userId).filter((x): x is string => x !== null),
      ...enrolled.map((e) => e.userId),
    ])
  );

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
          select: { userId: true, questionId: true, isCorrect: true, createdAt: true, question: { select: { topic: true } } },
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
  /*
   * Încercările se strâng BRUT, pe (om, modul), și se rezumă cu `rezumaModul`.
   *
   * Înainte se aduna direct: `total += 1` la fiecare încercare. Efectul, măsurat pe date
   * reale: cine făcea 2/4 și apoi învăța cele două greșite apărea cu 4/6 = 67%, deși
   * ajunsese să știe 4 din 4 — cine se întorcea arăta mai prost decât cine se oprea.
   */
  const incercariPeModul = new Map<string, Map<string, IncercareRezumat[]>>();
  const ultimaPeModul = new Map<string, Map<string, Date>>();
  for (const a of attempts) {
    const mid = topicModule.get(a.question.topic ?? "");
    if (!mid) continue;
    const peUser = incercariPeModul.get(a.userId) ?? new Map<string, IncercareRezumat[]>();
    const lista = peUser.get(mid) ?? [];
    lista.push({ questionId: a.questionId, isCorrect: a.isCorrect, createdAt: a.createdAt });
    peUser.set(mid, lista);
    incercariPeModul.set(a.userId, peUser);
    const uz = ultimaPeModul.get(a.userId) ?? new Map<string, Date>();
    const prec = uz.get(mid);
    if (!prec || a.createdAt > prec) uz.set(mid, a.createdAt);
    ultimaPeModul.set(a.userId, uz);
  }

  const cols: ModuleCol[] = modules.map((m) => ({ id: m.id, order: m.order, title: m.title }));

  /*
   * Pe ce modul se greșește cel mai mult — pe toată grupa, nu pe om.
   * Calculul stă în `roster-aggregate.ts` ca să poată fi probat cu teste: pagina
   * asta cere autentificare, deci altfel singura verificare ar fi fost privitul cu
   * ochii, care nu prinde un raport inversat sau o împărțire la zero.
   * Se folosesc încercările deja aduse pentru tablou — nicio interogare în plus.
   */
  const agregatPeModul = agregaGreseliPeModul(
    modules,
    attempts.map((a) => ({ userId: a.userId, isCorrect: a.isCorrect, topic: a.question.topic })),
  );

  /** Celulele pe module pentru un utilizator — aceleași, indiferent de unde vine rândul. */
  const celule = (userId: string | null) => {
    const done = userId ? doneByUser.get(userId) : undefined;
    const inc = userId ? incercariPeModul.get(userId) : undefined;
    const ult = userId ? ultimaPeModul.get(userId) : undefined;
    return {
      lectiiFacute: done?.size ?? 0,
      testeDate: inc?.size ?? 0,
      moduleCells: cols.map((c) => {
        const at = done?.get(c.id) ?? null;
        const lista = inc?.get(c.id);
        const rez = lista ? rezumaModul(lista) : null;
        return {
          moduleId: c.id,
          lectieLa: at ? at.toISOString() : null,
          stieAcum: rez?.stieAcum ?? null,
          atinse: rez?.atinse ?? null,
          dinPrima: rez?.dinPrima ?? null,
          recuperari: rez?.recuperari ?? null,
          testLa: ult?.get(c.id)?.toISOString() ?? null,
        };
      }),
    };
  };

  const stareDin = (
    lectiiFacute: number,
    testeDate: number,
    have: { invitedAt: Date | null; openedAt: Date | null; userId: string | null }
  ): RosterRow["stare"] => {
    if (cols.length > 0 && lectiiFacute >= cols.length && testeDate >= cols.length) return "terminat";
    if (lectiiFacute > 0 || testeDate > 0) return "invata";
    if (have.userId) return "cont";
    if (have.openedAt) return "apasat";
    if (have.invitedAt) return "trimisa";
    return "netrimisa";
  };

  const dinLista: RosterRow[] = recipients.map((r) => {
    const c = celule(r.userId);
    return {
      id: r.id,
      nume: `${r.lastName} ${r.firstName}`,
      functie: r.jobTitle,
      marca: r.badgeNo,
      unde: [r.postOffice, [r.city, r.county].filter(Boolean).join(", ") || null]
        .filter(Boolean)
        .join(" · ") || null,
      telefon: r.phone,
      recipientId: r.id,
      numeFamilie: r.lastName,
      prenume: r.firstName,
      judet: r.county,
      oras: r.city,
      oficiu: r.postOffice,
      utilizator: r.user?.username || r.user?.email || null,
      dePeLista: true,
      anonim: false,
      userId: r.userId,
      stare: stareDin(c.lectiiFacute, c.testeDate, r),
      invitedAt: r.invitedAt ? r.invitedAt.toISOString() : null,
      openedAt: r.openedAt ? r.openedAt.toISOString() : null,
      moduleCells: c.moduleCells,
    };
  });

  // Cine a intrat pe codul comun n-are rând pe listă, dar are muncă făcută. Îl
  // arătăm cu ce știm despre el — mai puțin decât ne-am dori, dar infinit mai
  // mult decât să dispară.
  const faraLista: RosterRow[] = enrolled
    .filter((e) => !recipientByUser.has(e.userId))
    .map((e) => {
      const c = celule(e.userId);
      const identitate =
        e.user.name?.trim() || e.user.email || e.user.username || null;
      return {
        id: `u:${e.userId}`,
        nume: identitate ?? "Fără identitate",
        // Ce ȘTIM despre el, nu de unde a intrat: contul demonstrativ are nume și
        // email, deci a-l eticheta „fără date de identificare" era o minciună.
        anonim: identitate === null,
        functie: null,
        marca: null,
        unde: null,
        telefon: "",
        recipientId: null,
        numeFamilie: null,
        prenume: null,
        judet: null,
        oras: null,
        oficiu: null,
        utilizator: e.user.username || e.user.email || null,
        dePeLista: false,
        userId: e.userId,
        stare: stareDin(c.lectiiFacute, c.testeDate, {
          invitedAt: null,
          openedAt: e.createdAt,
          userId: e.userId,
        }),
        invitedAt: null,
        openedAt: e.createdAt.toISOString(),
        moduleCells: c.moduleCells,
      };
    });

  // Cine a lucrat apare primul: managerul caută munca, nu lista.
  const rows: RosterRow[] = [...dinLista, ...faraLista].sort((a, b) => {
    const scor = (r: RosterRow) =>
      r.moduleCells.reduce((n, c) => n + (c.lectieLa ? 1 : 0) + (c.atinse ? 1 : 0), 0);
    const d = scor(b) - scor(a);
    return d !== 0 ? d : a.nume.localeCompare(b.nume, "ro");
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

      {agregatPeModul.length > 0 && (
        <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
          <h2 className="text-base font-semibold text-gray-100">Pe ce modul se greșește cel mai mult</h2>
          <p className="mt-1 text-xs text-gray-500">
            Pe toată grupa, nu pe om. Se numără încercările greșite, nu oamenii — coloana
            din dreapta spune câți cursanți au ajuns la modul.
          </p>
          <ul className="mt-4 space-y-2.5">
            {agregatPeModul.map((m) => {
              const pct = procentGreseli(m);
              const culoare = pct >= 50 ? "bg-red-500" : pct >= 30 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <li key={m.moduleId} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-gray-200">
                      <span className="text-gray-500">M{m.ordine} · </span>
                      {m.titlu}
                    </span>
                    <span className="shrink-0 tabular-nums text-gray-400">
                      <span className="font-semibold text-gray-200">{pct}%</span> greșit
                      <span className="ml-2 text-xs text-gray-600">
                        {nr(m.greseli)}/{nr(m.total)} {subst(m.total, "răspuns", "răspunsuri")} ·{" "}
                        {nr(m.cursanti)} {subst(m.cursanti, "cursant", "cursanți")}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                    <div className={`h-full ${culoare}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Roster rows={rows} cols={cols} domainId={active.id} />
    </div>
  );
}
