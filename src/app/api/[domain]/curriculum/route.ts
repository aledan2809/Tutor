import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { canAccessDomain } from "@/lib/domain-access";
import { bandForDomainSlug, BAND_YEARS, unitsForStudent } from "@/lib/curriculum";
import { getCurriculumState, saveChecklist } from "@/lib/curriculum-service";

// Aceeași poartă de acces ca session/start — checklistul unui domeniu nu e
// vizibil cuiva care nu poate exersa domeniul (consistență, finding review).
async function domainAccessError(
  user: { id: string } & Record<string, unknown>,
  domainSlug: string
): Promise<NextResponse | null> {
  const domain = await prisma.domain.findUnique({ where: { slug: domainSlug } });
  if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  if (!canAccessDomain(user as Parameters<typeof canAccessDomain>[0], domainSlug, domain.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// Checklistul programei parcurse pentru un domeniu: GET = starea celor două
// rânduri (programa la zi + bifele elevului), PUT = flow-ul de inițiere sau o
// editare ulterioară. Doar domeniile cu bandă de curriculum răspund aici.

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { domain: domainSlug } = await params;
  const accessErr = await domainAccessError(session.user, domainSlug);
  if (accessErr) return accessErr;

  // ?schoolYear= — flow-ul de inițiere cere rândurile pentru anul ABIA ales,
  // înainte de orice salvare. Fără asta, un user nou (fără an în DB) ar primi
  // rows:[] → checklist gol → salvat gol → lockout (finding review).
  const rawYear = _req.nextUrl.searchParams.get("schoolYear");
  const previewYear = rawYear !== null ? Number(rawYear) : undefined;

  const state = await getCurriculumState(session.user.id, domainSlug, previewYear);
  if (!state) {
    return NextResponse.json({ error: "Domain has no curriculum band" }, { status: 404 });
  }
  return NextResponse.json({
    band: state.band,
    initiated: state.initiated,
    schoolYear: state.schoolYear,
    week: state.week,
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
  const accessErr = await domainAccessError(session.user, domainSlug);
  if (accessErr) return accessErr;

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

  const res = await saveChecklist(session.user.id, band, schoolYear, taught);
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
