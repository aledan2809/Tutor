/**
 * App email sender. Primary transport is Resend (the same provider NextAuth uses
 * for magic links — AUTH_RESEND_KEY); falls back to SMTP/nodemailer if that's
 * configured instead. Returns true only when the message was accepted.
 *
 * NOTE: Resend requires the EMAIL_FROM domain to be verified in the Resend
 * dashboard. With no key (or an invalid one) this returns false and callers
 * skip the channel — they must NOT retry forever (see the escalation guard).
 *
 * Automatic mail skips an address on the suppression list (email-suppression.ts, a mirror of Resend's
 * own): Resend would drop it anyway, and a „false” lets an alert fall through to another channel.
 * `requested` marks the mail the person asked for (a sign-in link, a password reset): it always goes to
 * Resend, which decides. Every send has a time limit: one stuck send used to hold a cron run for hours.
 */
import { logger } from "@/lib/logger";
import { suppressionFor } from "@/lib/email-suppression";

/** Longest wait for Resend's answer. */
const RESEND_TIMEOUT_MS = 20_000;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.AUTH_RESEND_KEY || process.env.SMTP_HOST);
}

export async function sendAppEmail(opts: {
  to: string;
  subject: string;
  html: string;
  /** The person asked for this message (sign-in link, password reset): the suppression list doesn't stop it. */
  requested?: boolean;
  /**
   * One logical message (e.g. one alert to one parent): Resend sends it at most once per key within a day,
   * however many times it is asked. Only for messages whose text doesn't change between attempts.
   */
  idempotencyKey?: string;
}): Promise<boolean> {
  if (!opts.requested) {
    const suppressed = await suppressionFor(opts.to);
    if (suppressed) {
      logger.warn("Email not sent: the address is on the suppression list", { reason: suppressed });
      return false;
    }
  }

  const from = process.env.EMAIL_FROM || "noreply@etutor.ro";
  const resendKey = process.env.AUTH_RESEND_KEY;

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
          ...(opts.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey.slice(0, 256) } : {}),
        },
        body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
        signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
      });
      if (res.ok) return true;
      logger.error("Resend email rejected", undefined, { status: res.status });
    } catch (err) {
      // Timed out: Resend may have sent it anyway, so no second copy through SMTP.
      const name = (err as { name?: unknown } | null)?.name;
      if (name === "TimeoutError" || name === "AbortError") {
        logger.error("Resend email timed out; not retried through SMTP", err);
        return false;
      }
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
        // nodemailer's defaults wait up to 10 minutes on a silent server.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
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
