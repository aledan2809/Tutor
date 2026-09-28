import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { sendAppEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/sanitize";
import { logger } from "@/lib/logger";
import { findUserIdByEmail } from "@/lib/email-lookup";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  locale: z.enum(["ro", "en"]).optional(),
});

const LINK_LIFETIME_MS = 60 * 60 * 1000;
/** A second link for the same account inside this window is not sent (inbox flooding). */
const RESEND_GAP_MS = 2 * 60 * 1000;
/** Reset emails an account can receive in an hour. */
const LINKS_PER_HOUR = 5;

function resetEmail(locale: "ro" | "en", name: string | null, resetUrl: string) {
  const who = escapeHtml(name?.trim() || "");
  const button = (label: string) =>
    `<p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a></p>`;
  if (locale === "en") {
    return {
      subject: "Your new eTutor.ro password",
      html: `<p>Hi${who ? ` ${who}` : ""},</p>
<p>Someone asked to change the password of your eTutor.ro account. The link below lets you choose a new one. It works for one hour and only once.</p>
${button("Choose a new password")}
<p>If it wasn't you, ignore this email: your password stays the same.</p>
<p style="color:#888;font-size:12px;">eTutor.ro</p>`,
    };
  }
  return {
    subject: "Parola nouă pentru eTutor.ro",
    html: `<p>Bună${who ? `, ${who}` : ""},</p>
<p>Cineva a cerut schimbarea parolei contului tău de pe eTutor.ro. Cu linkul de mai jos îți alegi o parolă nouă. Merge o oră și o singură dată.</p>
${button("Alege parola nouă")}
<p>Dacă n-ai cerut tu, ignoră emailul: parola rămâne aceeași.</p>
<p style="color:#888;font-size:12px;">eTutor.ro</p>`,
  };
}

async function _POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const locale = parsed.data.locale ?? "ro";

  // Always the same answer, so the form can't be used to learn which emails have accounts.
  const successResponse = NextResponse.json({
    success: true,
    message: "If an account with that email exists, a reset link has been sent.",
  });

  const userId = await findUserIdByEmail(parsed.data.email);
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, password: true } })
    : null;
  if (!user?.email || !user.password) {
    // No account, or one that signs in only with Google — don't reveal which.
    return successResponse;
  }
  // The stored spelling keys the token and goes in the link, so the reset step finds it exactly.
  const email = user.email;
  const identifier = `reset:${email}`;
  const sentKey = `reset-sent:${email}`;

  const token = crypto.randomBytes(32).toString("hex");
  // One request per account at a time: read-then-write, the gap and the hourly cap below held only
  // for requests one after another — twenty sent together all passed and sent twenty emails.
  const issued = await prisma.$transaction(async (tx) => {
    const [lock] = await tx.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_xact_lock(hashtext(${identifier})) AS locked`;
    if (!lock?.locked) return false;

    const existing = await tx.verificationToken.findFirst({
      where: { identifier },
      orderBy: { expires: "desc" },
    });
    if (existing && existing.expires.getTime() > Date.now() + LINK_LIFETIME_MS - RESEND_GAP_MS) return false;

    // At most a few links an hour per account: anyone can type someone else's email here, and each
    // request would otherwise send them another message (and void the link they already have).
    await tx.verificationToken.deleteMany({ where: { identifier: sentKey, expires: { lt: new Date() } } });
    if ((await tx.verificationToken.count({ where: { identifier: sentKey } })) >= LINKS_PER_HOUR) return false;

    await tx.verificationToken.deleteMany({ where: { identifier } });
    await tx.verificationToken.create({
      data: { identifier, token, expires: new Date(Date.now() + LINK_LIFETIME_MS) },
    });
    await tx.verificationToken.create({
      data: { identifier: sentKey, token: `sent:${crypto.randomUUID()}`, expires: new Date(Date.now() + 60 * 60 * 1000) },
    });
    return true;
  });
  if (!issued) return successResponse;

  const baseUrl = process.env.AUTH_URL || "https://etutor.ro";
  const resetUrl = `${baseUrl}/${locale}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const { subject, html } = resetEmail(locale, user.name, resetUrl);

  // Sent after the response: waiting for the email service would make an existing account
  // answer measurably slower than a missing one. Never log the link — whoever reads the logs
  // could change the password.
  after(async () => {
    const sent = await sendAppEmail({ to: email, subject, html });
    if (!sent) logger.error("Password reset email was not accepted by any transport");
  });

  return successResponse;
}

export const POST = withErrorHandler(_POST);
