#!/usr/bin/env node
/**
 * import-exam-en-viii-2026.mjs — Exam-Bank slice 1
 *
 * Imports the two official EN VIII 2026 "Model" papers (subiect + barem) as the first
 * exam-bank material: Matematică + Limba și literatura română.
 *
 * SOURCE (provenance): Ministerul Educației și Cercetării / CNCE — Evaluarea Națională
 *   pentru absolvenții clasei a VIII-a, anul școlar 2025–2026, variante "Model".
 *   Public documents (edu.ro / subiecte.edu.ro). Content transcribed verbatim from the
 *   official subiect + barem PDFs (delivered locally in `~/Downloads/Temp/tutor eval nat/`).
 *   Answer keys taken from the official BAREM — zero generation, zero mesh gate (ground-truth).
 *
 * Figures: geometry/diagram items carry `hasFigure:true` + `figureNote` (description only) —
 *   we DO NOT fabricate images. Image extraction is a later slice. Such items are NOT autoGradable.
 *
 * Idempotent: upsert paper by unique (examType, year, subjectKey, variant) → delete its
 *   items/passages → recreate. Re-running yields identical counts.
 *
 * Modes:
 *   --validate   in-memory data checks only (NO DB connection): required fields, unique
 *                labels per paper, MCQ have options+correctAnswer, points sum == maxScore-officeBonus.
 *   --dry        connect DB, report what WOULD change (paper upsert + item/passage counts), NO writes.
 *   (no flag)    apply: write to DB.
 *
 * DB target: reads DATABASE_URL from env (.env). On prod this is VPS2 local PG (DBM). Never Neon.
 */

const MODE = process.argv.includes("--validate")
  ? "validate"
  : process.argv.includes("--dry")
    ? "dry"
    : "apply";

// ─────────────────────────────────────────────────────────────────────────────
// MATEMATICĂ — EN VIII 2026 Model
// Subiectul I (6 × 5p, MCQ) · Subiectul al II-lea (6 × 5p, MCQ, figuri) · Subiectul al III-lea (6 × 5p, deschis)
// Barem chei: I = 1c 2b 3a 4c 5c 6b · II = 1b 2c 3c 4a 5a 6d
// ─────────────────────────────────────────────────────────────────────────────
const MATH = {
  source: "EN VIII 2026 Model (edu.ro)",
  examType: "EN_VIII",
  year: 2026,
  subjectKey: "matematica",
  subjectName: "Matematică",
  grade: 8,
  variant: "model",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2026/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNCE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    {
      section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true,
      topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 36 : 4 − 4 · 2 este egal cu:",
      options: [{ key: "a", text: "17" }, { key: "b", text: "10" }, { key: "c", text: "1" }, { key: "d", text: "0" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true,
      topic: "Divizibilitate. Intervale",
      content: "Cel mai mare număr natural divizibil cu 5 din intervalul [3, 20) este:",
      options: [{ key: "a", text: "20" }, { key: "b", text: "15" }, { key: "c", text: "5" }, { key: "d", text: "3" }],
      correctAnswer: "b",
    },
    {
      section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true,
      topic: "Rapoarte și proporții",
      content: "Dacă a/4 = 5/2, atunci rezultatul calculului 2a + 10 este egal cu:",
      options: [{ key: "a", text: "30" }, { key: "b", text: "20" }, { key: "c", text: "15" }, { key: "d", text: "10" }],
      correctAnswer: "a",
    },
    {
      section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true,
      topic: "Procente",
      content: "Dintre cei 250 de elevi participanți la un concurs, 40% sunt băieți. Numărul băieților care participă la concurs este egal cu:",
      options: [{ key: "a", text: "160" }, { key: "b", text: "150" }, { key: "c", text: "100" }, { key: "d", text: "90" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true,
      topic: "Radicali. Media aritmetică",
      content: "Patru elevi, Ioan, Mihai, Gabriela și Maria, au calculat media aritmetică a numerelor a = √12 și b = 10 − 2√3. Rezultatele obținute (tabel): Ioan → 10; Mihai → 5 + 2√3; Gabriela → 5; Maria → 5 − 2√3. Conform informațiilor din tabel, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Ioan" }, { key: "b", text: "Mihai" }, { key: "c", text: "Gabriela" }, { key: "d", text: "Maria" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: false,
      topic: "Interpretarea diagramelor",
      hasFigure: true,
      figureNote: "Diagramă cu bare — numărul de mașini vândute în primele patru luni 2025: Ianuarie 1000, Februarie 2000, Martie 500, Aprilie 2500.",
      content: "În diagrama alăturată sunt prezentate informații despre numărul de mașini vândute de un comerciant în primele patru luni ale anului 2025. Afirmația: „Conform informațiilor din diagramă, cele mai multe mașini au fost vândute în luna februarie.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }],
      correctAnswer: "b",
    },
    // ── Subiectul al II-lea (toate au figură) ──
    {
      section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false,
      topic: "Segmente coliniare",
      hasFigure: true,
      figureNote: "Puncte A, B, C, D coliniare, în această ordine.",
      content: "În figura alăturată, punctele A, B, C și D sunt coliniare, în această ordine, astfel încât CD = 3 cm, BD = 3·CD și AD = 3·BD. Lungimea segmentului AC este egală cu:",
      options: [{ key: "a", text: "27 cm" }, { key: "b", text: "24 cm" }, { key: "c", text: "21 cm" }, { key: "d", text: "18 cm" }],
      correctAnswer: "b",
    },
    {
      section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false,
      topic: "Unghiuri. Bisectoare",
      hasFigure: true,
      figureNote: "Unghiuri adiacente suplementare AOC și COB; OM bisectoarea unghiului AOC.",
      content: "În figura alăturată sunt reprezentate unghiurile adiacente suplementare AOC și COB. Semidreapta OM este bisectoarea unghiului AOC, iar măsura unghiului MOC este egală cu 35°. Măsura unghiului BOC este egală cu:",
      options: [{ key: "a", text: "35°" }, { key: "b", text: "70°" }, { key: "c", text: "110°" }, { key: "d", text: "145°" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false,
      topic: "Triunghi dreptunghic. Proiecții",
      hasFigure: true,
      figureNote: "Triunghi ABC dreptunghic în C; D = proiecția lui C pe AB.",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în C, cu AB = 12 cm și măsura unghiului B egală cu 30°. Proiecția punctului C pe dreapta AB este punctul D. Lungimea segmentului CD este egală cu:",
      options: [{ key: "a", text: "3 cm" }, { key: "b", text: "2√3 cm" }, { key: "c", text: "3√3 cm" }, { key: "d", text: "6 cm" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false,
      topic: "Paralelogram. Arii",
      hasFigure: true,
      figureNote: "Paralelogram ABCD; E, F mijloacele laturilor AB, respectiv AD.",
      content: "În figura alăturată este reprezentat paralelogramul ABCD, cu aria egală cu 96 cm². Punctele E și F sunt mijloacele laturilor AB, respectiv AD. Aria triunghiului AEF este egală cu:",
      options: [{ key: "a", text: "12 cm²" }, { key: "b", text: "24 cm²" }, { key: "c", text: "48 cm²" }, { key: "d", text: "72 cm²" }],
      correctAnswer: "a",
    },
    {
      section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false,
      topic: "Cerc. Unghiuri",
      hasFigure: true,
      figureNote: "Cerc cu centrul O; AB și CD diametre; arcul AD = 52°.",
      content: "În figura alăturată este reprezentat cercul cu centrul în punctul O, iar AB și CD sunt diametre. Arcul AD are măsura egală cu 52°. Măsura unghiului BDC este egală cu:",
      options: [{ key: "a", text: "26°" }, { key: "b", text: "30°" }, { key: "c", text: "52°" }, { key: "d", text: "60°" }],
      correctAnswer: "a",
    },
    {
      section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false,
      topic: "Prismă. Volum",
      hasFigure: true,
      figureNote: "Prismă dreaptă ABCA'B'C' cu baza triunghi echilateral ABC.",
      content: "În figura alăturată este reprezentată prisma dreaptă ABCA'B'C', cu baza triunghiul echilateral ABC, AA' = 2√3 cm și AB = 4 cm. Volumul prismei ABCA'B'C' este egal cu:",
      options: [{ key: "a", text: "4√3 cm³" }, { key: "b", text: "8 cm³" }, { key: "c", text: "8√3 cm³" }, { key: "d", text: "24 cm³" }],
      correctAnswer: "d",
    },
    // ── Subiectul al III-lea (deschis, rezolvări complete) ──
    {
      section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false,
      topic: "Probleme. Ecuații",
      content: "În prezent, vârsta lui Bogdan este cu 8 ani mai mare decât triplul vârstei lui Tudor. Peste un an vârsta lui Bogdan va fi de 5 ori mai mare decât vârsta lui Tudor.",
      rubric: [
        { label: "a)", points: 2, answer: "Tudor NU poate avea în prezent 4 ani: dacă Tudor = 4, atunci Bogdan = 4·3 + 8 = 20; peste un an Tudor = 5 și Bogdan = 21, dar 5·5 = 25 ≠ 21." },
        { label: "b)", points: 3, answer: "Notând a = vârsta lui Tudor, b = vârsta lui Bogdan: b = 3a + 8 și b + 1 = 5(a + 1) ⇒ a = 2, b = 14 ani." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false,
      topic: "Calcul algebric. Expresii raționale",
      content: "Se consideră expresia E(x) = 3/(x²+6x+9) · x/(x−3) : (1/(x+3) + 3/(x²−9)), unde x este număr real, x ≠ −3, x ≠ 0 și x ≠ 3.",
      rubric: [
        { label: "a)", points: 2, answer: "1/(x+3) + 3/(x²−9) = x / ((x−3)(x+3)), pentru orice x real, x ≠ −3, x ≠ 3." },
        { label: "b)", points: 3, answer: "E(x) = 3/(x+3). N = 1/E(n) + 1/E(n+1) + 1/E(n+2) = (3n+12)/3 = n + 4, număr natural pentru orice n natural, n > 3." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false,
      topic: "Funcții. Grafic",
      hasFigure: true,
      figureNote: "Sistem de axe ortogonale xOy cu graficul funcției f(x) = 2x + 4.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = 2x + 4.",
      rubric: [
        { label: "a)", points: 2, answer: "f(2) = 8, f(−2) = 0 ⇒ f(2) + f(−2) = 8." },
        { label: "b)", points: 3, answer: "A(−2, 0) și B(0, 4); cu M(3, 0), triunghiul BOM dreptunghic în O ⇒ BM = 5; AM = 5, deci AM = BM ⇒ triunghiul AMB isoscel ⇒ ∢BAM ≡ ∢MBA." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false,
      topic: "Cerc. Patrulater inscriptibil",
      hasFigure: true,
      figureNote: "Cerc de centru O; A, B, C, D pe cerc; AB diametru; CD ∥ AB; AC bisectoarea unghiului BAD; CD = 16 cm.",
      content: "În figura alăturată este reprezentat cercul de centru O. Punctele A, B, C și D aparțin cercului, astfel încât AB este diametru. Dreptele CD și AB sunt paralele, semidreapta AC este bisectoarea unghiului BAD și CD = 16 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "AC bisectoarea unghiului BAD și CD ∥ AB ⇒ triunghiul ADC isoscel ⇒ AD = DC = 16 cm." },
        { label: "b)", points: 3, answer: "Triunghiurile AOD, DOC și BOC sunt echilaterale și congruente ⇒ Aria(ABCD) = 3·Aria(AOD) = 192√3 cm²." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false,
      topic: "Paralelogram. Asemănare. Arii",
      hasFigure: true,
      figureNote: "Paralelogram ABCD, AB = 15 cm; M pe AB cu AM = AD = (2/3)·AB; DM intersectează BC în N.",
      content: "În figura alăturată este reprezentat paralelogramul ABCD cu AB = 15 cm. Punctul M aparține segmentului AB, astfel încât AM = AD = (2/3)·AB.",
      rubric: [
        { label: "a)", points: 2, answer: "AD = AM = (2/3)·15 = 10 cm ⇒ P(ABCD) = 2(AB + AD) = 2·25 = 50 cm." },
        { label: "b)", points: 3, answer: "Distanța de la D la AB = 8 cm ⇒ Aria(ADM) = (AM·8)/2 = 40 cm². ΔADM ∼ ΔCND cu raport (AM/CD)² = 4/9 ⇒ Aria(NCD) = (9/4)·40 = 90 cm²." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false,
      topic: "Cub. Distanță punct-plan",
      hasFigure: true,
      figureNote: "Cub ABCDA'B'C'D', AB = 8 cm; M, N, P mijloacele muchiilor AD, DC, respectiv DD'.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D', cu AB = 8 cm. Punctele M, N și P sunt mijloacele muchiilor AD, DC, respectiv DD'.",
      rubric: [
        { label: "a)", points: 2, answer: "MN linie mijlocie în triunghiul DAC ⇒ MN = AC/2 = 4√2 cm; NP = MP = 4√2 cm ⇒ triunghiul MNP echilateral ⇒ Aria(MNP) = 8√3 cm²." },
        { label: "b)", points: 3, answer: "Distanța de la D' la planul (MNP) = 4√3/3 cm." },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LIMBA ȘI LITERATURA ROMÂNĂ — EN VIII 2026 Model
// SUBIECTUL I (70p): A (lectură, 9 itemi) + B (limbă, 8 itemi) · SUBIECTUL al II-lea (20p, compunere)
// Barem chei: A2=c A3=b A4=c · B1=c B2=d B3=d B4=d
// ─────────────────────────────────────────────────────────────────────────────
const RO = {
  source: "EN VIII 2026 Model (edu.ro)",
  examType: "EN_VIII",
  year: 2026,
  subjectKey: "limba_romana",
  subjectName: "Limba și literatura română",
  grade: 8,
  variant: "model",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2026/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNCE)",
  passages: [
    {
      ref: "Textul 1",
      title: "Dansul ursului",
      author: "Ion D. Sîrbu",
      sourceNote: "Fragment. (curmătură – vale între doi munți)",
      orderIndex: 1,
      body:
        "— Domnule inginer, eu am doi copii: un băiat mai mare, Daniel, care învață la un liceu în Chamonix și locuiește la internat, și o fată, Yolanda, care are numai zece ani, e elevă în clasa a patra primară, învață acasă cu soția mea și cu mine. Are tot ce-i trebuie: videotecă didactică, televizor de exerciții, tot felul de casetofoane. O dată pe lună cobor cu această neastâmpărată fetiță a mea la o institutoare care o examinează și o îndrumă. În septembrie, anul trecut, pe fiica mea, promovând în clasa a patra, am dus-o în fața unei comisii severe. A reușit cu „excepțional”: cărțile, pădurea și animalele sunt, pentru copii, cea mai inteligentă și ultramodernă școală.\n" +
        "— Sunt absolut de aceeași părere, întării eu, care mi-am crescut copiii sub oblăduirea muntelui.\n" +
        "— După examen, [...] Yolanda mea era veselă, se ținea bine în șa, mă tot bătea la cap cu urșii. Unde sunt urșii noștri, ce fac urșii noștri? [...] Am urcat, am tot urcat, era o toamnă frumoasă, caldă, strălucea tot văzduhul de lumină și viață. Yolanda mea cânta, eu o îngânam. Când am ajuns la curmătura ce se cheamă Creuse, am zis: „Aici vom mânca, iar eu am să trag un pui de somn!”. Așa și făcurăm, e un loc stâncos, minunat pentru o oră de odihnă. Am mâncat, mie-mi și venise somnul. Catârii pășteau, aveau acolo o iarbă ca mătasea, neatinsă. [...] Yolanda ciripea de-ale ei: era fericită că scăpase cu laude de la examinare. [...] Yolanda e deosebit de comunicativă. Vorbește cu păsările, cu veverița casei, cu popândăul. E copilă, are numai zece ani și consideră absolut toate ființele pădurii, chiar și copacii și ierburile, ca fiind prietene cu ea. [...] Nu cred că am dormit mai mult de o oră. M-am trezit brusc. Nu sunt un om fricos, dar am trăit atunci cea mai cutremurătoare spaimă din viața mea. Cum? Simplu de tot: m-am trezit lins pe față de un cap brun de trei ori mai mare decât al meu. Am încremenit [...]. Dar Yolanda m-a salvat: văzând că am devenit de culoarea ierbii, [...] a venit în ajutorul meu. L-a lovit cu pumnii pe ursul ce mă săruta, spunându-i: „Ajunge, Jacques, nu vezi că tata se teme de tine?!” și, ca pe un câine blând, l-a dat laoparte... Ha, ha! Asta a fost... [...] urșii au iernat la mine în grajd, și nu în pădure, sub o stâncă sau scorbură.",
    },
    {
      ref: "Textul 2",
      title: "Copiii își doresc metamorfoza, adulții mai degrabă se tem de ea",
      author: "Ioana Pârvulescu",
      sourceNote: "Interviu realizat de Andra Rotaru, blog.carturesti.ro. (metamorfoză – transformare, modificare, schimbare)",
      orderIndex: 2,
      body:
        "Vă mai amintiți primele întâlniri cu veverițele din copilărie? Ce regăsim în personajul de peste ani, Vevi?\n" +
        "Alături de mangusta din Cartea junglei, Riki-Tiki-Tavi, și de pinguini, animale pe care le-am întâlnit doar în cărți și filme documentare, veverițele sunt animalele mele favorite. Iar pe ele le-am tot întâlnit în excursiile copilăriei. [...] Mă binedispuneau de fiecare dată, păreau întruparea spiritului ludic al pădurii, erau pentru mine jocul în esența lui cea mai grațioasă.\n" +
        "Dar Vevi, așa cum povestesc pe coperta a 4-a a cărții Trei zile nemaipomenite, a fost, până la un punct, reală, pentru că e singura veveriță care a venit în vizită, din proprie inițiativă, chiar pe minuscula terasă a casei mele din inima Brașovului. [...]\n" +
        "Când veverița Vevi și fetița Emi își doresc cu ardoare ceva, dorințele devin realitate și fiecare se trezește în pielea celeilalte. [...] Sunt personajele pregătite pentru aventurile care se nasc odată cu împlinirea fanteziilor?\n" +
        "Da și nu. Un copil e mai pregătit și mai dornic de schimbări miraculoase decât un adult. Copiii își doresc metamorfoza, adulții mai degrabă se tem de ea, pentru că, de la un punct încolo al vieții, metamorfozele sunt primejdioase, iar asta e și tema din viitorul meu roman, Aurul pisicii. [...] A înțelege în profunzime ce trăiește altcineva, „a te pune în pielea/blana lui”, este pe cât de greu, pe atât de valoros, e o experiență fără de care ești sărac.",
    },
  ],
  items: [
    // ── A. Lectură ──
    {
      section: "I.A", label: "A.1", type: "FILL", points: 2, autoGradable: false,
      passageRef: "Textul 1",
      content: "Completează spațiile punctate cu informațiile din textul 1: „Fratele Yolandei, ___ (prenumele), locuiește la un ___.”",
      correctAnswer: "Daniel; internat (locuiește la internat / la un liceu în Chamonix)",
      rubric: [{ label: "completare", points: 2, answer: "Daniel; internat (câte 1 punct fiecare)" }],
    },
    {
      section: "I.A", label: "A.2", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 1",
      content: "Povestea despre îmblânzirea unor animale sălbatice este ascultată de către:",
      options: [{ key: "a", text: "brigadier" }, { key: "b", text: "bunică" }, { key: "c", text: "inginer" }, { key: "d", text: "institutoare" }],
      correctAnswer: "c",
    },
    {
      section: "I.A", label: "A.3", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Unul dintre personajele din cartea Ioanei Pârvulescu, Trei zile nemaipomenite, este:",
      options: [{ key: "a", text: "o mangustă" }, { key: "b", text: "o veveriță" }, { key: "c", text: "un pinguin" }, { key: "d", text: "un ursuleț" }],
      correctAnswer: "b",
    },
    {
      section: "I.A", label: "A.4", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Romanul Aurul pisicii prezintă:",
      options: [{ key: "a", text: "dorința de a avea o casă la munte" }, { key: "b", text: "excursiile din vremea copilăriei" }, { key: "c", text: "felul cum este privită schimbarea" }, { key: "d", text: "frumusețea pădurilor din Brașov" }],
      correctAnswer: "c",
    },
    {
      section: "I.A", label: "A.5", type: "TF_GRID", points: 6, autoGradable: true,
      passageRef: "Textul 1, Textul 2",
      content: "Notează „X” în dreptul fiecărui enunț pentru a stabili dacă este adevărat (A) sau fals (F), bazându-te pe informațiile din cele două texte.",
      rubric: [
        { label: "Textul 1 — Tatăl și fiica fac popas într-un loc numit Creuse.", points: 1, answer: "Adevărat" },
        { label: "Textul 1 — Yolanda este rănită de niște animale sălbatice.", points: 1, answer: "Fals" },
        { label: "Textul 1 — Atunci când povestește, tatăl Yolandei oferă multe explicații.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Pentru autoare, veverițele reprezintă jocul grațios.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Ioana Pârvulescu este realizatoarea unui film documentar despre animale.", points: 1, answer: "Fals" },
        { label: "Textul 2 — Pe prima copertă a cărții publicate de Ioana Pârvulescu sunt informații despre Vevi.", points: 1, answer: "Fals" },
      ],
      correctAnswer: "Textul 1: A, F, A | Textul 2: A, F, F",
    },
    {
      section: "I.A", label: "A.6", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Transcrie, din secvențele următoare, două figuri de stil diferite, pe care le vei preciza: „Am urcat, am tot urcat, era o toamnă frumoasă, caldă, strălucea tot văzduhul de lumină și viață.” și „Catârii pășteau, aveau acolo o iarbă ca mătasea, neatinsă”.",
      rubric: [{ label: "barem", points: 6, answer: "Două figuri de stil diferite (ex.: „am urcat, am tot urcat” – repetiție; „o iarbă ca mătasea” – comparație). 2×1p transcriere + 2×2p precizarea felului." }],
    },
    {
      section: "I.A", label: "A.7", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1, Textul 2",
      content: "Prezintă, în minimum 30 de cuvinte, un element de conținut comun celor două texte date, valorificând câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "Element comun (ex.: copilăria, lumea animalelor): 2p precizare + 2×1p prezentare din fiecare text + 1p norme + 1p număr minim de cuvinte." }],
    },
    {
      section: "I.A", label: "A.8", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 2",
      content: "Crezi că întâmplările din copilărie pot fi o sursă de inspirație pentru scrierea unui text? Motivează-ți răspunsul, în 50-100 de cuvinte, valorificând textul 2.",
      rubric: [{ label: "barem", points: 6, answer: "1p răspuns + 1p motivare + 2p valorificarea textului 2 + 1p norme + 1p încadrare în numărul de cuvinte." }],
    },
    {
      section: "I.A", label: "A.9", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Asociază fragmentul din opera literară „Dansul ursului” de Ion D. Sîrbu cu un alt text literar studiat la clasă sau citit ca lectură suplimentară, prezentând, în 50-100 de cuvinte, o valoare comună, prin referire la câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "1p numirea unei valori (ex.: empatia/curajul/educația/armonia din familie) + 1p titlu+autor text asociat + 2p prezentarea valorii comune + 1p norme + 1p număr de cuvinte." }],
    },
    // ── B. Limbă ──
    {
      section: "I.B", label: "B.1", type: "MCQ", points: 2, autoGradable: true,
      topic: "Diftong",
      content: "Conțin diftong ambele cuvinte din seria:",
      options: [{ key: "a", text: "„naivitate”, „înfiorător”" }, { key: "b", text: "„pășteau”, „grațioasă”" }, { key: "c", text: "„picioare”, „liceu”" }, { key: "d", text: "„realitate”, „brigadier”" }],
      correctAnswer: "c",
    },
    {
      section: "I.B", label: "B.2", type: "MCQ", points: 2, autoGradable: true,
      topic: "Cuvinte derivate",
      content: "Seria care cuprinde doar cuvinte derivate este:",
      options: [{ key: "a", text: "„excursiile”, „codrului”" }, { key: "b", text: "„optzeci”, „deodată”" }, { key: "c", text: "„prietenie”, „uneori”" }, { key: "d", text: "„stâncos”, „dorința”" }],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.3", type: "MCQ", points: 2, autoGradable: true,
      topic: "Sensul cuvintelor în context",
      content: "Secvența subliniată în fragmentul „văzând că am devenit de culoarea ierbii, [...] a venit în ajutorul meu” face referire la o stare de:",
      options: [{ key: "a", text: "bucurie" }, { key: "b", text: "entuziasm" }, { key: "c", text: "liniște" }, { key: "d", text: "spaimă" }],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.4", type: "MCQ", points: 2, autoGradable: true,
      topic: "Omonime",
      content: "Seria în care cuvintele subliniate sunt omonime este:",
      options: [
        { key: "a", text: "„Copiii își doresc metamorfoza”; „un copil știe ce implică schimbarea”" },
        { key: "b", text: "„în fața unei comisii severe”; „Pedepsele severe sunt respinse”" },
        { key: "c", text: "„într-o fracțiune de secundă”; „O fracție reprezintă o parte dintr-un întreg”" },
        { key: "d", text: "„tema din viitorul meu roman”; „Traian a fost un împărat roman”" },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.5", type: "SHORT", points: 6, autoGradable: false,
      content: "Precizează valoarea morfologică a cuvântului „o” în fiecare dintre contextele: (1) „era o toamnă frumoasă”; (2) „Yolanda mea cânta, eu o îngânam”; (3) „minunat pentru o oră de odihnă”.",
      correctAnswer: "(1) articol nehotărât; (2) pronume personal; (3) numeral cardinal",
      rubric: [{ label: "barem", points: 6, answer: "3×2p: (1) articol nehotărât, (2) pronume personal, (3) numeral cardinal. Nu se punctează identificarea primară (articol/pronume/numeral)." }],
    },
    {
      section: "I.B", label: "B.6", type: "OPEN", points: 6, autoGradable: false,
      content: "Alcătuiește un enunț imperativ, în care să existe un adjectiv pronominal posesiv, persoana a II-a, în cazul acuzativ (1), și un enunț asertiv, în care substantivul „copilărie” să fie complement prepozițional (2).",
      rubric: [{ label: "barem", points: 6, answer: "2×1p alcătuirea fiecărui tip de enunț + 1p valoarea morfologică (adj. pron. posesiv, p. a II-a, acuzativ) + 1p funcția sintactică (complement prepozițional) + 2×1p norme. Ex.: (1) Adu-mi cartea ta!; (2) M-am gândit la copilăria noastră." }],
    },
    {
      section: "I.B", label: "B.7", type: "OPEN", points: 6, autoGradable: false,
      content: "Transcrie trei propoziții subordonate diferite din fraza: „Am o bunică de optzeci de ani care se apucă luni să ne povestească ce a pățit la biserică și care pierde, povestind, slujba din duminica viitoare”, precizând felul acestora.",
      rubric: [{ label: "barem", points: 6, answer: "3×1p transcriere + 3×1p felul. Ex.: „care se apucă luni” – atributivă; „să ne povestească” – completivă prepozițională; „ce a pățit la biserică” – completivă directă." }],
    },
    {
      section: "I.B", label: "B.8", type: "FILL", points: 6, autoGradable: false,
      content: "Completează, în spațiile libere, forma corectă a cuvintelor scrise în paranteză (mesajul unui pădurar): „Yolanda, ___ (a ști, conjunctiv prezent, p. a II-a sg.) că, spre sfârșitul ___ (după-amiază), chiar în mijlocul ___ (pădure), ai putea vedea ___ (bine, superlativ relativ de superioritate) ultimii ___ (zimbru) din rezervație, ei ___ (adjectiv pronominal de întărire) niște legende.”",
      correctAnswer: "să știi, după-amiezii, pădurii, cel mai bine, zimbri, înșiși",
      rubric: [{ label: "barem", points: 6, answer: "6×1p: să știi, după-amiezii, pădurii, cel mai bine, zimbri, înșiși." }],
    },
    // ── SUBIECTUL al II-lea ──
    {
      section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 20, autoGradable: false,
      passageRef: "Textul 1",
      content: "Scrie o compunere, de minimum 150 de cuvinte, în care să o caracterizezi pe Yolanda, personajul din textul lui Ion D. Sîrbu. Vei avea în vedere: două date de identificare a personajului; prezentarea, prin câte o secvență comentată, a două trăsături morale; precizarea a două mijloace de caracterizare diferite; corelarea unei valori personale cu una dintre valorile personajului.",
      rubric: [
        { label: "Conținut", points: 12, answer: "2×1p date de identificare + 2×1p trăsături morale + 2×2p prezentare prin secvență comentată + 2×1p mijloc de caracterizare + 2p corelarea unei valori personale." },
        { label: "Redactare", points: 8, answer: "Paragrafe 1p, coerență 1p, proprietatea termenilor 1p, corectitudine gramaticală 1p, claritate 1p, ortografie 1p, punctuație 1p, lizibilitate 1p. Doar dacă are min. 150 cuvinte." },
      ],
    },
  ],
};

const PAPERS = [MATH, RO];

// ─────────────────────────────────────────────────────────────────────────────
// Validation (no DB)
// ─────────────────────────────────────────────────────────────────────────────
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
        const keys = (it.options || []).map((o) => o.key);
        if (it.correctAnswer && !keys.includes(it.correctAnswer))
          errors.push(`[${tag}] MCQ ${it.label} correctAnswer '${it.correctAnswer}' not in option keys`);
      }
      if (it.autoGradable && it.hasFigure)
        errors.push(`[${tag}] item ${it.label} autoGradable but hasFigure (contradiction)`);
      if (it.autoGradable && it.type === "OPEN")
        errors.push(`[${tag}] item ${it.label} autoGradable but type OPEN (contradiction)`);
      // rubric points must sum to item points (covers single-entry rubrics too — catches typos)
      if (Array.isArray(it.rubric) && it.rubric.length && it.rubric.every((r) => typeof r.points === "number")) {
        const rsum = it.rubric.reduce((a, r) => a + r.points, 0);
        if (rsum !== it.points)
          errors.push(`[${tag}] item ${it.label} rubric points ${rsum} != item points ${it.points}`);
      }
      sum += it.points;
    }
    if (sum !== expectedItemPoints)
      errors.push(`[${tag}] item points sum ${sum} != maxScore-officeBonus ${expectedItemPoints}`);
    // passage refs resolve
    const passRefs = new Set((p.passages || []).map((x) => x.ref));
    for (const it of p.items) {
      if (it.passageRef) {
        for (const r of String(it.passageRef).split(",").map((s) => s.trim())) {
          if (!passRefs.has(r))
            errors.push(`[${tag}] item ${it.label} passageRef '${r}' not found among passages`);
        }
      }
    }
    const autoCount = p.items.filter((i) => i.autoGradable).length;
    console.log(
      `  ${tag.padEnd(14)} items=${p.items.length} passages=${p.passages.length} ` +
        `pts=${sum}(+${p.officeBonus} oficiu=${sum + p.officeBonus}) autoGradable=${autoCount}`
    );
  }
  if (errors.length) {
    console.error(`\n❌ VALIDATE FAILED (${errors.length}):`);
    for (const e of errors) console.error("   - " + e);
    process.exit(1);
  }
  console.log("\n✅ VALIDATE OK — both papers structurally sound, points sum to 90 (+10 oficiu = 100).");
}

// ─────────────────────────────────────────────────────────────────────────────
// DB write (apply) / dry
// ─────────────────────────────────────────────────────────────────────────────
async function run(dry) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const p of PAPERS) {
      const existing = await prisma.examPaper.findUnique({
        where: {
          examType_year_subjectKey_variant: {
            examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant,
          },
        },
        include: { _count: { select: { items: true, passages: true } } },
      });
      const action = existing ? "UPDATE" : "CREATE";
      console.log(
        `  ${p.subjectKey.padEnd(14)} ${action} paper → items=${p.items.length} passages=${p.passages.length}` +
          (existing ? ` (replacing items=${existing._count.items} passages=${existing._count.passages})` : "")
      );
      if (dry) continue;

      const paper = await prisma.examPaper.upsert({
        where: {
          examType_year_subjectKey_variant: {
            examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant,
          },
        },
        update: {
          source: p.source, subjectName: p.subjectName, grade: p.grade, maxScore: p.maxScore,
          officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language,
          sourceUrl: p.sourceUrl, license: p.license, isActive: true,
        },
        create: {
          source: p.source, examType: p.examType, year: p.year, subjectKey: p.subjectKey,
          subjectName: p.subjectName, grade: p.grade, variant: p.variant, maxScore: p.maxScore,
          officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language,
          sourceUrl: p.sourceUrl, license: p.license,
        },
      });
      // idempotent: clear then recreate children
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
          autoGradable: !!it.autoGradable, topic: it.topic ?? null,
        })),
      });
    }
    // summary
    const [papers, items, passages] = await Promise.all([
      prisma.examPaper.count(), prisma.examItem.count(), prisma.examPassage.count(),
    ]);
    console.log(`\n${dry ? "🔎 DRY — no writes." : "✅ APPLIED."} DB totals: ExamPaper=${papers} ExamItem=${items} ExamPassage=${passages}`);
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  console.log(`\n=== import-exam-en-viii-2026 (mode=${MODE}) ===`);
  validate(); // always run structural validation first
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
