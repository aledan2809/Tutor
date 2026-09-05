import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireContentAdmin,
  domainScopeWhere,
  ownsDomain,
  resolveOwnedDomain,
} from "@/lib/merchant-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const schema = z.object({
  domainId: z.string().min(1),
  title: z.string().min(1),
  authors: z.string().min(1),
  publisher: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  edition: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  order: z.number().int().default(0),
  status: z.enum(["DRAFT", "APPROVED", "PUBLISHED"]).default("DRAFT"),
});

async function _GET(req: NextRequest) {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (domainId) where.domainId = domainId;
  if (status) where.status = status;
  // A merchant admin sees only entries filed under its own organization's
  // subjects. PLATFORM adds no filter, so the superadmin's query is unchanged.
  if (scope.kind === "ORG") where.domain = domainScopeWhere(scope);

  const items = await prisma.bibliography.findMany({
    where,
    include: { domain: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const domains = await prisma.domain.findMany({
    where: { isActive: true, ...domainScopeWhere(scope) },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ items, domains });
}

async function _POST(req: NextRequest) {
  const { error, scope, userId } = await requireContentAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // The subject written into must be the merchant's own. Gated on ORG because
  // for PLATFORM the check can only ever pass, and gating keeps the superadmin's
  // path — including its behaviour on a bogus domainId — exactly as it was.
  if (scope.kind === "ORG") {
    const owned = await resolveOwnedDomain(scope, parsed.data.domainId);
    if (!owned.ok) return owned.response;
  }

  const item = await prisma.bibliography.create({
    data: { ...parsed.data, createdBy: userId },
  });
  return NextResponse.json(item, { status: 201 });
}

async function _PUT(req: NextRequest) {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const parsed = schema.partial().safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (scope.kind === "ORG") {
    // Both the subject the entry is in and the subject it would be moved to must
    // be the merchant's own. 404, not 403: a foreign entry must read as absent.
    const existing = await prisma.bibliography.findUnique({
      where: { id },
      select: { domain: { select: { organizationId: true } } },
    });
    if (!existing || !ownsDomain(scope, existing.domain)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (parsed.data.domainId) {
      const owned = await resolveOwnedDomain(scope, parsed.data.domainId);
      if (!owned.ok) return owned.response;
    }
  }

  const item = await prisma.bibliography.update({ where: { id }, data: parsed.data });
  return NextResponse.json(item);
}

async function _DELETE(req: NextRequest) {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (scope.kind === "ORG") {
    const existing = await prisma.bibliography.findUnique({
      where: { id },
      select: { domain: { select: { organizationId: true } } },
    });
    if (!existing || !ownsDomain(scope, existing.domain)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  await prisma.bibliography.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
export const PUT = withErrorHandler(_PUT);
export const DELETE = withErrorHandler(_DELETE);
