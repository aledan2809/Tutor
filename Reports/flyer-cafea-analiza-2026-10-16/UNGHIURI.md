# Drumul flyer → probă → abonament, privit prin mai multe skill-uri

Scris 16.10.2026. Fapte comune (doar citire pe prod): în 30 de zile, fără conturile de test, 3 conturi (2 elevi veniți singuri,
0 grile, 0 părinți legați; 1 părinte, copilul legat a lucrat); 0 plăți de la lansare. Flyer: 11.100 împărțite, 6 vizite, 0 conturi.
Cine plătește în primele 7 zile dă 23,24 lei/lună (−30% bate codul de −25%), deși pagina arată 24,90.
Machete: `macheta-prim-ecran.html`, `macheta-flux-proba-plata.html` (churn-prevention).

## 1. churn-prevention — „cine pleacă și de ce”
Vezi `macheta-flux-proba-plata.html`: 5 momente (pagina, după cont, în probă, ziua 8, anularea), mesaje după comportament, oferta
potrivită motivului, rezumatul săptămânii copilului, anulare cu o întrebare + „continui anularea” la vedere.

## 2. onboarding — drumul până la „aha”
- **„Aha”-ul părintelui e primul raport de seară cu ce a lucrat copilul.** Dar drumul până acolo trece prin DOI oameni: părintele
  își face cont, iar copilul (care n-a cerut nimic) trebuie să deschidă linkul, să-și facă cont, să-și aleagă clasa și să lucreze.
  E tiparul „invită echipa” din aplicațiile de firmă: activarea depinde de al doilea om, cu motivație mică.
- **Valoare înainte de copil.** Imediat după cont, „Copiii mei” e gol până intră copilul. Locul gol ar trebui să arate un raport
  exemplu („așa va arăta seara”), cu butonul de invitație dedesubt: părintele vede ce primește înainte să depindă de copil.
- **Scurtătura „copilul e lângă tine?”**: varianta în care copilul își face contul chiar acum, pe telefonul părintelui (sau cu
  codul familiei), scoate așteptarea după un link deschis „mai târziu”. De verificat ce există azi și ce cere acordul părintelui.
- **Progres început deja**: „Pasul 2 din 3” cu pasul 1 bifat (contul) — oamenii termină mai des un drum început pentru ei.
- **Momentul de vârf**: când copilul termină primul test, părintele primește imediat „Andrei a terminat primul test: 4 din 5”.
  Asta e momentul pe care și-l amintește, nu ziua 8.
- **Copilul are nevoie de o victorie rapidă**: primul test de 5 întrebări fără cronometru (livrat 14.10) e exact asta; să nu fie
  precedat de prea mulți pași.
- **Ce trebuie numărat**: cont → invitație trimisă → copil intrat → prima grilă a copilului → 3 zile de lucru → plată. Azi există
  evenimentele `register_done` și `first_question`; lipsesc „invitație trimisă” și „copil intrat”.

## 3. paywalls — momentul în care cerem banii
- **Valoare înainte de cerere.** Mesajele cu −30% pleacă după calendar, și la familiile în care copilul n-a lucrat deloc. Acolo
  mesajul de plată vine înainte de „aha” și pare doar o factură. Cererea de bani să meargă doar la cine a văzut valoarea; ceilalți
  primesc ajutor pentru activare (punctul 2).
- **Ultima zi și pauza cu „ce ați făcut” + „ce pierzi”**: cifrele copilului (zile, grile, % corecte, zona slabă) lângă ce se
  oprește. Pauza de azi arată cifre reale încețoșate — bine; mesajul din ultima zi ar trebui să aibă aceleași cifre.
- **Un pas mai puțin până la plată.** Butonul din pauză și din mesaje duce azi la „Abonament” (`/dashboard/packages?plan=FAMILY`),
  unde părintele vede toate pachetele și locurile, apoi apasă plata. Pentru familia obișnuită (1 copil, 1 materie) butonul poate
  deschide direct plata Family la prețul ei; „Abonament” rămâne pentru „altă variantă”.
- **Lunar și anual, unul lângă altul** pe ecranul de plată: anual = 10 luni (2 gratuite), iar −30% din probă se aplică și anualului.
  Cine plătește anual nu mai are o decizie de luat în fiecare lună.
- **Dovadă, doar adevărată.** Nu avem încă clienți, deci nu există păreri de părinți. Ce putem spune cinstit: câte grile are
  materia (ex. 883 la matematică clasa a VIII-a), cifrele propriului copil. Fără mărturii inventate.
- **Respectă „nu”.** „Nu acum” vizibil în pauză; datele rămân salvate (deja spus) — reduce teama de a pierde ce s-a lucrat.
- **⚠️ Interzis**: un buton de tipul „cere-i mamei să plătească” pe ecranul copilului. Legea (UCPD anexa I pct. 28) interzice
  îndemnul direct către copii de a-și convinge părinții să cumpere. Copilul vede doar că accesul e oprit și că părintele a fost anunțat.

## 4. signup — formularul de cont
- **„Continuă cu Google” lipsește la înregistrare** (există la autentificare și e configurat pe site). Părintele de pe telefon
  tastează azi nume + e-mail + parolă; cu Google, un singur buton. Cel mai mare câștig la formular. De verificat la construire:
  rolul (Părinte), codul V126S, `start=free` și acceptarea termenilor trebuie să treacă și pe drumul Google.
- **Cerința de parolă spusă înainte, nu după eroare** („minimum 8 caractere” sub câmp). Ochiul de afișare există deja.
- **Alegerea Elev/Părinte** pentru cine vine de pe flyer („PENTRU PĂRINȚI”, `plan=FAMILY`): Părinte e deja ales; poate fi
  arătată mai discret, ca o întrebare în minus.
- **Ce urmează, spus lângă buton**: „Durează 2 minute. Fără card. Urmează: îi trimiți copilului linkul.” Pagina spune deja
  „Îți vei lega copilul după ce intri în cont” — bine; de scurtat și pus lângă buton.
- **Elevii veniți singuri** (3 în 30 de zile, fără conturile de test): toți și-au ales materia și au intrat de 1–3 ori, dar
  **niciunul n-a ajuns la prima întrebare**. Nu i-a oprit acordul părintelui (unul are 16–17 ani, unul e adult, unul fără dată).
  Pierderea e între „am ales materia” și prima grilă (clasa, confirmarea capitolelor, testul inițial). De urmărit în sesiunea
  Tutor: drumul elevului până la prima întrebare, pe telefon.

## 5. marketing-psychology — de ce ar alege părintele
- **Gâtuirea, înainte de text** (Theory of Constraints): azi limitele sunt (1) câți părinți ajung pe pagină — 6 din 11.100 de
  flyere — și (2) copilul care ajunge să lucreze. Lustruirea paginii e un optim local; câștigul mare e canalul (unde sunt părinții
  copiilor de 13–18 ani) și activarea copilului.
- **Ce „angajează” părintele (Jobs to be Done)**: nu „liniște” în abstract, ci „să știu în fiecare seară ce a lucrat, fără să-l
  mai întreb” și „să nu aflu abia la simulare că e în urmă”. Prima frază e deja în descrierea paginii pentru WhatsApp/Facebook
  — merită urcată în primul ecran.
- **Prețul în banii de zi cu zi** (mental accounting): „sub 1 leu pe zi” e adevărat (23,24/30 = 0,77 lei; 24,90/30 = 0,83 lei) și
  mai ușor de primit decât trei prețuri unul lângă altul (33,20 tăiat, 24,90, 23,24). Un singur preț mare, restul mic.
- **Pierderea cântărește dublu** (loss aversion): „Păstrez −30%” și „tot ce a lucrat rămâne salvat” sunt deja bine formulate;
  la fel trebuie spus în ultima zi, cu cifrele copilului.
- **Gratuit și fără card** (zero-price, regret aversion): bine pus în evidență azi; de păstrat.
- **Încredere fără clienți**: nu avem păreri de părinți și nu le inventăm. Ce e adevărat și concret: „883 de grile la matematică
  clasa a VIII-a”, „matematică și română acum, alte materii pe rând” (sinceritatea despre limite crește încrederea).
- **Un cârlig pentru părinte, nu pentru copil**: „Câte din 5 grile de clasa a VIII-a știi tu?” — 5 întrebări pentru părinte,
  fără cont, apoi „Vezi cum se descurcă copilul tău, 7 zile gratuit”. Curiozitate + un prim pas mic + părintele simte nivelul
  materiei. Se potrivește și pe un flyer nou (alt QR, alt link — se poate și măsura separat).
- **Mai puține alegeri** (Hick): primul ecran are azi 3 butoane și 2 prețuri; ecranul de plată are 5 pachete. Un drum clar
  (încearcă gratuit) + unul secundar (plătesc acum) e suficient; pachetele rămân pentru cine le caută.
- **Efortul propriu crește valoarea** (IKEA): părintele care stabilește în prima sesiune programul și materia copilului ține mai
  mult la cont — pasul există („ultimul cuvânt la program”), de adus în pasul 2–3.

## 6. 💰 Drumul banilor cap-coadă (verificarea `money-path` din Prompt Architect)
Ce primești: pașii prin care omul ajunge client și rămâne client, cu dovada pentru fiecare și ce n-a fost verificat.

| Pas atins de propunere | Dovada că merge | Risc de bani dacă e făcut greșit |
|---|---|---|
| Prețul 23,24 pe pagină | `checkout-price.ts:39-41` (se ia max(−30% probă, −25% cod)) — **verificat în cod** | −30% există doar cât proba e pornită (`AppSetting accessTrial`) și în primele 7 zile ale contului; pagina trebuie să calculeze prețul cu aceeași funcție, altfel promite 23,24 când plata cere 24,90 |
| Plata directă Family (fără pagina Abonament) | rând `Payment` + acces pentru TOȚI copiii legați | o familie cu 2 copii ar plăti un loc și al doilea copil ar intra în pauză — plata directă doar pentru 1 copil + 1 materie; altfel „Abonament” (unde e deja avertismentul de loc, `child-seat.ts`) |
| „Continuă cu Google” la cont | rând `User` cu rol Părinte + codul V126S păstrat + acordul în Legal Hub | rolul, codul și `start=free` se pierd pe drumul Google; un e-mail deja existent; acordul termenilor neînregistrat |
| Mesaje după comportament | rânduri `Notification` noi, livrate, doar 9–20 ora României | dubluri; conturi de test (`resolveIsTest`); contul Resend comun (limita zilnică); WhatsApp/SMS costă — proba nu le include |
| Rezumatul la ziua 8 | cifrele copilului lui, nu ale altui copil | arată date greșite → neîncredere exact la plată |
| Încă 7 zile pentru familiile inactive | acces „probă” cu dată nouă, o singură dată pe cont | acordat de două ori; acordat și familiilor care au lucrat |
| Anularea cu o întrebare | motivul salvat + abonamentul încheiat în Stripe la finalul perioadei | întrebarea nu are voie să blocheze anularea (legea cere anulare ușoară) |
| Pauza de vară | — | **brokerul nu poate opri un abonament pe o perioadă** azi → cere schimbare la broker (NO-TOUCH) |

**Plată ↔ acces (cele mai sensibile):** plătit fără acces (al doilea copil fără loc; plată directă greșită) și acces fără plată
(încă 7 zile acordate greșit). Primul e deja acoperit pe „Familia mea” și în Abonament (verificat în QA, 45/45).

**Cel mai mare risc, peste toată propunerea:** legătura de plată live **n-a primit încă niciun eveniment** (4 plăți începute la
broker, niciuna terminată; 0 rânduri `Payment`). Dacă prima plată reală nu activează contul, toate îmbunătățirile de mai sus duc
oamenii spre o plată care nu deschide accesul. **Proba cu cardul, înainte de 21.10, e pasul 0.**

**Verificat vs presupus:** verificate — calculul prețului în cod, redirecționarea după cont (`/dashboard/family`), Google configurat
pe autentificare, cifrele din Umami și din bază. Presupuse — tot ce e nou din machete (nimic construit) și efectul lor asupra
înscrierilor și plăților. `/bani final`: azi s-au schimbat doar machete și note, deci n-are ce măsura; `/bani` complet a rulat pe 15.10.

## 7. frontend-design — macheta finală
`macheta-finala-prim-ecran.html` / `.png`: un singur element memorabil — mesajul de seară al părintelui, primul lucru văzut;
titlul flyerului păstrat; ce face copilul și pentru ce; un singur preț mare („sub 1 leu pe zi”) cu 23,24 / 24,90 spuse mic și
cinstit; „Încearcă 7 zile gratuit” + „Continuă cu Google”; ce urmează după cont; cârligul „Câte din 5 grile de clasa a VIII-a știi
tu?”. Scoase tiparele generice (etichete cu majuscule, săgeți pe butoane). Înainte de site: mesajul de seară = exact rezumatul
zilnic real; 23,24 doar cât proba e pornită; drumul Google păstrează rolul, codul și acordul; cârligul cu 5 grile e de construit.
