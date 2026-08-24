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
  CURRICULUM_LAG_THRESHOLD,
  BAND_YEARS,
  type SubjectBand,
} from "@/lib/curriculum";

const BAND_DOMAIN_SLUGS: Record<SubjectBand, readonly string[]> = {
  "mate-gimnaziu": ["matematica-v-viii"],
  "romana-gimnaziu": ["romana-cl-viii"],
  "bac-mate": ["matematica-m1-ix-xii", "matematica-m2-ix-xii", "matematica-m3-ix-xii"],
  "bac-romana": ["romana-ix-xii"],
};

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

  // Toți (user, bandă) cu checklist inițiat.
  const groups = await prisma.curriculumCheck.groupBy({ by: ["userId", "band"] });
  const hits: LagHit[] = [];

  for (const g of groups) {
    const band = g.band as SubjectBand;
    if (!BAND_YEARS[band]) continue; // bandă necunoscută (istorică) — nimic de calculat
    const checks = await prisma.curriculumCheck.findMany({
      where: { userId: g.userId, band },
    });
    if (checks.length === 0) continue;
    const schoolYear = checks[0].schoolYear;
    const overrides = new Map(checks.map((c) => [c.unitKey, c.taught]));
    const rows = buildChecklist(band, schoolYear, week, overrides);
    const { lag, missing } = curriculumLag(rows);
    if (lag <= CURRICULUM_LAG_THRESHOLD) continue;

    const student = await prisma.user.findUnique({
      where: { id: g.userId },
      select: { id: true, name: true, email: true },
    });
    if (!student) continue;

    // Părinții: Guardian activ. Meditatorii: creatorii grupurilor ACTIVE în
    // care elevul e membru, pe domeniile acestei benzi.
    const [guardians, memberships] = await Promise.all([
      prisma.guardian.findMany({
        where: { childId: g.userId, status: "active" },
        select: { parentId: true },
      }),
      prisma.groupMember.findMany({
        where: {
          userId: g.userId,
          group: { isActive: true, domain: { slug: { in: [...BAND_DOMAIN_SLUGS[band]] } } },
        },
        select: { group: { select: { createdById: true } } },
      }),
    ]);
    const instructorIds = [...new Set(memberships.map((m) => m.group.createdById))];

    const preview = missing.slice(0, 3).map((u) => u.label).join(" · ");
    const rest = lag > 3 ? ` (+${lag - 3})` : "";
    const studentName = student.name ?? student.email ?? "elevul";
    const fingerprint = `curriculum-lag:${g.userId}:${band}:${yearLabel}:S${week}`;
    const metadata = { fingerprint, band, week, lag, studentId: g.userId };

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

    hits.push({ userId: g.userId, band, lag, missingLabels: missing.map((u) => u.label), recipients });
  }
  return hits;
}
