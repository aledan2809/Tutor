import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireContentAdmin, resolveOwnedDomain } from "@/lib/merchant-auth";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const examConfigSchema = z.object({
  questionTypes: z.array(z.enum(["MULTIPLE_CHOICE", "OPEN"])),
  timeLimit: z.number().int().positive().nullable().optional(),
  questionCount: z.number().int().min(1).max(200).default(20),
  passingScore: z.number().min(0).max(100).default(75),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const { id } = await params;

  // Reading a subject's exam settings — including the "no config yet" answer, which
  // would otherwise reveal whether a foreign subject exists — is limited to the
  // merchant's own subjects. Gated on ORG so the superadmin's answers, defaults
  // included, are exactly the ones it got before.
  if (scope.kind === "ORG") {
    const owned = await resolveOwnedDomain(scope, id);
    if (!owned.ok) return owned.response;
  }

  const config = await prisma.examConfig.findUnique({
    where: { domainId: id },
    include: { domain: { select: { name: true } } },
  });

  if (!config) {
    // Return defaults
    return NextResponse.json({
      domainId: id,
      questionTypes: ["MULTIPLE_CHOICE"],
      timeLimit: null,
      questionCount: 20,
      passingScore: 75,
      shuffleQuestions: true,
      shuffleOptions: true,
    });
  }

  return NextResponse.json(config);
}

async function _PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, scope } = await requireContentAdmin();
  if (error) return error;

  const { id } = await params;

  // The subject whose exam settings are written must be the merchant's own; the id
  // arrives from the URL and is otherwise trusted straight into the upsert.
  if (scope.kind === "ORG") {
    const owned = await resolveOwnedDomain(scope, id);
    if (!owned.ok) return owned.response;
  }

  const body = await req.json();
  const parsed = examConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { metadata, ...rest } = parsed.data;
  const data = {
    ...rest,
    metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
  };

  const config = await prisma.examConfig.upsert({
    where: { domainId: id },
    update: data,
    create: { domainId: id, ...data },
  });

  return NextResponse.json(config);
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
