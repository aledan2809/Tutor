/**
 * DOAR CITIRE. Abonamentele cu card: ce crede eTutor vs ce spune Stripe (prin brokerul de plăți), 13.10.2026.
 *
 * De ce: webhook-ul Stripe al firmei (Class RDA) primea doar checkout.session.completed + customer.subscription.updated.
 * Fără invoice.payment_failed / customer.subscription.deleted, eTutor n-a aflat de plățile eșuate sau de anulări: un cont
 * poate avea acces „active” în eTutor deși în Stripe abonamentul e anulat sau neplătit. Scriptul arată fiecare abonament
 * și marchează nepotrivirile. Nu schimbă nimic, nici în bază, nici în Stripe.
 *
 * Rulare, din orice folder de pe Mac:
 *   ssh root@72.62.155.74 'cd /var/www/tutor && git fetch -q origin master && git show origin/master:scripts/ops/verifica-abonamente-card.cjs | node --env-file=.env -'
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const mask = (e) => (e ? e.replace(/^(.).*?(.)?@/, (m, a, b) => `${a}***${b ?? ""}@`) : "(fără e-mail)");
const day = (d) => (d ? new Date(d).toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest" }) : "—");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// eTutor gives access on these; Stripe charges on these.
const TUTOR_ACCESS = new Set(["active", "trialing"]);
const STRIPE_OK = new Set(["active", "trialing"]);

async function stripeSide(subscriptionId) {
  const url = `${process.env.STRIPE_BROKER_URL.replace(/\/$/, "")}/api/subscription`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Project-Key": process.env.STRIPE_BROKER_PROJECT_KEY },
      body: JSON.stringify({ subscriptionId }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429) {
      await sleep(61000); // the broker allows 60 reads a minute per project
      continue;
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { error: `${res.status} ${body.error ?? ""}`.trim() };
    return { sub: body.subscription };
  }
  return { error: "429 de două ori" };
}

(async () => {
  if (!process.env.STRIPE_BROKER_URL || !process.env.STRIPE_BROKER_PROJECT_KEY) throw new Error("lipsesc STRIPE_BROKER_URL / STRIPE_BROKER_PROJECT_KEY în .env");
  const users = await prisma.user.findMany({
    where: { stripeSubscriptionId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { email: true, name: true, subscriptionStatus: true, subscriptionEndsAt: true, stripeSubscriptionId: true, freeForever: true },
  });
  console.log(`== Conturi cu abonament pe card în eTutor: ${users.length}`);
  let noPay = 0;
  let blocked = 0;
  let unknown = 0;
  for (const u of users) {
    const s = await stripeSide(u.stripeSubscriptionId);
    await sleep(1100);
    const tutor = `${u.subscriptionStatus ?? "—"}${u.subscriptionEndsAt ? ` până ${day(u.subscriptionEndsAt)}` : ""}`;
    let stripe;
    let flag = "";
    if (s.error) {
      stripe = `necitit (${s.error})`;
      unknown++;
    } else {
      const sub = s.sub;
      stripe = `${sub.status}${sub.cancelAtPeriodEnd ? `, se oprește ${day(sub.cancelAt)}` : ""}${sub.currentPeriodEnd ? `, perioada până ${day(sub.currentPeriodEnd)}` : ""}${sub.endedAt ? `, încheiat ${day(sub.endedAt)}` : ""}`;
      const tutorAccess = TUTOR_ACCESS.has(u.subscriptionStatus ?? "");
      const stripeOk = STRIPE_OK.has(sub.status);
      if (tutorAccess && !stripeOk && !u.freeForever) {
        flag = "  ⚠ ACCES FĂRĂ PLATĂ";
        noPay++;
      } else if (!tutorAccess && stripeOk) {
        flag = "  ⚠ PLĂTEȘTE, DAR E BLOCAT";
        blocked++;
      }
    }
    console.log(`   ${mask(u.email)} · ${u.name ?? "?"} · eTutor: ${tutor} · Stripe: ${stripe}${flag}`);
  }
  console.log(`\n== Acces fără plată: ${noPay} · Plătesc dar sunt blocați: ${blocked} · Necitite: ${unknown}`);
  console.log(
    noPay + blocked === 0
      ? "REZULTAT: eTutor și Stripe se potrivesc. Nimic de corectat."
      : "REZULTAT: există nepotriviri. Trimite rezultatul în sesiune: pregătesc corectarea (după ce webhook-ul primește toate evenimentele).",
  );
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("Eroare:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
