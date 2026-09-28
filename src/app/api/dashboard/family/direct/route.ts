import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import { createChildDirectly, FamilySeatError } from "@/lib/family-invite";
import { USERNAME_RE, USERNAME_RULE_RO } from "@/lib/username";

const schema = z.object({
  name: z.string().trim().min(2, "Numele trebuie să aibă cel puțin 2 caractere").max(80, "Numele poate avea cel mult 80 de caractere"),
  username: z.string().trim().toLowerCase().regex(USERNAME_RE, USERNAME_RULE_RO),
  // Optional: an empty field means none.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v || undefined)
    .pipe(z.string().email("Email invalid").optional())
    .optional(),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere").max(72, "Parola trebuie să aibă cel mult 72 de caractere"),
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
  const { name, username, email, password, domainSlugs } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { childId } = await createChildDirectly({
      ownerId: session.user.id,
      name,
      username,
      email: email ?? null,
      passwordHash,
      domainSlugs,
    });
    return NextResponse.json({ ok: true, childId }, { status: 201 });
  } catch (err) {
    if (err instanceof FamilySeatError) {
      return NextResponse.json({ error: "seat_unavailable", seat: err.check }, { status: 409 });
    }
    // Two adds at once with the same name or address: the database's unique index decides.
    const target = (err as { code?: string; meta?: { target?: unknown } })?.code === "P2002"
      ? String((err as { meta?: { target?: unknown } }).meta?.target ?? "")
      : null;
    if ((err instanceof Error && err.name === "UsernameTakenError") || (target !== null && target.includes("username"))) {
      return NextResponse.json({ error: "Numele de utilizator e deja folosit. Alege altul." }, { status: 409 });
    }
    if ((err instanceof Error && err.name === "EmailTakenError") || (target !== null && target.includes("email"))) {
      return NextResponse.json(
        { error: "Există deja un cont cu acest email. Folosește o invitație în loc." },
        { status: 409 }
      );
    }
    throw err;
  }
}

export const POST = withErrorHandler(_POST);
