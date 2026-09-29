/**
 * Erases one account by hand — for the cases a person decides: a parent who withdraws consent by
 * writing to the DPO, or an account the automatic sweep held back (it had a payment; once the
 * subscription is stopped and the invoices are kept, it can go). Same routine as the automatic
 * erasure (src/lib/account-erasure.ts): the Legal Hub is told first, then everything is deleted.
 *
 * Without `--apply` it only shows who would be erased.
 *
 *   npx tsx scripts/erase-account.ts --user <id> [--reason GUARDIAN_REFUSED|NO_GUARDIAN_ANSWER|INACTIVE|OTHER]
 *   npx tsx scripts/erase-account.ts --user <id> --reason OTHER --apply
 *   npx tsx scripts/erase-account.ts --user <id> --reason GUARDIAN_REFUSED --keep-payments --apply
 *
 * --keep-payments: for an account held because of its payments, once nothing on it is still paying or
 * owed (its card subscription and every extra subject or seat bought next to it stopped, its referral
 * commissions settled). The payment records move to a holder account with nothing about the person;
 * the rest is erased.
 */
import { prisma } from "@/lib/prisma";
import { eraseAccount, moneyFacts, stillMoving, type ErasureReason } from "@/lib/account-erasure";

const REASONS: ErasureReason[] = ["GUARDIAN_REFUSED", "NO_GUARDIAN_ANSWER", "INACTIVE", "OTHER"];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const userId = arg("--user");
  const reason = (arg("--reason") ?? "OTHER") as ErasureReason;
  if (!userId || !REASONS.includes(reason)) {
    console.error("Folosire: --user <id> [--reason GUARDIAN_REFUSED|NO_GUARDIAN_ANSWER|INACTIVE|OTHER] [--keep-payments] [--apply]");
    process.exit(2);
  }
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      username: true,
      accountRole: true,
      createdAt: true,
      stripeSubscriptionId: true,
      _count: { select: { payments: true, attempts: true } },
    },
  });
  if (!u) {
    console.log("Nu există un cont cu acest id.");
    return;
  }
  console.log(
    `Cont: ${u.name ?? "—"} · ${u.email ?? u.username ?? "—"} · ${u.accountRole ?? "—"} · făcut ${u.createdAt.toISOString().slice(0, 10)}`,
  );
  const money = await moneyFacts(userId);
  console.log(`Plăți: ${u._count.payments} · abonament card: ${u.stripeSubscriptionId ? "da" : "nu"} · răspunsuri: ${u._count.attempts}`);
  if (money?.addons.length) console.log(`Abonamente separate încă active (brokerul Stripe): ${money.addons.map((a) => a.sessionId).join(", ")}`);
  if (money?.owedCommissions) console.log(`Comisioane de recomandare neplătite: ${money.owedCommissions}`);
  if (!process.argv.includes("--apply")) {
    console.log(`Probă — nu șterg nimic. Motiv ales: ${reason}. Adaugă --apply ca să șterg.`);
    return;
  }
  const keepPayments = process.argv.includes("--keep-payments");
  if (money && stillMoving(money)) {
    console.log(
      "Mai sunt bani în mișcare pe cont: oprește întâi abonamentul cu cardul și abonamentele separate (brokerul Stripe) și decontează comisioanele, apoi rulează din nou.",
    );
    return;
  }
  const r = await eraseAccount(userId, reason, { keepPayments });
  console.log(r.erased ? `ȘTERS.${keepPayments ? " Plățile au rămas, fără nimic despre persoană." : ""}` : `NU s-a șters: ${r.why}.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
