import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { resolveDomainOrForbid } from "@/lib/domain-gate";
import { isParentOf } from "@/lib/guardian";
import { bandForDomainSlug, BAND_YEARS, unitsForStudent } from "@/lib/curriculum";
import { getCurriculumState, saveChecklist } from "@/lib/curriculum-service";

// Cine poate citi/scrie checklistul unui COPIL (?childId=). Reguli întărite
// după review-ul de securitate (2026-08-25):
//  - PĂRINTE = legătură Guardian activă cu relation PARENT (un TUTOR de
//    familie NU trece drept părinte — ar fi scris cross-domeniu cu eticheta
//    GUARDIAN falsă);
//  - MEDITATOR = rol INSTRUCTOR/ADMIN pe domeniu, verificat LIVE în DB (nu
//    doar din JWT-ul care poate fi vechi de până la 5 min — prima scriere
//    cross-user din codebase merită verificarea proaspătă);
//  - superadmin = echivalent INSTRUCTOR (consistent cu toate celelalte gate-uri;
//    fără asta, exact paginile montate pentru el îi arătau un gol tăcut);
//  - în TOATE cazurile copilul trebuie să aibă enrollment STUDENT ACTIV pe
//    domeniu — fără el, un adult putea "iniția" o bandă pe care copilul n-o
//    folosea și poarta îl bloca la zero când ajungea acolo.
async function resolveChildAccess(
  requester: { id: string; isSuperAdmin?: boolean },
  childId: string,
  domainSlug: string
): Promise<"GUARDIAN" | "INSTRUCTOR" | null> {
  if (childId === requester.id) return null; // self nu e "child path"
  const domain = await prisma.domain.findUnique({ where: { slug: domainSlug }, select: { id: true } });
  if (!domain) return null;
  const childEnrolled = await prisma.enrollment.findFirst({
    where: { userId: childId, domainId: domain.id, isActive: true, roles: { hasSome: ["STUDENT"] } },
    select: { id: true },
  });
  if (!childEnrolled) return null;

  if (await isParentOf(requester.id, childId)) return "GUARDIAN";
  if (requester.isSuperAdmin) return "INSTRUCTOR";
  const teaches = await prisma.enrollment.findFirst({
    where: {
      userId: requester.id,
      domainId: domain.id,
      isActive: true,
      roles: { hasSome: ["INSTRUCTOR", "ADMIN"] },
    },
    select: { id: true },
  });
  return teaches ? "INSTRUCTOR" : null;
}

// Aceeași poartă de acces ca session/start — checklistul unui domeniu nu e
// vizibil cuiva care nu poate exersa domeniul (self-path; child-path-ul are
// propriile reguli în resolveChildAccess).
async function domainAccessError(
  user: { id: string } & Record<string, unknown>,
  domainSlug: string
): Promise<NextResponse | null> {
  const gate = await resolveDomainOrForbid(domainSlug, user);
  if (!gate.ok) return gate.response;
  return null;
}

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { domain: domainSlug } = await params;

  // ?childId= — părintele/meditatorul citește checklistul copilului. Accesul
  // vine din RELAȚIE (guardian / predă domeniul), nu din enrollmentul propriu:
  // părintele tipic nu e înscris la materia copilului.
  const childId = _req.nextUrl.searchParams.get("childId");
  let subjectUserId = session.user.id;
  if (childId && childId !== session.user.id) {
    const rel = await resolveChildAccess(session.user, childId, domainSlug);
    if (!rel) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    subjectUserId = childId;
  } else {
    const accessErr = await domainAccessError(session.user, domainSlug);
    if (accessErr) return accessErr;
  }

  // ?schoolYear= — flow-ul de inițiere cere rândurile pentru anul ABIA ales,
  // înainte de orice salvare. Fără asta, un user nou (fără an în DB) ar primi
  // rows:[] → checklist gol → salvat gol → lockout (finding review).
  const rawYear = _req.nextUrl.searchParams.get("schoolYear");
  const previewYear = rawYear !== null ? Number(rawYear) : undefined;

  const state = await getCurriculumState(subjectUserId, domainSlug, previewYear);
  if (!state) {
    return NextResponse.json({ error: "Domain has no curriculum band" }, { status: 404 });
  }
  return NextResponse.json({
    band: state.band,
    initiated: state.initiated,
    schoolYear: state.schoolYear,
    week: state.week,
    revision: state.revision,
    bandYears: BAND_YEARS[state.band],
    rows: state.rows.map((r) => ({
      key: r.unit.key,
      label: r.unit.label,
      year: r.unit.year,
      weeks: r.unit.weeks,
      expectedByNow: r.expectedByNow,
      taught: r.taught,
    })),
  });
}

async function _PUT(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { domain: domainSlug } = await params;
  const band = bandForDomainSlug(domainSlug);
  if (!band) {
    return NextResponse.json({ error: "Domain has no curriculum band" }, { status: 404 });
  }

  const childId = req.nextUrl.searchParams.get("childId");
  let subjectUserId = session.user.id;
  let markedBy: "SELF" | "GUARDIAN" | "INSTRUCTOR" = "SELF";
  if (childId && childId !== session.user.id) {
    const rel = await resolveChildAccess(session.user, childId, domainSlug);
    if (!rel) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    subjectUserId = childId;
    markedBy = rel;
  } else {
    const accessErr = await domainAccessError(session.user, domainSlug);
    if (accessErr) return accessErr;
  }

  let body: { schoolYear?: unknown; taught?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // `null` e JSON valid — parse-ul reușește și abia body.schoolYear ar arunca
  // (500 în loc de 400 pe input degenerat; găsit de /review, 2026-08-24).
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  const schoolYear = Number(body.schoolYear);
  if (!Number.isInteger(schoolYear) || !BAND_YEARS[band].includes(schoolYear)) {
    return NextResponse.json(
      { error: "schoolYear must be one of the band's years", bandYears: BAND_YEARS[band] },
      { status: 400 }
    );
  }

  // taught: { [unitKey]: boolean } — doar chei cunoscute, doar booleeni.
  // Cheile lipsă devin false (nepredat) — fail-closed, nu deblocăm din tăcere.
  const raw = body.taught;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return NextResponse.json({ error: "taught must be an object of booleans" }, { status: 400 });
  }
  const taught = new Map<string, boolean>();
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v !== "boolean") {
      return NextResponse.json({ error: `taught.${k} must be a boolean` }, { status: 400 });
    }
    taught.set(k, v);
  }

  // Revizia optimistă: clientul trimite ce a văzut la încărcare; nepotrivirea
  // înseamnă că elevul/celălalt adult a salvat între timp → 409, se reîncarcă.
  const expectedRevision =
    "revision" in body ? ((body as { revision?: unknown }).revision as string | null) : undefined;
  if (expectedRevision !== undefined && expectedRevision !== null && typeof expectedRevision !== "string") {
    return NextResponse.json({ error: "revision must be a string or null" }, { status: 400 });
  }

  const res = await saveChecklist(subjectUserId, band, schoolYear, taught, markedBy, {
    markedById: session.user.id,
    expectedRevision,
  });
  if (res.conflict) {
    return NextResponse.json(
      { error: "Checklist changed since load", conflict: true },
      { status: 409 }
    );
  }
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  return NextResponse.json({
    saved: true,
    unitCount: unitsForStudent(band, schoolYear).length,
  });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
