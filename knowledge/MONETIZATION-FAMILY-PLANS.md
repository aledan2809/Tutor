# etutor.ro — Monetizare & Planuri de familie (spec)

> Sursa de adevăr pentru build-ul Părinte/Elev/Meditator. Prețurile de mai jos sunt
> **placeholder-uri pe care le setează owner-ul** (config, nu hardcodate). Co-design 2026-06; build fazat.

## 0. Poziționare (FĂCUT — Faza A, commit c0e1ae9)
- Homepage-ul pune accent pe faptul că **testele EXISTĂ deja** (1.400+ grile verificate: BAC / Evaluare Națională / admitere / pe clase), NU pe „generează un test" (suna ad-hoc / a AI).
- Demo-ul de paste-material rămâne ca **bonus secundar**, buton „Începe testul" (nu „Generează").
- Regulă ecosistem: **fără cuvântul „AI" în textele vizibile utilizatorului** (vezi memoria `feedback_etutor_no_ai_wording`).

## 1. Roluri (conturi separate)
- **Elev/Student** — cel care învață. Se poate plăti singur (fără părinte) și își urmărește singur progresul.
- **Părinte/Watcher** — **plătitorul**. Plătește ca să știe că copilul învață și progresează. Primește chasing/escaladare pe WhatsApp + sumare de progres.
- **Meditator/Instructor** — cont opțional al 3-lea (infra existentă: `InstructorGoal`, `InstructorMessage`, `EscalationThreshold`, `instructorEnabled`). Vede progresul copilului, testele, și **mai ales unde a greșit copilul**; își configurează singur notificările (escaladări, sumare). **Nu plătește niciodată** — e invitat/plătit de părinte.
- **2 părinți / 1 copil** suportat: ambii văd progresul, fiecare își configurează notificările separat.

DE CONSTRUIT (nou): **legătura Părinte↔Copil↔Meditator** + multi-părinte (nu există încă model Family/Guardian).

## 2. Planuri (cine + ce vede)
| Plan | Conturi | Cine vede progresul | Uplift (exemplu — owner confirmă) |
|---|---|---|---|
| **Self** | Elev | elevul | preț de bază pe materie |
| **Family** | 1 Părinte + Copil | părinte + chasing/escaladare WhatsApp | cârlig (inclus) |
| **Family Duo** | **2 Părinți** + Copil | ambii părinți, notificări configurate separat | mic flat (~+9 RON/lună) |
| **Trio** | Părinte(i) + Copil + **Meditator** | + meditator (teste / greșeli / escaladări) | premium (~+29 RON/lună) |

Pagina Părinte TREBUIE să explice clar opțiunea **Trio** + faptul că **părintele plătește inclusiv pentru meditator** (transparent).

## 3. Axe de preț (best-practice „family" tip Spotify — atractiv, decizie ușoară)
- **Unitate de bază**: materie/lună (placeholder 19.90 RON). Prețuri sezoniere deja în STRATEGY (sezon examene Feb–Iul, vacanță vară).
- **Discount sibling** (o factură, mai mulți copii, mai ieftin/cap): copil #1 întreg · #2 −25% · #3+ −40%.
- **Multi-materie / copil**: 1 întreg · a 2-a −15% · **All-inclusive** flat (placeholder 49 RON/copil/lună).
- **Anual**: −2 luni (~−16%) + loialitate 15→30% ani consecutivi (STRATEGY).
- **Psihologie**: evidențiat Family/Trio ca „Cel mai ales", preț/copil care scade vizibil, o singură factură, toggle Lunar/Anual cu economia afișată, charm pricing, free trial fără card.

## 4. Free + Trial → conversie
- **Free** (cont gratuit): max **2 materii/zi**, câte **5 întrebări/materie/zi** (deci 10 întrebări/zi pe 2 materii alese). Întrebările **contorizează + intră în gamification** (XP, streak).
- **Alegerea celor 2 materii necesită cont gratuit** (fără cont = doar demo-ul public; ca să-ți alegi materiile, îți faci cont).
- Scop: să-l facă **dornic să vadă mai mult ȘI să plătească**.
- CTA la atingerea limitei: **„Vrei mai mult? Update la Premium"**.
- **Trial de 7 zile** pe materiile plătite (părinte): **cronometru −30%** dacă plătește orice materie **în perioada de trial**.
- Infra existentă: `subscriptionStatus` ("trialing"/"active"), `SubscriptionPlan.trialDays`, Stripe checkout/webhook/plans. NOU: cota zilnică pe materie + cap de 2 materii/zi + contorizare în gamification + cronometrul de discount.

## 5. Flux de înrolare (Părinte)
1. Părintele introduce datele copilului: **nume copil + telefon copil + telefon părinte**.
2. **Buton demo → mesaje test personalizate pe WhatsApp** către copil/părinte (efect WOW).
3. „Cum funcționează" arătat de la cap la coadă: copilul exersează → **chasing pe WhatsApp** (împinge copilul) → **escaladare către părinte** → eventual **către meditator** (Trio).
4. CTA: înrolare părinte + copil (+ opțional meditator pentru Trio).

## 6. WhatsApp (LIVE prin proiectul `whatsapp` / Meta Cloud API)
- Aceeași WABA comună care trimite deja pentru PRO + 4pro-eat. Lib `@aledan/whatsapp` (templates + `template-manager` pentru Meta Business API).
- **TODO Tutor**: adaug creds Meta în env-ul Tutor (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WABA_ID` din `Master/credentials/whatsapp.env`) — momentan lipsesc → Tutor sare peste trimitere.
- **Template-uri**: reutilizez cele aprobate (`reminder24h`, `reminder2h`, `renewal*`); submit cele NOI (demo-trial, trial-expiry, chasing) prin `template-manager` (~24-48h aprobare Meta).
- **Remindere trial-expiry**: WhatsApp la **24h** și **2h** înainte de expirarea trial-ului dacă n-a plătit → necesită **cron/worker** (Tutor e `next start`, n-are worker încă).
- **Anti-abuz** pe butonul public de demo (limită per IP/număr; ideal gate după start-ul trial-ului).

## 7. Campanii promo (din MA) — strat de cupoane
- **Tutor (proiectul ăsta)**: sistem flexibil de **coduri promo / cupoane** — cod + %/perioadă + materii/planuri vizate → aplicat la checkout Stripe. + landing cu **atribuire UTM** (pattern ecosistem: MA Launch Plan → UTM).
- **MarketingAutomation (proiect/sesiune separată)**: deține conținutul + planificarea + trimiterea campaniei (email/WhatsApp/social), ex. „Învață din timp! Apucă-te de învățat din vară! −X%", referențiind codul promo Tutor. Decuplat.

## 8. Build fazat (status)
- **A. Repoziționare homepage** — ✅ FĂCUT (c0e1ae9)
- **B.** Pagina Părinte (Trio + Duo explicate) + Pagina Elev — marketing + cum funcționează + CTA
- **C.** Backend: model Părinte↔Copil↔Meditator + 4 planuri + reguli Free/trial (2 materii/zi × 5q + gamification)
- **D.** Cronometru −30% + cupoane Stripe + vederea meditatorului pe greșelile copilului
- **E.** WhatsApp: creds în Tutor + demo WOW + remindere 24h/2h trial-expiry (cron)
- **(MA, separat)** campanii promo sezoniere care referențiază codurile promo Tutor
