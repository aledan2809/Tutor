/**
 * Tier 3 (Viral Layer) — SEO subject landings.
 *
 * Curated, hand-authored content targeting high-intent RO search queries
 * ("grile bac matematică", "evaluare națională română", etc.). Each landing
 * carries a sample quiz (STATIC, no AI call → fast, zero-cost, indexable) plus
 * a CTA into the live Magic Quiz demo (/try). Pure data — no DB, no server deps,
 * so it's safe to import from both server (metadata) and client (sample quiz).
 *
 * Facts kept basic + verifiable (no fabricated content, per GUARDRAILS).
 */

export interface SampleQuestion {
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SubjectLanding {
  slug: string; // URL segment under /grile/<slug>
  examType: string; // "Bacalaureat" | "Evaluare Națională" | "Admitere"
  subject: string; // "Matematică"
  title: string; // <title> — keyword-leading
  metaDescription: string;
  h1: string;
  intro: string; // 1-2 paragraphs of real content
  topics: string[]; // chapters / competencies (content depth + keywords)
  faq: { q: string; a: string }[];
  sampleQuestions: SampleQuestion[];
}

export const SUBJECTS: SubjectLanding[] = [
  {
    slug: "grile-bacalaureat-matematica",
    examType: "Bacalaureat",
    subject: "Matematică",
    title: "Grile Bacalaureat Matematică — teste grilă online gratuite | etutor.ro",
    metaDescription:
      "Exersează cu grile de Bacalaureat la Matematică: teste grilă online, rezolvări pas cu pas și quiz generat din propriile materiale. Gratuit, fără cont.",
    h1: "Grile Bacalaureat — Matematică",
    intro:
      "Pregătește-te pentru proba de Matematică de la Bacalaureat cu teste grilă online. Exersezi pe capitolele din programă, primești explicații la fiecare răspuns și poți genera instant un test din propriile notițe sau pagini de manual.",
    topics: [
      "Numere reale, mulțimi și logică",
      "Funcții și grafice",
      "Progresii aritmetice și geometrice",
      "Logaritmi și exponențiale",
      "Trigonometrie",
      "Combinatorică și probabilități",
      "Geometrie analitică",
    ],
    faq: [
      {
        q: "Grilele sunt gratuite?",
        a: "Da. Poți exersa quiz-uri direct pe pagină, fără cont. Pentru progres salvat, streak-uri și 1400+ grile reale, îți faci cont gratuit.",
      },
      {
        q: "Pot face grile din propriul manual?",
        a: "Da — lipești o pagină de teorie în demo-ul Magic Quiz și AI-ul generează grile din chiar acel text, în câteva secunde.",
      },
    ],
    sampleQuestions: [
      {
        content: "Care este valoarea lui log₂ 8?",
        options: ["2", "3", "4", "8"],
        correctIndex: 1,
        explanation: "log₂ 8 = 3, deoarece 2³ = 8.",
      },
      {
        content: "Al treilea termen al progresiei aritmetice cu a₁ = 2 și rația r = 5 este:",
        options: ["7", "10", "12", "17"],
        correctIndex: 2,
        explanation: "a₃ = a₁ + 2r = 2 + 2·5 = 12.",
      },
      {
        content: "Câte submulțimi are o mulțime cu 4 elemente?",
        options: ["8", "12", "16", "24"],
        correctIndex: 2,
        explanation: "O mulțime cu n elemente are 2ⁿ submulțimi; 2⁴ = 16.",
      },
    ],
  },
  {
    slug: "grile-bacalaureat-romana",
    examType: "Bacalaureat",
    subject: "Limba și literatura română",
    title: "Grile Bacalaureat Română — teste grilă și subiecte | etutor.ro",
    metaDescription:
      "Grile de Bacalaureat la Limba și literatura română: noțiuni de teorie literară, curente, autori canonici și quiz generat din propriile materiale. Gratuit.",
    h1: "Grile Bacalaureat — Limba și literatura română",
    intro:
      "Verifică-ți cunoștințele pentru proba de Română de la Bacalaureat: curente literare, genuri și specii, figuri de stil și autorii canonici. Generează grile din propriile texte sau exersează cu cele de mai jos.",
    topics: [
      "Curente literare (clasicism, romantism, realism, modernism)",
      "Genuri și specii literare",
      "Figuri de stil și procedee",
      "Autori canonici (Eminescu, Caragiale, Rebreanu, Bacovia)",
      "Comentariul și eseul structurat",
    ],
    faq: [
      {
        q: "Acoperă autorii din programă?",
        a: "Grilele ating noțiunile de teorie literară și autorii canonici din programa de Bacalaureat. Pentru acoperire completă, contul gratuit deblochează seturi extinse.",
      },
    ],
    sampleQuestions: [
      {
        content: "Poezia „Luceafărul” de Mihai Eminescu aparține curentului:",
        options: ["Clasicism", "Romantism", "Realism", "Suprarealism"],
        correctIndex: 1,
        explanation: "„Luceafărul” este o capodoperă a romantismului eminescian.",
      },
      {
        content: "Figura de stil din „a fugit ca vântul” este:",
        options: ["Metaforă", "Comparație", "Personificare", "Hiperbolă"],
        correctIndex: 1,
        explanation: "Construcția cu „ca” introduce o comparație.",
      },
      {
        content: "Opera „O scrisoare pierdută” de I. L. Caragiale este o:",
        options: ["Tragedie", "Comedie", "Nuvelă", "Baladă"],
        correctIndex: 1,
        explanation: "Este o comedie de moravuri politice.",
      },
    ],
  },
  {
    slug: "grile-bacalaureat-istorie",
    examType: "Bacalaureat",
    subject: "Istorie",
    title: "Grile Bacalaureat Istorie — teste grilă online | etutor.ro",
    metaDescription:
      "Grile de Bacalaureat la Istorie: statul român modern, secolul XX, comunismul și integrarea europeană. Quiz din propriile materiale, gratuit, fără cont.",
    h1: "Grile Bacalaureat — Istorie",
    intro:
      "Recapitulează pentru proba de Istorie de la Bacalaureat: formarea statului român modern, perioada interbelică, regimul comunist și România după 1989. Exersează cu grile și generează teste din propriile notițe.",
    topics: [
      "Formarea statului român modern (1859, 1877, 1918)",
      "România interbelică",
      "Al Doilea Război Mondial",
      "Regimul comunist în România",
      "România după 1989 și integrarea europeană",
    ],
    faq: [
      {
        q: "Sunt grile cu date și evenimente?",
        a: "Da, grilele acoperă evenimente, date-cheie și procese istorice din programă. Poți genera și grile din propriul manual de istorie.",
      },
    ],
    sampleQuestions: [
      {
        content: "Mica Unire (Unirea Principatelor Române) a avut loc în anul:",
        options: ["1848", "1859", "1877", "1918"],
        correctIndex: 1,
        explanation: "Unirea Moldovei cu Țara Românească s-a realizat în 1859, sub Alexandru Ioan Cuza.",
      },
      {
        content: "Marea Unire a tuturor provinciilor românești s-a produs în anul:",
        options: ["1916", "1918", "1920", "1923"],
        correctIndex: 1,
        explanation: "Marea Unire s-a desăvârșit la 1 Decembrie 1918.",
      },
      {
        content: "Revoluția care a dus la căderea regimului comunist din România a avut loc în:",
        options: ["1985", "1989", "1991", "1992"],
        correctIndex: 1,
        explanation: "Regimul comunist a căzut în decembrie 1989.",
      },
    ],
  },
  {
    slug: "grile-bacalaureat-biologie",
    examType: "Bacalaureat",
    subject: "Biologie",
    title: "Grile Bacalaureat Biologie — teste grilă online | etutor.ro",
    metaDescription:
      "Grile de Bacalaureat la Biologie: celula, genetică, sisteme ale corpului uman și ecologie. Quiz generat din propriile materiale, gratuit, fără cont.",
    h1: "Grile Bacalaureat — Biologie",
    intro:
      "Pregătește proba de Biologie de la Bacalaureat cu grile pe capitolele din programă: citologie, genetică, anatomia și fiziologia omului. Generează teste din propriile materiale sau exersează mai jos.",
    topics: [
      "Celula — structură și funcții",
      "Diviziunea celulară (mitoză, meioză)",
      "Genetică și ereditate",
      "Sistemele corpului uman",
      "Ecologie și protecția mediului",
    ],
    faq: [
      {
        q: "Pot exersa pe anatomia omului?",
        a: "Da, grilele acoperă sistemele corpului uman din programa de Bacalaureat. Poți genera și quiz-uri din propriile scheme și notițe.",
      },
    ],
    sampleQuestions: [
      {
        content: "Organitul celular responsabil de producerea energiei (ATP) este:",
        options: ["Ribozomul", "Mitocondria", "Nucleul", "Lizozomul"],
        correctIndex: 1,
        explanation: "Mitocondria este sediul respirației celulare și al producerii de ATP.",
      },
      {
        content: "Procesul prin care o celulă se divide în două celule identice se numește:",
        options: ["Meioză", "Mitoză", "Fecundare", "Fotosinteză"],
        correctIndex: 1,
        explanation: "Mitoza produce două celule fiice identice cu celula-mamă.",
      },
      {
        content: "Pigmentul verde din plante implicat în fotosinteză este:",
        options: ["Hemoglobina", "Clorofila", "Melanina", "Caroten"],
        correctIndex: 1,
        explanation: "Clorofila absoarbe lumina necesară fotosintezei.",
      },
    ],
  },
  {
    slug: "grile-evaluare-nationala-matematica",
    examType: "Evaluare Națională",
    subject: "Matematică",
    title: "Grile Evaluare Națională Matematică — teste online | etutor.ro",
    metaDescription:
      "Grile pentru Evaluarea Națională la Matematică (clasa a VIII-a): calcul, ecuații, geometrie. Quiz generat din propriile materiale, gratuit, fără cont.",
    h1: "Grile Evaluare Națională — Matematică",
    intro:
      "Exersează pentru Evaluarea Națională la Matematică (clasa a VIII-a): calcul cu numere, ecuații, procente și geometrie plană. Generează grile din propriile materiale sau încearcă exemplele de mai jos.",
    topics: [
      "Numere raționale și reale",
      "Ecuații și inecuații",
      "Procente și rapoarte",
      "Geometrie plană (triunghi, cerc, arii)",
      "Unități de măsură",
    ],
    faq: [
      {
        q: "Sunt potrivite pentru clasa a VIII-a?",
        a: "Da, grilele urmează programa de Evaluare Națională pentru clasa a VIII-a. Poți genera și teste din propriul manual.",
      },
    ],
    sampleQuestions: [
      {
        content: "Cât reprezintă 25% din 200?",
        options: ["25", "40", "50", "75"],
        correctIndex: 2,
        explanation: "25% din 200 = 0,25 · 200 = 50.",
      },
      {
        content: "Soluția ecuației 2x + 6 = 14 este:",
        options: ["x = 2", "x = 4", "x = 6", "x = 8"],
        correctIndex: 1,
        explanation: "2x = 14 − 6 = 8, deci x = 4.",
      },
      {
        content: "Aria unui pătrat cu latura de 5 cm este:",
        options: ["10 cm²", "20 cm²", "25 cm²", "30 cm²"],
        correctIndex: 2,
        explanation: "Aria pătratului = latura² = 5² = 25 cm².",
      },
    ],
  },
  {
    slug: "grile-evaluare-nationala-romana",
    examType: "Evaluare Națională",
    subject: "Limba și literatura română",
    title: "Grile Evaluare Națională Română — teste online | etutor.ro",
    metaDescription:
      "Grile pentru Evaluarea Națională la Limba română (clasa a VIII-a): gramatică, vocabular, comprehensiune. Quiz din propriile materiale, gratuit, fără cont.",
    h1: "Grile Evaluare Națională — Limba și literatura română",
    intro:
      "Pregătește Evaluarea Națională la Limba română: părți de vorbire, ortografie, vocabular și înțelegerea textului. Generează grile din propriile materiale sau exersează mai jos.",
    topics: [
      "Părți de vorbire",
      "Ortografie și punctuație",
      "Vocabular (sinonime, antonime, omonime)",
      "Comprehensiunea textului",
      "Redactarea compunerii",
    ],
    faq: [
      {
        q: "Acoperă gramatica de clasa a VIII-a?",
        a: "Da, grilele includ noțiuni de gramatică și vocabular din programa de Evaluare Națională.",
      },
    ],
    sampleQuestions: [
      {
        content: "Cuvântul „repede” este, din punct de vedere morfologic, un:",
        options: ["Substantiv", "Adjectiv", "Adverb", "Verb"],
        correctIndex: 2,
        explanation: "În „aleargă repede”, cuvântul determină verbul și este adverb.",
      },
      {
        content: "Antonimul cuvântului „vesel” este:",
        options: ["Fericit", "Trist", "Bucuros", "Calm"],
        correctIndex: 1,
        explanation: "Antonimul (sensul opus) al lui „vesel” este „trist”.",
      },
      {
        content: "Forma corectă este:",
        options: ["niciun", "nici-un", "ni-ciun", "niciunu"],
        correctIndex: 0,
        explanation: "Se scrie într-un cuvânt: „niciun”.",
      },
    ],
  },
  {
    slug: "grile-admitere-inm-barou-drept",
    examType: "Admitere",
    subject: "Drept (INM / Barou)",
    title: "Grile Admitere INM și Barou — Drept, teste grilă | etutor.ro",
    metaDescription:
      "Grile pentru admiterea la INM și în Barou: drept civil, penal, procedură. Generează grile din propriile coduri și note de curs. Gratuit, fără cont.",
    h1: "Grile Admitere INM / Barou — Drept",
    intro:
      "Exersează pentru admiterea la Institutul Național al Magistraturii (INM) și în Barou cu grile de Drept. Generează teste din propriile coduri adnotate și note de curs — exact ce facem pentru cursanții noștri de la Drept.",
    topics: [
      "Drept civil",
      "Drept procesual civil",
      "Drept penal",
      "Drept procesual penal",
      "Organizarea sistemului judiciar",
    ],
    faq: [
      {
        q: "Pot genera grile din propriile coduri adnotate?",
        a: "Da — lipești o secțiune din cod sau din notele de curs și AI-ul generează grile din chiar acel text. Ideal pentru recapitulări țintite.",
      },
      {
        q: "Sunt grile actualizate la legislația în vigoare?",
        a: "Grilele generate pornesc de la textul pe care îl furnizezi tu, deci reflectă materialul tău actualizat. Recomandăm să folosești ediția curentă a codurilor.",
      },
    ],
    sampleQuestions: [
      {
        content: "Instituția care organizează formarea inițială a judecătorilor și procurorilor în România este:",
        options: ["CSM", "INM", "ÎCCJ", "Baroul"],
        correctIndex: 1,
        explanation: "Institutul Național al Magistraturii (INM) asigură formarea inițială a magistraților.",
      },
      {
        content: "Persoana admisă în profesia de avocat este membră a:",
        options: ["INM", "CSM", "Baroului", "Curții Constituționale"],
        correctIndex: 2,
        explanation: "Avocații sunt organizați în barouri.",
      },
    ],
  },
];

export function getSubject(slug: string): SubjectLanding | undefined {
  return SUBJECTS.find((s) => s.slug === slug);
}

export function listSubjects(): SubjectLanding[] {
  return SUBJECTS;
}
