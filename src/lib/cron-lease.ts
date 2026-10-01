/**
 * One run at a time for a cron job, across processes: a lease row in AppSetting.
 *
 * The reminder chains run every minute (the page promises a 6-minute wait in the morning, which a
 * 15-minute cron can't keep) and also from the 15-minute cron. Two runs at once could create the
 * same next rung twice or send one message twice, so whoever takes the lease runs; the other skips.
 *
 * Postgres advisory locks don't fit: Prisma pools connections, so the unlock can land on another
 * connection than the lock and leave it held. The lease is a plain compare-and-set on one row, timed
 * by the database clock, and expires on its own if a run dies before releasing it.
 *
 * While the run works, the lease is renewed every third of its length (01.10.2026: a run that outlived
 * its lease let the next one start on a stale list, and the same notices went out twice). A run that
 * dies stops renewing, and the lease still runs out on its own; a run stuck for MAX_RENEWED_LEASES
 * lengths stops renewing too, so a hung run can't keep the job off forever.
 */
const MAX_RENEWED_LEASES = 4;
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export type LeaseRun<T> = { ran: true; result: T } | { ran: false };

export async function withCronLease<T>(name: string, ttlMs: number, fn: () => Promise<T>): Promise<LeaseRun<T>> {
  const key = `cronLease:${name}`;
  const token = randomUUID();
  // The row exists after the first run; a concurrent first run loses on the primary key.
  await prisma.$executeRaw`
    INSERT INTO "AppSetting" ("key", "value", "updatedAt")
    VALUES (${key}, '{"untilMs": 0}'::jsonb, NOW())
    ON CONFLICT ("key") DO NOTHING`;
  const taken = await prisma.$executeRaw`
    UPDATE "AppSetting"
    SET "value" = jsonb_build_object(
          'untilMs', (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint + ${ttlMs}::bigint,
          'token', ${token}::text),
        "updatedAt" = NOW()
    WHERE "key" = ${key}
      AND COALESCE(("value"->>'untilMs')::bigint, 0) < (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint`;
  if (taken === 0) return { ran: false };

  const renewUntil = Date.now() + MAX_RENEWED_LEASES * ttlMs;
  const renew = setInterval(() => {
    if (Date.now() > renewUntil) {
      clearInterval(renew);
      return;
    }
    prisma.$executeRaw`
      UPDATE "AppSetting"
      SET "value" = jsonb_set("value", '{untilMs}', to_jsonb((EXTRACT(EPOCH FROM NOW()) * 1000)::bigint + ${ttlMs}::bigint)),
          "updatedAt" = NOW()
      WHERE "key" = ${key} AND "value"->>'token' = ${token}`.catch(() => undefined);
  }, Math.max(10_000, Math.floor(ttlMs / 3)));
  renew.unref?.();

  try {
    return { ran: true, result: await fn() };
  } finally {
    clearInterval(renew);
    // Release only our own lease: if this run outlived it, another run may hold the row now.
    await prisma.$executeRaw`
      UPDATE "AppSetting"
      SET "value" = '{"untilMs": 0}'::jsonb, "updatedAt" = NOW()
      WHERE "key" = ${key} AND "value"->>'token' = ${token}`;
  }
}
