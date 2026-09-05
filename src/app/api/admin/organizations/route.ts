import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

/**
 * Organizations themselves are platform business: only the superadmin creates a
 * merchant, assigns subjects to it, or appoints its admin. A merchant admin
 * administers INSIDE their organization and can never create another one.
 */
const createSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "doar litere mici, cifre și cratime"),
});

async function _GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: { select: { domains: true, members: true } },
    },
  });
  return NextResponse.json({ organizations });
}

async function _POST(req: NextRequest) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const clash = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (clash) {
    return NextResponse.json({ error: "Există deja o organizație cu acest identificator" }, { status: 409 });
  }

  const organization = await prisma.organization.create({
    data: parsed.data,
    select: { id: true, name: true, slug: true },
  });

  await logAudit({
    action: "ORGANIZATION_CREATE",
    performedById: session.user.id,
    targetType: "Organization",
    metadata: { organizationId: organization.id, slug: organization.slug, name: organization.name },
  });

  return NextResponse.json({ organization }, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
