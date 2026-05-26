import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

// Public route — creator-program recruitment waitlist (lead capture, no auth).
const schema = z.object({
  name: z.string().min(2, "Numele este obligatoriu").max(120),
  email: z.string().email("Email invalid").max(160),
  subject: z.string().min(2, "Alege materia").max(120),
  experience: z.string().max(2000).optional(),
  locale: z.string().max(5).optional(),
});

async function _POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Date invalide", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, subject, experience, locale } = parsed.data;

  // Idempotent: re-applying with the same email updates the entry (no dup, no error).
  await prisma.creatorWaitlist.upsert({
    where: { email },
    update: { name, subject, experience: experience ?? null, locale: locale ?? "ro" },
    create: { name, email, subject, experience: experience ?? null, locale: locale ?? "ro" },
  });

  return NextResponse.json(
    { success: true, message: "Te-ai înscris pe lista creatorilor. Te contactăm curând." },
    { status: 201 }
  );
}

export const POST = withErrorHandler(_POST);
