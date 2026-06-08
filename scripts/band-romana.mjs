#!/usr/bin/env node
/**
 * band-romana.mjs — banding for Limba română (mirror of band-matematica).
 *
 * Bands: "Română cl. VIII" (Capacitate / gimnaziu — already exists, holds the official
 * grile) + "Română IX-XII" (liceu / BAC — empty shell, created here). Matches the Mate
 * banding ("Matematica cl. VIII" + "Matematica IX-XII").
 *
 * Idempotent. Modes: --dry / (apply). DB: DATABASE_URL from env (VPS2 local PG).
 */

const DRY = process.argv.includes("--dry");

const CAPACITATE = { slug: "romana-cl-viii", name: "Română cl. VIII" };
const LICEU = { slug: "romana-ix-xii", name: "Română IX-XII" };

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const cap = await prisma.domain.findUnique({ where: { slug: CAPACITATE.slug } });
    const lic = await prisma.domain.findUnique({ where: { slug: LICEU.slug } });
    console.log(`"${CAPACITATE.name}" (${CAPACITATE.slug}): ${cap ? "exists" : "MISSING"}`);
    console.log(`"${LICEU.name}" (${LICEU.slug}): ${lic ? "exists" : "will CREATE"}`);

    if (DRY) {
      console.log("\n🔎 DRY — no writes.");
      return;
    }

    if (!cap) {
      await prisma.domain.create({
        data: { name: CAPACITATE.name, slug: CAPACITATE.slug, isActive: true, instructorEnabled: false },
      });
      console.log(`  ✅ created "${CAPACITATE.name}"`);
    }
    if (!lic) {
      await prisma.domain.create({
        data: { name: LICEU.name, slug: LICEU.slug, isActive: true, instructorEnabled: false },
      });
      console.log(`  ✅ created empty "${LICEU.name}"`);
    }
    console.log("\n✅ APPLIED. Banda Română: cl. VIII (Capacitate) + IX-XII (BAC).");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
