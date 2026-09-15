#!/usr/bin/env node
// Production data change for the „cât o cafea" flyer — decided by Alex on 15.09.2026:
//   1. every active monthly plan is charged at the NORMAL price the site already shows
//      (the DB still held the pre-1-September promo amounts, so checkout charged ~25% less
//      than /preturi displays);
//   2. voucher V126S: 25%, on every payment of the subscription (recurring), once per
//      account, Family plan only, activatable until 30.11.2026 23:59 (Romanian time).
// Order matters (review M2): prices first, then the voucher — a V126S checkout started while
// Family was still 24,90 would freeze 18,68 lei/month into that Stripe subscription.
//
// Run ON VPS2 after the deploy that contains migration 0063:
//   cd /var/www/tutor && node Reports/flyer-b2c-cafea-2026-09-15/apply-prices-and-v126s.mjs          # dry run
//   cd /var/www/tutor && node Reports/flyer-b2c-cafea-2026-09-15/apply-prices-and-v126s.mjs --apply  # writes
// Every write is guarded: a plan whose current price is neither the expected promo amount nor
// already the target stops the whole run; nothing is written unless all checks pass. A JSON
// backup of both tables is written before the transaction.
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";

const require = createRequire(`${process.cwd()}/package.json`);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// bani: promo (what the DB holds) → normal (what /ro/preturi shows = promo / 0.75, 2 decimals)
const PRICES = {
  ELEV: { from: 1990, to: 2653 },
  FAMILY: { from: 2490, to: 3320 },
  FAMILY_DUO: { from: 2990, to: 3987 },
  TRIO: { from: 3990, to: 5320 },
  FAMILY_TRIO: { from: 4990, to: 6653 },
};
const V126S = {
  code: "V126S",
  discountPercent: 25,
  recurring: true,
  oncePerUser: true,
  planKey: "FAMILY",
  maxUses: null,
  // 30.11.2026 is winter time in Romania (EET, UTC+2)
  expiresAt: new Date("2026-11-30T23:59:59+02:00"),
};

async function main() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true, interval: "MONTH" },
    select: { id: true, name: true, price: true, familyPlanKey: true },
  });
  const planUpdates = [];
  for (const [key, { from, to }] of Object.entries(PRICES)) {
    const matches = plans.filter((p) => p.familyPlanKey === key);
    if (matches.length !== 1) throw new Error(`expected exactly one active monthly ${key} plan, found ${matches.length}`);
    const p = matches[0];
    if (p.price === to) console.log(`= ${key.padEnd(11)} ${p.name}: already ${to}`);
    else if (p.price === from) planUpdates.push({ id: p.id, key, name: p.name, from, to });
    else throw new Error(`${key} (${p.name}) is ${p.price}, neither the promo ${from} nor the target ${to} — stopping, check by hand`);
  }

  const existing = await prisma.voucher.findUnique({ where: { code: V126S.code } });
  if (existing) {
    const same =
      existing.discountPercent === V126S.discountPercent && existing.recurring && existing.oncePerUser &&
      existing.planKey === V126S.planKey && existing.expiresAt?.getTime() === V126S.expiresAt.getTime();
    if (!same) throw new Error(`V126S already exists with different settings: ${JSON.stringify(existing)} — stopping`);
    console.log("= V126S already exists with the intended settings");
  }
  const creator = await prisma.user.findFirst({ where: { isSuperAdmin: true }, orderBy: { createdAt: "asc" }, select: { id: true, email: true } });
  if (!creator) throw new Error("no super-admin user to own the voucher");

  for (const u of planUpdates) console.log(`→ ${u.key.padEnd(11)} ${u.name}: ${u.from} → ${u.to}`);
  if (!existing) console.log(`→ create V126S: 25% · every payment · once per account · FAMILY only · expires ${V126S.expiresAt.toISOString()} · owner ${creator.email}`);
  if (!APPLY) {
    console.log("\nDRY RUN — nothing written. Re-run with --apply.");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync("/root/backups", { recursive: true });
  const backupPath = `/root/backups/tutor-plans-vouchers-before-v126s-${stamp}.json`;
  writeFileSync(backupPath, JSON.stringify({
    plans: await prisma.subscriptionPlan.findMany(),
    vouchers: await prisma.voucher.findMany(),
  }, null, 2));
  console.log(`backup: ${backupPath}`);

  await prisma.$transaction(async (tx) => {
    for (const u of planUpdates) {
      const r = await tx.subscriptionPlan.updateMany({ where: { id: u.id, price: u.from }, data: { price: u.to } });
      if (r.count !== 1) throw new Error(`${u.key} changed under us — rolled back`);
    }
    if (planUpdates.length) {
      await tx.adminAuditLog.create({
        data: {
          action: "EDIT_PLAN_PRICES",
          performedById: creator.id,
          targetType: "SubscriptionPlan",
          metadata: { reason: "prețurile încasate = prețurile afișate pe /preturi (decizie Alex 15.09.2026)", changes: planUpdates },
        },
      });
    }
    if (!existing) {
      const v = await tx.voucher.create({ data: { ...V126S, createdById: creator.id } });
      await tx.adminAuditLog.create({
        data: {
          action: "GENERATE_VOUCHER",
          performedById: creator.id,
          targetType: "Voucher",
          metadata: { code: v.code, discountPercent: v.discountPercent, recurring: true, oncePerUser: true, planKey: "FAMILY", campaign: "flyer-cafea" },
        },
      });
    }
  });

  const after = await prisma.subscriptionPlan.findMany({ where: { isActive: true, interval: "MONTH" }, select: { familyPlanKey: true, price: true }, orderBy: { price: "asc" } });
  const v = await prisma.voucher.findUnique({ where: { code: V126S.code } });
  console.log("after plans:", JSON.stringify(after));
  console.log("after V126S:", JSON.stringify({ code: v.code, discountPercent: v.discountPercent, recurring: v.recurring, oncePerUser: v.oncePerUser, planKey: v.planKey, expiresAt: v.expiresAt, isActive: v.isActive }));
}

main()
  .catch((e) => { console.error("STOPPED:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
