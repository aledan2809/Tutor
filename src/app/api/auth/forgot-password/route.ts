import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
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
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const { email } = parsed.data;

  // Always return success to prevent email enumeration
  const successResponse = NextResponse.json({
    success: true,
    message: "If an account with that email exists, a reset link has been sent.",
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    // User doesn't exist or uses OAuth — don't reveal this
    return successResponse;
  }

  // Generate reset token (expires in 1 hour)
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${email}` },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: `reset:${email}`,
      token,
      expires,
    },
  });

  // Send email
  const baseUrl = process.env.AUTH_URL || "https://tutor.knowbest.ro";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  try {
    const nodemailer = await import("nodemailer");
    const smtpHost = process.env.SMTP_HOST;

    if (smtpHost) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? "noreply@tutor.app",
        to: email,
        subject: "Reset your Tutor password",
        html: `
          <h2>Password Reset</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr>
          <p style="color:#888;font-size:12px;">Tutor — tutor.knowbest.ro</p>
        `,
      });
    } else {
      console.warn("SMTP not configured — reset URL:", resetUrl);
    }
  } catch (error) {
    console.error("Failed to send reset email:", error);
  }

  return successResponse;
}

export const POST = withErrorHandler(_POST);
