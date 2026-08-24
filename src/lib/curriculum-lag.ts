// Atenționarea de decalaj programă↔bife (cerință user 2026-08-24): dacă
// programa a avansat cu MAI MULT de CURRICULUM_LAG_THRESHOLD lecții peste
// bifele elevului — scenariul "elevul a uitat să bifeze" — primesc o
// atenționare elevul, părinții lui (Guardian activ) și meditatorii lui
// (creatorii grupurilor active în care e membru, pe domeniile benzii).
//
// Livrarea refolosește cascada existentă a alertelor de prag (rând in-app +
// canalele proprii ale fiecărui destinatar, cu quiet-hours). Dedup: o singură
// atenționare per (destinatar, elev, bandă, săptămână) — rândul programei
// avansează săptămânal, deci și decalajul; a re-trimite zilnic aceeași cifră
// ar îngropa clopoțelul (lecția dedup din review-ul curriculum-watch).

import { prisma } from "@/lib/prisma";
import { deliverThresholdAlert } from "@/lib/escalation/threshold-monitor";
import {
  buildChecklist,
  curriculumLag,
  schoolWeekAt,
  schoolYearStructureAt,
  domainSlugsForBand,
  CURRICULUM_LAG_THRESHOLD,
  BAND_YEARS,
  type SubjectBand,
} from "@/lib/curriculum";

type LagHit = {
  userId: string;
  band: SubjectBand;
  lag: number;
  missingLabels: string[];
  recipients: number;
};

/**
 * Evaluează decalajul pentru toți elevii cu checklist inițiat și trimite
 * atenționările. Returnează ce s-a trimis (pentru log/cron).
 * `now` e injectabil pentru verificare — în producție e data reală.
 */
export async function notifyCurriculumLag(now: Date = new Date()): Promise<LagHit[]> {
  // În afara unui an școlar configurat săptămâna e 0 → rândul programei nu
  // cere nimic din anul curent → decalajul e structural imposibil peste prag
  // doar dacă elevul și-a debifat anii anteriori — caz în care chiar merită
  // atenționarea, deci NU scurtcircuităm pe vară.
  const week = schoolWeekAt(now);
  const yearLabel = schoolYearStructureAt(now)?.label ?? "in-afara-anului";

  // Toate bifele dintr-o singură interogare, grupate în JS — versiunea cu
  // groupBy + findMany per grup făcea N+1 pe toată tabela la fiecare rulare
  // (finding review 2026-08-25).
  const allChecks = await prisma.curriculumCheck.findMany({
    select: { userId: true, band: true, unitKey: true, taught: true, schoolYear: true },
  });
  const byUserBand = new Map<string, typeof allChecks>();
  for (const c of allChecks) {
    const k = `${c.userId}\u0000${c.band}`;
    let arr = byUserBand.get(k);
    if (!arr) byUserBand.set(k, (arr = []));
    arr.push(c);
  }

  const hits: LagHit[] = [];
  for (const [key, checks] of byUserBand) {
    const [userId, bandRaw] = key.split("\u0000");
    const band = bandRaw as SubjectBand;
    if (!BAND_YEARS[band]) continue; // bandă necunoscută (istorică) — nimic de calculat

    // Gardă de consistență: toate rândurile unei benzi au același an prin
    // construcție (saveChecklist scrie tranzacțional). Ani amestecați = date
    // corupte de o migrare viitoare — mai bine sărim cu log decât să alarmăm
    // toată familia pe un decalaj fals (finding review).
    const years = new Set(checks.map((c) => c.schoolYear));
    if (years.size !== 1) {
      console.error(`[curriculum-lag] ani amestecați pentru ${userId}/${band} — sărit`);
      continue;
    }
    const schoolYear = checks[0].schoolYear;
    const overrides = new Map(checks.map((c) => [c.unitKey, c.taught]));
    const rows = buildChecklist(band, schoolYear, week, overrides);
    const { lag, missing } = curriculumLag(rows);
    if (lag <= CURRICULUM_LAG_THRESHOLD) continue;

    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!student) continue;

    // Părinții: Guardian activ cu relation PARENT — un TUTOR de familie nu e
    // părinte și nu trebuie să primească "copilului tău" (finding review).
    // Meditatorii: creatorii grupurilor ACTIVE în care elevul e membru, pe
    // domeniile benzii, REAUTORIZAȚI live (încă au rol INSTRUCTOR/ADMIN pe un
    // domeniu al benzii) — un rol revocat nu mai primește datele elevului, și
    // butonul "Vezi elevii" duce doar la cine chiar poate deschide pagina.
    const bandSlugs = domainSlugsForBand(band);
    const [guardians, memberships] = await Promise.all([
      prisma.guardian.findMany({
        where: { childId: userId, status: "active", relation: "PARENT" },
        select: { parentId: true },
      }),
      prisma.groupMember.findMany({
        where: {
          userId,
          group: { isActive: true, domain: { slug: { in: bandSlugs } } },
        },
        select: { group: { select: { createdById: true } } },
      }),
    ]);
    const creatorIds = [...new Set(memberships.map((m) => m.group.createdById))];
    const instructorIds =
      creatorIds.length === 0
        ? []
        : (
            await prisma.enrollment.findMany({
              where: {
                userId: { in: creatorIds },
                isActive: true,
                roles: { hasSome: ["INSTRUCTOR", "ADMIN"] },
                domain: { slug: { in: bandSlugs } },
              },
              select: { userId: true },
            })
          ).map((e) => e.userId);

    const preview = missing.slice(0, 3).map((u) => u.label).join(" · ");
    const rest = lag > 3 ? ` (+${lag - 3})` : "";
    const studentName = student.name ?? student.email ?? "elevul";
    const fingerprint = `curriculum-lag:${userId}:${band}:${yearLabel}:S${week}`;
    const metadata = { fingerprint, band, week, lag, studentId: userId };

    // Dedup per destinatar: o singură atenționare pe săptămâna asta.
    const send = async (
      recipientId: string,
      title: string,
      message: string,
      dest: { url: string; label: string }
    ) => {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: recipientId,
          type: "curriculum_lag",
          metadata: { path: ["fingerprint"], equals: fingerprint },
        },
      });
      if (existing) return false;
      await deliverThresholdAlert(recipientId, title, message, metadata, dest, "curriculum_lag");
      return true;
    };

    let recipients = 0;
    // Elevul — mesajul lui e acționabil direct pe checklist.
    if (
      await send(
        student.id,
        "Bifele materiei au rămas în urmă",
        `Programa a ajuns la ${lag} lecții pe care nu le-ai bifat: ${preview}${rest}. Bifează-le dacă s-au predat — sau lasă-le nebifate dacă la clasa ta chiar nu s-au făcut.`,
        { url: "/dashboard/practice", label: "Deschide lista materiei" }
      )
    )
      recipients++;
    // Părinții — spre vederea de monitorizare.
    for (const p of guardians) {
      if (
        await send(
          p.parentId,
          "Bifele materiei copilului au rămas în urmă",
          `Pentru ${studentName}, programa a ajuns la ${lag} lecții nebifate: ${preview}${rest}. O bifă uitată îi ascunde grilele lecției respective.`,
          { url: "/dashboard/watcher", label: "Vezi monitorizarea" }
        )
      )
        recipients++;
    }
    // Meditatorii — spre lista elevilor.
    for (const id of instructorIds) {
      if (
        await send(
          id,
          "Bifele materiei unui elev au rămas în urmă",
          `Pentru ${studentName}, programa a ajuns la ${lag} lecții nebifate: ${preview}${rest}.`,
          { url: "/dashboard/instructor/students", label: "Vezi elevii" }
        )
      )
        recipients++;
    }

    hits.push({ userId, band, lag, missingLabels: missing.map((u) => u.label), recipients });
  }
  return hits;
}
