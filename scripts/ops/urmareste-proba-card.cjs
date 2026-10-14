/**
 * DOAR CITIRE. Proba cu cardul pe producție (14.10.2026): ce a înregistrat eTutor pentru UN cont, la fiecare pas
 * (abonare → Pachete → anulare din portal → încheiere / rambursare), pus lângă ce spune Stripe prin brokerul de plăți.
 *
 * De ce: până acum nicio plată cu card n-a trecut prin producție; fluxul e verificat doar pe QA. Alex face proba cu
 * cardul lui, iar după fiecare pas rulează scriptul ăsta și trimite rezultatul în sesiune. Nu schimbă nimic,
 * nici în bază, nici în Stripe.
 *
 * Rulare, din orice folder de pe Mac (pune adresa contului de test în CONT):
 *   ssh root@72.62.155.74 'cd /var/www/tutor && git fetch -q origin master && git show origin/master:scripts/ops/urmareste-proba-card.cjs | CONT=adresa@contului.ro node --env-file=.env -'
 *
 * Rambursarea NU apare în eTutor: aplicația nu primește evenimentul de rambursare (plata rămâne „succeeded”).
 * Se vede doar în Stripe.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const TZ = "Europe/Bucharest";
const mask = (e) => (e ? e.replace(/^(.).*?(.)?@/, (m, a, b) => `${a}***${b ?? ""}@`) : "(fără e-mail)");
const day = (d) => (d ? new Date(d).toLocaleDateString("ro-RO", { timeZone: TZ }) : "—");
const when = (d) => (d ? new Date(d).toLocaleString("ro-RO", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }) : "—");
const money = (minor, cur) => (typeof minor === "number" ? `${(minor / 100).toFixed(2).replace(".", ",")} ${(cur || "ron").toUpperCase()}` : "—");
const tail = (id) => (id ? `…${id.slice(-6)}` : "—");
const DAY_MS = 24 * 60 * 60 * 1000;

async function stripeSide(subscriptionId) {
  if (!process.env.STRIPE_BROKER_URL || !process.env.STRIPE_BROKER_PROJECT_KEY) return { error: "lipsesc STRIPE_BROKER_URL / STRIPE_BROKER_PROJECT_KEY" };
  try {
    const res = await fetch(`${process.env.STRIPE_BROKER_URL.replace(/\/$/, "")}/api/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Project-Key": process.env.STRIPE_BROKER_PROJECT_KEY },
      body: JSON.stringify({ subscriptionId }),
      signal: AbortSignal.timeout(15000),
    });
    const body = await res.json().catch(() => ({}));
    return res.ok ? { sub: body.subscription } : { error: `${res.status} ${body.error ?? ""}`.trim() };
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  const cont = (process.env.CONT || "").trim().toLowerCase();
  if (!cont) throw new Error("pune adresa (sau numele de utilizator) contului de test în CONT=…");
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: cont }, { username: cont }] },
    select: {
      id: true, email: true, name: true, createdAt: true, freeForever: true, referredById: true, pendingVoucherCode: true,
      subscriptionStatus: true, subscriptionEndsAt: true, stripeSubscriptionId: true, subscriptionPeriodEnd: true,
      subscriptionCancelAt: true, subscriptionPrice: true, subscriptionRetryAt: true, subscriptionSyncedAt: true,
      subscriptionPlan: { select: { name: true, price: true, interval: true } },
    },
  });
  if (!user) throw new Error(`niciun cont cu adresa/numele „${cont}”`);

  const now = new Date();
  const sw = await prisma.appSetting.findUnique({ where: { key: "accessTrial" } });
  // Same rule as access.ts trialStartOf: an account older than the switch gets its week from the switch.
  const switchAt = sw?.value?.startsAt ? new Date(sw.value.startsAt) : null;
  const trialStart = switchAt && user.createdAt < switchAt ? switchAt : user.createdAt;
  const trialLeft = Math.min(7, Math.max(0, 7 - Math.floor((now - trialStart) / DAY_MS)));
  console.log(`== Cont: ${mask(user.email)} · ${user.name ?? "?"} · creat ${when(user.createdAt)}`);
  console.log(`   zile gratuite la o abonare făcută ACUM: ${trialLeft}${trialLeft > 0 ? " (cardul nu e taxat la abonare)" : " (cardul e taxat pe loc)"}`);
  console.log(`   comutatorul probei: ${sw ? `PORNIT din ${when(switchAt)}` : "OPRIT"} · Gratuit permanent: ${user.freeForever ? "DA" : "nu"} · cod păstrat: ${user.pendingVoucherCode ?? "—"}`);
  if (user.referredById) console.log("   ⚠ contul a venit prin recomandarea cuiva: o plată reală îi trece comision (de anulat după rambursare)");

  const p = user.subscriptionPlan;
  console.log("\n== Abonamentul, cum îl vede eTutor");
  console.log(`   pachet: ${p ? `${p.name} (${money(p.price, "ron")}/${p.interval === "YEAR" ? "an" : "lună"})` : "—"} · stare: ${user.subscriptionStatus ?? "—"} · abonament Stripe: ${tail(user.stripeSubscriptionId)}`);
  console.log(`   următoarea plată / sfârșitul perioadei: ${day(user.subscriptionPeriodEnd)} · oprire programată: ${day(user.subscriptionCancelAt)} · preț pe perioadă: ${money(user.subscriptionPrice, "ron")}`);
  console.log(`   acces până la: ${day(user.subscriptionEndsAt)} · reîncercare la bancă: ${when(user.subscriptionRetryAt)} · citit ultima oară de la broker: ${when(user.subscriptionSyncedAt)}`);

  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, createdAt: true, amount: true, currency: true, status: true, type: true, plan: { select: { name: true } } },
  });
  console.log(`\n== Plăți înregistrate în eTutor: ${payments.length}${payments.length === 10 ? " (ultimele 10)" : ""}`);
  for (const x of payments) console.log(`   ${when(x.createdAt)} · ${money(x.amount, x.currency)} · ${x.status} · ${x.type} · ${x.plan?.name ?? "—"}`);
  const earnings = payments.length
    ? await prisma.referralEarning.count({ where: { paymentId: { in: payments.map((x) => x.id) } } })
    : 0;
  if (earnings) console.log(`   ⚠ comisioane de recomandare pe aceste plăți: ${earnings}`);

  const settings = await prisma.setting.findMany({ where: { userId: user.id }, select: { key: true, value: true, updatedAt: true } });
  const billingKeys = settings.filter((s) => /discount|subject|addon|ended|subscription/i.test(s.key));
  console.log(`\n== Ce a păstrat eTutor la abonare (reducere, materii, abonamente încheiate): ${billingKeys.length || "nimic"}`);
  for (const s of billingKeys) console.log(`   ${s.key} (${when(s.updatedAt)}): ${JSON.stringify(s.value).slice(0, 160)}`);

  const since = new Date(now.getTime() - 3 * DAY_MS);
  const notes = await prisma.notification.findMany({
    where: { userId: user.id, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { createdAt: true, type: true, title: true },
  });
  console.log(`\n== Mesaje către cont în ultimele 3 zile: ${notes.length}`);
  for (const n of notes) console.log(`   ${when(n.createdAt)} · ${n.type} · ${n.title}`);

  let stripe = null;
  console.log("\n== Stripe (prin broker)");
  if (!user.stripeSubscriptionId) {
    console.log("   niciun abonament Stripe legat de cont (încă neabonat, sau încheiat)");
  } else {
    const s = await stripeSide(user.stripeSubscriptionId);
    if (s.error) console.log(`   necitit: ${s.error}`);
    else {
      stripe = s.sub;
      console.log(`   stare: ${stripe.status}${stripe.cancelAtPeriodEnd ? ` · se oprește ${day(stripe.cancelAt)}` : ""}${stripe.currentPeriodEnd ? ` · perioada până ${day(stripe.currentPeriodEnd)}` : ""}${stripe.trialEnd ? ` · proba până ${day(stripe.trialEnd)}` : ""}${stripe.endedAt ? ` · încheiat ${day(stripe.endedAt)}` : ""}`);
    }
  }

  const st = user.subscriptionStatus;
  let step;
  if (st === "canceled") step = "abonamentul e ÎNCHEIAT în eTutor (pasul de anulare imediată / încheiere a ajuns)";
  else if (st === "past_due") step = "plata a EȘUAT: contul e în pauză până la o plată reușită";
  else if ((st === "active" || st === "trialing") && (user.subscriptionCancelAt || stripe?.cancelAtPeriodEnd)) step = "ANULARE PROGRAMATĂ din portal: accesul rămâne până la data opririi";
  else if (st === "trialing") step = "ABONAT, în zilele gratuite: nimic taxat încă";
  else if (st === "active" && user.stripeSubscriptionId) step = "ABONAT și TAXAT";
  else step = "încă NEABONAT cu card";
  console.log(`\n== Pasul în care pare să fie contul: ${step}`);

  const tutorAccess = st === "active" || st === "trialing";
  const stripeOk = stripe ? stripe.status === "active" || stripe.status === "trialing" : null;
  if (stripe && tutorAccess !== stripeOk) console.log(`   ⚠ NEPOTRIVIRE: eTutor „${st}”, Stripe „${stripe.status}” — trimite rezultatul în sesiune`);
  if (user.subscriptionCancelAt && stripe && !stripe.cancelAtPeriodEnd) console.log("   ⚠ eTutor are o oprire programată pe care Stripe nu o mai are (reluată din portal?)");
  if (!user.subscriptionCancelAt && stripe?.cancelAtPeriodEnd) console.log("   ⚠ Stripe are o oprire programată pe care eTutor n-a primit-o încă");
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("Eroare:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
