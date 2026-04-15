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
 * Push notification — creates an in-app notification record.
 */
async function sendPushNotification(
  payload: NotificationPayload
): Promise<boolean> {
  const title = (payload.metadata.title as string) ?? "Study Reminder";
  const message = (payload.metadata.message as string) ?? "You have a session waiting!";

  // Save in-app notification
  await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: "push",
      title,
      message,
      metadata: { templateId: payload.templateId },
    },
  });

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

      const pushPayload = JSON.stringify({ title, body: message, icon: "/icon-192.png" });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            pushPayload
          );
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

  return true;
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

    if (payload.templateId === "whatsapp_friendly_reminder") {
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
