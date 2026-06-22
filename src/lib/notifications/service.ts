/**
 * Unified Notification Service
 *
 * Abstracts all notification channels:
 * - Push (in-app notification via DB)
 * - WhatsApp via @aledan/whatsapp
 * - SMS via @aledan/sms
 * - Email via nodemailer
 * - Call trigger (creates event for instructor)
 */

import { prisma } from "@/lib/prisma";
import type { EscalationChannel } from "@prisma/client";
import { getTelegramClient } from "@/lib/telegram/connect";

interface NotificationPayload {
  userId: string;
  channel: EscalationChannel;
  templateId: string;
  metadata: Record<string, unknown>;
}

/**
 * Send a notification through the specified channel.
 * Returns true if sent successfully.
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<boolean> {
  try {
    switch (payload.channel) {
      case "PUSH":
        return await sendPushNotification(payload);
      case "TELEGRAM":
        return await sendTelegramChannel(payload);
      case "WHATSAPP":
        return await sendWhatsAppNotification(payload);
      case "SMS":
        return await sendSMSNotification(payload);
      case "EMAIL":
        return await sendEmailNotification(payload);
      case "CALL":
        return await triggerInstructorCall(payload);
      default:
        console.error(`Unknown channel: ${payload.channel}`);
        return false;
    }
  } catch (error) {
    console.error(`Notification send failed [${payload.channel}]:`, error);
    return false;
  }
}

/**
 * Push notification — registers an in-app reminder and best-effort delivers a
 * real web push.
 *
 * Delivery-aware (cost-safety linchpin): web-push transport is no longer fire-
 * and-forget. We count how many subscriptions actually accepted the push and
 * record that outcome (`pushSubscriptions` / `pushDelivered`) on the in-app
 * notification, so cost reports can see real device reach (the ladder is only a
 * cost lever once push adoption > 0). The function still returns `true` when the
 * in-app reminder is registered — that surface always reaches the user on next
 * app open — but a configured-yet-undelivered push now logs a warning instead of
 * silently reporting success.
 */
async function sendPushNotification(
  payload: NotificationPayload
): Promise<boolean> {
  const title = (payload.metadata.title as string) ?? "Study Reminder";
  const message = (payload.metadata.message as string) ?? "You have a session waiting!";

  let subscriptionCount = 0;
  let deliveredCount = 0;

  // Send real web push if VAPID configured
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (vapidPublic && vapidPrivate) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const webpush = require("web-push");
      webpush.setVapidDetails(
        `mailto:${process.env.EMAIL_FROM || "noreply@tutor.app"}`,
        vapidPublic,
        vapidPrivate
      );

      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: payload.userId },
      });
      subscriptionCount = subscriptions.length;

      // data.url → where the tap navigates; data.escalationEventId → lets the
      // service worker ACK this escalation (push-first cost gate, see sw-push.js).
      const escalationEventId = payload.metadata.escalationEventId as
        | string
        | undefined;
      // Tutor routes are locale-prefixed (/[locale]/...); "/" safely redirects
      // to the localized home. Avoid a hardcoded path that may 404 on tap.
      const clickUrl = (payload.metadata.url as string) ?? "/";
      const pushPayload = JSON.stringify({
        title,
        body: message,
        icon: "/icon-192.png",
        data: { url: clickUrl, escalationEventId },
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            pushPayload
          );
          deliveredCount++;
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            // Subscription expired — clean up
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      }
    } catch (err) {
      console.error("Web push error:", err);
    }
  }

  // In-app notification — the always-available free reminder surface. Carries
  // the physical web-push delivery outcome for cost/adoption observability.
  await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: "push",
      title,
      message,
      metadata: {
        templateId: payload.templateId,
        pushSubscriptions: subscriptionCount,
        pushDelivered: deliveredCount,
      },
    },
  });

  if (subscriptionCount > 0 && deliveredCount === 0) {
    console.warn(
      `Push not delivered for user ${payload.userId}: ${subscriptionCount} subscription(s), 0 delivered`
    );
  }

  // The L1 reminder is registered in-app regardless of web-push transport result.
  return true;
}

/**
 * Telegram channel (distinct cascade step, before email). Free nudge for users
 * who linked their Telegram chat. Returns false when not linked / not enabled —
 * the engine's deliverability guard skips the step in that case.
 */
async function sendTelegramChannel(
  payload: NotificationPayload
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { telegramChatId: true },
  });
  if (!user?.telegramChatId) return false;
  return sendTelegramNotification(payload, user.telegramChatId);
}

/**
 * Telegram notification — free nudge for opted-in users. No template approval
 * (bot can message freely after /start), so we send localized text + a button
 * back into the app.
 */
async function sendTelegramNotification(
  payload: NotificationPayload,
  chatId: string
): Promise<boolean> {
  const client = getTelegramClient();
  if (!client) return false;

  // sendText/sendInlineKeyboard default to parseMode HTML — escape interpolated
  // values so a name/stat containing < > & can't break parsing.
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const userName = esc((payload.metadata.userName as string) ?? "Student");
  const stats = payload.metadata.stats ? esc(String(payload.metadata.stats)) : "";
  const text = stats
    ? `📚 Salut ${userName}! ${stats}\n\nDeschide eTutor și păstrează-ți seria de studiu.`
    : `📚 Salut ${userName}! E timpul pentru un quiz scurt — hai să-ți păstrezi seria de studiu.`;

  // Absolute https URL for the Telegram button (relative paths aren't allowed).
  const base = (process.env.AUTH_URL ?? "").replace(/\/$/, "");
  const rawUrl = payload.metadata.url as string | undefined;
  const buttonUrl =
    rawUrl && rawUrl.startsWith("http")
      ? rawUrl
      : base
        ? `${base}${rawUrl && rawUrl.startsWith("/") ? rawUrl : "/"}`
        : null;

  try {
    if (buttonUrl) {
      const res = await client.sendInlineKeyboard(chatId, text, [
        [{ text: "Deschide eTutor", url: buttonUrl }],
      ]);
      return res.success;
    }
    const res = await client.sendText(chatId, text);
    return res.success;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

/**
 * WhatsApp notification via @aledan/whatsapp.
 */
async function sendWhatsAppNotification(
  payload: NotificationPayload
): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn("WhatsApp not configured — skipping");
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { settings: { where: { key: "phone" } } },
  });

  const phoneSetting = user?.settings.find((s) => s.key === "phone");
  const phone = phoneSetting?.value as string | undefined;
  if (!phone) {
    console.warn(`No phone number for user ${payload.userId}`);
    return false;
  }

  try {
    const { WhatsAppClient, normalizePhone } = await import(
      "@aledan/whatsapp"
    );
    const client = new WhatsAppClient({
      phoneNumberId,
      accessToken,
    });

    const userName = (payload.metadata.userName as string) ?? "Student";

    // Paid WhatsApp reminder (Premium-only — gated in the engine before we get
    // here). Uses the Meta-approved `study_reminder` template.
    await client.sendTemplate(
      normalizePhone(phone),
      "study_reminder",
      "ro",
      [
        {
          type: "body" as const,
          parameters: [{ type: "text" as const, text: userName }],
        },
      ]
    );

    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

/**
 * SMS notification via @aledan/sms.
 */
async function sendSMSNotification(
  payload: NotificationPayload
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { settings: { where: { key: "phone" } } },
  });

  const phoneSetting = user?.settings.find((s) => s.key === "phone");
  const phone = phoneSetting?.value as string | undefined;
  if (!phone) {
    console.warn(`No phone number for user ${payload.userId}`);
    return false;
  }

  try {
    const { SMSClient } = await import("@aledan/sms");
    const client = new SMSClient({
      primary: {
        provider: "smslink",
        connectionId: process.env.SMSLINK_CONNECTION_ID ?? "",
        password: process.env.SMSLINK_PASSWORD ?? "",
      },
    });

    const userName = (payload.metadata.userName as string) ?? "Student";
    const message = `Tutor: Hi ${userName}, you haven't studied recently. Open the app and keep your streak alive!`;

    await client.send({ to: phone, message });
    return true;
  } catch (error) {
    console.error("SMS send error:", error);
    return false;
  }
}

/**
 * Email notification via nodemailer — a study reminder sent to the STUDENT
 * (cascade step between Telegram and WhatsApp). Instructor/parent alerts are a
 * separate concern (parent monitoring).
 */
async function sendEmailNotification(
  payload: NotificationPayload
): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost) {
    console.warn("SMTP not configured — skipping email");
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { email: true, name: true },
  });
  if (!user?.email) {
    console.warn(`No email for user ${payload.userId}`);
    return false;
  }

  const userName = (payload.metadata.userName as string) ?? user.name ?? "Salut";
  const base = (process.env.AUTH_URL ?? "https://etutor.ro").replace(/\/$/, "");
  const rawUrl = payload.metadata.url as string | undefined;
  const ctaUrl = rawUrl && rawUrl.startsWith("http") ? rawUrl : `${base}${rawUrl?.startsWith("/") ? rawUrl : "/"}`;

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "noreply@etutor.ro",
      to: user.email,
      subject: "eTutor — e timpul pentru un quiz scurt",
      html: `
        <p>Salut ${userName},</p>
        <p>E timpul pentru un quiz scurt — păstrează-ți seria de studiu.</p>
        <p><a href="${ctaUrl}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Începe quiz-ul</a></p>
        <hr>
        <p style="color:#888;font-size:12px">Memento automat de la eTutor.</p>
      `,
    });

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

/**
 * Call trigger — creates an event for the instructor to call the student.
 * L6: Does not actually make a call, but creates an actionable notification.
 */
async function triggerInstructorCall(
  payload: NotificationPayload
): Promise<boolean> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: payload.userId,
      isActive: true,
      roles: { has: "STUDENT" },
    },
  });

  if (!enrollment) return false;

  const instructorEnrollment = await prisma.enrollment.findFirst({
    where: {
      domainId: enrollment.domainId,
      isActive: true,
      roles: { has: "INSTRUCTOR" },
    },
  });

  if (!instructorEnrollment) return false;

  const userName = (payload.metadata.userName as string) ?? "A student";

  // Create notification for instructor
  await prisma.notification.create({
    data: {
      userId: instructorEnrollment.userId,
      type: "call_trigger",
      title: "Call Required — Inactive Student",
      message: `${userName} has been inactive for 48+ hours and hasn't responded to any reminders. Please call them to help get back on track.`,
      metadata: {
        studentUserId: payload.userId,
        escalationLevel: 6,
      },
    },
  });

  return true;
}
