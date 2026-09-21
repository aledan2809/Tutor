#!/usr/bin/env node
// Annual packages for delivery 2 — decided by Alex on 16–17.09.2026: a year costs ten months of the
// monthly price, with the family's discounts (trial offer or code, Telegram) and the free days left.
//
// For every active monthly package with a family plan key, one annual row: the same seats and
// features, price = 10 × the monthly price, trialDays as monthly. The row's price is informational:
// checkout, the pages and the add-on quotes price a year from the monthly row (checkout-facts.ts
// monthlyPlanPriceMinor), so a later change of the monthly price can't leave the two apart.
//
// Run from the Tutor repo (locally against the QA database, on VPS2 after the deploy):
//   node scripts/create-annual-plans.mjs          # dry run: prints what it would create or update
//   node scripts/create-annual-plans.mjs --apply  # backup JSON, then writes in one transaction
// Idempotent: an annual row that already exists for a key (same stripeId) isn't recreated; its price is
// brought to 10 × today's monthly price. One that isn't an annual row of the same package stops the run.
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";

const require = createRequire(`${process.cwd()}/package.json`);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const MONTHS_PAID_PER_YEAR = 10;

async function main() {
  const monthly = await prisma.subscriptionPlan.findMany({
    where: { isActive: true, interval: "MONTH", familyPlanKey: { not: null } },
    orderBy: { price: "asc" },
  });
  if (monthly.length === 0) throw new Error("no active monthly packages with a family plan key");

  const keys = new Set();
  const creates = [];
  const updates = [];
  for (const m of monthly) {
    if (keys.has(m.familyPlanKey)) throw new Error(`two active monthly ${m.familyPlanKey} packages — check by hand`);
    keys.add(m.familyPlanKey);
    const stripeId = `${m.stripeId}-year`;
    const price = m.price * MONTHS_PAID_PER_YEAR;
    const existing = await prisma.subscriptionPlan.findUnique({ where: { stripeId } });
    if (existing) {
      if (existing.interval !== "YEAR" || existing.familyPlanKey !== m.familyPlanKey) {
        throw new Error(`${stripeId} exists as ${existing.interval} / ${existing.familyPlanKey}, expected YEAR / ${m.familyPlanKey}`);
      }
      if (existing.price !== price) {
        updates.push({ id: existing.id, price });
        console.log(`~ ${m.familyPlanKey.padEnd(11)} ${existing.name}: ${(existing.price / 100).toFixed(2)} → ${(price / 100).toFixed(2)} lei / an (lunar ${(m.price / 100).toFixed(2)})`);
      } else {
        console.log(`= ${m.familyPlanKey.padEnd(11)} ${existing.name}: already ${(price / 100).toFixed(2)} lei / an`);
      }
      continue;
    }
    creates.push({
      name: `${m.name} · anual`,
      stripeId,
      price,
      interval: "YEAR",
      trialDays: m.trialDays,
      features: m.features ?? undefined,
      isActive: true,
      familyPlanKey: m.familyPlanKey,
      maxParents: m.maxParents,
      maxChildren: m.maxChildren,
      maxTutors: m.maxTutors,
    });
    console.log(`+ ${m.familyPlanKey.padEnd(11)} ${m.name} · anual: ${(price / 100).toFixed(2)} lei / an (lunar ${(m.price / 100).toFixed(2)})`);
  }

  if (!APPLY) {
    console.log(`\nDry run: ${creates.length} annual package(s) would be created, ${updates.length} price(s) updated. Run with --apply to write.`);
    return;
  }
  if (creates.length === 0 && updates.length === 0) {
    console.log("\nNothing to write.");
    return;
  }
  const dir = `${process.env.HOME}/backups`;
  mkdirSync(dir, { recursive: true });
  const backup = `${dir}/tutor-plans-before-annual-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(backup, JSON.stringify(await prisma.subscriptionPlan.findMany(), null, 2));
  console.log(`\nBackup: ${backup}`);
  await prisma.$transaction([
    ...creates.map((data) => prisma.subscriptionPlan.create({ data })),
    ...updates.map(({ id, price }) => prisma.subscriptionPlan.update({ where: { id }, data: { price } })),
  ]);
  console.log(`Created ${creates.length} annual package(s), updated ${updates.length} price(s).`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
