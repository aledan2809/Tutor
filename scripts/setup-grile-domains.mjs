#!/usr/bin/env node
/**
 * setup-grile-domains.mjs — Capacitate „Grile" consolidation (data side)
 *
 * 1. Rename Domain "Matematica V-VIII" → "Matematica cl. VIII" (keep slug — Capacitate bank,
 *    aggregates V-VIII source material; per-question source-class lives in Question.topic).
 * 2. Align Question.subject for that domain's questions → "Matematica cl. VIII".
 * 3. Upsert empty Domain "Română cl. VIII" (slug romana-cl-viii) — placeholder until RO grile exist.
 * 4. Publish the consolidated Mate grile: AI_GENERATED MULTIPLE_CHOICE DRAFT with meshConfidence
 *    >= MIN_CONF (default 0.8) → status PUBLISHED. Idempotent.
 *
 * Modes: --dry (report, no writes) · (no flag) apply. DB: DATABASE_URL from env (VPS2 local PG).
 */

const DRY = process.argv.includes("--dry");
const MIN_CONF = Number(process.env.GRILE_MIN_CONF ?? "0.8");

const MATE_SLUG = "matematica-v-viii";
const MATE_NEW_NAME = "Matematica cl. VIII";
const RO = { slug: "romana-cl-viii", name: "Română cl. VIII" };

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    // 1+2. Rename Mate domain + align subject
    const mate = await prisma.domain.findUnique({ where: { slug: MATE_SLUG } });
    if (!mate) throw new Error(`Domain ${MATE_SLUG} not found`);
    const oldName = mate.name;
    console.log(`Mate domain: "${oldName}" (slug ${mate.slug})`);

    // 4. Count publishable grile (eligibility)
    const eligible = await prisma.question.findMany({
      where: {
        domainId: mate.id, type: "MULTIPLE_CHOICE", status: "DRAFT",
        meshConfidence: { gte: MIN_CONF },
      },
      select: { id: true, meshConfidence: true },
    });
    const total = await prisma.question.count({ where: { domainId: mate.id } });
    console.log(`  questions total=${total}, eligible to publish (MCQ DRAFT conf>=${MIN_CONF})=${eligible.length}`);

    // 3. Romana domain
    const roExisting = await prisma.domain.findUnique({ where: { slug: RO.slug } });
    console.log(`Romana domain "${RO.name}" (slug ${RO.slug}): ${roExisting ? "exists" : "will CREATE"}`);

    if (DRY) {
      console.log("\n🔎 DRY — no writes.");
      return;
    }

    if (oldName !== MATE_NEW_NAME) {
      await prisma.domain.update({ where: { id: mate.id }, data: { name: MATE_NEW_NAME } });
      const subj = await prisma.question.updateMany({
        where: { domainId: mate.id, subject: oldName },
        data: { subject: MATE_NEW_NAME },
      });
      console.log(`  ✅ renamed domain → "${MATE_NEW_NAME}", aligned ${subj.count} question.subject`);
    } else {
      console.log("  domain already named correctly — skip rename");
    }

    if (!roExisting) {
      await prisma.domain.create({
        data: { name: RO.name, slug: RO.slug, isActive: true, instructorEnabled: false },
      });
      console.log(`  ✅ created empty domain "${RO.name}"`);
    }

    if (eligible.length) {
      const pub = await prisma.question.updateMany({
        where: { id: { in: eligible.map((q) => q.id) } },
        data: { status: "PUBLISHED" },
      });
      console.log(`  ✅ published ${pub.count} Mate grile (DRAFT → PUBLISHED)`);
    }

    // summary
    const [matePub, mateDraft, roCount] = await Promise.all([
      prisma.question.count({ where: { domainId: mate.id, status: "PUBLISHED" } }),
      prisma.question.count({ where: { domainId: mate.id, status: "DRAFT" } }),
      prisma.domain.findUnique({ where: { slug: RO.slug }, include: { _count: { select: { questions: true } } } }),
    ]);
    console.log(`\n✅ APPLIED.`);
    console.log(`  Matematica cl. VIII: PUBLISHED=${matePub} DRAFT=${mateDraft}`);
    console.log(`  Română cl. VIII: questions=${roCount?._count.questions ?? 0} (placeholder)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
