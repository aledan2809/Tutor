# Family Packages — Surface Audit (rol × pachet)

**Data:** 2026-06-25
**Scope:** Faza 3 din handoff „Pachete de familie". Verifică, pe codul livrat în
Fazele 0–2 (LIVE pe etutor.ro, commit `e750b6d`), că:
- fiecare rol ajunge la ce i se cuvine (**nimic lipsă**);
- niciun rol nu ajunge la ce nu a plătit / nu e al lui (**nimic neplătit/IDOR**).

---

## 1. Cum se stabilește fiecare rol

| Rol | Cum apare | Marker |
|---|---|---|
| Elev (copil) | register propriu SAU creat direct de părinte SAU acceptă invitație CHILD | `Enrollment.roles=[STUDENT]` + (dacă e în familie) `Guardian{parentId:owner, relation:PARENT}` |
| Părinte (owner) | contul care plătește pachetul; ancora familiei | `Guardian{parentId:owner, relation:PARENT}` către copii + `WATCHER` în domeniile copiilor |
| Al 2-lea părinte | acceptă invitație PARENT | `Guardian{parentId:coParent, relation:PARENT}` către copiii owner-ului + `WATCHER` |
| Meditator | acceptă invitație TUTOR | `Guardian{parentId:tutor, relation:TUTOR}` către copiii plătiți + `WATCHER` (**niciodată INSTRUCTOR**) |
| Instructor (profesor real) | enrollment INSTRUCTOR/ADMIN pe domeniu | `roles=[INSTRUCTOR]` → vedere pe tot domeniul (predare) |
| SuperAdmin | flag cont | `isSuperAdmin=true` → bypass seat-limits |

**Diferența cheie meditator vs instructor (leak fix):** meditatorul din familie
primește `WATCHER` + legături per-copil `relation=TUTOR`, **nu** `INSTRUCTOR`.
`watcherSeesAllStudents()` rămâne `false` pentru el → e limitat la copiii legați
(prin `getLinkedChildIds`). Instructorul real păstrează vederea pe domeniu —
comportament corect, neschimbat.

---

## 2. Matrice pachet × locuri (base seats)

Sursă unică: `src/lib/family.ts` (`FAMILY_PLANS`).

| Pachet | Părinți | Copii (bază) | Meditatori | tutorAccess |
|---|---|---|---|---|
| Elev | 0 | 0 (el e elevul) | 0 | ✗ |
| Family | 1 | 1 | 0 | ✗ |
| Family Duo | 2 | 1 | 0 | ✗ |
| Trio | 1 | 1 | 1 | ✓ |
| Family Trio | 2 | 1 | 1 | ✓ |

- **Copil peste bază** = add-on plătit cu reducere (al 2-lea −20%, al 3-lea+ −30%)
  → `canAddChild` întoarce `addon:true` + procentul, NU acces gratis.
- **Părinte peste limită** → blocat strict + CTA upgrade (Family→Duo, Trio→Family Trio).
- **Meditator fără `tutorAccess`** → blocat + CTA upgrade (Family→Trio, Duo→Family Trio).
- **SuperAdmin** → toate nelimitate (acoperă pilotul manual Alex↔Rareș).

**Scenarii acoperite** (din TRUE FULL E2E): #1 Elev singur · #2 Family (1P+1C) ·
#3 Duo (2P+1C) · #4 Trio (1P+1C+1M) · #5 Family Trio (2P+1C+1M) · #8 1P+mulți C+1M
(copii = add-on discount, meditator legat de toți copiii) · #9 elev 0 părinți.

---

## 3. Matrice suprafață × rol (nimic lipsă)

| Suprafață | Elev | Părinte/owner | Co-părinte | Meditator | Instructor | SuperAdmin |
|---|---|---|---|---|---|---|
| `/dashboard/family` (gestionează familia) | — | ✓ (owner) | ✓* | — | — | ✓ |
| Adaugă copil/părinte/meditator | — | ✓ (seat-gated) | — | — | — | ✓ |
| `/dashboard/watcher` (monitorizare) | — | ✓ copiii lui | ✓ copiii owner | ✓ copiii plătiți | ✓ domeniu | ✓ |
| Detaliu copil `/watcher/[id]` | — | ✓ (isGuardianOf) | ✓ | ✓ | ✓ domeniu | ✓ |
| Nudge / remindere / breaks / phone per copil | — | ✓ (isGuardianOf) | ✓ | ✓ | — | ✓ |
| Rapoarte KPI (`/watcher/reports`) | — | ✓ (childId ∈ linkați) | ✓ | ✓ | — | ✓ |
| Învățare proprie (Grile/Simulări/Progres) | ✓ | — (părinte ≠ elev) | — | — | preview | ✓ |
| `/family/accept/[token]`, `/family/join` | public (oricine cu link/cod, apoi login) | | | | | |

\* Co-părintele e tot un `Guardian{relation:PARENT}` al copiilor → `/dashboard/family`
i-ar arăta aceiași copii dacă deschide pagina (e și el „owner" pe ancora copiilor
lui). Edge benign — vezi §5.

---

## 4. Verificare control-acces (nimic neplătit / IDOR)

Verificat în cod (Fazele 0–2):

| Check | Rezultat |
|---|---|
| Toate rutele `/api/dashboard/family/*` operează pe `session.user.id` ca owner | ✓ — fără param de owner injectabil |
| `revokeInvite` / `removeFamilyMember` filtrează pe owner | ✓ — `updateMany where inviterId/parentId = owner` |
| Toate `/api/dashboard/watcher/[id]/*` (nudge, reminders, breaks, phone, nudge-targets, reports/[id]) | ✓ — gate `isGuardianOf(session.user.id, childId)` → fără IDOR pe copil nelegat |
| Seat-limit la **creare invitație** | ✓ — `createAndDeliverInvite` → `FamilySeatError` → 409 + CTA |
| Seat-limit la **acceptare** (autoritativ) | ✓ — re-check în tranzacție, sub `pg_advisory_xact_lock(owner)` (rezistent la accept-uri concurente) |
| Seat-limit la **creare directă copil** | ✓ — idem, în tranzacție lock-uită |
| Single-use invite | ✓ — flip `pending→accepted` cu `updateMany where status=pending` (count===1) |
| Self-invite | ✓ — blocat (`inviterId === accepterUserId`) |
| Meditator NU vede tot domeniul | ✓ — `WATCHER` fără `INSTRUCTOR` → `watcherSeesAllStudents=false` → scoped la copiii legați |
| `/api/family/accept` cere autentificare | ✓ — 401 fără sesiune |
| `/api/family/invite/lookup` expune doar nume invitator + rol + usable | ✓ — fără date sensibile |
| Suprafață `Question` / domenii restricționate atinsă | ✗ niciuna (L18 respectat) |

**Smoke prod (LIVE):** `/ro/family/join` 200 · `/ro/family/accept/<bad>` 200 (mesaj
„inexistentă") · `/ro/dashboard/family` 307→signin (gated) · `/api/dashboard/family`
401 · `/api/family/invite/lookup?token=nope` 404. Pilot intact: 1 Guardian
PARENT activ Alex→Rareș.

---

## 5. Findings / limitări cunoscute (follow-up)

> **Notă:** un /review adversarial (2 treceri) a găsit și **reparat în aceeași
> sesiune** 2 probleme reale: P1 IDOR co-părinte (mai jos #1, FIXAT) + P2 mutare
> de rol la acceptare (FIXAT — guard `RoleConflictError` în tranzacția de accept).
> Ambele re-verificate: CLOSED. Restul de mai jos sunt rafinări deschise.

1. **[FIXAT 2026-06-25]** Co-părinte putea scoate copilul din toată familia.
   `removeFamilyMember` cascada family-wide pe orice `relation=PARENT`. Acum
   cascada family-wide se face DOAR de ancora copilului (inviter-ul invitației
   CHILD/DIRECT acceptate, sau — pe legături legacy fără invitație — singurul
   părinte activ); un co-părinte non-ancoră își scoate doar propria legătură.
   **Limitare reziduală (fail-safe):** pe o familie legacy fără invitație cu ≥2
   părinți activi, nici ancora reală nu mai poate cascada (under-removes, fără
   impact de securitate) — de rafinat cu un marker explicit de ancoră pe Guardian.
2. **WhatsApp invitație rece** necesită un template Meta APROBAT
   (`WHATSAPP_INVITE_TEMPLATE`). Până atunci email/Telegram cad pe „copiază linkul";
   `study_reminder` (singurul aprobat) e intenție greșită pentru invitație.
   → acțiune user (submit template Meta, ~24-48h).
3. **Email branded** depinde de itemul deschis Resend DNS `etutor.ro`
   (`notifications@etutor.ro`). Până la verificare, livrarea email poate eșua →
   UI arată linkul de copiat (degradare grațioasă, nu blocant).
4. **Billing → roluri** încă nemapat (pilot manual). Un părinte care cumpără un
   pachet NU primește automat acces la „Familia mea" (nav „Familia mea" e
   condiționat de `WATCHER`/SuperAdmin). Când se cablează Stripe→roluri, achiziția
   pachetului ar trebui să acorde `WATCHER` (sau să arate „Familia mea" pe baza
   `subscriptionPlan`). Seat-gate-urile sunt deja gata să consume planul.
5. **Sync enrollment ulterior:** la legare, părintele/meditatorul primesc `WATCHER`
   pe domeniile CURENTE ale copilului. Dacă copilul se înscrie ulterior la un
   domeniu nou, guardianul nu e auto-înrolat acolo. De adăugat un hook la
   `enrollment.create` al copilului (follow-up).
6. **Meditator INSTRUCTOR istoric:** dacă există meditatori vechi cablați ca
   `INSTRUCTOR`, ei încă văd tot domeniul. Fluxul nou nu mai creează așa ceva;
   de auditat datele existente (pilotul nu are meditator).

**Concluzie:** suprafața e completă pentru rolurile țintă și nu expune nimic
neplătit/IDOR pe codul livrat. Follow-up-urile de mai sus sunt rafinări, nu găuri
de securitate.
