/**
 * macro-topic.smoke.mjs — offline assertions for the micro→macro mapper.
 * Run: node scripts/lib/macro-topic.smoke.mjs
 */
import { macroTopicMate, macroTopicRo, macroTopic, MATE_CAPITOLE as M, RO_CAPITOLE as R } from "./macro-topic.mjs";

let pass = 0, fail = 0;
function eq(got, want, label) {
  if (got === want) { pass++; }
  else { fail++; console.error(`  ✗ ${label}\n      got:  ${got}\n      want: ${want}`); }
}

// ─── Matematică: representative + tricky micro-topics ───
const MATE = [
  ["Ordinea operațiilor", M.NUMERE],
  ["Divizibilitate", M.NUMERE],
  ["Numere prime", M.NUMERE],
  ["Numere întregi. Operații", M.NUMERE],
  ["Împărțirea cu rest", M.NUMERE],
  ["Înmulțirea numerelor întregi", M.NUMERE],
  ["Compararea numerelor", M.NUMERE], // no specific keyword → fallback (base)
  ["Fracții zecimale periodice", M.FRACTII],
  ["Operații cu numere zecimale", M.FRACTII],
  ["Compararea numerelor raționale", M.FRACTII],
  ["Inversul unui număr rațional", M.FRACTII],
  ["Radicali. Produs", M.REALE],
  ["Compararea numerelor reale", M.REALE],
  ["Puteri. Diferența de pătrate", M.REALE],
  ["Module. Sume", M.REALE],
  ["Formule de calcul. Diferența de pătrate", M.REALE],
  ["Procente", M.PROPORTII],
  ["Rapoarte și proporții", M.PROPORTII],
  ["Rapoarte", M.PROPORTII], // plural "rapoarte" lacks substring "raport"
  ["Rapoarte. Calcul algebric", M.PROPORTII],
  ["Procente. Reduceri", M.PROPORTII],
  ["Ecuații de gradul I", M.ECUATII],
  ["Inecuații", M.ECUATII],
  ["Mulțimi. Intersecție", M.ECUATII],
  ["Intervale de numere reale", M.ECUATII],
  ["Sistem de ecuații. Probleme", M.ECUATII],
  ["Interpretarea diagramelor", M.STATISTICA],
  ["Citirea tabelelor de date", M.STATISTICA],
  ["Media aritmetică ponderată", M.STATISTICA],
  ["Probabilități", M.STATISTICA],
  ["Viteză, distanță, timp", M.STATISTICA],
  ["Probleme cu vârste", M.STATISTICA],
  ["Probleme cu sume de bani", M.STATISTICA],
  ["Volum. Debit", M.STATISTICA], // "debit" → practical, NOT spațiu
  ["Diagrame circulare. Procente", M.STATISTICA], // data before proporții
  ["Media geometrică. Radicali", M.STATISTICA], // a "medie" → stats bucket
  ["Segmente. Mijloc", M.GEO_PLANA],
  ["Cerc. Unghi înscris", M.GEO_PLANA],
  ["Triunghi dreptunghic. Teorema lui Pitagora", M.GEO_PLANA],
  ["Drepte paralele. Unghiuri", M.GEO_PLANA],
  ["Trapez. Linie mijlocie", M.GEO_PLANA],
  ["Romb. Arii", M.GEO_PLANA],
  ["Pătrat. Diagonală", M.GEO_PLANA],
  ["Geometrie analitică. Mediatoarea", M.GEO_PLANA],
  ["Cub. Volum", M.GEO_SPATIU],
  ["Paralelipiped dreptunghic. Diagonala", M.GEO_SPATIU],
  ["Piramidă patrulateră. Volum", M.GEO_SPATIU],
  ["Con circular drept. Generatoare", M.GEO_SPATIU],
  ["Sferă. Volum", M.GEO_SPATIU],
  ["Tetraedru regulat. Muchii", M.GEO_SPATIU],
  ["Cub. Unghiul a două drepte", M.GEO_SPATIU], // cub wins over "drepte"
];
for (const [t, want] of MATE) eq(macroTopicMate(t, ""), want, `Mate "${t}"`);

// ─── Limba română ───
const RO = [
  ["Diftong", R.FONETICA],
  ["Despărțirea în silabe", R.FONETICA],
  ["Accentuare", R.FONETICA],
  ["Sinonime contextuale", R.VOCABULAR],
  ["Antonime", R.VOCABULAR],
  ["Omonime", R.VOCABULAR],
  ["Sensul cuvintelor în context", R.VOCABULAR],
  ["Cuvinte derivate", R.FORMARE],
  ["Cuvinte derivate cu sufix", R.FORMARE],
  ["Sufixe diminutivale", R.FORMARE],
  ["Mijloace de îmbogățire a vocabularului", R.FORMARE],
  ["Forme de plural", R.MORFOLOGIE],
  ["Substantivul articulat hotărât", R.MORFOLOGIE],
  ["Substantivul articulat nehotărât", R.MORFOLOGIE],
];
for (const [t, want] of RO) eq(macroTopicRo(t, null, ""), want, `RO "${t}"`);

// passage-dependent (blank micro-topic) → comprehension regardless of content
eq(macroTopicRo(null, "Textul 1", "orice conținut"), R.TEXT, "RO passage-dependent → Înțelegerea textului");
eq(macroTopicRo("", "Textul 1, Textul 2", ""), R.TEXT, "RO multi-passage → Înțelegerea textului");

// ─── dispatcher routing ───
eq(macroTopic({ subjectKey: "matematica", topic: "Procente" }), M.PROPORTII, "dispatch mate");
eq(macroTopic({ subjectKey: "limba_romana", topic: "Diftong" }), R.FONETICA, "dispatch ro by subjectKey");
eq(macroTopic({ subject: "Română cl. VIII", topic: "Antonime" }), R.VOCABULAR, "dispatch ro by subject name");
eq(macroTopic({ subject: "Matematica cl. VIII", topic: null, content: "Calculează 2+3·4" }), M.NUMERE, "dispatch mate fallback");

// content fallback when no micro-topic (Mate)
eq(macroTopicMate(null, "Aria pătratului cu latura de 5 cm este"), M.GEO_PLANA, "Mate content fallback → geometrie");

console.log(`\nmacro-topic smoke: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
