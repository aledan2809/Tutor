# Cât se poate lua la testul „Agent imobiliar" fără să-l citești

**2026-09-06.** Reparasem indiciul de lungime (L34) și pe cel de poziție (L35) și
declarasem clasa închisă. Cererea a fost să verific și celelalte fețe. Le-am
verificat empiric, nu teoretic: am pus agenți să **dea testul fără să-l citească**
și am măsurat cine trece de 25%.

Lotul examinat: cele 62 de grile generate în dimineața aceleiași zile, după cele
două reparații. Cheia n-a ieșit niciodată din mâna mea — agenții au primit fișiere
orbite, iar scorarea am făcut-o eu. Am verificat în transcripturi că niciunul n-a
atins fișierul cu răspunsurile.

---

## 1. Ce s-a măsurat determinist

Fiecare „strategie" e un elev care alege după o regulă mecanică. `p` = probabilitatea
ca întâmplarea singură să dea un scor cel puțin la fel de bun.

| strategie | rată | p | |
|---|---|---|---|
| cele mai multe virgule | **57%** | 0,0000 | ⚠️ |
| cele mai multe propoziții | **53%** | 0,0000 | ⚠️ |
| cascadă: propoziții → cuvinte → caractere | **50%** | 0,0000 | ⚠️ |
| cele mai multe cuvinte | 39% | 0,0095 | ⚠️ |
| enumerarea cu trei elemente | 49% | 0,0002 | ⚠️ |
| cea mai lungă variantă (caractere) | 31% | 0,12 | — |
| mereu poziția 1 | 29% | 0,27 | — |
| evită „garantat/automat/exclusiv" | 31% | 0,29 | — |
| repetă cuvintele enunțului | 27% | 0,46 | — |
| valoarea numerică de mijloc | 0% | 1,00 | — |

**Diferența dintre răspunsul corect și media distractorilor**, pe unități:

| unitate | diferență |
|---|---|
| caractere | **+1%** ← singura pe care o filtram |
| cuvinte | +6% |
| propoziții | +23% |
| virgule | **+47%** |

Modelul respectase cererea „variante de lungime egală" umplând distractorii la
același număr de caractere. Indiciul nu dispăruse, se mutase în sintaxă. Uniform pe
toate cele 8 module (38-75%), deci obicei de generator, nu un modul stricat.

---

## 2. Ce s-a măsurat empiric — și e mult mai grav

Zece agenți au dat testul. Șase vedeau **doar cele patru variante**, fără nicio
întrebare. Patru vedeau enunțul, dar aveau voie să folosească exclusiv indicii
lingvistice, fără cunoștințe de imobiliare.

| atac | ce avea voie să folosească | scor |
|---|---|---|
| eliminare | doar criterii formale de item defect | **100%** (62/62) |
| registru | doar registrul și specificitatea | 98% |
| completă · expert · liber · profan | doar variantele, fără întrebare | **97%** |
| ciudată | doar varianta care iese din tipar | 95% |
| acord | doar acordul gramatical cu enunțul | **45%** |
| ecou | doar repetarea cuvintelor din enunț | 27% |
| formă | doar punctuație și structură, fără înțeles | 13% |

Două lucruri ies în evidență:

**Cele patru atacuri semantice au ales identic pe toate 62.** Nu sunt patru
strategii — e un singur semnal atât de puternic încât orice formulare îl găsește.
Și „reușite doar de ghicitorul de suprafață: **0**" — scurgerea prin sintaxă e un
simptom al aceleiași cauze, nu un defect separat.

**Distractorii nu erau tentanți, erau recognoscibil falși.** De-asta enunțul nu
făcea nicio muncă: itemul întreba de fapt „care dintre astea patru e adevărată?".

---

## 3. Ce a găsit analiza per-item

110 agenți, 92 de constatări, **34 confirmate** după ce fiecare a trecut printr-un
verificator care avea sarcina s-o respingă (46 respinse). Exemple, cu dovada lor:

- **Distractor care își declară singur necinstea** (Q04). Enunțul cere alternativa
  „în mod etic", iar trei variante încep cu „Să sugereze că…", „astfel încât
  presiunea *să pară* că…". Elevul taie orice variantă cu verb de fabricație și
  rămâne cea etică. Zero materie necesară.
- **Distractor care contrazice o cifră din enunț** (Q02). Enunțul spune că splitul
  e 40%; două variante anunță 30% și 50% în propriul text. Se elimină prin citire,
  fără niciun calcul.
- **Regulă inventată** ca sprijin: „conform baremului standard aplicat în primele
  trei luni", „cota minimă garantată prin contract".
- **Două variante care spun același lucru** (Q41) — deci ambele trebuie să fie
  greșite, și rămân două.
- **Cheia își numește și respinge singură un alt distractor** în propriul text (Q44).
- **Acord gramatical** (Q45): singura variantă cu dezacord („UN contra-ofertă… pe
  care O prezinți") era un distractor.
- **Chei greșite** (2 itemi), dintre care unul grav: **Q21 și Q24 sunt aceeași
  întrebare cu chei incompatibile.**

---

## 4. Cel mai scump defect: aceeași întrebare, două chei

Ruta de completare trimitea generatorului doar **numărul** grilelor existente,
niciodată textul lor. La a doua trecere modelul rescria din aceeași lecție fără să
știe ce scrisese. Rezultat: două perechi de enunțuri aproape identice, **ambele cu
chei diferite**. Un elev care le nimerește pe amândouă e marcat greșit la una pentru
exact același răspuns.

Asta nu e o scurgere, e o eroare — și e mai gravă decât toate indiciile la un loc.

---

## 5. Ce s-a reparat, la trei altitudini

**Cauza — promptul.** Cere paritate de sintaxă, gramatică și specificitate, și mai
ales distractori plauzibili: o concepție greșită reală pe care o are un începător,
nu o variantă absurdă, neetică sau care se autodenunță. Cele trei tipare de mai sus
sunt numite explicit, cu cifrele măsurate. Plus enunțurile existente ajung acum în
prompt.

**Proprietatea, nu indiciile — `blind-check.ts`.** A doua poartă, pe altă întrebare
decât prima: poarta existentă vede enunțul și verifică dacă grila e *corectă*; asta
nu-l vede și verifică dacă mai e *nevoie* de el. Nu-i pasă ce indiciu a scăpat, doar
dacă întrebarea mai contează. Nu se închide când judecătorul e inaccesibil — un item
rezolvabil orb e corect, doar slab — dar spune întotdeauna explicit dacă a rulat.

**Familia, nu unitatea — `guess-baseline.ts`.** Măsoară lotul pe caractere, cuvinte,
propoziții, virgule și fiecare poziție fixă, și raportează în română ce ia un elev
care nu citește. Pur, deci rulează gratis pe fiecare lot. Comanda pentru grilele deja
stocate: `npx tsx scripts/measure-guess-baseline.ts <slug-materie>`.

**Plasa pentru duplicate — `near-duplicate.ts`.** Prag 0,35, calibrat pe lotul real:
perechile adevărate au ieșit la 0,48 și 0,36, următoarea pereche nelegată sub 0,30;
din 1.891 de perechi posibile prinde exact pe cele două.

**Ce NU s-a făcut, deliberat.** Un filtru determinist pe structură care ar fi adus
ghicitorul la nivelul întâmplării taia **21 din 62** de grile bune. Plata era prea
mare pentru un defect al generatorului: aceiași bani cheltuiți pe prompt elimină
cauza, nu conținutul.

---

## 6. Două greșeli în propria măsurătoare

Prinse de teste, nu de recitit codul:

1. `\b` în JavaScript e ASCII, deci `\bși\b` **nu se potrivește niciodată** — lipsea
   exact conjuncția care leagă enumerările românești din fiecare numărătoare de
   propoziții.
2. O virgulă urmată de conjuncție („…, dacă e complet") marchează **o** graniță, nu
   două — frazele compuse ieșeau umflate exact acolo unde măsuram diferența.

Concluziile nu s-au schimbat după corectare, dar cifrele da.

---

## 7. Verificarea finală — lotul regenerat (56 de grile)

Lotul vechi a fost șters și regenerat integral cu promptul reparat plus cele două
gărzi. Din 67 generate au rămas **34**; dintre cele care trecuseră de poarta de
corectitudine, **39% au căzut la proba oarbă**. Zero eșecuri de generare (înainte:
12 din 18 rulări cădeau pe timeout).

### Ce s-a rezolvat — scurgerea de suprafață, complet

| strategie | lot vechi (62) | lot nou (56) |
|---|---|---|
| cascadă propoziții→cuvinte→caractere | **50%** (p=0,00002) | **19%** (p=0,86) |
| cele mai multe virgule | 57% | 29% (nesemnificativ) |
| cele mai multe propoziții | 53% | 24% |
| „varianta care iese din tipar" | 95% | **27%** |

| diferență corectă vs distractori | vechi | nou |
|---|---|---|
| propoziții | +23% | **+2%** |
| virgule | +47% | **+10%** |
| caractere | +1% | −1% |

**Un elev care nu citește întrebarea ia acum 19%, sub cei 25% ai întâmplării.**
Singura strategie peste prag e „cea mai scurtă variantă" (39%, p=0,021) — sub pragul
de alarmă și așteptată ca fals-pozitiv când testezi zece strategii deodată, dar de
urmărit la lotul următor.

### Ce NU s-a rezolvat — rezolvarea oarbă semantică

| atac | vechi | nou |
|---|---|---|
| doar variantele, fără enunț (4-5 atacuri) | 97% | **52-61%** |
| doar criterii formale de item defect (vede enunțul) | 100% | 98% |
| doar registrul și specificitatea (vede enunțul) | 98% | 96% |

Înjumătățit, nu eliminat. Regulile pe care le-au raportat agenții spun de ce: aleg
„varianta care exprimă practica recomandată de curs — transparență, cifre
documentate, protecția clientului".

**Și aici e limita onestă a măsurătorii.** Într-o materie care predă practica
onestă, răspunsul corect *va fi* cel onest. Un cititor care a absorbit valorile
cursului și alege varianta transparentă demonstrează că a învățat, nu că trișează.
Nu pot separa „a învățat" de „a exploatat un indiciu" fără elevi reali — iar a face
valorile cursului ambigue ca să scadă cifra ar fi pedagogie mai proastă, nu mai bună.

Cifrele cu enunțul vizibil (96-98%) sunt dovadă slabă de defect din același motiv: un
model care citește întrebarea și știe domeniul *trebuie* să iasă bine.

### O ipoteză proprie, respinsă de măsurătoare

Agenții au invocat repetat referințe încrucișate („«60-90 de zile» din Q14 confirmă
Q12"), iar eu am presupus că regula „distractorii să fie fapte adevărate care răspund
la altă întrebare" a creat singură defectul ăsta. **Măsurat: 9% în lotul nou vs 10%
în cel vechi** — practic neschimbat. Ipoteza nu se susține, deci nu am livrat gardă
pentru ea. Detectorul lexical prinde doar potrivirile de suprafață; corelarea
semantică pe care o fac agenții rămâne nemăsurată.

## 8. Ce rămâne deschis

- **Rezolvabilitatea oarbă la 95-100% e o slăbiciune de proiectare, nu neapărat o
  scurgere pentru un elev care nu știe materia.** Un agent care recunoaște afirmația
  adevărată folosește cunoștințe, nu un indiciu. Ce e sigur exploatabil de oricine:
  familia sintactică (57%) și acordul gramatical (45%). Distincția asta contează și
  n-o pot închide fără elevi reali.
- Fețele neverificate încă: ordinea alfabetică, lungimea explicației, tiparele între
  module. Lista din `TODO_PERSISTENT.md` rămâne deschisă — de data asta numită, nu
  presupusă acoperită.
- **Rezolvarea oarbă la 52-61%** (vezi §7): înjumătățită, dar deschisă. Următorul pas
  onest nu e încă un filtru, ci elevi reali — singura măsurătoare care separă „a
  învățat valorile cursului" de „a exploatat un indiciu".
