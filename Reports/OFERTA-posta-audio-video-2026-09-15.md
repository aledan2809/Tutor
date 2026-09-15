# Materiale audio și video generate din aplicație, pentru Poșta Română — analiză și cotație

**Data:** 15 septembrie 2026 · **Pentru:** oferta OF-2026-0001 (eTutor → C.N. Poșta Română S.A., emisă de Fabulosos SRL)
**Stare:** funcția NU există azi în eTutor. Poșta știe. Am spus că o putem face. Documentul ăsta spune cum, cu ce, cât costă și ce nu trebuie uitat.

Prețurile furnizorilor sunt cele publicate la data de azi (surse la final); se schimbă des, deci se reconfirmă înainte de semnarea actului adițional.

---

## 0. Pe scurt

- **Ce livrăm**: fiecare lecție rămâne text (așa e promis în prezentare: merge pe orice telefon, consumă puține date). Din textul ei se generează, la apăsarea unui buton din panou, **varianta audio** (voce sintetică în română) și **varianta video** cu un **prezentator virtual** care „citește" lecția, cu subtitrare. Cursantul alege formatul; progresul și raportul rămân aceleași.
- **Cu ce**: voce → Azure AI Speech (are voci românești, servere în UE, ~0,10 $ pe lecție); prezentator video → HeyGen API la început (1–4 $ pe minut, integrare rapidă), cu drum de rezervă spre un motor open-source găzduit de noi când volumul crește; difuzare → Bunny Stream sau Cloudflare Stream (linkuri semnate, cu expirare; **nu** YouTube, **nu** serverul nostru).
- **Cât ne costă**: pentru ~100 de lecții a câte 6 minute, generarea video ≈ 1.800 $ o dată (HeyGen) sau ~150 $ (Elai/open-source); vocea ≈ 10 $; difuzarea către 20.000 de oameni ≈ 25–360 $ pe lună, după furnizor. Costurile mari sunt **generarea** (o dată per lecție) și **munca noastră** (adaptarea textului pentru citit cu voce, verificarea, regenerarea la fiecare modificare), nu vizionarea.
- **Cum cotăm**: propunerea inițială (4.900 / 1 / 6) a fost respinsă de Alex ca prea mică; cifrele decise sunt în §4b (7.900 EUR activare · 9 EUR/min audio · 99 EUR/min video · regenerare 50%). Disponibilitate estimată: trimestrul I 2027.
- **Ce nu trebuie uitat**: textul lecției nu e un scenariu vorbit (abrevieri, cifre, replici) · vizionarea trebuie să conteze în raport la fel ca cititul · orice modificare a lecției învechește filmul · consumul de date pe telefonul omului (6 minute de video ≈ 60–70 MB; audio ≈ 4 MB) · prezentatorul virtual trebuie declarat ca atare (AI Act) · procedurile Poștei sunt confidențiale — unde pleacă textul la generare contează.

---

## 1. Ce a cerut Poșta și ce promitem

Poșta a cerut materiale audio și video care să se poată **dezvolta direct din aplicație**, nu filmate. Interpretarea practică: un prezentator virtual (ca la meteo) care prezintă lecția. Nu e disponibil azi în eTutor și le-am spus asta.

Promisiunea din ofertă, formulată astfel încât să nu contrazică prezentarea (unde scrie explicit „Lecția e text, nu video"):

> Lecția rămâne text. Opțional, două formate în plus, generate din aplicație din textul fiecărei lecții: audio (voce sintetică în română) și video cu prezentator virtual, cu subtitrare. Funcția nu e disponibilă azi; disponibilitate estimată: trimestrul I 2027.

Poziționarea contează comercial: textul e produsul, audio/video e un strat opțional. Așa nu ne obligăm să avem video pentru fiecare lecție din prima zi.

---

## 2. Cum s-ar face — lanțul de producție

```
text lecție (panou)
   │
   ▼  1. adaptare pentru citit cu voce (script) — automată, cu verificare umană
script vorbit ──► 2. voce (TTS, ro-RO) ──► audio.mp3 ───────────────────────┐
   │                                                                          │
   └────────────► 3. prezentator virtual (avatar + sincronizare buze) ──► video.mp4
                     4. subtitrări din script (exacte, nu recunoaștere vocală)  │
                     5. transcodare + găzduire privată (HLS, linkuri semnate) ◄─┘
                     6. player în lecție + eveniment „a urmărit X%" → raport
```

Reguli de construcție, învățate din alte proiecte:

1. **Generarea e o coadă, nu timp real.** Un video de 6 minute durează 1–5 minute la furnizor. Butonul din panou pune lecția în coadă; omul primește starea („se generează", „gata", „eșuat") și un pas de **aprobare** înainte de publicare — să asculte / să vadă înainte ca 20.000 de oameni s-o facă.
2. **Scriptul ≠ textul.** „AWB", „CNP", „art. 12", „5–7 minute", replicile între ghilimele — toate se citesc altfel decât se scriu. Un pas automat rescrie textul pentru voce (cifre în litere unde trebuie, pauze la replici, lexicon de pronunție pentru termenii Poștei) și un om verifică prima dată.
3. **Subtitrările vin din script**, nu din recunoașterea vocală a filmului: sunt exacte, gratuite și servesc și la accesibilitate, și la oficiile zgomotoase.
4. **Versionare.** Când se editează o lecție, materialele ei se marchează „învechite"; se regenerează la cerere (cost), iar versiunea veche rămâne servită până e aprobată cea nouă.
5. **Ce se numără în raport**: azi „a citit lecția" e un eveniment. Trebuie decis cu Poșta ce înseamnă „a urmărit": ≥ 90% din durată, o singură dată. Player-ul trimite evenimentul; restul (test, remindere) rămâne neschimbat.
6. **Textul rămâne sursa de adevăr.** Dacă un furnizor pică, lecția se citește. Nimic din fluxul de instruire nu depinde de video.

---

## 3. Unelte și costuri

### 3.1 Voce (text → vorbire), limba română

| Furnizor | Preț | Voci ro-RO | Date în UE | Cost / lecție (~6.500 caractere) |
|---|---|---|---|---|
| **Azure AI Speech** (neural) | 16 $ / 1 mil. caractere (HD: 22 $); 500.000 caractere/lună gratuite; angajament → 7,50 $ | da (Alina, Emil) | da (regiuni UE) | ≈ 0,10 $ |
| **Google Cloud Text-to-Speech** | 16 $ / 1 mil. (Neural2), 30 $ / 1 mil. (Chirp 3 HD) | da | da (regiuni UE) | 0,10–0,20 $ |
| **ElevenLabs** | 0,10 $ / 1.000 caractere (v2/v3), 0,05 $ (Flash) = 50–100 $ / 1 mil. | da (multilingv) | doar pe planul Enterprise | 0,33–0,65 $ |

Recomandare: **Azure** ca implicit (cel mai bun raport preț / calitate / UE), ElevenLabs doar dacă la testul pe 3 lecții vocea sună vizibil mai natural și Poșta o cere. Costul vocii e neglijabil oricum; contează pronunția termenilor Poștei — se testează înainte de a alege.

### 3.2 Prezentator virtual (video cu avatar)

| Soluție | Preț | Observații |
|---|---|---|
| **HeyGen API** | portofel preplătit de la 5 $, tarif pe secundă: ≈ 1 $/min (Avatar III geamăn digital) … 3 $/min (Avatar IV foto) … 4 $/min (Avatar V / Studio) | integrare rapidă, calitate bună, API separat de abonamentul web; **servere în SUA** |
| **Synthesia** | Creator 89 $/lună (30 min, API) sau Enterprise personalizat (mediană ~30.000 $/an); depășire 2–5 $/min; avatar personalizat ~1.000 $/an | standardul în instruire corporativă; scump la volum |
| **Elai.io** | 29–59 $/utilizator/lună; pe minute; la volum 0,16–0,22 $/min (25.000–100.000 min) | cel mai previzibil preț per minut, API |
| **Colossyan** | 19–70 $/lună, minute nelimitate pe Business | orientat pe instruire, cu chestionare; API limitat |
| **D-ID** | planuri de la 4,70 $/lună; API ≈ 5,90 $/min (video) | orientat pe „poze care vorbesc" și agenți în timp real |
| **Open-source găzduit de noi** (LivePortrait + MuseTalk / EchoMimic / Duix-Avatar) | doar calcul: 0,06–0,12 $/min pe GPU închiriat (RTX 4090 ≈ 0,77 $/oră) | **datele rămân la noi**, cel mai ieftin la volum, dar cere inginerie și întreținere (modelele se schimbă lunar) |

Recomandare: **HeyGen API la pornire** (timp scurt până la primul film) cu contract de prelucrare a datelor și, dacă Poșta refuză ca textul procedurilor să treacă prin SUA, **varianta open-source găzduită de noi** (sau Elai, care e mai ieftin la volum). Decizia se ia la activare, cu Poșta, pe baza testului pe 3 lecții.

Cost de generare pentru 100 de lecții × 6 minute = 600 de minute: HeyGen Avatar IV ≈ 1.800 $ · Avatar III ≈ 600 $ · Elai ≈ 100–130 $ · open-source ≈ 40–70 $ calcul (+ timpul nostru). Fiecare regenerare după o modificare costă la fel.

### 3.3 Găzduire și difuzare

| Soluție | Preț | Verdict |
|---|---|---|
| **Cloudflare Stream** | 5 $ / 1.000 minute stocate pe lună + 1 $ / 1.000 minute vizionate; codare și trafic incluse; linkuri semnate; player propriu | simplu, previzibil: 0,06 $ pe oră vizionată |
| **Bunny Stream** | stocare 0,005–0,01 $/GB/lună + trafic 0,005–0,015 $/GB (după zonă); minim 1 $/lună; transcodare, player, DRM (opțional, enterprise) incluse | **cel mai ieftin la volum, firmă din UE** |
| **Vimeo Business** | ~75–100 $/lună | restricție pe domeniu, dar date în SUA și preț fix pentru ce nu folosim |
| **YouTube privat** | gratis | **nu**: un video privat se poate împărți cu **cel mult 50 de conturi Google** |
| **YouTube nelistat** | gratis | **nu**: oricine are linkul vede; fără control de acces, fără expirare, fără jurnal, procedurile interne ale Poștei pe un link Google, cu recomandări lângă ele |
| **Serverul nostru (VPS2)** | „gratis" | **nu**: un singur VPS cu 20 de aplicații; 2.000–4.000 de vizionări simultane la 1,5 Mbps înseamnă 3–6 Gbps, iar portul e de 1 Gbps și e împărțit |

Estimare pentru Poșta (cel mai încărcat caz: toți aleg video): 20.000 cursanți × 3 lecții/lună × 6 min = **360.000 de minute vizionate pe lună** → Cloudflare ≈ 360 $ + 5 $ stocare; Bunny ≈ 4 TB de trafic × 0,005–0,015 $/GB = **20–60 $** + stocare neglijabilă (~7 GB). Dacă majoritatea aleg audio (4 MB pe lecție), traficul scade de ~15 ori.

Recomandare: **Bunny Stream** (cost, UE, DRM disponibil dacă Poșta insistă), cu Cloudflare Stream ca alternativă la fel de bună dacă preferăm un preț pe minut fără calcule de GB.

---

## 4. Cotația — cum o facem (bune practici) și cifrele propuse

Ce fac furnizorii de e-learning care vând așa ceva (Synthesia, Elai, Colossyan, studiourile de instruire) și ce e sănătos pentru noi:

1. **Separă o singură dată de recurent.** Construcția fluxului (script, voce, avatar, subtitrări, coadă, player, raport, găzduire) e muncă o singură dată → **taxă de activare**. Generarea e per lecție → **per minut generat**. Difuzarea e per lună → **inclusă până la un plafon**, apoi per oră.
2. **Tarifează motorul de cost real: minutele generate, nu vizionările.** Vizionarea costă cenți pe oră; generarea costă dolari pe minut și, mai ales, timpul nostru de verificare. Un preț „pe cursant" ar părea familiar (ca grila), dar ne-ar lăsa expuși dacă Poșta cere regenerări dese.
3. **Regenerarea costă.** Spus explicit: „regenerarea după modificarea lecției se tarifează la fel". Altfel fiecare corectură de virgulă devine un film gratuit.
4. **Validare pe 3 lecții înainte de volum**, inclusă în activare: se alege vocea, prezentatorul, ritmul, și Poșta vede exact ce primește. (Nu e „pilot" în sensul comercial — e recepția activării.)
5. **Plafon de difuzare + depășire**, ca la telefonie. 3.000 de ore pe lună acoperă ~30.000 de vizionări de 6 minute; peste, 0,10 EUR / oră (costul nostru e 0,06 $).
6. **Varianta „conturi proprii"**, ca la mesaje: dacă Poșta vrea, conturile de voce / avatar / difuzare se deschid pe numele ei și facturile furnizorilor merg direct la ea; noi facturăm doar munca (activare + verificare per lecție). Simetric cu Varianta B de la WhatsApp/SMS și ușor de explicat.
7. **Clauza de preț al furnizorilor**: prețurile lor se schimbă des; tarifele per minut se pot revizui la 12 luni sau la o schimbare de peste 20% la furnizor, cu preaviz.
8. **Proprietate și licențe**: filmele generate sunt ale Poștei; prezentatorul și vocea sunt licențiate de la furnizor (nu se pot folosi în afara contractului); nu se clonează vocea sau chipul unui angajat real fără acord scris.
9. **SLA simplu**: o lecție trimisă la generare e gata în 24 de ore lucrătoare (include verificarea umană).

**Cifrele propuse** (deja scrise în OF-2026-0001, marcate „cotație orientativă, de confirmat la activare"):

| Element | Preț propus | Costul nostru (estimat) | De ce |
|---|---|---|---|
| Activare | 4.900 EUR o dată | ~8–12 zile de lucru + testul pe 3 lecții | acoperă construcția fluxului și integrarea în raport |
| Audio | 1 EUR / minut generat | ~0,02 EUR voce + verificare | prețul e pentru verificare, nu pentru voce |
| Video cu prezentator | 6 EUR / minut generat (6 min ≈ 36 EUR) | ~2,7 EUR (HeyGen Avatar IV) sau 0,15–0,60 EUR (Elai / open-source) | ~2× peste costul cel mai scump; marja crește dacă trecem pe open-source |
| Difuzare | inclusă până la 3.000 ore/lună, apoi 0,10 EUR / oră | 0,06 $ / oră (Cloudflare) sau mai puțin (Bunny) | plafonul acoperă o lună întreagă la 20.000 de oameni pe audio+video mixt |

Variante de model, dacă preferi altceva: **preț fix pe lecție** (audio + video = 50 EUR / lecție, oricâte minute până la 8) — mai ușor de bugetat de Poșta, mai riscant pentru noi la lecții lungi; **taxă lunară pe cursant** (+0,20 EUR / cursant activ / lună, cu generarea inclusă până la 10 lecții noi pe lună) — se aliniază grilei, dar decuplează prețul de costul real.

---

## 4b. Ce a decis Alex (15.09, după-amiază) și verificarea de piață

Prima propunere (1 EUR/min audio, 6 EUR/min video, 4.900 EUR activare, 150 EUR/lecție) a fost respinsă ca prea mică.
**Decis**: dezvoltare + activare **7.900 EUR** o dată · audio **9 EUR / minut generat** · video cu prezentator (audio și
subtitrare incluse) **99 EUR / minut generat** (o lecție de 6 minute: 54 EUR audio, 594 EUR video) · regenerare după
modificare **jumătate** din tarif · conținut nou scris de noi, DOAR TEXT, **500 EUR/lecție · 1.300 EUR/curs · 400 EUR de la 20**
(ridicat de la 250/650/200 după verificarea de piață; lecție = 5–7 min de citit, 3.000–5.000 de caractere + grilă de 6–10
întrebări; modul = lecție + grilă; curs = 3 module + test final; conversia unei lecții în audio/video = 4–6 minute generate,
adică 36–54 EUR audio sau 396–594 EUR video per lecție) · difuzarea rămâne inclusă până la 3.000 de ore pe lună, apoi 0,10 EUR/oră.

| Ce | Piața (surse 2026) | Decis | Unde se așază |
|---|---|---|---|
| Video cu avatar, ca serviciu | agenții AI 2–5 USD/min cu editare, 20–30 USD/min premium; tool-uri AI 99–500 USD per video; producție clasică cu om în cadru 500–1.500 USD/min | 99 EUR/min | între „AI premium" și producția clasică; se susține ca serviciu complet (script, verificare, subtitrări, găzduire, versionare) |
| Voce | narator uman e-learning 15–55 USD/min finit (tipic 30–55); modul de 5 min 80–250 USD | 9 EUR/min | un sfert din vocea umană, cu regenerare în minute |
| Conținut la comandă | microlearning 500–3.000 USD/modul; modul de 5 min făcut intern 500–1.500 USD; 10.000–14.300 USD per oră de e-learning (1.000–1.430 USD per 6 min) | 500 EUR/lecție (era 250) | la limita de jos a pieței, justificat de metoda din demonstrație |
| Dezvoltare + activare | proiecte de microlearning la comandă de la ~4.000 USD; 10–14 zile × 600 EUR | 7.900 EUR | în linie |

Surse: ai-content.agency (cost per minut avatar 2026) · dmakproductions.com (training video cost 2026) · colossyan.com
(video production costs 2026) · vidico.com (educational video 2026) · voicecrafters.com + kimhandysidesvoiceover.com
(tarife voice-over e-learning 2026) · trainingcost.com (microlearning 2026; e-learning per oră 2026) · allencomm.com și
seriousfactory.com (custom e-learning 2026) · eesel.ai (HeyGen 2026) · arcade.software (Synthesia 2026).

## 5. Resurse suplimentare (10–20% din utilizatori simultan)

20.000 de cursanți → **2.000–4.000 de oameni simultan**, posibil pe același material (de exemplu o lecție nouă anunțată dimineața).

| Resursă | Ce înseamnă | Concluzie |
|---|---|---|
| Difuzare video | 4.000 × 1,5 Mbps (720p) = **6 Gbps** la vârf | doar prin CDN (Bunny/Cloudflare); niciun server al nostru nu poate |
| Difuzare audio | 4.000 × 64 kbps = 256 Mbps | tot CDN, dar de 20 de ori mai ieftin |
| Serverul aplicației | pentru video emite doar **linkuri semnate** (milisecunde) | video în sine nu încarcă aplicația |
| Aplicația eTutor la 4.000 simultan | conexiuni la baza de date, PM2 pe un singur proces, VPS2 împărțit cu ~20 de aplicații | **problemă independentă de video**: pentru Poșta e nevoie de un VPS dedicat (sau două procese) și un test de încărcare înainte de primii 3.000 de oameni — de trecut în planul de pornire, nu în cotația audio/video |
| Stocare | 100 lecții × 6 min ≈ 6–7 GB video + 0,3 GB audio | neglijabilă |
| Generare | 100 lecții ≈ 10 ore la un job pe rând, ~1 oră în paralel | coadă cu maxim 5 joburi simultane, ca să nu ardem bugetul din greșeală |
| Telefoanele oamenilor | 6 min 720p ≈ 60–70 MB; 480p ≈ 25–35 MB; audio ≈ 4 MB; Poșta are 7.000 de abonamente de date pentru ~20.000 de oameni | **audio-first**, video la 480p implicit pe date mobile, cu avertisment „consumă ~30 MB" și sugestia de Wi-Fi la oficiu |

---

## 6. Stocarea materialelor — decizia

**Nu YouTube.** Privat = maximum 50 de conturi. Nelistat = public pentru oricine are linkul, fără expirare, fără jurnal de acces, fără posibilitatea de a-l retrage de la un singur om — și procedurile interne ale Poștei ar sta pe infrastructura Google, lângă recomandări de videoclipuri. Pentru un client public, cu proceduri interne, argumentul e suficient.

**Nu serverul propriu.** Nici bandă, nici transcodare, nici redundanță.

**Da: CDN video privat** — Bunny Stream (UE, cel mai ieftin, DRM disponibil) sau Cloudflare Stream (preț pe minut, simplu). Fișierele-sursă generate se păstrează și într-un depozit de obiecte din UE (de exemplu Hetzner Object Storage), ca să nu depindem de un singur furnizor și să putem regenera sau muta.

---

## 7. Securitate suplimentară

- **Linkuri semnate, cu expirare scurtă** (minute), emise doar unui cursant autentificat, pentru lecția la care are acces; fără listare publică; jurnal de vizionări (cine, când, cât).
- **HLS, nu MP4 direct**: nu împiedică un om hotărât, dar elimină „click dreapta → salvează" și limitează redistribuirea ocazională.
- **Filigran vizibil** „Uz intern — Poșta Română", ars în video la generare: gratuit și descurajează ecranele filmate. Filigranul per utilizator (forensic) e scump și nu se justifică pentru proceduri de lucru.
- **DRM** (Widevine/FairPlay) doar dacă Poșta îl cere explicit — e disponibil la Bunny pe planul enterprise; pentru instruire procedurală nu e standard.
- **Unde pleacă textul.** La generare, textul lecției (adică procedura Poștei) ajunge la furnizorul de voce și la cel de avatar. Cu Azure în regiuni UE și DPA, e în regulă. HeyGen e în SUA: fie acord explicit de la Poșta (procedurile nu sunt date personale, dar sunt confidențiale), fie generarea video la noi (open-source) — decizie de luat la activare, nu presupusă.
- **Fără date personale în materiale.** Scripturile nu conțin nume de angajați sau clienți; exemplele rămân cele din lecții.
- **Prezentatorul**: persoană sintetică licențiată. Nu se folosește chipul sau vocea unui angajat real fără acord scris; nu se clonează vocea nimănui.
- **Transparență (AI Act)**: prezentatorul virtual e marcat ca atare în player („prezentator generat automat") — obligatoriu pentru conținut sintetic care imită persoane. (În interfață evităm cuvântul „AI", ca peste tot la noi; „generat automat" e suficient.)
- **Ștergere**: la încetarea contractului, materialele se șterg de la CDN și din depozit; Poșta primește o copie dacă o cere.
- **Cheile furnizorilor** stau în seiful nostru (nu în aplicație), cu plafon lunar de cheltuieli setat la furnizor, ca un buton apăsat de 200 de ori să nu producă o factură de 200 de filme.

---

## 8. Ce ar mai putea scăpa (AOB)

1. **Calitatea vocii românești** e decizia care se vede cel mai mult. Se testează 3 lecții pe Azure (Alina/Emil), Google (Neural2 / Chirp 3) și ElevenLabs înainte de a alege, cu un lexicon de pronunție pentru termenii Poștei (AWB, PRIORIPOST, CNP, art., lei/bani). Face parte din activare.
2. **Textul de citit vs. scenariul vorbit**: lecțiile actuale sunt scrise pentru ochi (liste, replici, cifre). Un pas de adaptare automată + verificare umană e obligatoriu; fără el, prezentatorul va citi „5–7" ca „cinci liniuță șapte".
3. **Ce înseamnă „a urmărit"** în raport, și dacă vizionarea deschide testul la fel ca cititul. De decis cu Poșta; azi testul se deschide după citirea lecției.
4. **Modificarea lecțiilor** e frecventă la început (presupunerile devin procedurile lor). Fiecare modificare învechește filmul. Recomandare: se generează video **după** ce conținutul e stabilizat cu Poșta, nu în prima săptămână.
5. **Consumul de date** pe telefoanele oamenilor — vezi §5. Audio-first și 480p implicit.
6. **Mesajele**: nu se trimit fișiere video pe WhatsApp/Telegram (dimensiune, cost); mesajul duce la lecție, ca acum.
7. **Prezentator personalizat** (în uniformă, „al Poștei"): posibil la Synthesia (~1.000 $/an) sau HeyGen (necesită filmarea unui actor real, cu acord) — opțiune separată, nu în cotația de bază.
8. **Achiziție publică**: pentru Poșta, opțiunea se contractează prin act adițional; valoarea trebuie să rămână sub pragurile care ar cere procedură separată — de verificat cu ei înainte de a promite un calendar.
9. **Ce se întâmplă dacă un furnizor dispare**: textul rămâne; materialele deja generate rămân la CDN; lanțul se refolosește cu alt furnizor (de aceea depozitul de obiecte propriu).
10. **Costul unei schimbări de voce sau de prezentator** după ce s-au generat 100 de lecții = regenerarea tuturor. De spus înainte.
11. **Capacitatea eTutor pentru 20.000 de oameni** e o temă separată (VPS dedicat, test de încărcare, două procese) și trebuie să intre în planul de pornire indiferent de video.
12. **Accesibilitate**: subtitrările și textul acoperă persoanele cu deficiențe de auz; vocea ajută la cele de vedere. E un argument în plus pentru un client public.

---

## 9. Pașii următori, dacă Poșta spune „da"

1. Confirmarea cifrelor din §4 de către Alex (sunt propuneri, nu decizii).
2. La activare: testul pe 3 lecții (voce, prezentator, ritm), decizia de furnizor pentru video (SUA vs. la noi), decizia „ce înseamnă a urmărit".
3. Construcția fluxului în eTutor: coadă de generare, script vorbit + lexicon, integrarea furnizorilor, subtitrări, player, evenimente în raport, versionare, marcaj de transparență.
4. Găzduire: cont Bunny Stream (sau Cloudflare) + depozit de obiecte în UE; linkuri semnate; filigran.
5. Aprobarea primelor 3 lecții de către Poșta → generarea restului, după ce conținutul e stabil.

---

## Surse (prețuri publicate, 2026)

- HeyGen API: [G2 — HeyGen API pricing 2026](https://www.g2.com/articles/heygen-api-pricing) · [Realtime Avatar — HeyGen API pricing explained](https://realtimeavatar.ai/blog/heygen-api-pricing-explained) · [Arcade — HeyGen pricing 2026](https://www.arcade.software/post/heygen-pricing)
- Synthesia: [Arcade — Synthesia pricing 2026](https://www.arcade.software/post/synthesia-pricing) · [eesel — Synthesia pricing 2026](https://www.eesel.ai/blog/synthesia-pricing) · [Knowlify — Synthesia pricing breakdown](https://knowlify.com/articles/synthesia-pricing)
- D-ID: [heyfish — D-ID review, API pricing per minute](https://heyfish.ai/d-id-review) · [Top 50 AI Tools — D-ID pricing](https://top50aitools.com/pricing/d-id)
- Elai.io / Colossyan / Tavus: [Elai.io pricing 2026 (G2)](https://www.g2.com/products/elai-io/pricing) · [digen — Elai enterprise pricing 2026](https://resource.digen.ai/elai-io-enterprise-pricing-breakdown-2026/) · [Guidde — Colossyan pricing 2026](https://www.guidde.com/knowledge-hub/colossyan-features-pricing-review-2026) · [Tavus — plans and pricing](https://www.tavus.io/pricing)
- Open-source (LivePortrait, MuseTalk) și costul pe GPU: [Spheron — self-host AI avatar generator 2026](https://www.spheron.network/blog/self-host-ai-avatar-generator-heygen-alternative-2026/) · [Fora Soft — HeyGen alternatives + when to build custom](https://www.forasoft.com/blog/article/heygen-alternatives) · [VisionStory — LivePortrait guide](https://www.visionstory.ai/open-source/liveportrait)
- ElevenLabs: [ElevenLabs API pricing](https://elevenlabs.io/pricing/api) · [Flexprice — ElevenLabs plans and usage pricing 2026](https://flexprice.io/blog/elevenlabs-pricing-breakdown)
- Azure AI Speech: [Azure Speech pricing](https://azure.microsoft.com/en-us/pricing/details/speech/) · [TextToLab — Azure TTS pricing 2026](https://texttolab.com/blog/azure-text-to-speech-pricing)
- Google Cloud Text-to-Speech: [Google Cloud TTS](https://cloud.google.com/text-to-speech) · [TextToLab — Google Cloud TTS pricing 2026](https://texttolab.com/blog/google-cloud-tts-pricing)
- Cloudflare Stream: [Cloudflare Stream pricing (docs)](https://developers.cloudflare.com/stream/pricing) · [BlazingCDN — Cloudflare Stream pricing 2026](https://blog.blazingcdn.com/en-us/cloudflares-pricing-for-video-streaming-services)
- Bunny Stream: [DEV — Bunny Stream pricing 2026](https://dev.to/nayankyada/bunny-stream-pricing-2026-free-trial-limits-storage-costs-when-to-upgrade-2j56) · [Swarmify — Bunny Stream review 2026](https://swarmify.com/blog/bunny-stream-review/)
- YouTube privat vs. nelistat: [Swarmify — YouTube unlisted vs private (2026)](https://swarmify.com/blog/youtube-unlisted-vs-private/) · [Fast.io — private video sharing](https://fast.io/resources/private-video-sharing/)

*Document de lucru intern (Fabulosos / eTutor). Nu e destinat trimiterii ca atare către Poșta Română — cifrele către client sunt cele din oferta OF-2026-0001.*
