#!/usr/bin/env node
/**
 * band-matematica-bac.mjs — create the 3 BAC Matematică program domains.
 *
 * BAC Matematică has 3 distinct national programs (NEVER mixed):
 *   • M1 — Matematică-Informatică (mate-info)
 *   • M2 — Științele naturii
 *   • M3 — Tehnologic
 * Each gets its own Domain (slug ends in -ix-xii → classified "Bacalaureat" by
 * src/lib/exam-level.ts) so Grile group separately per program. Idempotent.
 *
 * DB: DATABASE_URL from env (VPS2 local PG). Modes: --dry / (apply).
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const DOMAINS = [
  { slug: "matematica-m1-ix-xii", name: "Matematică M1 (Mate-Info) — Bacalaureat" },
  { slug: "matematica-m2-ix-xii", name: "Matematică M2 (Științele naturii) — Bacalaureat" },
  { slug: "matematica-m3-ix-xii", name: "Matematică M3 (Tehnologic) — Bacalaureat" },
];

async function run() {
  for (const d of DOMAINS) {
    const existing = await prisma.domain.findFirst({ where: { OR: [{ slug: d.slug }, { name: d.name }] } });
    if (existing) { console.log(`  ✓ exists: ${existing.name} (${existing.slug})`); continue; }
    if (DRY) { console.log(`  would create: ${d.name} (${d.slug})`); continue; }
    await prisma.domain.create({ data: { name: d.name, slug: d.slug, isActive: true } });
    console.log(`  + created: ${d.name} (${d.slug})`);
  }
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
