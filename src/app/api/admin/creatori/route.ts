import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// SuperAdmin-only CRUD for the Creator Program waitlist.
// GET is served by the admin page (server component); this file handles
// POST (create). PATCH/DELETE live in ./[id]/route.ts.

async function requireSuperAdmin() {
  const session = await auth();
  return session?.user?.isSuperAdmin === true;
}

export async function POST(req: NextRequest) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";

  if (!name || !email || !subject) {
    return NextResponse.json(
      { error: "Câmpurile nume, email și materie sunt obligatorii." },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalid." }, { status: 400 });
  }

  try {
    const entry = await prisma.creatorWaitlist.create({
      data: {
        name,
        email,
        subject,
        track: typeof body.track === "string" ? body.track.trim() : "",
        experience: typeof body.experience === "string" ? body.experience.trim() || null : null,
        needsTaxHelp: body.needsTaxHelp === true,
        locale: typeof body.locale === "string" ? body.locale : "ro",
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Există deja o înscriere cu acest email." }, { status: 409 });
    }
    return NextResponse.json({ error: "Eroare la salvare." }, { status: 500 });
  }
}
