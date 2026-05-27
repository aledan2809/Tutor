import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

const CV_DIR = process.env.CV_UPLOAD_DIR || "/var/www/tutor-uploads/cv";
const TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// SuperAdmin-only — serves an uploaded creator CV by registration id.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const entry = await prisma.creatorWaitlist.findUnique({ where: { id }, select: { cvPath: true, name: true } });
  if (!entry?.cvPath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Path-traversal guard: only serve files inside the configured CV dir.
  const resolved = path.resolve(entry.cvPath);
  if (!resolved.startsWith(path.resolve(CV_DIR))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buf = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const safeName = `CV-${entry.name.replace(/[^a-zA-Z0-9._-]/g, "_")}${ext}`;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": TYPES[ext] || "application/octet-stream",
        "Content-Disposition": `inline; filename="${safeName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
}
