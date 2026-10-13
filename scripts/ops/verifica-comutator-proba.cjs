/**
 * DOAR CITIRE. Ce a făcut comutatorul probei (accesTrial) pe producție cât a fost pornit din greșeală (13.10.2026).
 *
 * Cât a fost pornit, singurul efect posibil: cron-ul /api/cron/escalation (la 15 minute, mesajele doar între 9 și 20 ora
 * României) a putut trimite părinților mesajul de lansare „7 zile cu tot pachetul Family… apoi contul intră în pauză”
 * (notificare în aplicație + e-mail/Telegram/push). Pauze n-au putut apărea: fiecare cont mai vechi primea întâi 7 zile.
 *
 * Rulare, din orice folder de pe Mac (serverul ia scriptul din GitHub, fără să schimbe nimic în /var/www/tutor):
 *   ssh root@72.62.155.74 'cd /var/www/tutor && git fetch -q origin master && git show origin/master:scripts/ops/verifica-comutator-proba.cjs | node --env-file=.env -'
 * sau, din folderul Tutor de pe Mac, după `git pull`:
 *   ssh root@72.62.155.74 'cd /var/www/tutor && node --env-file=.env -' < scripts/ops/verifica-comutator-proba.cjs
 * Nu scrie nimic în bază.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const mask = (e) => (e ? e.replace(/^(.).*?(.)?@/, (m, a, b) => `${a}***${b ?? ""}@`) : "(fără e-mail)");
const ro = (d) => d.toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" });

(async () => {
  const since = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  const audit = await prisma.adminAuditLog.findMany({
    where: { action: { in: ["ACCESS_TRIAL_ON", "ACCESS_TRIAL_OFF"] }, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { action: true, createdAt: true },
  });
  const setting = await prisma.appSetting.findUnique({ where: { key: "accessTrial" } });
  console.log("== Comutatorul acum:", setting ? `PORNIT din ${JSON.stringify(setting.value)}` : "OPRIT (niciun rând accessTrial)");
  console.log("== Porniri/opriri în ultimele 3 zile:");
  for (const a of audit) console.log(`   ${a.action === "ACCESS_TRIAL_ON" ? "PORNIT" : "OPRIT "}  ${ro(a.createdAt)}`);
  if (audit.length === 0) console.log("   (niciuna în jurnalul de administrare)");

  const firstOn = audit.find((a) => a.action === "ACCESS_TRIAL_ON")?.createdAt ?? since;
  const notes = await prisma.notification.findMany({
    where: { type: { startsWith: "access_trial_" }, createdAt: { gte: firstOn } },
    orderBy: { createdAt: "asc" },
    select: { type: true, createdAt: true, user: { select: { email: true, name: true } } },
  });
  console.log(`\n== Mesaje de probă create de la prima pornire (${ro(firstOn)}): ${notes.length}`);
  const byType = {};
  for (const n of notes) byType[n.type] = (byType[n.type] ?? 0) + 1;
  for (const [t, c] of Object.entries(byType)) console.log(`   ${t}: ${c}`);
  for (const n of notes) console.log(`   ${ro(n.createdAt)}  ${n.type}  ${n.user?.name ?? "?"}  ${mask(n.user?.email)}`);
  console.log(
    notes.length === 0
      ? "\nREZULTAT: niciun mesaj nu a plecat. Nu e nimic de reparat."
      : "\nREZULTAT: părinții de mai sus au primit mesajul de lansare. Trimite rezultatul în sesiune: pregătesc mesajul de corectare.",
  );
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("Eroare:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
