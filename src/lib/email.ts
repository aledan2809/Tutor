/**
 * App email sender. Primary transport is Resend (the same provider NextAuth uses
 * for magic links — AUTH_RESEND_KEY); falls back to SMTP/nodemailer if that's
 * configured instead. Returns true only when the message was accepted.
 *
 * NOTE: Resend requires the EMAIL_FROM domain to be verified in the Resend
 * dashboard. With no key (or an invalid one) this returns false and callers
 * skip the channel — they must NOT retry forever (see the escalation guard).
 */
import { logger } from "@/lib/logger";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.AUTH_RESEND_KEY || process.env.SMTP_HOST);
}

export async function sendAppEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const from = process.env.EMAIL_FROM || "noreply@etutor.ro";
  const resendKey = process.env.AUTH_RESEND_KEY;

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
      });
      if (res.ok) return true;
      logger.error("Resend email rejected", undefined, { status: res.status });
    } catch (err) {
      logger.error("Resend email error", err);
    }
    // fall through to SMTP if available
  }

  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
      return true;
    } catch (err) {
      logger.error("SMTP email error", err);
      return false;
    }
  }

  return false;
}
