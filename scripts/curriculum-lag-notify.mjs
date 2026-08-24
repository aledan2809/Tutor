#!/usr/bin/env node
// Atenționarea săptămânală de decalaj programă↔bife (vezi src/lib/curriculum-lag.ts).
//
//   npx tsx scripts/curriculum-lag-notify.mjs                (data reală)
//   npx tsx scripts/curriculum-lag-notify.mjs --at 2027-01-25  (verificare: altă dată)
//
// Cron VPS2 (lunea 06:27, la 10 min după curriculum-watch):
//   27 6 * * 1 cd /var/www/tutor && npx tsx scripts/curriculum-lag-notify.mjs >> /var/log/tutor-curriculum-lag.log 2>&1

const atIdx = process.argv.indexOf("--at");
const now = atIdx > -1 ? new Date(process.argv[atIdx + 1] + "T09:00:00+02:00") : new Date();
if (isNaN(now.getTime())) {
  console.error("--at cere o dată ISO (YYYY-MM-DD)");
  process.exit(2);
}

const { notifyCurriculumLag } = await import("../src/lib/curriculum-lag.ts");
const hits = await notifyCurriculumLag(now);
if (hits.length === 0) {
  console.log(`[curriculum-lag] ${now.toISOString()} — niciun elev peste prag`);
} else {
  for (const h of hits) {
    console.log(
      `[curriculum-lag] user=${h.userId} band=${h.band} lag=${h.lag} destinatari-noi=${h.recipients} — ${h.missingLabels.slice(0, 4).join(" · ")}`
    );
  }
}
process.exit(0);
