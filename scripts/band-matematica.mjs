// One-shot: grade-band Matematica. The existing "Matematica" domain (all
// gymnasium content) becomes "Matematica V-VIII"; an empty "Matematica IX-XII"
// is created for high-school content. Question.subject is aligned too so the
// public demo dropdown matches the register domains. Idempotent.
//
//   DATABASE_URL=... node scripts/band-matematica.mjs        (dry run)
//   DATABASE_URL=... node scripts/band-matematica.mjs --apply

const OLD = { name: "Matematica", slug: "matematica" };
const VVIII = { name: "Matematica V-VIII", slug: "matematica-v-viii" };
const IXXII = { name: "Matematica IX-XII", slug: "matematica-ix-xii" };

async function run(apply) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const dom = await prisma.domain.findFirst({ where: { OR: [{ slug: OLD.slug }, { name: OLD.name }] } });
  console.log("Existing Matematica domain:", dom ? `${dom.name} (${dom.slug})` : "NOT FOUND");
  if (dom && dom.slug !== VVIII.slug) {
    if (apply) {
      await prisma.domain.update({ where: { id: dom.id }, data: { name: VVIII.name, slug: VVIII.slug } });
      console.log(`  renamed domain -> ${VVIII.name} (${VVIII.slug})`);
    } else console.log(`  would rename -> ${VVIII.name} (${VVIII.slug})`);
  } else if (dom) console.log("  already renamed.");

  const ix = await prisma.domain.findFirst({ where: { slug: IXXII.slug } });
  if (!ix) {
    if (apply) {
      await prisma.domain.create({ data: { name: IXXII.name, slug: IXXII.slug, isActive: true } });
      console.log(`  created empty domain -> ${IXXII.name} (${IXXII.slug})`);
    } else console.log(`  would create -> ${IXXII.name} (${IXXII.slug})`);
  } else console.log(`  ${IXXII.name} already exists.`);

  const cnt = await prisma.question.count({ where: { subject: OLD.name } });
  console.log(`Questions with subject "${OLD.name}": ${cnt}`);
  if (cnt) {
    if (apply) {
      const r = await prisma.question.updateMany({ where: { subject: OLD.name }, data: { subject: VVIII.name } });
      console.log(`  updated subject -> "${VVIII.name}" on ${r.count} questions`);
    } else console.log(`  would update subject -> "${VVIII.name}" on ${cnt} questions`);
  }

  console.log(apply ? "\nAPPLIED." : "\nDRY RUN — re-run with --apply.");
  await prisma.$disconnect();
}

run(process.argv[2] === "--apply");
