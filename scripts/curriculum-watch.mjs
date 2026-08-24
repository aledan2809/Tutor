#!/usr/bin/env node
// curriculum-watch — verificarea automată a surselor programei parcurse.
//
// Programele școlare și structura anului se schimbă prin ordin de ministru, iar
// maparea din src/lib/curriculum.ts e scrisă de mână din documente. Scriptul
// re-descarcă săptămânal (cron, sept-mai) sursele și compară amprentele; la
// diferență, ridică o notificare in-app pentru superadmini. NU modifică nimic
// singur — schimbarea de programă e lege, o aplică un om (decizie user
// 2026-08-24, AskUserQuestion).
//
//   node scripts/curriculum-watch.mjs            (respectă fereastra sept-mai)
//   node scripts/curriculum-watch.mjs --force    (rulează oricând — test)
//
// Cron VPS2 (săptămânal, lunea 06:17) — prin tsx, ca verificarea băncii de
// întrebări (import al nucleului TS) să ruleze, nu doar amprentele PDF:
//   17 6 * * 1 cd /var/www/tutor && npx tsx scripts/curriculum-watch.mjs >> /var/log/tutor-curriculum-watch.log 2>&1
//
// Exit: 0 = nicio schimbare / în afara ferestrei · 1 = schimbare detectată ·
//       2 = sursă inaccesibilă (semnal separat: documentul s-a MUTAT, nu doar
//       schimbat — link mort înseamnă că nu mai putem verifica deloc).

import { createHash } from "node:crypto";

// Sursele urmărite + amprentele lor la data încheierii mapării (2026-08-24).
// La actualizarea mapării în src/lib/curriculum.ts se actualizează și sha-urile.
const SOURCES = [
  {
    name: "Ordin 3.194/2026 — structura anului școlar 2026-2027 (MO 126/16.02.2026)",
    url: "https://cdn.edupedu.ro/wp-content/uploads/2026/02/Ordin-Nr.-3.1942026-STRUCTURA-AN-SCOLAR-2026-2027-Monitorul-Oficial-Partea-I-nr.-126.pdf",
    sha256: "788cd37d2eca8b629db3d92ecf0382e9e680f8f92de455e338b91bf5892d14f9",
  },
  {
    name: "Planificare Sigma — Matematică cl. a VIII-a (2025-2026)",
    url: "https://manuale.editurasigma.ro/system/files/2025-09/Planificare_calendaristica_MATEMATICA-VIII_2025-2026.pdf",
    sha256: "b3de44b5d5ac7ee0c532971111a1aa0970e6741d324a40a7ae65b84044c21dc1",
  },
  {
    name: "Planificare Sigma — Matematică cl. a VII-a (2025-2026)",
    url: "https://manuale.editurasigma.ro/system/files/2025-09/Planificare%20MATE%20cls%20VII%202025-2026_%20calendaristica.pdf",
    sha256: "a916c213d2738aa96c5906ad74516a731de2e1405acc00b864fd47fc9d5580ad",
  },
  {
    name: "Programa școlară matematică V-VIII (OMEN 3393/2017)",
    url: "http://www.mategl.com/Programa%20Calude%202007/download/Programa-scolara-matematica-V-VIII%20-%20noua%20aplicata%20din%202017.pdf",
    sha256: "43e719e0745794da080bd7a419f12bcc4fee5dc3f5c8952fdf3b5087b4a59a42",
  },
];

const FORCE = process.argv.includes("--force");

function inWatchWindow(d = new Date()) {
  const m = d.getMonth() + 1; // 1-12
  return m >= 9 || m <= 5; // septembrie-mai
}

async function fetchSha(url) {
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { sha: createHash("sha256").update(buf).digest("hex"), bytes: buf.length };
}

async function notifySuperadmins(title, lines, fingerprint) {
  // Notificare in-app prin modelul Notification existent (bell-ul din UI).
  // Dedup pe amprenta constatării: cronul e săptămânal și condiția nu dispare
  // până nu editează cineva maparea — fără gardă, fiecare superadmin ar acumula
  // câte o notificare identică pe săptămână, tot anul (finding review).
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const admins = await prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true },
    });
    let sent = 0;
    for (const a of admins) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: a.id,
          type: "curriculum_watch",
          isRead: false,
          metadata: { path: ["fingerprint"], equals: fingerprint },
        },
      });
      if (existing) continue;
      await prisma.notification.create({
        data: {
          userId: a.id,
          type: "curriculum_watch",
          title,
          message: lines.join("\n"),
          metadata: { fingerprint },
        },
      });
      sent++;
    }
    console.log(`[curriculum-watch] notificări noi: ${sent}/${admins.length} superadmini`);
  } finally {
    await prisma.$disconnect();
  }
}

// ── Verificări dincolo de PDF-uri ───────────────────────────────────────────
// (a) Topicuri din banca de întrebări neacoperite de nicio unitate: o grilă cu
//     topic necunoscut curriculumului e INVIZIBILĂ pentru orice elev pe un
//     domeniu cu poartă — tăcut. Prima versiune a listei BAC pierdea 25 din 46
//     exact așa (finding review 2026-08-24).
// (b) Anul școlar curent neacoperit de nicio structură din SCHOOL_YEARS: fără
//     structură, rândul programei rămâne gol (fail-closed) — corect, dar
//     cineva trebuie să afle că e vremea să introducă ordinul nou.
async function checkDbAndYear() {
  const problems = [];
  const { PrismaClient } = await import("@prisma/client");
  // Nucleul e TypeScript; îl încărcăm prin tsx dacă e disponibil, altfel
  // sărim verificarea (a) cu avertisment — mai bine parțial decât fals-verde.
  // Sub `npx tsx` importul TS merge direct; sub node simplu încercăm register.
  // Cronul rulează prin tsx tocmai ca ramura asta să nu fie sărită.
  let curriculum = null;
  try {
    curriculum = await import("../src/lib/curriculum.ts");
  } catch {
    try {
      const { register } = await import("tsx/esm/api");
      register();
      curriculum = await import("../src/lib/curriculum.ts");
    } catch (e) {
      console.log(`[warn]      nucleul curriculum nu s-a putut încărca (${e.message}) — sar verificarea topicurilor`);
    }
  }
  let dbCheckRan = false;

  const prisma = new PrismaClient();
  try {
    if (curriculum) {
      dbCheckRan = true;
      const { CURRICULUM, SCHOOL_YEARS, schoolYearStructureAt } = curriculum;
      const bandBySlug = {
        "matematica-v-viii": "mate-gimnaziu",
        "romana-cl-viii": "romana-gimnaziu",
        "matematica-m1-ix-xii": "bac-mate",
        "matematica-m2-ix-xii": "bac-mate",
        "matematica-m3-ix-xii": "bac-mate",
        "romana-ix-xii": "bac-romana",
      };
      for (const [slug, band] of Object.entries(bandBySlug)) {
        const domain = await prisma.domain.findUnique({ where: { slug } });
        if (!domain) continue;
        const covered = new Set(CURRICULUM[band].flatMap((u) => u.chapters));
        const topics = await prisma.question.groupBy({
          by: ["topic"],
          where: { domainId: domain.id, status: "PUBLISHED" },
          _count: { _all: true },
        });
        for (const t of topics) {
          if (!covered.has(t.topic)) {
            problems.push(`• NEACOPERIT: ${slug} → topic "${t.topic}" (${t._count._all} grile invizibile)`);
          }
        }
      }
      if (!schoolYearStructureAt(new Date(), SCHOOL_YEARS)) {
        const now = new Date();
        if (inWatchWindow(now)) {
          problems.push("• AN NECONFIGURAT: data curentă nu cade în nicio structură din SCHOOL_YEARS — introdu ordinul noului an școlar în src/lib/curriculum.ts");
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }
  return { problems, dbCheckRan };
}

const now = new Date();
if (!FORCE && !inWatchWindow(now)) {
  console.log(`[curriculum-watch] ${now.toISOString()} — în afara ferestrei sept-mai, nimic de făcut`);
  process.exit(0);
}

const changed = [];
const dead = [];
for (const src of SOURCES) {
  try {
    const { sha, bytes } = await fetchSha(src.url);
    if (sha === src.sha256) {
      console.log(`[ok]        ${src.name} (${bytes} B)`);
    } else {
      console.log(`[SCHIMBAT]  ${src.name}\n  așteptat ${src.sha256}\n  găsit    ${sha}`);
      changed.push(src);
    }
  } catch (e) {
    console.log(`[MORT]      ${src.name}: ${e.message}`);
    dead.push({ ...src, error: e.message });
  }
}

let dbProblems = [];
let dbCheckRan = false;
try {
  ({ problems: dbProblems, dbCheckRan } = await checkDbAndYear());
  for (const line of dbProblems) console.log(line);
} catch (e) {
  console.error(`[curriculum-watch] verificarea DB a eșuat: ${e.message}`);
}

if (changed.length || dead.length || dbProblems.length) {
  const lines = [
    ...changed.map((c) => `• SCHIMBAT: ${c.name}`),
    ...dead.map((c) => `• INACCESIBIL: ${c.name} (${c.error})`),
    ...dbProblems,
    "",
    "Maparea din src/lib/curriculum.ts poate fi învechită. Verifică documentele și actualizeaz-o manual — nimic nu se schimbă automat.",
  ];
  const { createHash } = await import("node:crypto");
  const fingerprint = createHash("sha256").update(lines.join("\n")).digest("hex").slice(0, 16);
  try {
    await notifySuperadmins("Programa școlară: verificarea a găsit probleme", lines, fingerprint);
  } catch (e) {
    console.error(`[curriculum-watch] notificarea a eșuat: ${e.message}`);
  }
  process.exit(dead.length && !changed.length && !dbProblems.length ? 2 : 1);
}
console.log(
  dbCheckRan
    ? `[curriculum-watch] ${now.toISOString()} — toate sursele neschimbate, banca acoperită, anul configurat`
    : `[curriculum-watch] ${now.toISOString()} — sursele neschimbate; verificarea băncii SĂRITĂ (rulează prin tsx pentru acoperire completă)`
);
process.exit(0);
