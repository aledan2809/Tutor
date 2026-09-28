import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findUserIdByEmail } from "@/lib/email-lookup";
import { withErrorHandler } from "@/lib/api-handler";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  // Verbatim (trimmed): it's the stored spelling the link was issued with, and keys the token.
  email: z.string().trim().email(),
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be at most 72 characters"),
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
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, token, password } = parsed.data;

  // Find and validate token
  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: `reset:${email}`,
      token,
    },
  });

  if (!record) {
    return NextResponse.json(
      { error: "Invalid or expired reset link" },
      { status: 400 }
    );
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
    });
    return NextResponse.json(
      { error: "Reset link has expired. Please request a new one." },
      { status: 400 }
    );
  }

  // The token is bound to the link's spelling; the account may since have been lowercased (0073).
  const accountId = await findUserIdByEmail(email);
  const account = accountId
    ? await prisma.user.findUnique({ where: { id: accountId }, select: { id: true, emailVerified: true } })
    : null;
  if (!account) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  // The link reached the inbox, so the email is now proven. The version bump ends every session
  // signed in before the change — including one held by whoever had the old password. If the email
  // had never been proven, the account may have been made by someone else with this address: a
  // Google account linked to it meanwhile goes too, or that person could still sign in with it.
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: account.id },
      data: { password: hashedPassword, emailVerified: new Date(), sessionVersion: { increment: 1 } },
    }),
    ...(account.emailVerified ? [] : [prisma.account.deleteMany({ where: { userId: account.id } })]),
    // deleteMany, not delete: a double click must not turn a changed password into an error page.
    prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier, token: record.token },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: "Password has been reset. You can now sign in.",
  });
}

export const POST = withErrorHandler(_POST);
