#!/usr/bin/env node
/**
 * import-exam-ro-bac-batch.mjs — 11 BAC RO full ExamPapers (Simulări) — proba E.a, real/tehnologic.
 *
 * Completes the BAC Simulări set (the 2025 model + simulare already exist as their own scripts).
 * Each paper: Subiectul I (text + A 5 itemi 30p + B argumentativ 20p) + Subiectul al II-lea (10p,
 * comentariu/notații/perspectivă pe un fragment) + Subiectul al III-lea (eseu 30p). 90+10=100.
 * All items OPEN/SHORT (self-score). Bareme ground-truth: A per-item (verbatim din barem), B/II/III
 * = baremul-standard oficial (identic pe toate lucrările). The Subiectul I supporting text is
 * REUSED from the already-imported grile rows (`bac-grile:<year>-<variant>%`) — single source, no
 * duplication. examType=BAC, grade 12 → apare în Simulări sub „Bacalaureat / Limba și literatura
 * română / <an>". Idempotent (upsert paper by unique key + replace items/passages).
 *
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL din env (VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

// ─── Standard official bareme (identice pe toate lucrările BAC) ───
const B_RUBRIC = [
  { label: "Conținut", points: 14, answer: "Formularea unei opinii – 1p; câte 2p pentru enunțarea fiecăruia dintre cele două argumente (2×2=4p); câte 2p pentru dezvoltarea fiecărui argument (2×2=4p); valorificarea textului în dezvoltarea oricărui argument – 3p / simpla citare – 1p, plus raportarea la experiența personală sau culturală – 1p (3p+1p=4p); formularea unei concluzii pertinente – 1p." },
  { label: "Redactare", points: 6, answer: "Utilizarea corectă a conectorilor – 2p; respectarea normelor limbii literare – 1p; ortografie și punctuație – 1p; așezarea în pagină, lizibilitatea – 1p; respectarea numărului minim de cuvinte (150) – 1p. Doar dacă textul dezvoltă subiectul." },
];
const II_RUBRIC = [
  { label: "Conținut", points: 6, answer: "Numirea/identificarea aspectului cerut (idee poetică / rol al notațiilor autorului / perspectivă narativă / modalități de caracterizare) – 2p; prezentare/comentare adecvată și nuanțată – 4p / ezitantă – 2p / simplă precizare – 1p." },
  { label: "Redactare", points: 4, answer: "Utilizarea limbii literare – 1p; logica înlănțuirii ideilor – 1p; ortografia – 1p; punctuația – 1p. Doar dacă răspunsul are minimum 50 de cuvinte și dezvoltă subiectul." },
];
const III_RUBRIC = [
  { label: "Conținut", points: 18, answer: "Câte 6 puncte pentru fiecare dintre cele trei repere/cerințe din enunț (3×6=18p)." },
  { label: "Redactare", points: 12, answer: "Existența părților componente (introducere, cuprins, încheiere) – 1p; logica înlănțuirii ideilor – 1p; abilități de analiză și argumentare – 3p; utilizarea limbii literare – 2p; ortografia – 2p; punctuația – 2p; așezarea în pagină, lizibilitatea – 1p. Doar dacă eseul are minimum 400 de cuvinte și dezvoltă subiectul." },
];

// helper: A item (SHORT/OPEN, 6p, passage-dependent)
const a = (label, content, answer, type = "SHORT") => ({ section: "I.A", label, type, points: 6, content, rubric: [{ label: "barem", points: 6, answer }] });
const bItem = (content) => ({ section: "I.B", label: "B", type: "OPEN", points: 20, content, rubric: B_RUBRIC });
const iiItem = (content) => ({ section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 10, content, rubric: II_RUBRIC });
const iiiItem = (content) => ({ section: "Subiectul al III-lea", label: "III", type: "OPEN", points: 30, content, rubric: III_RUBRIC });

const PAPERS = [
  {
    year: 2025, variant: "var-06", title: "Ion Pillat (în vol. „Scriitori care au devenit amintiri”)", author: "Virgil Carianopol",
    items: [
      a("A.1", "Indică sensul din text al cuvântului glorie și al secvenței din nou.", "Sensul cuvântului (de exemplu: faimă) – 2p + al secvenței (de exemplu: iarăși) – 2p; răspuns în enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează numele celor doi traducători ai poeziilor lui Francis Jammes, utilizând informațiile din textul dat.", "Cei doi traducători (Ion Pillat și N. I. Herescu) – 2p+2p; răspuns în enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează o pasiune a scriitorului Ion Pillat, justificându-ți răspunsul cu o secvență semnificativă din textul dat.", "Precizarea unei pasiuni (de exemplu: călătoria) – 2p; justificare cu secvență – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică motivul pentru care Virgil Carianopol cumpără volumul „Scrisori către Plante”.", "Precizarea motivului (de exemplu: pentru a-l oferi lui Ion Pillat) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, opinia lui Ion Pillat despre traduceri, așa cum reiese din textul dat.", "Precizarea opiniei (de exemplu: traducerile sunt necesare) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă relațiile interumane sunt influențate sau nu de existența unor preocupări comune, raportându-te atât la informațiile din fragmentul extras din volumul „Scriitori care au devenit amintiri” de Virgil Carianopol, cât și la experiența personală sau culturală."),
      iiItem(
        "Prezintă, în minimum 50 de cuvinte, rolul notațiilor autorului în fragmentul de mai jos.\n\n" +
        "ACTUL II\n\n" +
        "După o lună de la acțiunea primului act. E tot o duminică, spre dimineață, și pe fereastră se vede, în decorul cunoscut, toamna de octombrie. Interiorul casei lui Manole e mult schimbat. [...] Încăperea, ca aspect general, are acum un aer de sărăcie, de pustiu [...]. La ridicarea cortinei, Manole se plimbă prin încăpere, cu mâinile la spate, adâncit în importanța lucrului pe care îl face. [...] Manole dictează la roman. Maria, așezată la biroul obișnuit [...], așteaptă cu tocul atent, dar cu gândurile ei personale duse dincolo de manuscris, dincolo de oraș și parcă de lume.\n" +
        "Câteva clipe de pauză. Manole se plimbă, Maria așteaptă.\n" +
        "MANOLE (care [...] are cugetul greu din cauza Mariei [...], se oprește în fața ei și, văzând că se gândește „departe”, zice cu blândețe): Ai ostenit?\n" +
        "(Tudor Mușatescu, „Trenurile mele”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unui text narativ studiat, aparținând lui Marin Preda.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea textului narativ studiat într-o perioadă, într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două episoade/secvențe semnificative pentru tema textului narativ studiat;\n" +
        "– analiza a două elemente de structură, de compoziție și/sau de limbaj, relevante pentru textul narativ studiat."),
    ],
  },
  {
    year: 2025, variant: "var-07", title: "Părintele „Geticei”", author: "Grigore Băjenaru",
    items: [
      a("A.1", "Indică sensul din text al cuvântului prielnic și al secvenței pe timpuri.", "Sensul cuvântului (de exemplu: favorabil) – 2p + al secvenței (de exemplu: odinioară) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează o caracteristică a profesorilor la al căror curs de inaugurare sălile erau pline, valorificând textul dat.", "Menționarea unei caracteristici (de exemplu: talentul oratoric, competența profesională) – 4p; enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează momentul zilei în care are loc cursul de inaugurare susținut de Vasile Pârvan, justificându-ți răspunsul cu o secvență din text.", "Precizarea momentului (de exemplu: la asfințit) – 2p; justificare cu secvență – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică un motiv pentru care Vasile Pârvan face referire la originea numelui său.", "Precizarea motivului (de exemplu: pentru a capta atenția) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, atmosfera din sala „Odobescu”, de dinaintea începerii cursului susținut de Vasile Pârvan, așa cum reiese din textul dat.", "Precizarea atmosferei (de exemplu: animată) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă înfățișarea unei persoane poate influența sau nu succesul acesteia, raportându-te atât la informațiile din textul „Părintele «Geticei»” de Grigore Băjenaru, cât și la experiența personală sau culturală."),
      iiItem(
        "Prezintă, în minimum 50 de cuvinte, rolul notațiilor autorului în fragmentul de mai jos.\n\n" +
        "ACTUL I, TABLOUL I\n\n" +
        "Încăpere strâmtă, săracă, dar curată, în casa curelarului Ion Sorcovă. În mijloc, ușă deschisă: se văd poarta și strada [...]. În dreapta ușii, fereastră cu perdele albe și mușcate roșii. [...] E în amurg și ultimele raze ale soarelui împurpurează perdelele albe. [...]\n" +
        "SCENA II — SORCOVĂ, NASTASIA, VULPAȘIN\n" +
        "VULPAȘIN (s-a oprit în prag, sfielnic, se descoperă; e în cămașă, cu mânecile sumese și palmele murdare [...]; dând cu ochii de Nastasia, tresare și coboară privirea): Bună seara! (Nu știe ce să facă cu pălăria.)\n" +
        "NASTASIA (s-a întunecat, nemulțumire).\n" +
        "SORCOVĂ: Noroc, Vulpașine!\n" +
        "VULPAȘIN (încearcă surâs și se apropie de Nastasia cu mâna întinsă): Îmi pare bine că te văd!\n" +
        "NASTASIA (îi întoarce spatele și iese, trântind ușa).\n" +
        "(G.M. Zamfirescu, „Domnișoara Nastasia”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități de construcție a unui personaj într-un text narativ studiat, aparținând lui Ion Creangă sau lui Ioan Slavici.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– prezentarea statutului social, psihologic, moral etc. al personajului ales;\n" +
        "– evidențierea unei trăsături a personajului ales, prin două episoade/secvențe comentate;\n" +
        "– analiza a două elemente de structură, de compoziție și/sau de limbaj ale textului narativ studiat, relevante pentru construcția personajului ales."),
    ],
  },
  {
    year: 2025, variant: "var-08", title: "Pribeag în țara mea. Sub mască. Memorii", author: "Nichifor Crainic",
    items: [
      a("A.1", "Indică sensul din text al cuvântului arătoasă și al secvenței băga în groază.", "Sensul cuvântului (de exemplu: frumoasă) – 2p + al secvenței (de exemplu: înspăimânta) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează vocația pe care și-o descoperă Nichifor Crainic în timpul șederii la familia care îl găzduiește, utilizând informațiile din textul dat.", "Menționarea vocației (de exemplu: vocația de bucătar) – 4p; enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează reacția părinților la schimbarea comportamentului copilului la micul-dejun, justificându-ți răspunsul cu o secvență semnificativă din text.", "Precizarea reacției (de exemplu: se amuză) – 2p; justificare cu secvență (de exemplu: „spre hazul părinților”) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică un motiv pentru care băiatul obișnuiește să plece de acasă.", "Precizarea motivului (de exemplu: lipsa partenerilor de joacă) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, o trăsătură morală a lui Nichifor Crainic, așa cum reiese din textul dat.", "Precizarea trăsăturii (de exemplu: altruism, hărnicie) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă experiențele din copilărie influențează sau nu comportamentul unei persoane, raportându-te atât la informațiile din fragmentul extras din volumul „Pribeag în țara mea. Sub mască. Memorii” de Nichifor Crainic, cât și la experiența personală sau culturală."),
      iiItem(
        "Comentează, în minimum 50 de cuvinte, textul de mai jos, evidențiind relația dintre ideea poetică și mijloacele artistice.\n\n" +
        "Copilărie crudă, tot raiul tău uitat:\n" +
        "Un car purtând recolta grădinilor în el,\n" +
        "Re'nvii deplină iarăși, ca-n arcul de oțel\n" +
        "Al unui orologiu stârnind, când sferturi bat,\n" +
        "Un timp ce nu-l încape cadranul său rotat.\n\n" +
        "Imagini migratoare, în stol foșnind aripi,\n" +
        "Întoarse dintr-al undei fior în ochiul clar,\n" +
        "Cum steaua roabă pietrei se mântuie-n amnar,\n" +
        "Fiți doar secunda primă ce, ștearsă de pe chip,\n" +
        "Egal se contopește în ceasul de nisip.\n" +
        "(Miron Radu Paraschivescu, „Copilărie”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități de construcție a unui personaj într-un roman interbelic studiat.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– prezentarea statutului social, psihologic, moral etc. al personajului ales;\n" +
        "– evidențierea unei trăsături a personajului ales, prin două episoade/secvențe comentate;\n" +
        "– analiza a două elemente de structură, de compoziție și/sau de limbaj ale romanului studiat, relevante pentru construcția personajului ales."),
    ],
  },
  {
    year: 2024, variant: "model", title: "Scrietor (în vol. „Amintiri”)", author: "Ioan Slavici",
    items: [
      a("A.1", "Indică sensul din text al cuvântului totdeauna și al secvenței nu eram în stare.", "Sensul cuvântului (de exemplu: mereu) – 2p + al secvenței (de exemplu: nu puteam) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează denumirea publicațiilor pe care le-a condus Ioan Slavici, utilizând informațiile din textul dat.", "Menționarea publicațiilor (Tribuna, Minerva) – 2p+2p; enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează numele unei personalități culturale care l-a influențat pe Ioan Slavici, justificându-ți răspunsul cu o secvență semnificativă din textul dat.", "Precizarea numelui (de exemplu: Eminescu) – 2p; justificare cu secvență – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică motivul pentru care Ioan Slavici se consideră împlinit mai ales prin activitatea sa didactică.", "Precizarea motivului (de exemplu: are ocazia de a le oferi altora învățături) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, o trăsătură a lui Ioan Slavici, așa cum reiese din textul dat.", "Precizarea trăsăturii (de exemplu: sinceritate, sensibilitate, spirit contradictoriu) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă procesul creației trebuie sau nu să fie influențat de așteptările publicului, raportându-te atât la informațiile din textul „Scrietor”, extras din volumul „Amintiri” de Ioan Slavici, cât și la experiența personală sau culturală."),
      iiItem(
        "Comentează, în minimum 50 de cuvinte, textul de mai jos, evidențiind relația dintre ideea poetică și mijloacele artistice.\n\n" +
        "Același freamăt trece-n crâng,\n" +
        "Aceleași ape-n văi se frâng,\n" +
        "Căzând din stâncă-n stâncă,\n\n" +
        "Același a rămas și-acum\n" +
        "Conacu-n margine de drum,\n" +
        "În liniște adâncă.\n\n" +
        "Deasupra lui pier stoluri-stol\n" +
        "Pribegii nori pe cerul gol,\n" +
        "Și-n nopțile cu lună\n\n" +
        "Ca ieri alături amândoi\n" +
        "Stam ascultând glas de cimpoi\n" +
        "Din munți în munți cum sună...\n" +
        "(Ion Pillat, „Același freamăt”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unui text dramatic postbelic studiat.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea textului dramatic postbelic studiat într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două scene/secvențe relevante pentru tema textului dramatic postbelic studiat;\n" +
        "– analiza a două componente de structură și/sau de limbaj, semnificative pentru textul dramatic postbelic studiat."),
    ],
  },
  {
    year: 2024, variant: "simulare", title: "Metropole", author: "Liviu Rebreanu",
    items: [
      a("A.1", "Indică sensul din text al cuvântului sforțări și al secvenței la fiece pas.", "Sensul cuvântului (de exemplu: eforturi) – 2p + al secvenței (de exemplu: pretutindeni) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează soluția găsită de persoanele interesate de lectură, care nu au posibilitatea să-și cumpere cărți, utilizând informațiile din textul dat.", "Menționarea soluției (de exemplu: lectura în librărie) – 4p; enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează un efect al creșterii interesului față de sport în spațiul românesc, justificându-ți răspunsul cu o secvență semnificativă din textul dat.", "Precizarea unui efect (de exemplu: dezvoltarea jurnalismului sportiv) – 2p; justificare cu secvență – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică un motiv pentru care tejghelele librăriilor din Paris sunt amplasate până în mijlocul trotuarului.", "Precizarea motivului (de exemplu: pentru a atrage atenția trecătorilor) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, relația dintre jurnaliștii francezi și scriitori, așa cum reiese din textul dat.", "Precizarea relației (de exemplu: relație de colegialitate, respect) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă presa contribuie sau nu la formarea gustului artistic al publicului, raportându-te atât la informațiile din fragmentul extras din volumul „Metropole” de Liviu Rebreanu, cât și la experiența personală sau culturală."),
      iiItem(
        "Prezintă, în minimum 50 de cuvinte, rolul notațiilor autorului în fragmentul de mai jos.\n\n" +
        "SCENA III — NASTASIA, ION SORCOVĂ\n" +
        "NASTASIA (schimbare, veselie nervoasă, neliniște; umblă de colo până colo și caută): N-ai văzut oglinda?\n" +
        "SORCOVĂ (pe pat și se uită îngândurat la ea).\n" +
        "NASTASIA: Parcă era la fereastră, adineauri.\n" +
        "SORCOVĂ (gest: o fi fost...).\n" +
        "NASTASIA (își aduce aminte și caută, grabnic, în cutia mesei): Uite-o! (Se privește în oglindă [...] iar se uită în oglindă și se întristează.) Nu-i așa că m-am urâțit? Și-am îmbătrânit, m-am zbârcit la ochi...\n" +
        "SORCOVĂ (tace).\n" +
        "NASTASIA (îl privește): De ce taci? Vreau să fiu frumoasă! Vine Vulpașin și vreau să fiu frumoasă! Ce te uiți așa la mine? (Râs chinuit.)\n" +
        "(George Mihail-Zamfirescu, „Domnișoara Nastasia”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unui text poetic studiat, aparținând lui Lucian Blaga.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea textului poetic într-o perioadă, într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două imagini/idei poetice relevante pentru tema textului poetic;\n" +
        "– analiza a două elemente de compoziție și/sau de limbaj, semnificative pentru textul poetic (de exemplu: titlu, incipit, relații de opoziție și de simetrie, motive poetice, figuri semantice, elemente de prozodie etc.)."),
    ],
  },
  {
    year: 2024, variant: "var-02", title: "O vizită la Tudor Arghezi (în vol. „Amintiri și portrete literare”)", author: "Gabriel Dimisianu",
    items: [
      a("A.1", "Indică sensul din text al secvenței pe neașteptate și al cuvântului împrejurare.", "Sensul secvenței (de exemplu: deodată) – 2p + al cuvântului (de exemplu: circumstanță) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează numele revistei la care lucrează Andriana Fianu, utilizând informațiile din textul dat.", "Menționarea revistei (Gazeta literară) – 4p; enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează modul în care Gabriel Dimisianu își propune să se comporte în timpul vizitei la Tudor Arghezi, justificându-ți răspunsul cu o secvență semnificativă din textul dat.", "Precizarea modului (de exemplu: își propune să rămână tăcut) – 2p; justificare cu secvență (de exemplu: „Voi fi ochi și urechi, dar mut”) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică motivul pentru care Gabriel Dimisianu este surprins când Tudor Arghezi intră în cameră.", "Precizarea motivului (de exemplu: vioiciunea manifestată de Arghezi) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, o trăsătură morală a lui Gabriel Dimisianu, care se desprinde din textul dat.", "Precizarea trăsăturii (de exemplu: emotivitate, timiditate) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă emoțiile influențează sau nu sinceritatea exprimării, raportându-te atât la informațiile din fragmentul extras din volumul „Amintiri și portrete literare” de Gabriel Dimisianu, cât și la experiența personală sau culturală."),
      iiItem(
        "Prezintă, în minimum 50 de cuvinte, rolul notațiilor autorului în fragmentul de mai jos.\n\n" +
        "ACTUL I\n\n" +
        "O cameră simplu mobilată. [...] În stânga, lângă perete, o etajeră cu volume legate frumos și frumos orânduite. [...] În dreapta, planul întâi, camera domnului Chirică. [...] În fund, un mic vestibul cu geamlâc.\n" +
        "Nichita și Varlam se zăresc în geamlâcul vestibulului. Varlam deschide și îi face loc lui Nichita. Amândoi își agață pălăriile în cuier.\n" +
        "NICHITA: Sunt tare curios să-l văd la față.\n" +
        "VARLAM: E neschimbat ca înfățișare, atâta doar, că anii i-au cam pungit obrajii. (Oprindu-se în prag.) Să știi că nu-i acasă.\n" +
        "NICHITA: Ce te face să crezi?\n" +
        "VARLAM: Dacă nu-i în colțișorul lui (arată biroul), slabă nădejde să fie... (Deschide ușa din dreapta, dispare o clipă, apoi se întoarce.) Nu-i.\n" +
        "(Gh. Ciprian, „Omul cu mârțoaga”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unei nuvele studiate.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea nuvelei studiate într-o perioadă, într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două episoade/secvențe semnificative pentru tema nuvelei studiate;\n" +
        "– analiza a două elemente de structură, de compoziție și/sau de limbaj, relevante pentru nuvela studiată."),
    ],
  },
  {
    year: 2024, variant: "var-04", title: "Cu scriitorii prin veac (interviu cu I. Al. Brătescu-Voinești)", author: "I. Valerian",
    items: [
      a("A.1", "Indică sensul din text al cuvântului pildă și al secvenței din când în când.", "Sensul cuvântului (de exemplu: model, exemplu) – 2p + al secvenței (de exemplu: uneori) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează durata evenimentului în cadrul căruia a fost sărbătorit I. Al. Brătescu-Voinești, utilizând informațiile din textul dat.", "Menționarea duratei (o săptămână) – 4p; enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează un rol pe care tâmplăria îl are în ansamblul preocupărilor lui I. Al. Brătescu-Voinești, justificându-ți răspunsul cu o secvență semnificativă din textul dat.", "Precizarea unui rol (de exemplu: de relaxare) – 2p; justificare cu secvență – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică motivul pentru care I. Al. Brătescu-Voinești consideră potrivită sărbătorirea scriitorilor.", "Precizarea motivului (de exemplu: recunoașterea rolului scriitorilor în societate) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, o trăsătură morală a lui I. Al. Brătescu-Voinești, așa cum reiese din textul dat.", "Precizarea trăsăturii (de exemplu: modestia) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă activitățile în natură influențează sau nu stările sufletești, raportându-te atât la informațiile din fragmentul extras din volumul „Cu scriitorii prin veac”, cât și la experiența personală sau culturală."),
      iiItem(
        "Prezintă, în minimum 50 de cuvinte, perspectiva narativă din fragmentul de mai jos.\n\n" +
        "Aproape de sfârșitul lunii, într-o zi când iar n-a găsit pe Dandu la întâlnirea fixată [...], Liana s-a suit în tramvai și a pornit spre casă. Se uita distrată, din fereastra vagonului, la forfoteala lumii pe Calea Victoriei și pe bulevard. Deodată, în furnicarul de oameni de pe trotuarul cinematografelor, i se păru că zărește pe Dandu cu o femeie... Întoarse capul să se uite mai bine, dar tramvaiul gonea clopoțind furios și coroanele castanilor acoperiră grupul în care a zărit pălăria cafenie [...]. Vru să se dea jos la stația din Brezoianu, să alerge, să se convingă. Vagonul era arhiplin [...].\n" +
        "„O, dacă asta e la mijloc!”, își zicea mereu Liana nemaivăzând nimic până acasă, deși îi privea fix pe trecătorii de pe trotuare, parc-ar fi așteptat să mai apară pălăria cafenie...\n" +
        "(Liviu Rebreanu, „Jar”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unui text poetic studiat, aparținând lui Mihai Eminescu sau lui George Bacovia.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea textului poetic ales într-o perioadă, într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două imagini/idei poetice relevante pentru tema textului poetic ales;\n" +
        "– analiza a două elemente de compoziție și/sau de limbaj, semnificative pentru textul poetic ales."),
    ],
  },
  {
    year: 2024, variant: "var-09", title: "Amintiri", author: "Mihail Șerban",
    items: [
      a("A.1", "Indică sensul din text al secvenței în stare și al cuvântului oaspete.", "Sensul secvenței (de exemplu: capabil) – 2p + al cuvântului (de exemplu: musafir) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează două indicii prin care Sadoveanu le sugera celorlalți că vorbesc prea mult, utilizând informațiile din textul dat.", "Menționarea a două indicii (de exemplu: privea pe fereastră, se uita la ceas) – 2p+2p; enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează atitudinea lui Sadoveanu în momentul plecării publicistului, justificându-ți răspunsul cu o secvență semnificativă din textul dat.", "Precizarea atitudinii (de exemplu: bunăvoință) – 2p; justificare cu secvență (de exemplu: „i-a zis Sadoveanu zâmbind, întinzându-i mâna cu prietenie”) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică motivul pentru care publicistul se oprește brusc din vorbit.", "Precizarea motivului (de exemplu: intervenția lui Mihail Sadoveanu) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, o stare manifestată de Constantin Mitru în timp ce vorbește prietenul lui Sadoveanu, așa cum reiese din textul dat.", "Precizarea stării (de exemplu: nerăbdare) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă vorbitul excesiv este sau nu o dovadă de impolitețe, raportându-te atât la informațiile din textul „Amintiri” de Mihail Șerban, cât și la experiența personală sau culturală."),
      iiItem(
        "Prezintă, în minimum 50 de cuvinte, perspectiva narativă din fragmentul de mai jos.\n\n" +
        "Tăcură amândoi câteva clipe fără să se privească. Simțeau amândoi că-i desparte un zid și că nu se vor putea înțelege [...].\n" +
        "Apoi se despărțiră ca doi străini. Își dădură mâna, își urară noroc, iar David îi zise la revedere [...], ca și când ar fi vorbit cu oricare din camarazii ceilalți [...]. Rămase pe loc și se uită lung în urma lui Oprișor, care mergea cu capul sus, legănându-și puțin corpul și tăind aerul cu o cravașă moale, foarte liniștit și nepăsător. Privindu-l, David se pomeni că-l invidiază.\n" +
        "„Iată un om fericit care știe ce are să facă!” se gândi dânsul [...].\n" +
        "(Liviu Rebreanu, „Catastrofa”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unui text dramatic studiat.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea textului dramatic studiat într-o perioadă, într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două scene/secvențe relevante pentru tema textului dramatic studiat;\n" +
        "– analiza a două componente de structură și/sau de limbaj, semnificative pentru textul dramatic studiat."),
    ],
  },
  {
    year: 2023, variant: "var-01", title: "Însemnările mele", author: "Maria Banuș",
    items: [
      a("A.1", "Indică sensul din text al secvenței vrute și nevrute.", "Sensul secvenței (de exemplu: fleacuri/nimicuri) – 4p; enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează instrumentul muzical la care cânta Maria Banuș când era elevă, utilizând informațiile din textul dat.", "Menționarea instrumentului (pianul) – 4p; enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează atitudinea Mariei Banuș față de Bubi, justificându-ți răspunsul cu o secvență semnificativă din textul dat.", "Precizarea atitudinii (de exemplu: respingere) – 2p; justificare cu secvență (de exemplu: „Când mă gândesc că o să vină Bubi la București mi se face rău.”) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică motivul pentru care, aflată la patinaj, eleva Maria Banuș se simte diferită de ceilalți.", "Precizarea motivului (de exemplu: crede că toți sunt mai fericiți decât ea/îi este frică) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, o trăsătură morală a Mariei Banuș, așa cum reiese din primul paragraf al textului dat.", "Precizarea trăsăturii (de exemplu: spirit critic, emotivitate) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă emoțiile influențează sau nu comportamentul unei persoane, raportându-te atât la informațiile din fragmentul extras din volumul „Însemnările mele” de Maria Banuș, cât și la experiența personală sau culturală."),
      iiItem(
        "Comentează, în minimum 50 de cuvinte, textul de mai jos, evidențiind relația dintre ideea poetică și mijloacele artistice.\n\n" +
        "Trecutu-l știm atât cât l-am aflat\n" +
        "C-a fost trăit și că s-a spulberat.\n" +
        "Acumul se trăiește tot la fel.\n" +
        "Se spulberă-n tăcere și nevăzut și el.\n" +
        "Nu-l înțeleg de noi cum se desparte,\n" +
        "Trăind cu noi și totuș mult departe.\n" +
        "Că viața-și pierde și văzută drumul,\n" +
        "Ca umbra și ca fumul.\n" +
        "Au fost frumoase și trăite toate.\n" +
        "Firește, zice gândul, și se poate.\n\n" +
        "Trăiește-ntr-adevăr tot ce se vede?\n" +
        "(Tudor Arghezi, „S-a spulberat”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unui text narativ studiat, aparținând lui Mihail Sadoveanu sau lui G. Călinescu.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea textului narativ studiat într-o perioadă, într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două episoade/secvențe relevante pentru tema textului narativ studiat;\n" +
        "– analiza a două elemente de structură, de compoziție și/sau de limbaj, semnificative pentru textul narativ studiat."),
    ],
  },
  {
    year: 2023, variant: "var-05", title: "Interviu cu Marin Preda (Luceafărul, 1974)", author: "Sânziana Pop",
    items: [
      a("A.1", "Indică sensul din text al secvenței țin minte.", "Sensul secvenței (de exemplu: îmi amintesc) – 4p; enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează numele revistei al cărei sediu se află în locuința lui Geo Dumitrescu, utilizând informațiile din textul dat.", "Menționarea revistei (Albatros) – 4p; enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează un efect pe care îl are asupra lui Marin Preda dialogul cu Sânziana Pop, justificându-ți răspunsul cu o secvență semnificativă din textul dat.", "Precizarea unui efect (de exemplu: revelație, împrospătarea memoriei) – 2p; justificare cu secvență (de exemplu: „Sunt și pentru mine unele dintre ele, pe măsură ce mi le împrospătez.”) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică motivul pentru care Marin Preda este surprins de titlul textului pe care vrea să îl citească M. R. Paraschivescu.", "Precizarea motivului (de exemplu: titlul textului citit coincide cu cel al textului trimis la redacție) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, atitudinea lui Marin Preda față de Geo Dumitrescu, așa cum reiese din textul dat.", "Precizarea atitudinii (de exemplu: admirație) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă vârsta este sau nu un obstacol în inițierea unor proiecte artistice, științifice, sociale etc., raportându-te atât la informațiile din fragmentul extras din interviul cu Marin Preda, realizat de Sânziana Pop, cât și la experiența personală sau culturală."),
      iiItem(
        "Prezintă, în minimum 50 de cuvinte, două modalități de caracterizare a personajului, identificate în fragmentul dat.\n\n" +
        "În dimineața de 28 aprilie, un vizitator neașteptat bătu la ușa portarului Julius. Necunoscutul era un tânăr lung, palid, și vorbea puțin gângav, stânjenit, dar afectându-și în același timp gângăveala; se rezemă într-un baston necioplit, pe care îl ținea cu amândouă mâinile la spate. [...] Firește, vizitatorul neașteptat îl înciudă, cu atât mai mult cu cât vorbirea lui împiedicată se dovedea plină de taine. Julius nu izbutise să-i afle numele. [...]\n" +
        "— Și știi bine că nimic nu s-a schimbat în bibliotecă?\n" +
        "Julius îl asigura stăruitor că totul era ca mai înainte [...].\n" +
        "— Bibliotecarul e aici?\n" +
        "— Cum se poate? D. Cesare vine la opt. [...]\n" +
        "— Firește, firește... Așadar, nimic?... Hm! E de necrezut! Dumneata ai fost aici astă-noapte?\n" +
        "(Mircea Eliade, „Lumina ce se stinge...”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unui text poetic studiat, aparținând lui Mihai Eminescu.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea textului poetic într-o perioadă, într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două imagini/idei poetice relevante pentru tema textului poetic;\n" +
        "– analiza a două elemente de compoziție și/sau de limbaj, semnificative pentru textul poetic."),
    ],
  },
  {
    year: 2023, variant: "var-06", title: "Ion Creangă. Viața și opera", author: "G. Călinescu",
    items: [
      a("A.1", "Indică sensul din text al secvenței de bună seamă.", "Sensul secvenței (de exemplu: desigur) – 4p; enunț – 1p; corectitudine – 1p."),
      a("A.2", "Menționează două dintre sursele de venit ale lui Ion Creangă, utilizând informațiile din textul dat.", "Menționarea a două surse de venit (de exemplu: activitatea de institutor, comerțul) – 2p+2p; enunț – 1p; corectitudine – 1p."),
      a("A.3", "Precizează o posibilă semnificație a curcubeului pentru Ion Creangă, justificându-ți răspunsul cu o secvență semnificativă din textul dat.", "Precizarea unei semnificații (de exemplu: speranța) – 2p; justificare cu secvență (de exemplu: „semn, poate, pentru el, de schimbări în bine”) – 2p; enunț – 1p; corectitudine – 1p."),
      a("A.4", "Explică un motiv pentru care Ion Creangă călătorește la Târgu-Neamț.", "Precizarea motivului (de exemplu: revederea locurilor copilăriei și a rudelor) – 2p; explicare nuanțată – 2p/încercare – 1p; enunț – 1p; corectitudine – 1p."),
      a("A.5", "Prezintă, în 30-50 de cuvinte, o trăsătură morală a lui Ion Creangă, așa cum reiese din textul dat.", "Precizarea trăsăturii (de exemplu: fire superstițioasă, sensibilitate) – 2p; prezentare adecvată – 2p/încercare – 1p; număr de cuvinte – 1p; corectitudine – 1p.", "OPEN"),
      bItem("Redactează un text de minimum 150 de cuvinte, în care să argumentezi dacă oamenii trebuie sau nu să exprime recunoștință față de școlile în care au fost formați, raportându-te atât la informațiile din fragmentul extras din volumul „Ion Creangă. Viața și opera” de G. Călinescu, cât și la experiența personală sau culturală."),
      iiItem(
        "Comentează, în minimum 50 de cuvinte, textul de mai jos, evidențiind relația dintre ideea poetică și mijloacele artistice.\n\n" +
        "A mele visuri risipite!\n" +
        "Ce-mi umplu inima de jale,\n" +
        "Le văd în frunzele pălite\n" +
        "Și-n pustiirea de pe vale.\n\n" +
        "De-a pururi sta-vor troienite,\n" +
        "Sub vremea ce s-așterne-n pale,\n" +
        "A mele visuri risipite,\n" +
        "Ce-mi umplu inima de jale!\n\n" +
        "Copac, când zile fericite\n" +
        "Îți vor întoarce iar în cale\n" +
        "Podoaba ramurilor tale,\n" +
        "În noapte-or sta mai adâncite\n" +
        "A mele visuri risipite!\n" +
        "(Al. Vlahuță, „A mele visuri...”)"),
      iiiItem(
        "Redactează un eseu de minimum 400 de cuvinte, în care să prezinți particularități ale unui text narativ studiat, aparținând lui Liviu Rebreanu sau lui Camil Petrescu.\n\n" +
        "În elaborarea eseului, vei avea în vedere următoarele repere:\n" +
        "– evidențierea a două trăsături care fac posibilă încadrarea textului narativ studiat într-o perioadă, într-un curent cultural/literar sau într-o orientare tematică;\n" +
        "– comentarea a două episoade/secvențe relevante pentru tema textului narativ studiat;\n" +
        "– analiza a două elemente de structură, de compoziție și/sau de limbaj, semnificative pentru textul narativ studiat."),
    ],
  },
];

function validate() {
  const errors = [];
  for (const p of PAPERS) {
    const tag = `${p.year}-${p.variant}`;
    let sum = 0;
    const labels = new Set();
    for (const it of p.items) {
      if (!it.section || !it.label || !it.type || typeof it.points !== "number") errors.push(`[${tag}] item missing field: ${it.label}`);
      if (!it.content?.trim()) errors.push(`[${tag}] item ${it.label} empty content`);
      const k = `${it.section}::${it.label}`; if (labels.has(k)) errors.push(`[${tag}] dup ${k}`); labels.add(k);
      if (Array.isArray(it.rubric)) {
        const rsum = it.rubric.reduce((s, r) => s + r.points, 0);
        if (rsum !== it.points) errors.push(`[${tag}] ${it.label} rubric ${rsum} != ${it.points}`);
      }
      sum += it.points;
    }
    if (sum !== 90) errors.push(`[${tag}] item points sum ${sum} != 90`);
    if (!p.title || !p.author) errors.push(`[${tag}] missing title/author`);
    console.log(`  ${tag.padEnd(16)} items=${p.items.length} pts=${sum}(+10=${sum + 10})`);
  }
  if (errors.length) { console.error(`\n❌ VALIDATE FAILED (${errors.length}):`); errors.forEach((e) => console.error("   - " + e)); process.exit(1); }
  console.log(`\n✅ VALIDATE OK — ${PAPERS.length} papers, each 90 (+10 oficiu = 100).`);
}

async function run(dry) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const p of PAPERS) {
      // Reuse the Subiectul I supporting text from the already-imported grile rows (single source).
      const grileRow = await prisma.question.findFirst({
        where: { sourceReference: { startsWith: `bac-grile:${p.year}-${p.variant}-` }, passage: { not: null } },
        select: { passage: true },
      });
      if (!grileRow?.passage) { console.warn(`  ⚠️ ${p.year}-${p.variant}: no grile passage found — run import-grile-bac-ro.mjs first`); }
      const passageBody = grileRow?.passage ?? "";

      const existing = await prisma.examPaper.findUnique({
        where: { examType_year_subjectKey_variant: { examType: "BAC", year: p.year, subjectKey: "limba_romana", variant: p.variant } },
        include: { _count: { select: { items: true, passages: true } } },
      });
      console.log(`  ${existing ? "UPDATE" : "CREATE"} BAC ${p.year} ${p.variant} → items=${p.items.length}` + (existing ? ` (replacing ${existing._count.items} items/${existing._count.passages} passages)` : ""));
      if (dry) continue;

      const paper = await prisma.examPaper.upsert({
        where: { examType_year_subjectKey_variant: { examType: "BAC", year: p.year, subjectKey: "limba_romana", variant: p.variant } },
        update: { source: `BAC ${p.year} ${p.variant} — Limba și literatura română (CNPEE)`, subjectName: "Limba și literatura română", grade: 12, maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro", sourceUrl: "https://subiecte.edu.ro/", license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)", isActive: true },
        create: { source: `BAC ${p.year} ${p.variant} — Limba și literatura română (CNPEE)`, examType: "BAC", year: p.year, subjectKey: "limba_romana", subjectName: "Limba și literatura română", grade: 12, variant: p.variant, maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro", sourceUrl: "https://subiecte.edu.ro/", license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)", isActive: true },
      });
      await prisma.examItem.deleteMany({ where: { paperId: paper.id } });
      await prisma.examPassage.deleteMany({ where: { paperId: paper.id } });
      await prisma.examPassage.create({ data: { paperId: paper.id, ref: "Textul 1", title: p.title, author: p.author, sourceNote: "Fragment.", body: passageBody, orderIndex: 1 } });
      await prisma.examItem.createMany({
        data: p.items.map((it, idx) => ({
          paperId: paper.id, section: it.section, label: it.label, orderIndex: idx, type: it.type, points: it.points,
          content: it.content, correctAnswer: null, rubric: it.rubric ?? undefined,
          passageRef: it.section.startsWith("I.") ? "Textul 1" : null,
          hasFigure: false, autoGradable: false,
        })),
      });
    }
    const [papers, items] = await Promise.all([prisma.examPaper.count({ where: { examType: "BAC" } }), prisma.examItem.count()]);
    console.log(`\n${dry ? "🔎 DRY — no writes." : "✅ APPLIED."} BAC ExamPapers now=${papers}; total ExamItem=${items}`);
  } finally { await prisma.$disconnect(); }
}

(async () => { console.log(`\n=== import-exam-ro-bac-batch (mode=${MODE}) ===`); validate(); if (MODE === "validate") return; await run(MODE === "dry"); })().catch((e) => { console.error("FATAL:", e); process.exit(1); });
