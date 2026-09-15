// Oferta eTutor → Poșta Română (OF-2026-0001), versiunea Word v2.
// Sursă de adevăr pentru conținut: modelul .docx al lui Alex + deciziile din 14–15.09
// (prețuri 500/1.300/400, audio/video 7.900 + 9/99 EUR/min, fără exemplul de calcul,
// cursurile demo dezactivate la pornire, raportare scrisă doar cât există azi,
// clauza de anexă, adresa ONRC, eTutor.ro).
// Rulare: NODE_PATH=~/.npm-global/lib/node_modules node build-oferta.js <out.docx>
// Varianta fără comentarii (pentru PDF-ul de citit): NO_COMMENTS=1 node build-oferta.js <out.docx>
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, Header, Footer,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, LevelFormat,
  TableLayoutType, HeadingLevel, CommentRangeStart, CommentRangeEnd, CommentReference,
} = require("docx");

const OUT = process.argv[2] || path.join(__dirname, "oferta-v2.docx");
const MEDIA = path.join(__dirname, "media");
const img = (f) => fs.readFileSync(path.join(MEDIA, f));

// ---------- design tokens ----------
const FONT = "Calibri";
const C = {
  navy: "003B70", ink: "1F2933", gray: "5B6573", grayLight: "8A93A0",
  gold: "F6C900", goldText: "8A6D00", cream: "FFF8D6", panel: "F2F5F8", line: "D9E0E8",
  white: "FFFFFF", green: "0B6B4A", terra: "9C4A17",
};
const PAGE_W = 11906, PAGE_H = 16838, M_LR = 1134, M_T = 1276, M_B = 1134;
const CW = PAGE_W - 2 * M_LR; // 9638 DXA = 17 cm
const S = { body: 21, small: 18, tiny: 16, table: 19, lead: 23 }; // half-points

// ---------- primitives ----------
// keep(fn): every paragraph built inside fn gets "keep with next" — Word then moves a
// small table or a short list to the next page whole instead of splitting it.
let KEEP = 0;
const keep = (fn) => { KEEP++; try { return fn(); } finally { KEEP--; } };
const NO_COMMENTS = process.env.NO_COMMENTS === "1"; // review renders: same layout, no balloons
const run = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
const para = (children, o = {}) =>
  new Paragraph({ children: typeof children === "string" ? [run(children)] : children, ...o, ...(KEEP ? { keepNext: true } : {}) });
const body = (children, o = {}) => para(children, { spacing: { after: 120, line: 276 }, ...o });
const lead = (text, o = {}) =>
  para([run(text, { size: S.lead, color: C.ink })], { spacing: { after: 160, line: 290 }, keepNext: true, ...o });
const h1 = (text, o = {}) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(text)], ...o });
const h2 = (text, o = {}) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run(text)], ...o });
const label = (text, o = {}) =>
  para([run(text.toUpperCase(), { size: S.tiny, bold: true, color: o.color || C.gray, characterSpacing: 10 })], {
    spacing: { after: 40 }, keepNext: true, ...o.p,
  });
const bullet = (children, o = {}) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: typeof children === "string" ? [run(children)] : children,
    spacing: { after: 70, line: 276 },
    ...o,
    ...(KEEP ? { keepNext: true } : {}),
  });
const b = (text, o = {}) => run(text, { bold: true, ...o });

const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const TABLE_NO_BORDERS = { ...NO_BORDERS, insideHorizontal: NONE, insideVertical: NONE };
const hair = (color = C.line, size = 4) => ({ style: BorderStyle.SINGLE, size, color });
const RULED = { ...TABLE_NO_BORDERS, bottom: hair(), insideHorizontal: hair() }; // rows separated by hairlines

function cell(children, o = {}) {
  return new TableCell({
    width: { size: o.w, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    borders: o.borders,
    margins: o.margins || { top: 90, bottom: 90, left: 150, right: 150 },
    verticalAlign: o.vAlign || VerticalAlign.TOP,
    columnSpan: o.span,
    children: Array.isArray(children) ? children : [children],
  });
}
function table(rows, widths, o = {}) {
  return new Table({
    width: { size: widths.reduce((a, x) => a + x, 0), type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: TABLE_NO_BORDERS,
    rows,
    ...o,
  });
}
const row = (cells, o = {}) => new TableRow({ children: cells, cantSplit: true, ...o });
const spacer = (after = 120) => para([run("")], { spacing: { before: 0, after, line: 120 } });

// Callout: cream panel with a gold bar on the left.
function callout(title, children, o = {}) {
  const kids = [];
  if (title) kids.push(label(title, { color: C.goldText }));
  for (const c of children) kids.push(c);
  return table(
    [row([cell(kids, {
      w: CW, fill: o.fill || C.cream,
      borders: { left: { style: BorderStyle.SINGLE, size: 36, color: o.bar || C.gold } },
      margins: { top: 140, bottom: 120, left: 240, right: 240 },
    })])],
    [CW],
  );
}
const cpara = (children, o = {}) => para(typeof children === "string" ? [run(children)] : children, { spacing: { after: 60, line: 276 }, ...o });

// Data table: navy header, zebra rows, hairline separators.
function dataTable(headers, rows, widths, o = {}) {
  const right = new Set(o.right || []);
  const head = row(
    headers.map((h, i) => cell(
      para([run(h.toUpperCase(), { size: S.tiny, bold: true, color: C.white, characterSpacing: 8 })], {
        alignment: right.has(i) ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { after: 0 },
      }),
      { w: widths[i], fill: C.navy, vAlign: VerticalAlign.CENTER, margins: { top: 80, bottom: 80, left: 150, right: 150 } },
    )),
    { tableHeader: true },
  );
  const body = rows.map((r, ri) => row(r.map((v, i) => {
    const content = Array.isArray(v) ? v : [run(v, { size: S.table })];
    return cell(
      para(content, { alignment: right.has(i) ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { after: 0, line: 264 } }),
      {
        w: widths[i], fill: ri % 2 ? C.panel : C.white, vAlign: VerticalAlign.CENTER,
        margins: { top: 72, bottom: 72, left: 150, right: 150 },
      },
    );
  })));
  return table([head, ...body], widths, { borders: RULED });
}

// ---------- comments (open questions for Alex) ----------
const COMMENT_TEXT = [
  "Numele e scris „Palasca”, iar adresa de e-mail „pasasca”. Una dintre ele are o greșeală — care e forma corectă?",
  "Ai decis că cele trei cursuri demo se dezactivează la începutul colaborării. Întrebarea e doar dacă spunem asta clientului în ofertă sau o păstrăm ca notă internă.",
  "În documentul tău scria agregare oficiu → județ → regiune → național. În platformă există azi: pe persoană, pe oficiu, filtrare pe județ și totalul rețelei — nu există agregare pe regiune. Am scris doar ce există. O promitem ca dezvoltare, cu termen?",
  "Grila se oprește la 20.000 de cursanți. Dacă se extinde la toată rețeaua, se poate trece de prag. Adăugăm o treaptă „peste 20.000” (cu preț sau „la cerere”)?",
  "Pe 14.09 am notat „facturare lunară în avans”, dar în documentul tău nu apare „în avans”. Scriem explicit „în avans” (factura la începutul lunii, pe lista de la acea dată)?",
];
const comments = COMMENT_TEXT.map((text, id) => ({
  id, author: "Claude", initials: "CL", date: new Date("2026-09-15T21:00:00+03:00"),
  children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size: 18 })] })],
}));
const withComment = (id, runs) => NO_COMMENTS ? runs : [new CommentRangeStart(id), ...runs, new CommentRangeEnd(id), new TextRun({ children: [new CommentReference(id)] })];

// ---------- header / footer ----------
const logoEtutor = (w) => new ImageRun({ type: "png", data: img("logo-etutor.png"), transformation: { width: w, height: Math.round((w * 95) / 622) }, altText: { title: "eTUTOR.ro", description: "Logo eTUTOR.ro", name: "etutor" } });
const logoPosta = (h) => new ImageRun({ type: "png", data: img("logo-posta.png"), transformation: { width: Math.round((h * 344) / 172), height: h }, altText: { title: "Poșta Română", description: "Logo Poșta Română", name: "posta" } });
const logoKnowhow = (h) => new ImageRun({ type: "png", data: img("logo-knowhow.png"), transformation: { width: Math.round((h * 300) / 105), height: h }, altText: { title: "Know How", description: "Logo Know How Consortium", name: "knowhow" } });

const headerDefault = new Header({
  children: [
    table([row([
      cell(para([logoEtutor(118)], { spacing: { after: 0 } }), { w: CW / 2, vAlign: VerticalAlign.BOTTOM, margins: { top: 0, bottom: 60, left: 0, right: 0 }, borders: { bottom: hair(C.line, 6) } }),
      cell(para([logoPosta(26)], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }), { w: CW / 2, vAlign: VerticalAlign.BOTTOM, margins: { top: 0, bottom: 60, left: 0, right: 0 }, borders: { bottom: hair(C.line, 6) } }),
    ])], [CW / 2, CW / 2]),
  ],
});
const makeFooter = () => new Footer({
  children: [
    table([row([
      cell(para([logoKnowhow(20)], { spacing: { after: 0 } }), { w: 2000, vAlign: VerticalAlign.CENTER, margins: { top: 80, bottom: 0, left: 0, right: 0 }, borders: { top: hair(C.line, 6) } }),
      cell(para([run("Fabulosos SRL · part of Know How Consortium · eTutor.ro", { size: S.tiny, color: C.gray })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }), { w: CW - 4000, vAlign: VerticalAlign.CENTER, margins: { top: 80, bottom: 0, left: 0, right: 0 }, borders: { top: hair(C.line, 6) } }),
      cell(para([new TextRun({ children: ["Pagina ", PageNumber.CURRENT, " din ", PageNumber.TOTAL_PAGES], font: FONT, size: S.tiny, color: C.gray })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }), { w: 2000, vAlign: VerticalAlign.CENTER, margins: { top: 80, bottom: 0, left: 0, right: 0 }, borders: { top: hair(C.line, 6) } }),
    ])], [2000, CW - 4000, 2000]),
  ],
});

// ---------- content ----------
const K = []; // document body

// COVER
K.push(table([row([
  cell(para([logoEtutor(200)], { spacing: { after: 0 } }), { w: CW / 2, vAlign: VerticalAlign.CENTER, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
  cell(para([logoPosta(52)], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }), { w: CW / 2, vAlign: VerticalAlign.CENTER, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
])], [CW / 2, CW / 2]));
K.push(spacer(560));
K.push(para([run("OFERTĂ COMERCIALĂ  ·  NR. OF-2026-0001", { size: S.small, bold: true, color: C.goldText, characterSpacing: 6 })], { spacing: { after: 80 } }));
K.push(para([run("eTutor pentru angajații Poștei Române", { size: 56, bold: true, color: C.navy })], { spacing: { after: 120, line: 240 } }));
K.push(para([run("Abonament de instruire pe telefon — simplu de pornit, ușor de urmărit, fără integrare IT.", { size: 25, color: C.gray })], {
  spacing: { after: 280 }, border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: C.gold, space: 12 } },
}));

const metaCell = (lab, val, w) => cell([label(lab), para([run(val, { size: S.body, bold: true, color: C.ink })], { spacing: { after: 0, line: 264 } })], { w, fill: C.panel, margins: { top: 120, bottom: 120, left: 200, right: 160 } });
const half = CW / 2;
K.push(table([
  row([metaCell("Către", "Compania Națională Poșta Română S.A.", half), metaCell("De la", "Fabulosos SRL · part of Know How Consortium", half)], {}),
  row([metaCell("Întâlnirea de referință", "Vineri, 11 septembrie 2026", half), metaCell("Emisă · valabilă", "15 septembrie 2026 · până la 15 octombrie 2026", half)]),
], [half, half]));
K.push(spacer(200));

K.push(body("În urma întâlnirii din 11 septembrie 2026, în care am prezentat soluția eTutor și cele trei trasee demonstrative, vă transmitem oferta comercială pentru utilizarea platformei în rețeaua Poștei Române."));
K.push(para([run("Participanți din partea Poștei Române: ", { size: S.small, bold: true, color: C.gray })], { spacing: { before: 60, after: 40 }, keepNext: true }));
K.push(bullet(withComment(0, [run("Elisa Palasca — elisa.pasasca@ro.post")]), { spacing: { after: 30 } }));
K.push(bullet("Ioana Marinescu — ioana.marinescu@ro.post", { spacing: { after: 30 } }));
K.push(bullet("Catalin Ciucanu — catalin.ciucanu@ro.post", { spacing: { after: 220 } }));

K.push(callout("Propunerea, într-o frază", [
  para([run("Instruire de 5–7 minute, direct pe telefonul angajatului, cu exercițiu și test, remindere automate pe mai multe canale și raportare pentru management — pe persoană și pe oficiu.", { size: S.lead, color: C.ink })], { spacing: { after: 0, line: 300 } }),
]));
K.push(spacer(160));

K.push(h2("Pe scurt", { spacing: { before: 120, after: 100 } }));
K.push(bullet([b("Fără instalare "), run("și fără integrare cu sistemele Poștei Române.")]));
K.push(bullet([b("Pornire rapidă: "), run("sunt suficiente lista de cursanți — sau un cod comun de acces — și configurarea inițială.")]));
K.push(bullet([b("Prețul depinde doar de numărul de cursanți activi "), run("din lună: de la 3,25 EUR până la 1,50 EUR / cursant / lună, fără TVA.")]));
K.push(bullet([b("Conținutul: "), run("Poșta Română și-l poate scrie și edita oricând, fără cost; Fabulosos poate asista sau poate crea conținut nou, contra cost.")]));
K.push(bullet([b("Cursurile arătate la întâlnire au fost strict demonstrative "), run("(pentru interfață). Nu sunt conținut inclus în abonament.")]));
K.push(bullet([b("Formatul de bază e textul; "), run("audio și video cu prezentator virtual sunt opțiuni în dezvoltare, estimate pentru trimestrul I 2027.")]));
K.push(bullet([b("Raportare pentru management "), run("pe persoană și pe oficiu, cu filtrare pe județ și imaginea întregii rețele.")]));

// 1. SOLUȚIA
K.push(h1("1. Soluția propusă", { pageBreakBefore: true }));
K.push(lead("eTutor mută instruirea din sala de curs în fluxul real de lucru al angajatului: pe telefon, în lecții scurte, cu exercițiu, test și revenire automată asupra celor care rămân în urmă."));

const stepW = Math.floor(CW / 4);
const stepWidths = [stepW, stepW, stepW, CW - 3 * stepW];
const step = (n, title, text, w, i) => cell([
  para([run(n, { size: 30, bold: true, color: C.goldText })], { spacing: { after: 20 } }),
  para([run(title, { size: S.body, bold: true, color: C.navy, characterSpacing: 10 })], { spacing: { after: 40 } }),
  para([run(text, { size: S.small, color: C.ink })], { spacing: { after: 0, line: 252 } }),
], { w, fill: C.panel, margins: { top: 140, bottom: 140, left: 180, right: 140 }, borders: i < 3 ? { right: { style: BorderStyle.SINGLE, size: 36, color: C.white } } : {} });
K.push(table([row([
  step("01", "INTRĂ", "Link personal de unică folosință sau cod comun de acces.", stepWidths[0], 0),
  step("02", "ÎNVAȚĂ", "Lecție de 5–7 minute, pe telefon, fără instalare.", stepWidths[1], 1),
  step("03", "VERIFICĂ", "Exercițiu și test, cu răspuns pe loc.", stepWidths[2], 2),
  step("04", "RECUPEREAZĂ", "Remindere automate dacă lipsește; progresul se vede în raport.", stepWidths[3], 3),
])], stepWidths));

K.push(h2("Accesul cursanților"));
K.push(body("Fiecare cursant primește un link personal de unică folosință, își alege un nume de utilizator și o parolă și intră de pe propriul telefon — fără instalare și fără adresă de e-mail. Dacă nu există o listă nominală, se poate folosi un cod comun de acces, afișat la avizier."));

K.push(h2("Conținutul: cine îl creează"));
K.push(body(withComment(1, [run("Cele trei cursuri prezentate la întâlnirea din 11 septembrie 2026 — factor poștal, lucrător la ghișeu și șef de oficiu, fiecare cu 3 module (lecție + grilă) — au fost strict demonstrative, pentru interfață și experiența cursantului. Nu reprezintă conținut inclus în abonament și vor fi dezactivate la începutul colaborării, ca să nu rămână vizibile cursanților reali.")])));
K.push(body("Conținutul folosit efectiv se stabilește separat, în una dintre cele două variante:", { keepNext: true, spacing: { after: 100 } }));
const optW = [Math.floor(CW / 2), CW - Math.floor(CW / 2)];
const option = (tag, title, lines, w, i) => cell([
  label(tag, { color: i === 0 ? C.green : C.terra }),
  para([run(title, { size: S.body, bold: true, color: C.navy })], { spacing: { after: 60 } }),
  ...lines.map((l) => para([run(l, { size: S.small, color: C.ink })], { spacing: { after: 40, line: 264 } })),
], { w, fill: C.panel, margins: { top: 140, bottom: 120, left: 200, right: 180 }, borders: i === 0 ? { right: { style: BorderStyle.SINGLE, size: 36, color: C.white } } : {} });
K.push(table([row([
  option("Fără cost", "Poșta Română scrie conținutul", [
    "Direct din panoul de administrare, oricând: lecții, grile și teste.",
    "Configurăm accesul în panou la pornire.",
  ], optW[0], 0),
  option("Contra cost", "Fabulosos creează conținutul", [
    "Pornind de la documentele Poștei, cu verificare de către trei evaluatori independenți.",
    "Detalii și prețuri în secțiunea 3.",
  ], optW[1], 1),
])], optW));

K.push(h2("Remindere în cascadă — diferențiatorul eTutor"));
K.push(body("Dacă un cursant nu intră la lecție, platforma îl caută automat, pe rând, pe mai multe canale:", { keepNext: true, spacing: { after: 100 } }));
const chanW = 1700, arrowW = Math.floor((CW - 5 * chanW) / 4);
const chanWidths = [chanW, arrowW, chanW, arrowW, chanW, arrowW, chanW, CW - 5 * chanW - 3 * arrowW, chanW];
const chan = (name, note, free, w) => cell([
  para([run(name, { size: S.small, bold: true, color: C.navy })], { alignment: AlignmentType.CENTER, spacing: { after: 20 } }),
  para([run(note, { size: S.tiny, bold: true, color: free ? C.green : C.terra })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
], { w, fill: free ? "EAF5EF" : "FBEFE6", vAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 90, left: 60, right: 60 } });
const arrow = (w) => cell(para([run("→", { size: 26, bold: true, color: C.grayLight })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }), { w, vAlign: VerticalAlign.CENTER, margins: { top: 0, bottom: 0, left: 0, right: 0 } });
K.push(table([row([
  chan("Notificare pe telefon", "gratuit", true, chanWidths[0]), arrow(chanWidths[1]),
  chan("Telegram", "gratuit", true, chanWidths[2]), arrow(chanWidths[3]),
  chan("E-mail", "gratuit", true, chanWidths[4]), arrow(chanWidths[5]),
  chan("WhatsApp", "cost per mesaj", false, chanWidths[6]), arrow(chanWidths[7]),
  chan("SMS", "cost per mesaj", false, chanWidths[8]),
])], chanWidths));
K.push(spacer(80));
K.push(body([run("Cascada se oprește imediat ce angajatul reia activitatea. Primele trei canale sunt "), b("gratuite și nelimitate"), run("; WhatsApp și SMS se folosesc doar dacă omul nu a reacționat la cele gratuite, cu cel mult un SMS pe zi, și se plătesc per mesaj (vezi 2.4).")]));

K.push(h2("Managementul vede cine rămâne în urmă"));
K.push(body("Sistemul nu doar trimite remindere: rapoartele arată cine a intrat, cine a terminat și unde se greșește, astfel încât managementul își concentrează intervenția acolo unde e nevoie, fără urmărirea manuală a fiecărui angajat.", { keepNext: true }));
keep(() => {
  K.push(bullet([b("Pe persoană: "), run("parcurs, timp, scoruri, greșeli și progres.")]));
  K.push(bullet(withComment(2, [b("Pe oficiu, "), run("cu filtrare pe județ, și imaginea de ansamblu a întregii rețele.")])));
  K.push(bullet([b("Unde se greșește: "), run("temele și întrebările cu cele mai multe răspunsuri greșite.")]));
  K.push(bullet([b("Export "), run("al rapoartelor.")]));
});
K.push(bullet([b("Rapoarte personalizate: "), run("orice raport cerut în primele 60 de zile de abonament se face gratuit; ulterior, contra cost.")], { spacing: { after: 120, line: 276 } }));

K.push(h2("Mesagerie instantanee, separat de cursuri"));
K.push(body("eTutor poate fi folosit și pentru comunicări operative, independent de lecții și teste: fiecare instructor poate trimite mesaje libere — unui singur cursant sau mai multora din echipa sa, deodată — pe canalul ales (aplicație, e-mail, WhatsApp sau SMS). Mesajele WhatsApp și SMS se plătesc per mesaj, ca în secțiunea 2.4."));

// 2. OFERTA FINANCIARĂ
K.push(h1("2. Oferta financiară", { spacing: { before: 400, after: 180 } }));
K.push(lead("Prețul abonamentului depinde exclusiv de numărul de cursanți activi din luna respectivă."));
K.push(h2("2.1 Grila de preț", { spacing: { before: 60, after: 100 } }));
const gridW = [Math.round(CW * 0.6), CW - Math.round(CW * 0.6)];
K.push(keep(() => dataTable(
  ["Număr de cursanți activi în lună", "Preț / cursant / lună, fără TVA"],
  [
    ["până la 3.000", [b("3,25 EUR", { size: S.table })]],
    ["3.001 – 5.000", [b("3,00 EUR", { size: S.table })]],
    ["5.001 – 7.000", [b("2,50 EUR", { size: S.table })]],
    ["7.001 – 10.000", [b("2,00 EUR", { size: S.table })]],
    ["10.001 – 15.000", [b("1,75 EUR", { size: S.table })]],
    [withComment(3, [run("15.001 – 20.000", { size: S.table })]), [b("1,50 EUR", { size: S.table })]],
  ],
  gridW, { right: [1] },
)));

K.push(h2("2.2 Cum se calculează"));
keep(() => {
  K.push(bullet([b("Abonamentul lunar "), run("= numărul de cursanți activi din lună × prețul treptei în care se încadrează acest număr. Prețul treptei se aplică tuturor cursanților activi, nu doar celor de peste prag.")]));
  K.push(bullet([b("Cursant activ "), run("= persoană cu cont creat și acces în luna respectivă. Persoanele scoase din listă nu se mai facturează din luna următoare.")]));
});
K.push(bullet(withComment(4, [b("Factura lunară "), run("se face pe baza listei de cursanți de la data facturii; diferențele se regularizează pe factura lunii următoare.")]), { spacing: { after: 120, line: 276 } }));

K.push(h2("2.3 Ce este inclus în abonament"));
keep(() => {
  K.push(bullet([b("Acces nelimitat la platformă "), run("pentru fiecare cursant activ: lecții scurte, exerciții și teste, pentru fiecare funcție (ghișeu, factor poștal, șef de oficiu etc.).")]));
  K.push(bullet([b("Remindere automate în cascadă; "), run("notificarea pe telefon, Telegram și e-mailul sunt gratuite și nelimitate.")]));
  K.push(bullet([b("Raportare pentru management și export; "), run("rapoarte personalizate gratuit în primele 60 de zile.")]));
  K.push(bullet([b("Mesagerie instantanee "), run("către cursanți.")]));
  K.push(bullet([b("Dreptul Poștei Române de a scrie și edita conținut, "), run("fără cost.")]));
  K.push(bullet([b("Configurarea inițială: "), run("conturile expeditor pentru WhatsApp, e-mail și SMS, importul cursanților din Excel/CSV sau codul comun de acces.")]));
  K.push(bullet([b("Suport "), run("pe e-mail și telefon, în zilele lucrătoare, pentru echipa de HR a Poștei Române implicată în proiect.")]));
});
K.push(bullet([b("Etapa de pornire "), run("(secțiunea 4) se derulează în cadrul abonamentului, fără tarif separat.")], { spacing: { after: 120, line: 276 } }));

K.push(h2("2.4 Ce nu este inclus: mesajele WhatsApp și SMS"));
K.push(body("Costul mesajelor WhatsApp și SMS nu este inclus în abonament. Poșta Română alege una dintre două variante:", { keepNext: true, spacing: { after: 100 } }));
const cmpW = [2150, Math.floor((CW - 2150) / 2), CW - 2150 - Math.floor((CW - 2150) / 2)];
const cmpHead = (t, w, fill) => cell(para([run(t, { size: S.small, bold: true, color: C.white })], { spacing: { after: 0 } }), { w, fill, vAlign: VerticalAlign.CENTER, margins: { top: 90, bottom: 90, left: 150, right: 150 } });
const cmpCell = (runs, w, fill) => cell(para(typeof runs === "string" ? [run(runs, { size: S.table })] : runs, { spacing: { after: 0, line: 264 } }), { w, fill, margins: { top: 90, bottom: 90, left: 150, right: 150 } });
const cmpLabel = (t, w) => cell(para([run(t, { size: S.small, bold: true, color: C.navy })], { spacing: { after: 0, line: 264 } }), { w, fill: C.panel, margins: { top: 90, bottom: 90, left: 150, right: 150 } });
K.push(keep(() => table([
  row([cmpHead("", cmpW[0], C.navy), cmpHead("Varianta A — prin conturile Fabulosos", cmpW[1], C.navy), cmpHead("Varianta B — pe conturile Poștei Române", cmpW[2], C.navy)], { tableHeader: true }),
  row([cmpLabel("Cine plătește furnizorii", cmpW[0]), cmpCell("Fabulosos plătește furnizorii și refacturează lunar, la consum, la prețul plătit — fără adaos.", cmpW[1], C.white), cmpCell("Poșta Română plătește direct furnizorii; noi nu refacturăm nimic per mesaj.", cmpW[2], C.white)]),
  row([cmpLabel("Tarif", cmpW[0]), cmpCell([b("0,30 lei / mesaj WhatsApp ", { size: S.table }), run("(Meta) și ", { size: S.table }), b("0,37 lei / segment SMS ", { size: S.table }), run("(Twilio) — tarifele curente la data ofertei; orice modificare a furnizorilor se comunică în prealabil.", { size: S.table })], cmpW[1], C.white), cmpCell("Tarifele proprii ale furnizorilor, facturate de aceștia direct Poștei Române.", cmpW[2], C.white)]),
  row([cmpLabel("Ce facem noi", cmpW[0]), cmpCell("Trimitem de pe conturile noastre; consumul se vede în panoul de administrare, mesaj cu mesaj.", cmpW[1], C.white), cmpCell("Creăm și configurăm, pe numele Poștei și cu metoda ei de plată, contul WhatsApp Business (Meta) și contul de SMS — inclus. Șabloanele de mesaje se aprobă la Meta, de regulă în 1–2 zile lucrătoare.", cmpW[2], C.white)]),
], cmpW, { borders: RULED })));
K.push(spacer(60));
K.push(body([b("Ordin de mărime: "), run("la o utilizare obișnuită, un cursant primește 0–4 mesaje plătite pe lună. De exemplu, 3.000 de cursanți × 2 mesaje WhatsApp = 1.800 lei pe lună, la cost.")], { spacing: { before: 60, after: 120, line: 284 } }));

// 3. SERVICII OPȚIONALE
K.push(h1("3. Servicii opționale, contra cost", { spacing: { before: 400, after: 180 } }));
K.push(lead("Serviciile de mai jos sunt la cerere; abonamentul funcționează complet și fără ele."));

K.push(h2("3.1 Conținut de curs creat de Fabulosos (text)", { spacing: { before: 60, after: 100 } }));
K.push(body("Scriem lecții și grile pe orice procedură sau temă, pornind de la documentele Poștei Române, cu aceeași metodă folosită la demonstrație.", { keepNext: true }));
K.push(callout("Ce înseamnă termenii", [
  cpara([b("Lecție "), run("= un text de citit în 5–7 minute (circa 500–800 de cuvinte, 3.000–5.000 de caractere), cu replici exacte și exemple din practica Poștei.")]),
  cpara([b("Grilă "), run("= 6–10 întrebări cu câte 4 variante și explicația răspunsului corect.")]),
  cpara([b("Modul "), run("= o lecție împreună cu grila ei.")]),
  cpara([b("Curs "), run("= 3 module + un test final de 10–15 întrebări din toate modulele.")], { spacing: { after: 0, line: 276 } }),
], { fill: C.panel, bar: C.navy }));
K.push(spacer(140));
const priceW = [Math.round(CW * 0.66), CW - Math.round(CW * 0.66)];
K.push(keep(() => dataTable(
  ["Conținut în format text (lecție + grilă)", "Preț, fără TVA"],
  [
    ["Lecție nouă (un modul), verificată și publicată", [b("500 EUR", { size: S.table })]],
    ["Curs nou complet (3 module + test final)", [b("1.300 EUR", { size: S.table })]],
    ["De la 20 de lecții comandate odată", [b("400 EUR / lecție", { size: S.table })]],
  ],
  priceW, { right: [1] },
)));
K.push(spacer(80));
K.push(body([b("Cum lucrăm: "), run("documentare pe materialele Poștei → redactare → verificare de către trei evaluatori independenți → grilă fără indicii de răspuns → o rundă de corecturi cu echipa Poștei → publicare în platformă, gata de trimis cursanților.")], { spacing: { before: 60, after: 100, line: 284 } }));
K.push(body([b("Termen: "), run("5 zile lucrătoare per curs, de la primirea documentației complete. Actualizarea unei lecții deja create, la schimbarea procedurii, rămâne inclusă în abonament.")]));
K.push(body([run("Transformarea unei lecții în audio sau video se tarifează separat — vezi 3.3.", { color: C.gray })]));

K.push(h2("3.2 Traineri pe teme specifice"));
K.push(body("Instruirea de zi cu zi rămâne la dirigenții și șefii direcți; trainerii noștri intervin doar la cerere, pe teme punctuale — de exemplu relația cu clientul la ghișeu, procedurile de curierat și colete sau conducerea oficiului.", { keepNext: true }));
const trW = [Math.round(CW * 0.64), CW - Math.round(CW * 0.64)];
K.push(keep(() => dataTable(
  ["Format", "Preț orientativ, fără TVA"],
  [
    ["Sesiune online · 90 de minute · grupă de până la 25 de persoane", [b("150–200 EUR / sesiune", { size: S.table })]],
    ["Zi de training la sediul Poștei Române · 6 ore · grupă de până la 20 de persoane", [b("600 EUR / zi", { size: S.table }), run(" + deplasare", { size: S.table })]],
    ["Trainer dedicat, lunar · 8 sesiuni online + întrebări între sesiuni", [b("1.300 EUR / lună", { size: S.table })]],
  ],
  trW, { right: [1] },
)));
K.push(spacer(60));
K.push(body([run("Variantele sunt orientative și se stabilesc pentru fiecare proiect.", { color: C.gray })], { spacing: { before: 60, after: 120 } }));

K.push(h2("3.3 Materiale audio și video (în dezvoltare)"));
K.push(body("Lecția rămâne text — merge pe orice telefon și consumă puține date. La cererea Poștei Române dezvoltăm două formate suplimentare, generate direct din textul fiecărei lecții: audio (voce sintetică în limba română) și video cu prezentator virtual și subtitrare. Cursantul alege formatul; progresul și raportarea rămân aceleași."));
K.push(callout(null, [
  para([b("Funcția nu este disponibilă astăzi. ", { color: C.ink }), run("Disponibilitate estimată: trimestrul I 2027. Se contractează prin act adițional, la activare.")], { spacing: { after: 0, line: 276 } }),
]));
K.push(spacer(140));
const avW = [Math.round(CW * 0.62), CW - Math.round(CW * 0.62)];
K.push(keep(() => dataTable(
  ["Element", "Preț, fără TVA"],
  [
    ["Dezvoltare și activare: fluxul de generare, configurarea vocii și a prezentatorului, găzduirea securizată, testul pe trei lecții", [b("7.900 EUR", { size: S.table }), run(", o singură dată", { size: S.table })]],
    ["Audio — voce sintetică în limba română", [b("9 EUR / minut generat", { size: S.table })]],
    ["Video cu prezentator virtual (audio și subtitrare incluse)", [b("99 EUR / minut generat", { size: S.table })]],
    ["Regenerarea unui material după modificarea lecției", [b("50%", { size: S.table }), run(" din tariful de mai sus", { size: S.table })]],
    ["Găzduire și difuzare", [run("incluse până la 3.000 de ore vizionate / lună; peste, ", { size: S.table }), b("0,10 EUR / oră", { size: S.table })]],
  ],
  avW, { right: [1] },
)));
K.push(spacer(80));
K.push(body([b("Cât costă o lecție: "), run("un text de 5–7 minute de citit produce 4–6 minute de material vorbit, adică 36–54 EUR în varianta audio sau 396–594 EUR în varianta video. Materialul se generează din textul deja publicat; conținutul nu se rescrie.")], { spacing: { before: 60, after: 100, line: 284 } }));
K.push(body("Materialele rămân private — acces doar din aplicație, prin linkuri semnate, cu expirare —, sunt stocate pe servere din Uniunea Europeană și se șterg la încetarea contractului."));

// 4. PORNIRE
K.push(h1("4. Propunerea de pornire", { spacing: { before: 400, after: 180 } }));
K.push(lead("Un pilot măsurabil, nu o implementare greoaie: pornim cu procedurile reale ale Poștei Române, testăm pe un eșantion controlat și măsurăm diferența înainte și după."));
const tlW = [900, CW - 900];
const tlStep = (n, title, text, last) => row([
  cell(para([run(n, { size: 30, bold: true, color: C.navy })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }), {
    w: tlW[0], fill: C.gold, vAlign: VerticalAlign.CENTER, margins: { top: 60, bottom: 60, left: 0, right: 0 },
    borders: last ? {} : { bottom: { style: BorderStyle.SINGLE, size: 24, color: C.white } },
  }),
  cell([
    para([run(title, { size: S.body, bold: true, color: C.navy })], { spacing: { after: 30 } }),
    para([run(text, { size: S.small, color: C.ink })], { spacing: { after: 0, line: 264 } }),
  ], { w: tlW[1], fill: C.panel, margins: { top: 120, bottom: 120, left: 220, right: 200 }, borders: last ? {} : { bottom: { style: BorderStyle.SINGLE, size: 24, color: C.white } } }),
]);
K.push(keep(() => table([
  tlStep("1", "Proceduri", "Poșta Română ne transmite una sau mai multe proceduri de start — de exemplu livrare și avizare, gestiune, utilizarea terminalului sau reclamații. Conținutul îl scrie Poșta în panou sau îl creează Fabulosos (secțiunea 3)."),
  tlStep("2", "Validare", "3–5 factori poștali și un diriginte citesc materialul și semnalează ce nu este adevărat sau nu se aplică în practică."),
  tlStep("3", "Pilot", "Un județ și câteva oficii de tipuri diferite; un grup de test și un grup de comparație, pe o perioadă de câteva săptămâni."),
  tlStep("4", "Măsurare", "Comparăm rezultatele și identificăm modulele și temele unde instruirea produce diferența reală.", true),
], tlW)));
K.push(spacer(80));
K.push(body([run("Etapa de pornire se derulează "), b("în cadrul abonamentului"), run(", pentru cursanții activi din acea etapă, fără tarif separat.")], { spacing: { before: 60, after: 120, line: 284 } }));

K.push(h2("Ce avem nevoie de la Poșta Română"));
keep(() => {
  K.push(bullet([b("O procedură de start "), run("(sau mai multe).")]));
  K.push(bullet([b("Lista cursanților din pilot "), run("— nume, funcție, oficiu și număr de telefon, în Excel/CSV — sau, fără listă, un cod comun de acces afișat la avizier.")]));
});
K.push(bullet([b("Dacă preferați să scrieți intern conținutul, "), run("vă configurăm accesul în panoul de administrare și vă putem asista în structurarea materialelor.")], { spacing: { after: 120, line: 276 } }));

K.push(h2("Rezultatul urmărit"));
K.push(body("Nu propunem o platformă care doar livrează cursuri, ci un canal permanent pentru instruire, revenire automată asupra celor care rămân în urmă, măsurarea rezultatelor și, la nevoie, comunicare instantanee către rețea."));

// 5. CONDIȚII
K.push(h1("5. Condiții comerciale și conformitate", { spacing: { before: 360, after: 200 } }));
const termW = [2300, CW - 2300];
const term = (lab, runs) => row([
  cell(para([run(lab, { size: S.small, bold: true, color: C.navy })], { spacing: { after: 0, line: 264 } }), { w: termW[0], margins: { top: 110, bottom: 110, left: 0, right: 150 } }),
  cell(para(typeof runs === "string" ? [run(runs, { size: S.table })] : runs, { spacing: { after: 0, line: 272 } }), { w: termW[1], margins: { top: 110, bottom: 110, left: 150, right: 0 } }),
]);
K.push(keep(() => table([
  term("Prețuri și TVA", "Prețurile sunt exprimate în EUR (abonament și servicii opționale) sau în lei (mesaje WhatsApp și SMS) și nu includ TVA. TVA 21% se adaugă conform legii."),
  term("Facturare și plată", "Facturare lunară, în lei, la cursul BNR din ziua facturii. Termen de plată: 30 de zile."),
  term("Durată și încetare", "Abonament lunar, cu o perioadă contractuală minimă de 6 luni. Încetarea se poate face cu un preaviz de 45 de zile. La suspendare, datele nu se șterg."),
  term("Date personale", "Pentru angajații Poștei Române, operatorul datelor este Poșta Română. Fabulosos SRL prelucrează datele în numele Poștei, pe baza unui acord de prelucrare (art. 28 GDPR) semnat odată cu contractul. Datele se șterg la încetarea contractului sau la cerere."),
  term("Valabilitate", "Oferta este valabilă 30 de zile de la emitere, până la 15 octombrie 2026. Contractul și acordul de prelucrare se semnează după acceptare."),
  term("Anexa 1", [run("Prezentarea eTutor pentru Poșta Română (eTutor.ro/posta, versiunea din 11 septembrie 2026): descrierea produsului și a fluxului de la listă la raport. Cursurile arătate acolo sunt strict demonstrative. ", { size: S.table }), b("Anexa descrie produsul; prețurile și condițiile comerciale sunt cele din prezenta ofertă. ", { size: S.table }), run("Etapa de pornire descrisă în anexă se derulează conform secțiunii 4.", { size: S.table })]),
], termW, { borders: RULED })));

K.push(spacer(300));
K.push(body("Vă mulțumim pentru întâlnirea din 11 septembrie 2026 și pentru discuția aplicată despre felul în care eTutor poate fi folosit în rețeaua Poștei Române — pentru instruire, implicarea cursanților și comunicare operativă.", { keepNext: true, spacing: { after: 200, line: 284 } }));
K.push(table([row([cell([
  label("Contact", { color: C.goldText }),
  para([run("Alex Dănciulescu", { size: 24, bold: true, color: C.navy })], { spacing: { after: 30 }, keepNext: true }),
  para([run("Fabulosos SRL · part of Know How Consortium", { size: S.body, color: C.ink })], { spacing: { after: 30 }, keepNext: true }),
  para([run("office@eTutor.ro  ·  +40 712 383 492", { size: S.body, bold: true, color: C.ink })], { spacing: { after: 30 }, keepNext: true }),
  para([run("Str. Valea Oltului nr. 8, bl. A5, sc. C, et. 1, ap. 36, Sector 6, București", { size: S.small, color: C.gray })], { spacing: { after: 20 }, keepNext: true }),
  para([run("CUI RO33968578  ·  Reg. Com. J2015000297404", { size: S.small, color: C.gray })], { spacing: { after: 0 } }),
], { w: CW, fill: C.panel, borders: { left: { style: BorderStyle.SINGLE, size: 36, color: C.navy } }, margins: { top: 160, bottom: 160, left: 260, right: 200 } })])], [CW]));

// ---------- document ----------
const doc = new Document({
  creator: "Fabulosos SRL",
  title: "Ofertă comercială eTutor — Poșta Română (OF-2026-0001)",
  description: "Abonament de instruire pe telefon pentru angajații Poștei Române",
  ...(NO_COMMENTS ? {} : { comments: { children: comments } }),
  styles: {
    default: { document: { run: { font: FONT, size: S.body, color: C.ink }, paragraph: { spacing: { after: 120, line: 276 } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 34, bold: true, color: C.navy },
        paragraph: { spacing: { before: 0, after: 200 }, keepNext: true, keepLines: true, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.gold, space: 8 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 25, bold: true, color: C.navy },
        paragraph: { spacing: { before: 300, after: 100 }, keepNext: true, keepLines: true, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { run: { color: C.navy, bold: true }, paragraph: { indent: { left: 300, hanging: 220 } } } }],
    }],
  },
  sections: [{
    properties: {
      titlePage: true,
      page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: M_T, right: M_LR, bottom: M_B, left: M_LR, header: 567, footer: 454 } },
    },
    headers: { first: new Header({ children: [new Paragraph({ children: [] })] }), default: headerDefault },
    footers: { first: makeFooter(), default: makeFooter() },
    children: K,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("wrote", OUT, buf.length, "bytes");
});
