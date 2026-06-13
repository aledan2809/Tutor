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
import { getTelegramClient, telegramNudgesEnabled } from "@/lib/telegram/connect";
import { WHATSAPP_UPGRADE_TEMPLATE } from "@/lib/escalation/segmentation";

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
      case "WHATSAPP":
        return await sendWhatsAppOrTelegram(payload);
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
 * Cost-saving substitution at the WhatsApp escalation level: if the user has
 * opted into Telegram (linked chat + FEATURE_TELEGRAM_NUDGES), send the nudge
 * for FREE on Telegram instead of a paid WhatsApp template. Degrades to
 * WhatsApp when Telegram isn't eligible or the send fails — the user still
 * gets reminded, just on the paid channel.
 */
async function sendWhatsAppOrTelegram(
  payload: NotificationPayload
): Promise<boolean> {
  if (telegramNudgesEnabled()) {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { telegramChatId: true },
    });
    if (user?.telegramChatId) {
      const sent = await sendTelegramNotification(payload, user.telegramChatId);
      if (sent) return true;
      // Telegram failed → fall through to paid WhatsApp so the user is still reached.
      console.warn(
        `Telegram nudge failed for user ${payload.userId}, falling back to WhatsApp`
      );
    }
  }
  return await sendWhatsAppNotification(payload);
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
  // values so a name/stat containing < > & can't break parsing (a failed send
  // would silently degrade the user to paid WhatsApp).
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const userName = esc((payload.metadata.userName as string) ?? "Student");
  let text: string;
  if (payload.templateId === WHATSAPP_UPGRADE_TEMPLATE) {
    text = `📚 Salut ${userName}! Mementourile pe WhatsApp fac parte din abonamentul premium eTutor. Continuă cu acces complet și păstrează-ți ritmul de studiu.`;
  } else if (payload.templateId === "whatsapp_pressure_stats") {
    const stats = esc((payload.metadata.stats as string) ?? "Seria ta e în pericol!");
    text = `📚 Salut ${userName}! ${stats}\n\nDeschide eTutor și păstrează-ți seria de studiu.`;
  } else {
    text = `📚 Salut ${userName}! Nu ai mai studiat de ceva vreme — hai înapoi să-ți păstrezi seria.`;
  }

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

    if (payload.templateId === WHATSAPP_UPGRADE_TEMPLATE) {
      // Final capped WhatsApp touch for free users — upgrade CTA. Requires the
      // Meta-approved `study_upgrade` template (submit with funnel item 3; this
      // path is dormant until WhatsApp is configured).
      await client.sendTemplate(
        normalizePhone(phone),
        "study_upgrade",
        "ro",
        [
          {
            type: "body" as const,
            parameters: [{ type: "text" as const, text: userName }],
          },
        ]
      );
    } else if (payload.templateId === "whatsapp_friendly_reminder") {
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
    } else if (payload.templateId === "whatsapp_pressure_stats") {
      const stats = (payload.metadata.stats as string) ?? "Your streak is at risk!";
      await client.sendTemplate(
        normalizePhone(phone),
        "study_pressure",
        "ro",
        [
          {
            type: "body" as const,
            parameters: [
              { type: "text" as const, text: userName },
              { type: "text" as const, text: stats },
            ],
          },
        ]
      );
    }

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
 * Email notification via nodemailer.
 * L5: Sends email to the student's instructor.
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

  // Find the instructor for this user
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: payload.userId,
      isActive: true,
      roles: { has: "STUDENT" },
    },
    include: { domain: true },
  });

  if (!enrollment) return false;

  const instructorEnrollment = await prisma.enrollment.findFirst({
    where: {
      domainId: enrollment.domainId,
      isActive: true,
      roles: { has: "INSTRUCTOR" },
    },
    include: { user: true },
  });

  const instructorEmail = instructorEnrollment?.user.email;
  if (!instructorEmail) {
    console.warn("No instructor email found");
    return false;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: smtpUser, pass: smtpPass },
    });

    const userName = (payload.metadata.userName as string) ?? "A student";
    const domainName = enrollment.domain.name;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "noreply@tutor.app",
      to: instructorEmail,
      subject: `[Tutor] Student Inactivity Alert — ${userName}`,
      html: `
        <h2>Student Inactivity Alert</h2>
        <p><strong>${userName}</strong> has been inactive in <strong>${domainName}</strong> for an extended period.</p>
        <p>The student has not responded to automated reminders (push, WhatsApp, SMS).</p>
        <p>Please consider reaching out to help them get back on track.</p>
        <hr>
        <p style="color: #888; font-size: 12px;">This is an automated alert from Tutor's escalation system.</p>
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
