#!/usr/bin/env node
/**
 * import-exam-ro-bac-2025-model.mjs — Exam-Bank · BAC · Limba și literatura română
 *
 * BAC 2025 Model, Proba E.a) — filiera teoretică (real) / tehnologică / vocațională
 * (cu excepția profilului pedagogic). Subiect + barem oficiale (Ministerul Educației /
 * CNPEE — publice). Text verbatim; bareme ground-truth din BAREM (verbatim, fără parafrazare).
 *
 * Structură BAC RO (diferită de EN VIII): Subiectul I (50p) = text + A (5 itemi, 30p) +
 * B (text argumentativ, 20p); Subiectul al II-lea (10p) = comentariu text liric;
 * Subiectul al III-lea (30p) = eseu. Toți itemii OPEN/SHORT (zero MCQ) → self-score pe rubric.
 * 90p + 10 oficiu = 100. Timp: 3 ore.
 *
 * Idempotent · Modes: --validate / --dry / (apply). DB: DATABASE_URL din env (VPS2 local PG).
 */

const MODE = process.argv.includes("--validate")
  ? "validate"
  : process.argv.includes("--dry")
    ? "dry"
    : "apply";

const RO = {
  source: "BAC 2025 Model — Limba și literatura română (CNPEE), filiera reală/tehnologică",
  examType: "BAC",
  year: 2025,
  subjectKey: "limba_romana",
  subjectName: "Limba și literatura română",
  grade: 12,
  variant: "model",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 180,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/bacalaureat/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)",
  passages: [
    {
      ref: "Textul 1",
      title: "Pământul bătătorit de părintele meu. File de jurnal",
      author: "Puia Florica Rebreanu",
      sourceNote: "Fragment.",
      orderIndex: 1,
      body:
        "Duminică, 12 august. Am căutat la izvoare pe Vasile fotograful să ne „imortalizăm” – măicuța și cu mine – într-o poză „artistică”. Măicuța era foarte frumos îmbrăcată, în alb, și pieptănată cu cele două cozi pe cap. Am ales o poziție pe trepte, având pavilionul de cură în spate, ca un „fond” balnear.\n" +
        "Poate că e un obicei depășit de a te fotografia, și mai ales în port popular. La mine este mai degrabă un obicei de familie. Tata mă alesese în copilărie ca modelul lui preferat. El avea pasiunea fotografiatului. Ținea să imortalizeze toate momentele și locurile care îi plăceau. Aparatul „Leica” era foarte modern prin 1934. [...]\n" +
        "Dacă aș fi avut și eu această îndemânare și talent, cred că aș fi fotografiat pe tata, în toate momentele, la toate orele din noapte și zi. Dar, așa cum se întâmplă mai adesea, cel care fotografiază nu apare pe peliculă. Totuși, uneori tata nu rămânea în pagubă, deoarece îl fotografia mereu Radu, soțul meu, și deseori chiar când nu observa. Într-un rând, Radu l-a surprins în vizor strănutând. E o scenă rară în maldărul de fotografii cu tata. Asta însă îl supăra. Supărarea nu ținea mult. Un fotograf îl înțelege numaidecât pe altul. [...]\n" +
        "Luni, 13 august. Expediem o telegramă Letiției Slăvoacă Miron, vestind-o că sosim la Ilva Mare sâmbătă 18 august. La poștă ne aștepta corespondență: două scrisori de la soțul meu, romanul Răscoala, tradus în ungurește de Galdi Laszlo, și alte două scrisori – adresate nouă la București – din partea Letiției, precum și una de la Liviu H. Oprescu.\n" +
        "Scrisoarea lui Radu, pe optsprezece pagini, ne-a delectat prin umorul ei dens. Un obicei luat de la tata care îi relata pe larg măicuței întâmplările de peste zi, mai cu seamă din călătoriile în străinătate. Scrisorile erau întocmite de tata întotdeauna în ceasurile imediat următoare evenimentelor respective, când firesc ar fi fost să se odihnească. Era un mod al lui de relaxare, de recreere. Poate că cea mai caracteristică în acest sens este scrisoarea, de „numai” șaisprezece pagini, expediată de la Oslo, la 18 martie 1928, duminică seara. [...]\n" +
        "Odată ajunse la preoteasa Lazăr, ni se comunică regretul că nu am participat și noi la botezul nepotului ei, la petrecerea care a avut loc cu cei treisprezece invitați, dintre care cel mai plăcut musafir a fost pictorița Ileana Colonel Antonu, care a cântat și a fluierat doine, înveselind toată adunarea.\n" +
        "O cunoșteam din anii trecuți. În drum spre casă, am întâlnit-o pe pictoriță care, bucuroasă, ne-a invitat vineri, să ne arate colecția sa de tablouri și obiecte de artă.\n" +
        "Vineri, 17 august. Astăzi ne pregătim să mergem în vizită la Ileana Colonel Antonu – născută Cheffa – împreună cu părintele Lazăr și soția. [...] Pictorița este o femeie frumoasă, în ciuda celor șaizeci și cinci de ani ce-i poartă. E grațioasă și plină de temperament. Studiile și le-a făcut în Franța. A călătorit mult, culegând de peste tot frumosul, în toate formele lui. Originară din Bistrița, s-a stabilit până la urmă în Sângeorz. Din discuție, aflăm că multe țărănci vin la ea și o roagă ca, dintr-un chip mic, „cât un bob de porumb”, dintr-o fotografie aproape ștearsă, să le zugrăvească copilița sau feciorelul morți mai demult. Vor, sărmanele, să aibă „chipul mare și zugrăvit în culori frumoase”. Întotdeauna pictorița le-a satisfăcut dorințele. Atunci când le întreabă dacă „băiata” seamănă, mulțumirea lor este desăvârșită. „Aproape că grăiește”, răspund ele.",
    },
  ],
  items: [
    // ── SUBIECTUL I — A. Lectură (30p) ──
    {
      section: "I.A", label: "A.1", type: "SHORT", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Indică sensul din text al cuvântului depășit și al secvenței pe larg.",
      rubric: [{ label: "barem", points: 6, answer: "Indicarea sensului din text al cuvântului dat (de exemplu: învechit) – 2p + al secvenței date (de exemplu: detaliat) – 2p; formularea răspunsului în enunț/enunțuri – 1p; corectitudinea exprimării, respectarea normelor de ortografie și de punctuație – 1p." }],
    },
    {
      section: "I.A", label: "A.2", type: "SHORT", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Menționează două domenii artistice în care se manifestă talentul Ileanei Colonel Antonu, utilizând informațiile din textul dat.",
      rubric: [{ label: "barem", points: 6, answer: "Menționarea celor două domenii artistice (de exemplu: pictura și muzica) – 4p; formularea răspunsului în enunț – 1p; corectitudinea exprimării, respectarea normelor de ortografie și de punctuație – 1p." }],
    },
    {
      section: "I.A", label: "A.3", type: "SHORT", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Precizează o caracteristică a scrisorii trimise de Radu soției sale, justificându-ți răspunsul cu o secvență semnificativă din textul dat.",
      rubric: [{ label: "barem", points: 6, answer: "Precizarea unei caracteristici a scrisorii trimise de Radu (de exemplu: dimensiunea amplă) – 2p; justificarea răspunsului cu o secvență semnificativă din text (de exemplu: „Scrisoarea lui Radu, pe optsprezece pagini”) – 2p; formularea răspunsului în enunț/enunțuri – 1p; corectitudinea exprimării, respectarea normelor – 1p." }],
    },
    {
      section: "I.A", label: "A.4", type: "SHORT", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Explică un motiv pentru care Liviu Rebreanu scria scrisori imediat după câte un eveniment.",
      rubric: [{ label: "barem", points: 6, answer: "Precizarea motivului (de exemplu: împărtășirea detaliată a experienței) – 2p; explicare nuanțată – 2p / încercare de explicare – 1p; formularea răspunsului în enunț/enunțuri – 1p; corectitudinea exprimării, respectarea normelor – 1p." }],
    },
    {
      section: "I.A", label: "A.5", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Prezintă, în 30-50 de cuvinte, reacția femeilor la vederea portretelor realizate pornind de la fotografii în care apar copiii lor, așa cum reiese din textul dat.",
      rubric: [{ label: "barem", points: 6, answer: "Precizarea reacției (de exemplu: uimire) – 2p; prezentare adecvată și nuanțată – 2p / încercare de prezentare – 1p; respectarea precizării privind numărul de cuvinte – 1p; corectitudinea exprimării, respectarea normelor de ortografie și de punctuație – 1p." }],
    },
    // ── SUBIECTUL I — B. Text argumentativ (20p) ──
    {
      section: "I.B", label: "B", type: "OPEN", points: 20, autoGradable: false,
      passageRef: "Textul 1",
      content:
        "Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă fotografiile au sau nu un rol important în viața unei persoane, raportându-te atât la informațiile din fragmentul extras din volumul „Pământul bătătorit de părintele meu. File de jurnal” de Puia Florica Rebreanu, cât și la experiența personală sau culturală.\n\n" +
        "În redactarea textului, vei avea în vedere următoarele repere:\n" +
        "– formularea unei opinii față de problematica pusă în discuție, enunțarea și dezvoltarea corespunzătoare a două argumente adecvate opiniei și formularea unei concluzii pertinente (14 puncte);\n" +
        "– utilizarea corectă a conectorilor în argumentare, respectarea normelor limbii literare, așezarea în pagină, lizibilitatea, respectarea numărului minim de cuvinte (6 puncte).",
      rubric: [
        { label: "Conținut", points: 14, answer: "Formularea unei opinii – 1p; câte 2p pentru enunțarea fiecăruia dintre cele două argumente (2×2=4p); câte 2p pentru dezvoltarea corespunzătoare a fiecărui argument (2×2=4p); valorificarea textului în dezvoltarea oricărui argument – 3p / simpla citare – 1p, plus raportarea la experiența personală sau culturală – 1p (3p+1p=4p); formularea unei concluzii pertinente – 1p." },
        { label: "Redactare", points: 6, answer: "Utilizarea corectă a conectorilor în argumentare – 2p; respectarea normelor limbii literare – 1p; respectarea normelor de ortografie și de punctuație – 1p; așezarea în pagină, lizibilitatea – 1p; respectarea numărului minim de cuvinte – 1p. Doar dacă textul dezvoltă subiectul propus." },
      ],
    },
    // ── SUBIECTUL al II-lea (10p) — comentariu text liric ──
    {
      section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 10, autoGradable: false,
      content:
        "Comentează, în minimum 50 de cuvinte, textul de mai jos, evidențiind relația dintre ideea poetică și mijloacele artistice.\n\n" +
        "Sunt zece ani. Ce curios îmi pare\n" +
        "Aspectul lucrurilor vechi, uitate!\n" +
        "Ca dintr-un somn, deodată deșteptate,\n" +
        "Parcă privesc c-un aer de mirare...\n\n" +
        "Mai strâmtă-i casa, toate-s micșorate,\n" +
        "Mă uit ca-n vis, și caut prin sertare,\n" +
        "Nimicuri scumpe... inima-mi tresare\n" +
        "De-o sfântă și duioasă pietate.\n\n" +
        "Aceleași cadre-mpodobesc păreții,\n" +
        "Din rame, cată lung și trist la mine:\n" +
        "Povești pierdute-n haosul vieții.\n\n" +
        "De farmecul de-odinioară pline,\n" +
        "Îmi readuc parfumul tinereții...\n" +
        "Parfum de flori crescute pe ruine.\n" +
        "(Alexandru Vlahuță, Sonet)",
      rubric: [
        { label: "Conținut", points: 6, answer: "Numirea ideii poetice – 2p; comentarea adecvată și nuanțată, prin evidențierea relației dintre ideea poetică identificată și mijloacele artistice – 4p / comentarea prin evidențierea ezitantă a relației – 2p / simpla precizare a unor mijloace artistice – 1p." },
        { label: "Redactare", points: 4, answer: "Utilizarea limbii literare – 1p; logica înlănțuirii ideilor – 1p; ortografia – 1p (0-1 greșeli – 1p; 2+ greșeli – 0p); punctuația – 1p (0-1 greșeli – 1p; 2+ greșeli – 0p). Doar dacă răspunsul are minimum 50 de cuvinte și dezvoltă subiectul." },
      ],
    },
    // ── SUBIECTUL al III-lea (30p) — eseu text narativ Sadoveanu ──
    {
      section: "Subiectul al III-lea", label: "III", type: "OPEN", points: 30, autoGradable: false,
      content:
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unui text narativ studiat, aparținând lui Mihail Sadoveanu.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea textului narativ studiat într-o perioadă, într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două episoade/secvențe semnificative pentru tema textului narativ studiat;\n" +
        "– analiza a două elemente de structură, de compoziție și/sau de limbaj, relevante pentru textul narativ studiat (de exemplu: acțiune, conflict, relații temporale și spațiale, incipit, final, tehnici narative, instanțe ale comunicării narative, perspectivă narativă, registre stilistice, limbaj etc.).\n\n" +
        "Notă: Ordinea integrării reperelor în cuprinsul eseului este la alegere.",
      rubric: [
        { label: "Conținut", points: 18, answer: "Evidențierea a două trăsături de încadrare (precizarea perioadei/curentului/orientării – 2p; numirea a două trăsături – 2×1p; evidențierea celor două trăsături prin valorificarea textului – 2×1p) = 6p; comentarea a două episoade/secvențe semnificative pentru temă (precizarea temei – 2p; câte 2p pentru comentarea fiecărui episod – 2×2p) = 6p; analiza a două elemente de structură/compoziție/limbaj (câte 3p pentru fiecare element analizat, justificând relevanța – 2×3p) = 6p." },
        { label: "Redactare", points: 12, answer: "Existența părților componente (introducere, cuprins, încheiere) – 1p; logica înlănțuirii ideilor – 1p; abilități de analiză și de argumentare – 3p; utilizarea limbii literare – 2p; ortografia – 2p (0-1 greșeli – 2p; 2 greșeli – 1p; 3+ – 0p); punctuația – 2p (idem); așezarea în pagină, lizibilitatea – 1p. Doar dacă eseul are minimum 400 de cuvinte și dezvoltă subiectul." },
      ],
    },
  ],
};

const PAPERS = [RO];

function validate() {
  const errors = [];
  for (const p of PAPERS) {
    const tag = `${p.subjectKey}`;
    const expectedItemPoints = p.maxScore - p.officeBonus;
    let sum = 0;
    const labels = new Set();
    for (const it of p.items) {
      if (!it.section || !it.label || !it.type || typeof it.points !== "number")
        errors.push(`[${tag}] item missing required field: ${JSON.stringify(it.label)}`);
      if (!it.content || !it.content.trim())
        errors.push(`[${tag}] item ${it.label} empty content`);
      const labelKey = `${it.section}::${it.label}`;
      if (labels.has(labelKey)) errors.push(`[${tag}] duplicate label ${it.section} ${it.label}`);
      labels.add(labelKey);
      if (it.type === "MCQ") {
        if (!Array.isArray(it.options) || it.options.length < 2)
          errors.push(`[${tag}] MCQ ${it.label} needs >=2 options`);
        if (!it.correctAnswer) errors.push(`[${tag}] MCQ ${it.label} missing correctAnswer`);
      }
      if (it.autoGradable && it.hasFigure)
        errors.push(`[${tag}] item ${it.label} autoGradable but hasFigure`);
      if (it.autoGradable && it.type === "OPEN")
        errors.push(`[${tag}] item ${it.label} autoGradable but type OPEN`);
      if (Array.isArray(it.rubric) && it.rubric.length && it.rubric.every((r) => typeof r.points === "number")) {
        const rsum = it.rubric.reduce((a, r) => a + r.points, 0);
        if (rsum !== it.points)
          errors.push(`[${tag}] item ${it.label} rubric points ${rsum} != item points ${it.points}`);
      }
      sum += it.points;
    }
    if (sum !== expectedItemPoints)
      errors.push(`[${tag}] item points sum ${sum} != maxScore-officeBonus ${expectedItemPoints}`);
    const passRefs = new Set((p.passages || []).map((x) => x.ref));
    for (const it of p.items) {
      if (it.passageRef) {
        for (const r of String(it.passageRef).split(",").map((s) => s.trim())) {
          if (!passRefs.has(r)) errors.push(`[${tag}] item ${it.label} passageRef '${r}' not found`);
        }
      }
    }
    console.log(`  ${tag.padEnd(14)} items=${p.items.length} passages=${p.passages.length} pts=${sum}(+${p.officeBonus} oficiu=${sum + p.officeBonus})`);
  }
  if (errors.length) {
    console.error(`\n❌ VALIDATE FAILED (${errors.length}):`);
    for (const e of errors) console.error("   - " + e);
    process.exit(1);
  }
  console.log("\n✅ VALIDATE OK — paper structurally sound, points sum to 90 (+10 oficiu = 100).");
}

async function run(dry) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const p of PAPERS) {
      const existing = await prisma.examPaper.findUnique({
        where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } },
        include: { _count: { select: { items: true, passages: true } } },
      });
      const action = existing ? "UPDATE" : "CREATE";
      console.log(`  ${p.subjectKey.padEnd(14)} ${action} paper → items=${p.items.length} passages=${p.passages.length}` + (existing ? ` (replacing items=${existing._count.items} passages=${existing._count.passages})` : ""));
      if (dry) continue;

      const paper = await prisma.examPaper.upsert({
        where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } },
        update: {
          source: p.source, subjectName: p.subjectName, grade: p.grade, maxScore: p.maxScore,
          officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language,
          sourceUrl: p.sourceUrl, license: p.license, isActive: true,
        },
        create: {
          source: p.source, examType: p.examType, year: p.year, subjectKey: p.subjectKey,
          subjectName: p.subjectName, grade: p.grade, variant: p.variant, maxScore: p.maxScore,
          officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language,
          sourceUrl: p.sourceUrl, license: p.license, isActive: true,
        },
      });
      await prisma.examItem.deleteMany({ where: { paperId: paper.id } });
      await prisma.examPassage.deleteMany({ where: { paperId: paper.id } });
      if (p.passages.length) {
        await prisma.examPassage.createMany({
          data: p.passages.map((x) => ({
            paperId: paper.id, ref: x.ref, title: x.title ?? null, author: x.author ?? null,
            sourceNote: x.sourceNote ?? null, body: x.body, orderIndex: x.orderIndex,
          })),
        });
      }
      await prisma.examItem.createMany({
        data: p.items.map((it, idx) => ({
          paperId: paper.id, section: it.section, label: it.label, orderIndex: idx,
          type: it.type, points: it.points, content: it.content,
          options: it.options ?? undefined, correctAnswer: it.correctAnswer ?? null,
          rubric: it.rubric ?? undefined, passageRef: it.passageRef ?? null,
          hasFigure: !!it.hasFigure, figureNote: it.figureNote ?? null,
          figureUrl: it.figureUrl ?? null, autoGradable: !!it.autoGradable, topic: it.topic ?? null,
        })),
      });
    }
    const [papers, items, passages] = await Promise.all([
      prisma.examPaper.count(), prisma.examItem.count(), prisma.examPassage.count(),
    ]);
    console.log(`\n${dry ? "🔎 DRY — no writes." : "✅ APPLIED."} DB totals: ExamPaper=${papers} ExamItem=${items} ExamPassage=${passages}`);
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  console.log(`\n=== import-exam-ro-bac-2025-model (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
