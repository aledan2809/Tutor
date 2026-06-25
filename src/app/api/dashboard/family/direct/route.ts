import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import { createChildDirectly, FamilySeatError } from "@/lib/family-invite";

const schema = z.object({
  name: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere"),
  email: z.string().email("Email invalid"),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere"),
  domainSlugs: z.array(z.string()).optional(),
});

/** POST: the parent creates the child's account directly (3rd linking path). */
async function _POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { name, email, password, domainSlugs } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { childId } = await createChildDirectly({
      ownerId: session.user.id,
      name,
      email,
      passwordHash,
      domainSlugs,
    });
    return NextResponse.json({ ok: true, childId }, { status: 201 });
  } catch (err) {
    if (err instanceof FamilySeatError) {
      return NextResponse.json({ error: "seat_unavailable", seat: err.check }, { status: 409 });
    }
    if (err instanceof Error && err.name === "EmailTakenError") {
      return NextResponse.json(
        { error: "Există deja un cont cu acest email. Folosește o invitație în loc." },
        { status: 409 }
      );
    }
    throw err;
  }
}

export const POST = withErrorHandler(_POST);
