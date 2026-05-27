import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// SuperAdmin-only update/delete for a single Creator Program waitlist entry.

async function requireSuperAdmin() {
  const session = await auth();
  return session?.user?.isSuperAdmin === true;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v) return NextResponse.json({ error: "Numele nu poate fi gol." }, { status: 400 });
    data.name = v;
  }
  if (typeof body.email === "string") {
    const v = body.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      return NextResponse.json({ error: "Email invalid." }, { status: 400 });
    }
    data.email = v;
  }
  if (typeof body.subject === "string") {
    const v = body.subject.trim();
    if (!v) return NextResponse.json({ error: "Materia nu poate fi goală." }, { status: 400 });
    data.subject = v;
  }
  if (typeof body.track === "string") data.track = body.track.trim();
  if (typeof body.experience === "string") data.experience = body.experience.trim() || null;
  if (typeof body.needsTaxHelp === "boolean") data.needsTaxHelp = body.needsTaxHelp;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nimic de actualizat." }, { status: 400 });
  }

  try {
    const entry = await prisma.creatorWaitlist.update({ where: { id }, data });
    return NextResponse.json({ entry });
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2002") return NextResponse.json({ error: "Email deja folosit de altă înscriere." }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Înscrierea nu există." }, { status: 404 });
    return NextResponse.json({ error: "Eroare la actualizare." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.creatorWaitlist.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2025") return NextResponse.json({ error: "Înscrierea nu există." }, { status: 404 });
    return NextResponse.json({ error: "Eroare la ștergere." }, { status: 500 });
  }
}
