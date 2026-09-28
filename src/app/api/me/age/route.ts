import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { validBirthYear, needsParentConsent } from "@/lib/age";
import { issueConsentRequest, loadConsentState, sendConsentEmail } from "@/lib/parent-consent-server";

const schema = z.object({
  birthYear: z.number(),
  parentEmail: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v || undefined)
    .pipe(z.string().email().optional())
    .optional(),
  locale: z.enum(["ro", "en"]).optional(),
});

/**
 * POST: the year of birth of a learner who made their own account (asked once; Alex, 28.09.2026).
 * Under 16 it comes with a parent's email, who is asked for consent.
 */
async function _POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Scrie un email valid pentru părinte." }, { status: 400 });
  const { birthYear, parentEmail } = parsed.data;
  const locale = parsed.data.locale ?? "ro";
  if (!validBirthYear(birthYear)) return NextResponse.json({ error: "Alege anul nașterii." }, { status: 400 });

  // Only an account the question is for (a learner on their own account, not yet answered): once —
  // a year changed after the question would undo it — and no one else can send consent emails.
  if ((await loadConsentState(session.user.id)).kind !== "ask-age") {
    return NextResponse.json({ error: "Anul nașterii nu mai e de cerut pentru acest cont." }, { status: 409 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const minor = needsParentConsent(birthYear);
  if (minor && !parentEmail) return NextResponse.json({ error: "Scrie emailul unui părinte." }, { status: 400 });
  if (minor && user.email && user.email.toLowerCase() === parentEmail) {
    return NextResponse.json({ error: "Scrie adresa unui părinte, nu pe a ta." }, { status: 400 });
  }

  const saved = await prisma.user.updateMany({ where: { id: session.user.id, birthYear: null }, data: { birthYear } });
  if (saved.count !== 1) return NextResponse.json({ error: "Anul nașterii e deja salvat." }, { status: 409 });
  if (minor && parentEmail) {
    const issued = await issueConsentRequest(session.user.id, parentEmail);
    if (issued.ok) after(() => sendConsentEmail(session.user.id, issued.token, locale));
  }
  return NextResponse.json({ ok: true, minor });
}

export const POST = withErrorHandler(_POST);
