#!/usr/bin/env node
/**
 * draft-matematica-v-viii.mjs
 *
 * Sets every PUBLISHED Question in the `matematica-v-viii` domain back to DRAFT,
 * per user request (recalibration; exam-bank tier supersedes the generated grile).
 *
 * Scoped + reversible: only domain `matematica-v-viii` + status PUBLISHED is touched.
 * Before writing, the exact affected IDs are saved to
 *   scripts/_rollback/draft-matematica-v-viii-<ISO>.json
 * so the change can be undone precisely (set those IDs back to PUBLISHED).
 *
 * ⚠️ Side effect (intended): after this runs, `matematica-v-viii` has 0 PUBLISHED
 *    questions → the Matematică subject disappears from the public `/try` demo +
 *    practice (both read Question status=PUBLISHED, type=MULTIPLE_CHOICE) until
 *    something is re-published.
 *
 * Modes:  --dry  report only, NO writes.  (no flag)  apply.
 * DB target: DATABASE_URL from env (.env). On prod = VPS2 local PG. Never Neon.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DRY = process.argv.includes("--dry");
const DOMAIN_SLUG = "matematica-v-viii";
const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    console.log(`\n=== draft-matematica-v-viii (mode=${DRY ? "dry" : "apply"}) ===`);
    const domain = await prisma.domain.findUnique({ where: { slug: DOMAIN_SLUG } });
    if (!domain) {
      console.error(`❌ Domain '${DOMAIN_SLUG}' not found. Aborting.`);
      process.exit(1);
    }

    const published = await prisma.question.findMany({
      where: { domainId: domain.id, status: "PUBLISHED" },
      select: { id: true },
    });
    const counts = await prisma.question.groupBy({
      by: ["status"],
      where: { domainId: domain.id },
      _count: { _all: true },
    });
    const before = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
    console.log(`  domain '${DOMAIN_SLUG}' (${domain.id}) — before:`, before);
    console.log(`  PUBLISHED to draft: ${published.length}`);

    if (DRY) {
      console.log("\n🔎 DRY — no writes.");
      return;
    }
    if (published.length === 0) {
      console.log("\n✅ Nothing to do — 0 PUBLISHED (idempotent).");
      return;
    }

    // rollback list (write BEFORE mutation)
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const rbDir = join(__dirname, "_rollback");
    mkdirSync(rbDir, { recursive: true });
    const rbPath = join(rbDir, `draft-matematica-v-viii-${ts}.json`);
    writeFileSync(
      rbPath,
      JSON.stringify(
        { domainSlug: DOMAIN_SLUG, domainId: domain.id, action: "PUBLISHED->DRAFT", at: ts, ids: published.map((q) => q.id) },
        null,
        2
      )
    );
    console.log(`  rollback list → ${rbPath}`);

    const res = await prisma.question.updateMany({
      where: { domainId: domain.id, status: "PUBLISHED" },
      data: { status: "DRAFT" },
    });

    const after = Object.fromEntries(
      (
        await prisma.question.groupBy({ by: ["status"], where: { domainId: domain.id }, _count: { _all: true } })
      ).map((c) => [c.status, c._count._all])
    );
    console.log(`\n✅ APPLIED — ${res.count} updated. after:`, after);
    console.log(`   Rollback: set status=PUBLISHED for the ${published.length} ids in ${rbPath}`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
