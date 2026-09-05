import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { requireContentAdmin, ownsDomain } from "@/lib/merchant-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

/**
 * People, for a merchant admin.
 *
 * Deliberately NOT an extension of /api/admin/users: that route can set
 * `isSuperAdmin` on the account it creates. Putting a merchant admin behind it
 * would make a single missed branch the difference between "adds an agent" and
 * "mints a platform superadmin". This route cannot express that at all — the
 * shape it writes has no such field.
 *
 * The roles it may grant stop at INSTRUCTOR. If a merchant admin could grant
 * ADMIN, they could make an accomplice who makes another one, and the boundary
 * an organization draws would last exactly one hop.
 */
const GRANTABLE_ROLES = ["STUDENT", "WATCHER", "INSTRUCTOR"] as const;

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  domainId: z.string().min(1),
  roles: z.array(z.enum(GRANTABLE_ROLES)).min(1).default(["STUDENT"]),
});

/** GET — the organization's own people. The superadmin sees everyone, as before. */
async function _GET(req: NextRequest) {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
  const users = await prisma.user.findMany({
    where: {
      ...(scope.kind === "ORG" ? { organizationId: scope.organizationId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      isOrgAdmin: true,
      isBanned: true,
      createdAt: true,
      enrollments: {
        where: { isActive: true },
        select: { roles: true, domain: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  return NextResponse.json({ users, scope: scope.kind });
}

/** POST — create an account and enroll it, in one of the organization's own subjects. */
async function _POST(req: NextRequest) {
  const { error, scope, userId } = await requireContentAdmin();
  if (error) return error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password, domainId, roles } = parsed.data;

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    select: { id: true, name: true, organizationId: true },
  });
  // 404, not 403: a merchant must not learn which subjects other merchants have.
  if (!ownsDomain(scope, domain)) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "Există deja un cont cu acest e-mail" }, { status: 409 });
  }

  // The account belongs to the merchant that created it. For the superadmin
  // creating one directly it belongs to the subject's organization, which for a
  // platform subject is null — a platform account, exactly as before.
  const organizationId =
    scope.kind === "ORG" ? scope.organizationId : domain!.organizationId;

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        emailVerified: new Date(),
        organizationId,
        accountRole: roles.includes("STUDENT") ? "STUDENT" : null,
      },
      select: { id: true, name: true, email: true },
    });
    await tx.enrollment.create({
      data: { userId: user.id, domainId, roles: [...roles], isActive: true },
    });
    return user;
  });

  await logAudit({
    action: "ORG_USER_CREATE",
    performedById: userId,
    targetUserId: created.id,
    targetType: "User",
    metadata: { organizationId, domainId, domainName: domain!.name, roles, scope: scope.kind },
  });

  return NextResponse.json({ user: created }, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
