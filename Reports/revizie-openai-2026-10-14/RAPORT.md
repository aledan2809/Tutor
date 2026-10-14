# Revizia cu OpenAI (Codex) a lucrului din 14.10.2026

Cerută de Alex: „verifică și cu OpenAI tot ce ai făcut”. Interval: `3ed8efa..HEAD` (52 de fișiere, ~1.800 de rânduri), Codex CLI 0.160.1,
model `gpt-6-luna`, doar citire (`codex exec -s read-only`). Două treceri: efort de gândire implicit („none”) și „high”.

## Verdictul pe fiecare constatare (efort „high”)

| # | OpenAI | Verdict | Ce s-a făcut |
|---|---|---|---|
| 1 | P1 — testul inițial (`/dashboard/assessment`, `api/student/assessment`) pornește fără bifarea capitolelor | **Real, dar exista dinainte** (fișierul neatins azi; ultima schimbare 28.09). Încalcă regula din 24.08. | Trecut în `TODO_PERSISTENT.md` ca reparație separată (poartă în GET + POST + mesajul în pagină). |
| 2 | P1 — un părinte care e și meditator în altă familie ar vedea copilul acelei familii | **Nu e o scurgere.** Copilul apare doar prin legătura de meditator, care există numai dacă acea familie l-a invitat; aceeași legătură îi dădea deja acces la copil (`isGuardianOf`). Revizia Claude a ajuns la aceeași concluzie. | Neschimbat. |
| 3 | P2 — clasa propusă după data nașterii folosea data UTC (00:00–03:00 pe 1 septembrie) | Real, fereastră mică. | Reparat: data României (`Europe/Bucharest`) + test. |
| 4 | P2 — ruta alternativă `api/student/sessions/quick` nu aplica regula „primul test = 5 întrebări” | Real, ruta nu e folosită de nicio pagină. | Aliniată (aceeași regulă, `isFirstQuickTest`). |

Prima trecere (efort „none”): nicio constatare.

## Textul complet al reviziei (efort „high”)

## Findings

### P1 — A curriculum quiz can start without checklist confirmation

[assessment/page.tsx:61](/Users/danciulescu/Projects/Tutor/src/app/%5Blocale%5D/dashboard/assessment/page.tsx:61) loads assessment questions for an enrolled subject, and [assessment/route.ts:134](/Users/danciulescu/Projects/Tutor/src/app/api/student/assessment/route.ts:134) selects published questions without checking whether the curriculum checklist was confirmed. Its POST path also accepts answers and records an assessment session without that check ([assessment/route.ts:43](/Users/danciulescu/Projects/Tutor/src/app/api/student/assessment/route.ts:43)). A student can therefore open **Assessment** on a curriculum subject and take a quiz before confirming the checklist. Apply the curriculum gate and covered-topic filter to both GET and POST.

### P1 — The new parent access can expose a tutor-linked child

[watcher-instructor-auth.ts:69](/Users/danciulescu/Projects/Tutor/src/lib/watcher-instructor-auth.ts:69) grants watcher access to an account with any active PARENT child link. But [watcher/route.ts:26](/Users/danciulescu/Projects/Tutor/src/app/api/dashboard/watcher/route.ts:26) then fetches *all* active guardian links, including TUTOR links, via [guardian.ts:55](/Users/danciulescu/Projects/Tutor/src/lib/guardian.ts:55). The child detail route also treats any active guardian relation as sufficient ([watcher/[id]/route.ts:28](/Users/danciulescu/Projects/Tutor/src/app/api/dashboard/watcher/%5Bid%5D/route.ts:28)). A parent who also has an active tutor link to another family’s child can now see that child’s watcher entry and detail. Scope these newly enabled parent-only requests to `relation: "PARENT"`; preserve broader tutor access only if it is explicitly intended and authorized.

### P2 — The birth-date proposal uses the UTC date at the Romanian school-year boundary

[curriculum.ts:388](/Users/danciulescu/Projects/Tutor/src/lib/curriculum.ts:388) chooses the school year from UTC month/year. On September 1 between midnight and 03:00 in Romania, UTC is still August 31, so the proposal uses the previous school year. For example, a child born August 31, 2018 can be proposed for grade 1 instead of grade 2 during that window. Derive the current date in `Europe/Bucharest`, as the age utilities already do.

### P2 — The alternate quick-session API misses the new first-test behavior

[student/sessions/quick/route.ts:69](/Users/danciulescu/Projects/Tutor/src/app/api/student/sessions/quick/route.ts:69) still selects the recommended session’s normal question count, and [line 104](/Users/danciulescu/Projects/Tutor/src/app/api/student/sessions/quick/route.ts:104) stores its normal duration. A new student whose first quick test is started through this endpoint gets the usual session length and timer instead of five questions without a timer. Apply the first-test rule here too, or retire the endpoint if it is no longer a supported entry point.

## Checked and found correct

- The primary `/session/start` route checks curriculum confirmation server-side before creating a regular session; the direct quick-session route also checks it. I found the assessment route above as a separate bypass.
- Curriculum checklist reads and writes for a child verify an active PARENT link or a qualifying instructor enrollment, and require the child to be actively enrolled in that subject.
- The new empty-child watcher entry is based on an active PARENT link. The cross-relation exposure occurs later when the watcher list/detail paths use broader guardian checks.
- First-test sizing and timer behavior are consistent in `/session/start`; its UI also prevents duplicate starts within one page instance.
- Read-only review only; no files were changed and no tests were run.