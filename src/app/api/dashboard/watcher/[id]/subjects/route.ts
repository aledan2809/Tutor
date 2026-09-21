import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isParentOf } from "@/lib/guardian";
import { refuseIfPaused } from "@/lib/access-gate";
import { activeSetters, setByLabel } from "@/lib/guardian-lock";
import { enableLearnerSubject } from "@/lib/family-invite";
import { subjectAddonQuote, subjectNeedsPayment } from "@/lib/checkout-facts";

/**
 * The child's subjects, from the parent's page (Alex, 16.09.2026: the parent has the last word on the
 * child's hours and subjects). Adding or removing one marks it as the parent's: the child can't add
 * back a subject a parent removed (guardian-lock.ts). Parents only — a family tutor doesn't decide
 * the child's subjects. Public subjects only — a course a company or a school enrolled the child in
 * is theirs to manage, and isn't listed here.
 */

type Guard = { ok: false; response: NextResponse } | { ok: true; userId: string };

async function guardOf(childId: string): Promise<Guard> {
  const session = await getSession();
  if (!session?.user) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const paused = await refuseIfPaused(session.user.id);
  if (paused) return { ok: false, response: paused };
  if (!(await isParentOf(session.user.id, childId))) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: session.user.id };
}

const domainSelect = { id: true, name: true, slug: true, icon: true, visibility: true, isActive: true } as const;

async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = await params;
  const guard = await guardOf(childId);
  if (!guard.ok) return guard.response;

  const [enrollments, publicDomains] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: childId, roles: { hasSome: ["STUDENT"] }, domain: { isActive: true, visibility: "PUBLIC" } },
      select: { isActive: true, setById: true, domain: { select: domainSelect } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.domain.findMany({
      where: { isActive: true, visibility: "PUBLIC" },
      select: { id: true, name: true, slug: true, icon: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const owners = await activeSetters(childId, enrollments.map((e) => e.setById));
  const view = (e: (typeof enrollments)[number]) => ({
    domainId: e.domain.id,
    name: e.domain.name,
    slug: e.domain.slug,
    icon: e.domain.icon,
    // A company or school course can't be removed from here.
    managedElsewhere: e.domain.visibility === "PRIVATE",
    ...setByLabel(e.setById, guard.userId, owners),
  });

  const active = enrollments.filter((e) => e.isActive);
  const activeIds = new Set(active.map((e) => e.domain.id));
  return NextResponse.json({
    subjects: active.map(view),
    // Removed by a guardian who is still one: the child can't add these back.
    removed: enrollments.filter((e) => !e.isActive && e.setById && owners.has(e.setById)).map(view),
    available: publicDomains.filter((d) => !activeIds.has(d.id)),
  });
}

const bodySchema = z.object({ domainId: z.string().min(1) });

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = await params;
  const guard = await guardOf(childId);
  if (!guard.ok) return guard.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Alege o materie." }, { status: 400 });
  const domain = await prisma.domain.findUnique({ where: { id: parsed.data.domainId }, select: domainSelect });
  // 404 for a private one too: it must not confirm that it exists.
  if (!domain || !domain.isActive || domain.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Materia nu există." }, { status: 404 });
  }

  // Past the subjects the card subscription pays for: the parent who pays gets the price of the next
  // subject and pays it on its own subscription; another parent is told who does (checkout-facts.ts).
  const payer = await subjectNeedsPayment(childId, domain.id);
  if (payer) {
    const quote = payer.payerId === guard.userId ? await subjectAddonQuote(payer.payerId) : null;
    return NextResponse.json(
      {
        // With a quote the page shows the offer, with the price in the parent's language.
        error: quote ? "O materie în plus se plătește separat." : "Materiile în plus le adaugă părintele care plătește abonamentul.",
        code: "SUBJECT_ADDON",
        quote,
      },
      { status: 402 }
    );
  }

  // Every adult of the family follows the child in the new subject (the watcher lists only the
  // child's subjects the adult has a WATCHER enrollment in).
  await enableLearnerSubject(childId, domain.id, guard.userId);

  return NextResponse.json({ success: true }, { status: 201 });
}

async function _DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = await params;
  const guard = await guardOf(childId);
  if (!guard.ok) return guard.response;

  const domainId = req.nextUrl.searchParams.get("domainId");
  if (!domainId) return NextResponse.json({ error: "Alege o materie." }, { status: 400 });
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_domainId: { userId: childId, domainId } },
    select: { id: true, isActive: true, roles: true, domain: { select: { visibility: true, slug: true } } },
  });
  if (!enrollment || !enrollment.isActive || !enrollment.roles.includes("STUDENT")) {
    return NextResponse.json({ error: "Copilul nu are această materie." }, { status: 404 });
  }
  if (enrollment.domain.visibility === "PRIVATE" || enrollment.roles.some((r) => r === "ADMIN" || r === "INSTRUCTOR")) {
    return NextResponse.json(
      { error: "Materia aceasta vine de la o școală sau o firmă și se gestionează de acolo." },
      { status: 403 },
    );
  }

  await prisma.$transaction([
    prisma.enrollment.update({ where: { id: enrollment.id }, data: { isActive: false, setById: guard.userId } }),
    // Reminders that opened this subject keep the child's schedule but open the default subject:
    // otherwise they'd lead into a subject the child can't open, and alert the parent for it.
    prisma.studyReminder.updateMany({ where: { userId: childId, domainSlug: enrollment.domain.slug }, data: { domainSlug: null } }),
  ]);
  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
export const DELETE = withErrorHandler(_DELETE);
