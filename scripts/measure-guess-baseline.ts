/**
 * Cât ia un elev care nu citește întrebarea, pe grilele unei materii.
 *
 *   export DATABASE_URL=...
 *   npx tsx scripts/measure-guess-baseline.ts <slug-materie> [--status DRAFT|PUBLISHED|toate]
 *
 * Există fiindcă de trei ori la rând am declarat scurgerea închisă după ce am
 * reparat-o pe unitatea pe care o măsuram, iar ea s-a mutat în vecina ei:
 * caractere → cuvinte → virgule → propoziții. Ruta de generare rulează deja
 * măsurătoarea pe lotul proaspăt; asta o rulează pe ce e deja în bază, oricând.
 */

import { PrismaClient } from "@prisma/client";
import { measureGuessBaseline, describeGuessBaseline } from "../src/lib/guess-baseline";

const prisma = new PrismaClient();

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Folosire: npx tsx scripts/measure-guess-baseline.ts <slug-materie> [--status DRAFT|PUBLISHED|toate]");
    process.exitCode = 1;
    return;
  }
  const statusArg = process.argv.includes("--status")
    ? process.argv[process.argv.indexOf("--status") + 1]
    : "toate";

  const domain = await prisma.domain.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!domain) {
    console.error(`Nu există materia „${slug}".`);
    process.exitCode = 1;
    return;
  }

  const rows = await prisma.question.findMany({
    where: {
      domainId: domain.id,
      type: "MULTIPLE_CHOICE",
      ...(statusArg === "toate" ? {} : { status: statusArg as "DRAFT" | "PUBLISHED" }),
    },
    select: { options: true, correctAnswer: true },
  });

  const items = rows.map((r) => ({
    options: Array.isArray(r.options) ? (r.options as unknown[]).map(String) : [],
    correctAnswer: r.correctAnswer,
  }));

  const b = measureGuessBaseline(items);
  console.log(`${domain.name} · ${b.n} grile · întâmplarea ${Math.round(b.chance * 100)}%\n`);
  console.log("strategie".padEnd(44) + "rată".padStart(8) + "din".padStart(6) + "p".padStart(11));
  console.log("-".repeat(69));
  for (const s of [...b.scores, b.cascade].sort((x, y) => y.rate - x.rate)) {
    if (!s.decided) continue;
    console.log(
      s.name.padEnd(44) +
        (Math.round(s.rate * 100) + "%").padStart(8) +
        String(s.decided).padStart(6) +
        s.pValue.toFixed(4).padStart(11) +
        (s.pValue < 0.01 ? "  ⚠️" : ""),
    );
  }
  console.log("\n" + describeGuessBaseline(b));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
