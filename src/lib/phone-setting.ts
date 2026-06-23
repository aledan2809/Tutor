/**
 * WhatsApp recipient phone, stored as Setting(userId, "phone") — the same place
 * the escalation WhatsApp channel reads from (notifications/service.ts). Either
 * the student (own) or a guardian (the child's) can set it.
 */
import { prisma } from "@/lib/prisma";

export async function getUserPhone(userId: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({
    where: { userId_key: { userId, key: "phone" } },
    select: { value: true },
  });
  return typeof s?.value === "string" ? s.value : null;
}

/** Validate + normalize a typed phone. Returns null if implausible. Keeps a leading +. */
export function normalizePhoneInput(raw: string): string | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return hasPlus ? `+${digits}` : digits;
}

export async function setUserPhone(userId: string, phone: string): Promise<void> {
  await prisma.setting.upsert({
    where: { userId_key: { userId, key: "phone" } },
    create: { userId, key: "phone", value: phone },
    update: { value: phone },
  });
}

export async function clearUserPhone(userId: string): Promise<void> {
  await prisma.setting.deleteMany({ where: { userId, key: "phone" } });
}
