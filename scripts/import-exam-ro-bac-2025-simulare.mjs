#!/usr/bin/env node
/**
 * import-exam-ro-bac-2025-simulare.mjs — Exam-Bank · BAC · Limba și literatura română
 * BAC 2025 Simulare, Proba E.a) — filiera reală/tehnologică. Subiect + barem oficiale
 * (Ministerul Educației / CNPEE — publice). Text verbatim; bareme ground-truth.
 * Structură BAC RO: SI (text + A 5 itemi 30p + B argumentativ 20p) + SII comentariu liric 10p
 * + SIII eseu 30p. Toți itemii OPEN/SHORT (self-score). 90+10=100. Idempotent.
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL din env.
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

const RO = {
  source: "BAC 2025 Simulare — Limba și literatura română (CNPEE), filiera reală/tehnologică",
  examType: "BAC", year: 2025, subjectKey: "limba_romana", subjectName: "Limba și literatura română",
  grade: 12, variant: "simulare", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/bacalaureat/", license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)",
  passages: [
    {
      ref: "Textul 1", title: "Liviu Rusu (în vol. „Evocări”)", author: "Ștefan Aug. Doinaș",
      sourceNote: "Fragment.", orderIndex: 1,
      body:
        "În ce mă privește, student la Medicină (numai că în sala de disecție citeam piesele lui Shakespeare și frecventam mai mult disciplinele de la Litere), rolul jucat de profesorul de Estetică a fost covârșitor. Veneam de la țară, elev silitor desigur, dar complet neintrodus în domeniile care mă atrăgeau, lipsit de gust în materie de arte și informație culturală – un adevărat „barbar” care nimerise în mijlocul Atenei, blocat de o timiditate aproape morbidă. Prima acțiune eficientă pe care a avut-o profesorul Liviu Rusu asupra mea a fost aceea de „a sparge” tocmai această timiditate. [...]\n" +
        "Educația și instruirea mea estetică au început, însă, cu „Audițiile muzicale” pe care profesorul Liviu Rusu le ținea în prelungirea Seminarului de Estetică. Acestea, de asemenea, făceau săli pline. Ele complineau în mod nesistematic o reală istorie a muzicii simfonice clasice: audierea fiecărui disc era precedată de o expunere a profesorului.\n" +
        "Pentru mine, atmosfera avea ceva incredibil: de inițiere într-un domeniu al unei arte de care eram total străin. În viața mea, până atunci, nu fusesem la un concert, nici nu ascultasem muzică simfonică. Intram într-un univers pe care nici măcar nu-l bănuisem, în care fiecare descoperire constituia un nou moment de delectare, în care – întâi de toate – aveam revelația propriei persoane. [...]\n" +
        "Ca în tot ceea ce făcea profesorul, prezența sa fizică – vocea, gesticulația, pledoaria – precum și termenii săi marcau ca o pecete materia însăși a lecției: de-a lungul anilor, de câte ori am ascultat Mozart sau Beethoven, de pildă, în memoria mea apărea figura profesorului, iar unele dintre expresiile sale – deosebit de plastice – se însoțeau inevitabil de surâsurile sau chiar ironiile noastre. Nimic nu leagă pe elev de profesorul său mai mult decât omul care, coborând de pe estradă, ți se alătură asemenea unui camarad cu care poți să conversezi – prin cuvinte sau numai tăcând – de acord sau în contradictoriu. [...]\n" +
        "În atmosfera acelor ani, când războiul – care era în toi – părea a se desfășura pe altă planetă, Universitatea „Regele Ferdinand” din Cluj, refugiată la Sibiu, trăia cu ardoare o rivalitate culturală pasionantă: între grupul de studenți mediciniști conduși de profesorul de anatomie Victor Papilian – care era un remarcabil prozator și dramaturg – și grupul celor de la Litere, Filosofie și Drept, animat de la catedră de Liviu Rusu, iar la nivel de cenaclu de Lucian Blaga. [...]\n" +
        "„Arena” întrecerii culturale între studenții de la Medicină și cei de la Litere a fost teatrul amator universitar. [...] Profesorul Liviu Rusu a regizat un spectacol cu „O scrisoare pierdută” de I.L. Caragiale. Astăzi, montarea asigurată de profesorul nostru de Estetică ar apărea, desigur, ca o realizare modestă, cu „îndrăzneli” care au devenit lucruri de rutină ale artei scenice. Dar, pe vremea aceea, soluțiile artistice, experimentale, existente în acel spectacol, au avut mare efect: actorii înaintau spre scenă printre cele două rânduri de spectatori; unii interpreți se aflau în loje, îi interpelau pe cei din sală înainte de a coborî în spațiul scenic; la un moment dat, sufleorul dădea la o parte capacul cuștii sale pentru a interveni etc. [...]\n" +
        "Spectacolul mi se pare a fi fost foarte important pentru noi, întrucât indica o sferă de preocupări care aveau să caracterizeze activitatea literară a tuturor prietenilor mei.",
    },
  ],
  items: [
    { section: "I.A", label: "A.1", type: "SHORT", points: 6, passageRef: "Textul 1",
      content: "Indică sensul din text al cuvântului reală și al secvenței dădea la o parte.",
      rubric: [{ label: "barem", points: 6, answer: "Indicarea sensului din text al cuvântului dat (de exemplu: adevărată) – 2p + al secvenței date (de exemplu: îndepărta) – 2p; formularea răspunsului în enunț/enunțuri – 1p; corectitudinea exprimării, respectarea normelor – 1p. (Scrierea fără ghilimele a cuvântului-sens nu se consideră greșeală.)" }] },
    { section: "I.A", label: "A.2", type: "SHORT", points: 6, passageRef: "Textul 1",
      content: "Menționează localitatea în care a funcționat în timpul războiului Universitatea „Regele Ferdinand”, valorificând informațiile din text.",
      rubric: [{ label: "barem", points: 6, answer: "Menționarea localității (Sibiu) – 4p; formularea răspunsului în enunț – 1p; corectitudinea exprimării, respectarea normelor – 1p." }] },
    { section: "I.A", label: "A.3", type: "SHORT", points: 6, passageRef: "Textul 1",
      content: "Precizează domeniul artistic în care se manifestă spiritul competitiv al studenților de la Medicină și Litere, justificându-ți răspunsul cu o secvență semnificativă din textul dat.",
      rubric: [{ label: "barem", points: 6, answer: "Precizarea domeniului artistic (teatru) – 2p; justificarea cu o secvență semnificativă (de exemplu: „«Arena» întrecerii culturale între studenții de la Medicină și cei de la Litere a fost teatrul amator universitar.”) – 2p; formularea în enunț/enunțuri – 1p; corectitudinea exprimării – 1p." }] },
    { section: "I.A", label: "A.4", type: "SHORT", points: 6, passageRef: "Textul 1",
      content: "Explică un motiv pentru care spectacolul regizat de Liviu Rusu a atras atenția.",
      rubric: [{ label: "barem", points: 6, answer: "Precizarea motivului (de exemplu: noutatea abordării) – 2p; explicare nuanțată – 2p / încercare – 1p; formularea în enunț/enunțuri – 1p; corectitudinea exprimării – 1p." }] },
    { section: "I.A", label: "A.5", type: "OPEN", points: 6, passageRef: "Textul 1",
      content: "Prezintă, în 30-50 de cuvinte, un efect pe care îl are muzica simfonică asupra tânărului Ștefan Aug. Doinaș.",
      rubric: [{ label: "barem", points: 6, answer: "Precizarea efectului (de exemplu: descoperirea de sine) – 2p; prezentare adecvată și nuanțată – 2p / încercare – 1p; respectarea numărului de cuvinte – 1p; corectitudinea exprimării, respectarea normelor – 1p." }] },
    { section: "I.B", label: "B", type: "OPEN", points: 20, passageRef: "Textul 1",
      content:
        "Redactează un text de minimum 150 de cuvinte în care să argumentezi dacă profesorii contribuie sau nu la îmbogățirea experienței culturale a tinerilor, raportându-te atât la fragmentul extras din volumul „Evocări” de Ștefan Aug. Doinaș, cât și la experiența personală sau culturală.\n\n" +
        "În redactarea textului, vei avea în vedere următoarele repere:\n" +
        "– formularea unei opinii față de problematica pusă în discuție, enunțarea și dezvoltarea corespunzătoare a două argumente adecvate opiniei și formularea unei concluzii pertinente (14 puncte);\n" +
        "– utilizarea corectă a conectorilor în argumentare, respectarea normelor limbii literare, așezarea în pagină, lizibilitatea, respectarea numărului minim de cuvinte (6 puncte).",
      rubric: [
        { label: "Conținut", points: 14, answer: "Formularea unei opinii – 1p; câte 2p pentru enunțarea fiecăruia dintre cele două argumente (2×2=4p); câte 2p pentru dezvoltarea corespunzătoare a fiecărui argument (2×2=4p); valorificarea textului în dezvoltarea oricărui argument – 3p / simpla citare – 1p, plus raportarea la experiența personală sau culturală – 1p (3p+1p=4p); formularea unei concluzii pertinente – 1p." },
        { label: "Redactare", points: 6, answer: "Utilizarea corectă a conectorilor – 2p; respectarea normelor limbii literare – 1p; ortografie și punctuație – 1p; așezarea în pagină, lizibilitatea – 1p; numărul minim de cuvinte – 1p. Doar dacă textul dezvoltă subiectul." },
      ] },
    { section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 10,
      content:
        "Comentează, în minimum 50 de cuvinte, textul de mai jos, evidențiind relația dintre ideea poetică și mijloacele artistice.\n\n" +
        "De sticlă ‒ câmpia înghețată.\n" +
        "Departe un șir de pomi despuiați\n" +
        "scutură chiciura luminată.\n\n" +
        "Au trecut sănii trase de boi\n" +
        "albi ca zăpada, și aburind ca zarea,\n" +
        "să încarce lemne din zăvoi.\n\n" +
        "Am rămas singur, și e atât de frig\n" +
        "încât aș putea să-mi văd cuvintele\n" +
        "înghețând în aer, când te strig.\n\n" +
        "Caut prin grădină pașii tăi,\n" +
        "ieri le-am zărit în prima ninsoare urmele,\n" +
        "umbre albastre, ca niște porumbei.\n" +
        "(Adrian Maniu, Iarnă)",
      rubric: [
        { label: "Conținut", points: 6, answer: "Numirea ideii poetice – 2p; comentarea adecvată și nuanțată, prin evidențierea relației dintre ideea poetică și mijloacele artistice – 4p / evidențiere ezitantă – 2p / simpla precizare a unor mijloace artistice – 1p." },
        { label: "Redactare", points: 4, answer: "Utilizarea limbii literare – 1p; logica înlănțuirii ideilor – 1p; ortografia – 1p; punctuația – 1p. Doar dacă răspunsul are minimum 50 de cuvinte și dezvoltă subiectul." },
      ] },
    { section: "Subiectul al III-lea", label: "III", type: "OPEN", points: 30,
      content:
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unui roman psihologic sau al experienței studiat.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea romanului studiat într-o perioadă, într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două episoade/secvențe semnificative pentru tema romanului studiat;\n" +
        "– analiza a două elemente de structură, de compoziție și/sau de limbaj, relevante pentru romanul studiat (de exemplu: acțiune, conflict, relații temporale și spațiale, incipit, final, tehnici narative, instanțe ale comunicării narative, perspectivă narativă, registre stilistice, limbaj etc.).\n\n" +
        "Notă: Ordinea integrării reperelor în cuprinsul eseului este la alegere.",
      rubric: [
        { label: "Conținut", points: 18, answer: "Evidențierea a două trăsături de încadrare (precizarea perioadei/curentului/orientării – 2p; numirea a două trăsături – 2×1p; evidențierea lor prin valorificarea romanului – 2×1p) = 6p; comentarea a două episoade/secvențe semnificative pentru temă (precizarea temei – 2p; câte 2p/episod – 2×2p) = 6p; analiza a două elemente de structură/compoziție/limbaj (câte 3p, justificând relevanța – 2×3p) = 6p." },
        { label: "Redactare", points: 12, answer: "Existența părților componente – 1p; logica înlănțuirii ideilor – 1p; abilități de analiză și argumentare – 3p; utilizarea limbii literare – 2p; ortografia – 2p; punctuația – 2p; așezarea în pagină, lizibilitatea – 1p. Doar dacă eseul are minimum 400 de cuvinte și dezvoltă subiectul." },
      ] },
  ],
};

const PAPERS = [RO];

function validate() {
  const errors = [];
  for (const p of PAPERS) {
    const expectedItemPoints = p.maxScore - p.officeBonus;
    let sum = 0; const labels = new Set();
    for (const it of p.items) {
      if (!it.section || !it.label || !it.type || typeof it.points !== "number") errors.push(`item missing field: ${it.label}`);
      if (!it.content || !it.content.trim()) errors.push(`item ${it.label} empty content`);
      const k = `${it.section}::${it.label}`; if (labels.has(k)) errors.push(`dup label ${k}`); labels.add(k);
      if (Array.isArray(it.rubric) && it.rubric.every((r) => typeof r.points === "number")) {
        const rsum = it.rubric.reduce((a, r) => a + r.points, 0);
        if (rsum !== it.points) errors.push(`item ${it.label} rubric ${rsum} != ${it.points}`);
      }
      sum += it.points;
    }
    if (sum !== expectedItemPoints) errors.push(`item points sum ${sum} != ${expectedItemPoints}`);
    const refs = new Set((p.passages || []).map((x) => x.ref));
    for (const it of p.items) if (it.passageRef) for (const r of String(it.passageRef).split(",").map((s) => s.trim())) if (!refs.has(r)) errors.push(`item ${it.label} passageRef '${r}' missing`);
    console.log(`  ${p.subjectKey} items=${p.items.length} passages=${p.passages.length} pts=${sum}(+${p.officeBonus}=${sum + p.officeBonus})`);
  }
  if (errors.length) { console.error(`\n❌ VALIDATE FAILED (${errors.length}):`); errors.forEach((e) => console.error("   - " + e)); process.exit(1); }
  console.log("\n✅ VALIDATE OK — points sum to 90 (+10 oficiu = 100).");
}

async function run(dry) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const p of PAPERS) {
      const existing = await prisma.examPaper.findUnique({ where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } }, include: { _count: { select: { items: true, passages: true } } } });
      console.log(`  ${existing ? "UPDATE" : "CREATE"} paper → items=${p.items.length} passages=${p.passages.length}` + (existing ? ` (replacing ${existing._count.items}/${existing._count.passages})` : ""));
      if (dry) continue;
      const paper = await prisma.examPaper.upsert({
        where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } },
        update: { source: p.source, subjectName: p.subjectName, grade: p.grade, maxScore: p.maxScore, officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language, sourceUrl: p.sourceUrl, license: p.license, isActive: true },
        create: { source: p.source, examType: p.examType, year: p.year, subjectKey: p.subjectKey, subjectName: p.subjectName, grade: p.grade, variant: p.variant, maxScore: p.maxScore, officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language, sourceUrl: p.sourceUrl, license: p.license, isActive: true },
      });
      await prisma.examItem.deleteMany({ where: { paperId: paper.id } });
      await prisma.examPassage.deleteMany({ where: { paperId: paper.id } });
      if (p.passages.length) await prisma.examPassage.createMany({ data: p.passages.map((x) => ({ paperId: paper.id, ref: x.ref, title: x.title ?? null, author: x.author ?? null, sourceNote: x.sourceNote ?? null, body: x.body, orderIndex: x.orderIndex })) });
      await prisma.examItem.createMany({ data: p.items.map((it, idx) => ({ paperId: paper.id, section: it.section, label: it.label, orderIndex: idx, type: it.type, points: it.points, content: it.content, options: it.options ?? undefined, correctAnswer: it.correctAnswer ?? null, rubric: it.rubric ?? undefined, passageRef: it.passageRef ?? null, hasFigure: !!it.hasFigure, figureNote: it.figureNote ?? null, figureUrl: it.figureUrl ?? null, autoGradable: !!it.autoGradable, topic: it.topic ?? null })) });
    }
    const [papers, items, passages] = await Promise.all([prisma.examPaper.count(), prisma.examItem.count(), prisma.examPassage.count()]);
    console.log(`\n${dry ? "🔎 DRY — no writes." : "✅ APPLIED."} DB totals: ExamPaper=${papers} ExamItem=${items} ExamPassage=${passages}`);
  } finally { await prisma.$disconnect(); }
}

(async () => { console.log(`\n=== import-exam-ro-bac-2025-simulare (mode=${MODE}) ===`); validate(); if (MODE === "validate") return; await run(MODE === "dry"); })().catch((e) => { console.error("FATAL:", e); process.exit(1); });
