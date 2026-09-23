/**
 * Presence, verified against a real database: the signal, the 30-minute rule, two tabs at once, and
 * the split between measured stays and the history rebuilt from activity.
 *
 * Run against the QA database (never prod — it writes and deletes):
 *   cd Tutor && DATABASE_URL=postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa \
 *     npx tsx Reports/prezenta-conturi-2026-09-23/verificare-prezenta.ts
 *
 * Everything it creates carries the `qa-presence-` prefix and is deleted at the end, pass or fail.
 */
import { prisma } from "@/lib/prisma";
import {
  recordPing,
  presenceFor,
  lastTraceFor,
  lastSeenFor,
  trackingStart,
  purgeOldVisits,
  VISIT_GAP_MS,
  VISIT_TAIL_MS,
} from "@/lib/presence";

const MIN = 60_000;
const TAG = "qa-presence";
let pass = 0;
let fail = 0;

function check(name: string, ok: boolean, detail: unknown = "") {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}  ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  } else {
    fail++;
    console.log(`FAIL  ${name}  ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  }
}

async function wipe() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}-` } } });
  // Only on the test database: the start of recording must be reset between runs so each run
  // measures its own seam. In production this row is written once and never touched again.
  await prisma.setting.deleteMany({ where: { key: "presence.trackingStartedAt" } });
  await prisma.question.deleteMany({ where: { subject: TAG } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}

async function main() {
  await wipe();

  const domain = await prisma.domain.create({
    data: { name: `QA Prezență ${Date.now()}`, slug: `${TAG}-${Date.now()}`, isActive: true },
  });
  const question = await prisma.question.create({
    data: {
      domainId: domain.id,
      subject: TAG,
      topic: "prezență",
      content: "Întrebare de verificare",
      correctAnswer: "A",
      status: "PUBLISHED",
    },
  });

  const mkUser = async (slug: string) =>
    prisma.user.create({ data: { email: `${TAG}-${slug}-${Date.now()}@demo.tutor.app`, name: `QA ${slug}` } });

  // ── Two tabs signalling at the same instant must not become two stays ──────────────────────────
  const tabs = await mkUser("tabs");
  const both = await Promise.all([recordPing(tabs.id), recordPing(tabs.id)]);
  const tabsVisits = await prisma.userVisit.count({ where: { userId: tabs.id } });
  check(
    "două tabe care trimit semnalul în aceeași clipă = o singură vizită",
    tabsVisits === 1,
    { vizite: tabsVisits, rezultate: both },
  );

  // ── The signal repeated too soon changes nothing ───────────────────────────────────────────────
  const solo = await mkUser("solo");
  const first = await recordPing(solo.id);
  const again = await recordPing(solo.id);
  const soloVisit = await prisma.userVisit.findFirstOrThrow({ where: { userId: solo.id } });
  check(
    "un semnal la câteva secunde de precedentul e ignorat (nu umflă nimic)",
    first === "opened" && again === "ignored" && soloVisit.pings === 1,
    { first, again, pings: soloVisit.pings },
  );

  // ── Inside the gap the stay is extended, past it a new one opens ───────────────────────────────
  await prisma.userVisit.update({
    where: { id: soloVisit.id },
    data: { lastSeenAt: new Date(Date.now() - 5 * MIN) },
  });
  const extended = await recordPing(solo.id);
  const afterExtend = await prisma.userVisit.count({ where: { userId: solo.id } });

  const nowRef = Date.now();
  await prisma.userVisit.update({
    where: { id: soloVisit.id },
    data: { startedAt: new Date(nowRef - 70 * MIN), lastSeenAt: new Date(nowRef - 31 * MIN) },
  });
  const opened = await recordPing(solo.id);
  const afterGap = await prisma.userVisit.count({ where: { userId: solo.id } });
  check(
    "sub 30 de minute prelungește vizita, peste 30 deschide una nouă",
    extended === "extended" && afterExtend === 1 && opened === "opened" && afterGap === 2,
    { extended, afterExtend, opened, afterGap },
  );

  // ── Measured time: the two stays of this account, clipped to the period ────────────────────────
  const realFrom = new Date(nowRef - 2 * 60 * MIN);
  const measured = await presenceFor([solo.id], realFrom, new Date());
  const soloRows = await prisma.userVisit.findMany({
    where: { userId: solo.id },
    select: { startedAt: true, lastSeenAt: true },
  });
  const expectedMs = soloRows.reduce(
    (acc, r) => acc + Math.max(0, r.lastSeenAt.getTime() - Math.max(r.startedAt.getTime(), realFrom.getTime())) + VISIT_TAIL_MS,
    0,
  );
  const got = measured.byUser.get(solo.id);
  check(
    "timpul măsurat = suma șederilor din perioadă, fiecare cu restul ei de un minut",
    got?.visits === 2 && Math.abs((got?.ms ?? 0) - expectedMs) < 1500,
    { vizite: got?.visits, ms: got?.ms, aşteptat: expectedMs },
  );

  // ── History: activity from before recording began is rebuilt by the same rule ──────────────────
  const hist = await mkUser("istoric");
  const session = await prisma.session.create({ data: { userId: hist.id, domainId: domain.id, type: "practice" } });
  // The start of recording is the remembered one, not the oldest surviving stay — this test itself
  // backdates a stay, and the two would no longer be the same moment.
  const anchor = (await trackingStart())!;
  const before = anchor.getTime();
  // Two traces 5 minutes apart (one stay) + one a day earlier (another stay), all before the anchor.
  for (const at of [before - 3 * 60 * MIN, before - 175 * MIN, before - 24 * 60 * MIN]) {
    await prisma.attempt.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        userId: hist.id,
        answer: "A",
        isCorrect: true,
        createdAt: new Date(at),
      },
    });
  }
  const rebuilt = await presenceFor([hist.id], new Date(before - 7 * 24 * 60 * MIN), new Date());
  const histGot = rebuilt.byUser.get(hist.id);
  check(
    "activitatea de dinainte de măsurare se reface în vizite (5 min la un loc, o zi mai devreme separat)",
    histGot?.visits === 2 && histGot?.ms === 5 * MIN + 2 * VISIT_TAIL_MS && rebuilt.estimated === true,
    { vizite: histGot?.visits, ms: histGot?.ms, estimat: rebuilt.estimated },
  );

  // ── The two sources never overlap: a stay after the anchor is measured, not rebuilt ────────────
  await recordPing(hist.id);
  const mixed = await presenceFor([hist.id], new Date(before - 7 * 24 * 60 * MIN), new Date());
  const mixedGot = mixed.byUser.get(hist.id);
  check(
    "cele două surse nu se suprapun: istoricul + șederea măsurată = 3 vizite, nu 4",
    mixedGot?.visits === 3,
    { vizite: mixedGot?.visits },
  );

  // ── A period entirely after the anchor is not reported as estimated ────────────────────────────
  const onlyReal = await presenceFor([hist.id], new Date(before + 1), new Date());
  check(
    "o perioadă care începe după startul măsurării nu mai e marcată drept estimare",
    onlyReal.estimated === false && onlyReal.byUser.get(hist.id)?.visits === 1,
    { estimat: onlyReal.estimated, vizite: onlyReal.byUser.get(hist.id)?.visits },
  );

  // ── The last trace carries the subject — that is what the column shows under the sign-in ──────
  const traces = await lastTraceFor([hist.id, solo.id]);
  const histTrace = traces.get(hist.id);
  check(
    "ultima urmă de activitate vine cu materia pe care a lucrat",
    histTrace?.domainName === domain.name && Math.abs((histTrace?.at.getTime() ?? 0) - (before - 175 * MIN)) < 1500,
    { materie: histTrace?.domainName, la: histTrace?.at?.toISOString() },
  );
  check(
    "un cont fără nicio activitate nu apare cu materie inventată",
    traces.get(solo.id) === undefined,
    { areUrmă: traces.has(solo.id) },
  );

  // ── An account nobody touched reads zero, not a hole ───────────────────────────────────────────
  const idle = await mkUser("inactiv");
  const idleReport = await presenceFor([idle.id], new Date(Date.now() - 30 * 24 * 60 * MIN), new Date());
  check(
    "un cont fără vizite arată zero, nu lipsă de date",
    idleReport.byUser.get(idle.id)?.visits === 0 && idleReport.byUser.get(idle.id)?.ms === 0,
    idleReport.byUser.get(idle.id),
  );

  // ── The moment recording began is remembered, not derived from the oldest surviving stay ──────
  const anchorBefore = await trackingStart();
  const purgeMe = await mkUser("vechi");
  await prisma.userVisit.create({
    data: {
      userId: purgeMe.id,
      startedAt: new Date(Date.now() - 500 * 24 * 60 * MIN),
      lastSeenAt: new Date(Date.now() - 500 * 24 * 60 * MIN + 10 * MIN),
    },
  });
  const deleted = await purgeOldVisits(400);
  const anchorAfter = await trackingStart();
  check(
    "ștergerea șederilor vechi nu mută startul măsurării (altfel cifrele măsurate ar redeveni estimări)",
    deleted >= 1 && anchorBefore?.getTime() === anchorAfter?.getTime(),
    { șterse: deleted, înainte: anchorBefore?.toISOString(), după: anchorAfter?.toISOString() },
  );

  // ── A stay straddling the seam is one stay, not two ────────────────────────────────────────────
  const seam = await mkUser("cusătură");
  const seamSession = await prisma.session.create({ data: { userId: seam.id, domainId: domain.id, type: "practice" } });
  const anchorMs = (await trackingStart())!.getTime();
  // Work three minutes before recording began, then the first signal just after it.
  await prisma.attempt.create({
    data: {
      sessionId: seamSession.id,
      questionId: question.id,
      userId: seam.id,
      answer: "A",
      isCorrect: true,
      createdAt: new Date(anchorMs - 3 * MIN),
    },
  });
  await prisma.userVisit.create({
    data: { userId: seam.id, startedAt: new Date(anchorMs + MIN), lastSeenAt: new Date(anchorMs + 12 * MIN) },
  });
  const seamReport = await presenceFor([seam.id], new Date(anchorMs - 7 * 24 * 60 * MIN), new Date());
  check(
    "o ședere care trece peste momentul pornirii măsurării se numără o dată, nu de două ori",
    seamReport.byUser.get(seam.id)?.visits === 1,
    seamReport.byUser.get(seam.id),
  );

  // ── „Ultima dată pe site" is the measured stay, which the sign-in stamp cannot know ────────────
  const seen = await lastSeenFor([seam.id, idle.id]);
  check(
    "ultima prezență măsurată se citește per cont (sesiunea ține 30 de zile, deci conectarea singură nu ajunge)",
    Math.abs((seen.get(seam.id)?.getTime() ?? 0) - (anchorMs + 12 * MIN)) < 1500 && !seen.has(idle.id),
    { pentruCusătură: seen.get(seam.id)?.toISOString(), pentruInactiv: seen.get(idle.id) ?? null },
  );

  // ── The gap constant is the one the rule speaks of ─────────────────────────────────────────────
  check("regula pauzei e de 30 de minute", VISIT_GAP_MS === 30 * MIN, { VISIT_GAP_MS });
}

main()
  .catch((e) => {
    fail++;
    console.log("FAIL  eroare neprevăzută în verificare:", e?.message || e);
  })
  .finally(async () => {
    await wipe();
    console.log(`\n${pass}/${pass + fail} PASS`);
    await prisma.$disconnect();
    process.exit(fail === 0 ? 0 : 1);
  });
