#!/usr/bin/env node
// Production data change for the parents' page — decided by Alex on 16.09.2026:
//   1. ONV126S, the site's own code, on exactly the same terms as V126S (the flyer's):
//      25%, on every payment (recurring), once per account, Family only, activation until
//      30.11.2026 23:59 (Romanian time). Two codes so the flyer and the site are measured apart.
//   2. „7 zile gratuite" also when paying by card: every active plan's trialDays 14 → 7.
//      (Checkout additionally gives only the days still owed out of 7 since account creation —
//      that part is code, deployed before this script runs.)
//
// Run ON VPS2 after the deploy that contains migration 0064 and the checkout change:
//   cd /var/www/tutor && node Reports/landing-parinte-cafea-2026-09-16/apply-onv126s-and-trial7.mjs          # dry run
//   cd /var/www/tutor && node Reports/landing-parinte-cafea-2026-09-16/apply-onv126s-and-trial7.mjs --apply  # writes
// Guarded like apply-prices-and-v126s.mjs: V126S must exist with the flyer's terms (it is the
// template), each active plan must be at 14 or already 7 days, and nothing is written unless every
// check passes. A JSON backup of both tables is written before the transaction.
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";

const require = createRequire(`${process.cwd()}/package.json`);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const BACKUP_DIR = process.env.BACKUP_DIR || "/root/backups"; // override only for a local test run

const TEMPLATE_CODE = "V126S";
const ONLINE = {
  code: "ONV126S",
  discountPercent: 25,
  recurring: true,
  oncePerUser: true,
  planKey: "FAMILY",
  maxUses: null,
  // 30.11.2026 is winter time in Romania (EET, UTC+2)
  expiresAt: new Date("2026-11-30T23:59:59+02:00"),
};
const TRIAL = { from: 14, to: 7 };

const sameTerms = (v) =>
  v.discountPercent === ONLINE.discountPercent &&
  v.recurring === ONLINE.recurring &&
  v.oncePerUser === ONLINE.oncePerUser &&
  v.planKey === ONLINE.planKey &&
  (v.maxUses ?? null) === ONLINE.maxUses &&
  v.expiresAt?.getTime() === ONLINE.expiresAt.getTime();

async function main() {
  const template = await prisma.voucher.findUnique({ where: { code: TEMPLATE_CODE } });
  if (!template || !template.isActive || !sameTerms(template)) {
    throw new Error(`${TEMPLATE_CODE} is missing or no longer on the flyer's terms: ${JSON.stringify(template)} — stopping`);
  }

  const existing = await prisma.voucher.findUnique({ where: { code: ONLINE.code } });
  if (existing && !sameTerms(existing)) {
    throw new Error(`${ONLINE.code} already exists with different settings: ${JSON.stringify(existing)} — stopping`);
  }
  if (existing) console.log(`= ${ONLINE.code} already exists with the intended settings`);

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    select: { id: true, name: true, familyPlanKey: true, trialDays: true, interval: true },
  });
  const planUpdates = [];
  for (const p of plans) {
    if (p.trialDays === TRIAL.to) console.log(`= ${p.name}: already ${TRIAL.to} days`);
    else if (p.trialDays === TRIAL.from) planUpdates.push(p);
    else throw new Error(`${p.name} has trialDays=${p.trialDays}, neither ${TRIAL.from} nor ${TRIAL.to} — stopping, check by hand`);
  }

  const creator = await prisma.user.findFirst({ where: { isSuperAdmin: true }, orderBy: { createdAt: "asc" }, select: { id: true, email: true } });
  if (!creator) throw new Error("no super-admin user to own the voucher");

  for (const p of planUpdates) console.log(`→ ${p.name}: trialDays ${TRIAL.from} → ${TRIAL.to}`);
  if (!existing) {
    console.log(`→ create ${ONLINE.code}: 25% · every payment · once per account · FAMILY only · expires ${ONLINE.expiresAt.toISOString()} · owner ${creator.email}`);
  }
  if (!APPLY) {
    console.log("\nDRY RUN — nothing written. Re-run with --apply.");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = `${BACKUP_DIR}/tutor-plans-vouchers-before-onv126s-trial7-${stamp}.json`;
  writeFileSync(
    backupPath,
    JSON.stringify({ plans: await prisma.subscriptionPlan.findMany(), vouchers: await prisma.voucher.findMany() }, null, 2),
  );
  console.log(`backup: ${backupPath}`);

  await prisma.$transaction(async (tx) => {
    for (const p of planUpdates) {
      const r = await tx.subscriptionPlan.updateMany({ where: { id: p.id, trialDays: TRIAL.from }, data: { trialDays: TRIAL.to } });
      if (r.count !== 1) throw new Error(`${p.name} changed under us — rolled back`);
    }
    if (planUpdates.length) {
      await tx.adminAuditLog.create({
        data: {
          action: "EDIT_PLAN_TRIAL_DAYS",
          performedById: creator.id,
          targetType: "SubscriptionPlan",
          metadata: {
            reason: "7 zile gratuite și la plata cu cardul, 7 în total (decizie Alex 16.09.2026)",
            changes: planUpdates.map((p) => ({ id: p.id, name: p.name, from: TRIAL.from, to: TRIAL.to })),
          },
        },
      });
    }
    if (!existing) {
      const v = await tx.voucher.create({ data: { ...ONLINE, createdById: creator.id } });
      await tx.adminAuditLog.create({
        data: {
          action: "GENERATE_VOUCHER",
          performedById: creator.id,
          targetType: "Voucher",
          metadata: {
            code: v.code,
            discountPercent: v.discountPercent,
            recurring: true,
            oncePerUser: true,
            planKey: "FAMILY",
            campaign: "parinte-online",
            sameTermsAs: TEMPLATE_CODE,
          },
        },
      });
    }
  });

  const after = await prisma.subscriptionPlan.findMany({ where: { isActive: true }, select: { name: true, trialDays: true }, orderBy: { price: "asc" } });
  const vouchers = await prisma.voucher.findMany({
    where: { code: { in: [TEMPLATE_CODE, ONLINE.code] } },
    select: { code: true, discountPercent: true, recurring: true, oncePerUser: true, planKey: true, expiresAt: true, isActive: true },
  });
  console.log("after plans:", JSON.stringify(after));
  console.log("after vouchers:", JSON.stringify(vouchers));
}

main()
  .catch((e) => {
    console.error("STOPPED:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
