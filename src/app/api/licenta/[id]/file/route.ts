import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain; charset=utf-8",
};

/**
 * GET: serve a licență source document inline (so the admin feedback view can
 * deep-link to the exact page). Access: superadmin / any ADMIN / the document's
 * owner (the student). Served inline; the caller appends #page=N.
 */
async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const doc = await prisma.licentaDocument.findUnique({
    where: { id },
    select: { filePath: true, fileType: true, userId: true, title: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin =
    session.user.isSuperAdmin ||
    session.user.enrollments?.some((e) => e.roles.includes("ADMIN" as never));
  const isOwner = session.user.id === doc.userId;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let data: Buffer;
  try {
    data = await readFile(doc.filePath);
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }

  return new NextResponse(data as unknown as BodyInit, {
    headers: {
      "Content-Type": MIME[doc.fileType] ?? "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    },
  });
}

export const GET = withErrorHandler(_GET);
