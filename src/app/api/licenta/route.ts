import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import type { DomainAccessUser } from "@/lib/domain-access";
import { canUseLicenta, ensureLicentaDomainAndStudent } from "@/lib/licenta";
import { extractAndSegment, fileTypeFromName } from "@/lib/grila-generate";

const UPLOAD_DIR = process.env.LICENTA_UPLOAD_DIR || "/var/www/tutor-uploads/licenta";
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

/** GET /api/licenta — list uploaded materials (private; admins + Rareș). */
async function _GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseLicenta(session.user as unknown as DomainAccessUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const docs = await prisma.licentaDocument.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      fileType: true,
      status: true,
      totalPassages: true,
      processedPassages: true,
      questionCount: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ docs });
}

/** POST /api/licenta — upload a document; segments it and creates a processing record. */
async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseLicenta(session.user as unknown as DomainAccessUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "Încarcă un fișier" }, { status: 400 });
  }
  const f = file as File;
  const type = fileTypeFromName(f.name);
  if (!type) {
    return NextResponse.json({ error: "Format acceptat: PDF, DOCX sau TXT" }, { status: 400 });
  }
  if (f.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Fișier prea mare (${Math.round(f.size / 1024 / 1024)} MB, max 25 MB)` },
      { status: 413 }
    );
  }
  const title =
    ((formData.get("title") as string) || "").trim() ||
    f.name.replace(/\.[^.]+$/, "") ||
    "Material licență";

  const { domainId, studentId } = await ensureLicentaDomainAndStudent();
  if (!studentId) {
    return NextResponse.json(
      { error: "Contul studentului (Rareș) nu există încă în platformă." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await f.arrayBuffer());

  let passages;
  try {
    passages = await extractAndSegment(buffer, type);
  } catch (err) {
    return NextResponse.json(
      { error: `Nu am putut citi documentul: ${(err as Error).message}` },
      { status: 400 }
    );
  }
  if (passages.length === 0) {
    return NextResponse.json({ error: "Documentul nu conține text utilizabil." }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const fname = `${randomUUID()}.${type}`;
  const filePath = path.join(UPLOAD_DIR, fname);
  await writeFile(filePath, buffer);

  const doc = await prisma.licentaDocument.create({
    data: {
      userId: studentId,
      domainId,
      title,
      filePath,
      fileType: type,
      totalPassages: passages.length,
      status: "processing",
      createdById: session.user.id,
    },
    select: { id: true, title: true, totalPassages: true },
  });

  return NextResponse.json(doc, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
