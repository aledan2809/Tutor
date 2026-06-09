# Lessons Learned — Tutor

> Capture incident root causes here. One entry per lesson: L## — YYYY-MM-DD — <short title>.
> Format: **Symptom / Root cause / Fix / Prevention**.

## L01 — 2026-06-01 — Route-handler redirect leaks internal host behind nginx

**Symptom:** `GET /r/<CODE>` returned `307 Location: https://localhost:3013/ro/try` on prod (etutor.ro) — a browser would follow it to the dead internal address. Caught by live behavioral E2E, not by build/tests.

**Root cause:** `new URL("/ro/try", req.url)` in an App Router route handler. Behind nginx, the backend `Host` header is the upstream address (`localhost:3013`), so `req.url` / `req.nextUrl.origin` reflect the internal origin, not the public one. The vhost did not `proxy_set_header Host $host`.

**Fix:** Build redirect targets from the canonical public origin: `const base = process.env.AUTH_URL || req.nextUrl.origin; new URL(path, base)`. (`AUTH_URL=https://etutor.ro` on prod; falls back to request origin for local dev.) The Set-Cookie was already correct — cookies bind to the host the browser requested, independent of `req.url`.

**Prevention:** Never derive a redirect/absolute URL from `req.url`/`req.nextUrl.origin` in a route handler that runs behind a reverse proxy — use `AUTH_URL` or `x-forwarded-host`. Verify redirects with a live `curl -I` (the Location header), not just a green build.

## L02 — 2026-06-03 — Free-tier AI grader plateaus ~87%; a Claude-class judge (CLI on VPS, $0) reaches 97%+

**Symptom:** the Tier 5 Content Quality Mesh (generation + 3-lens screening, all on Groq llama-3.3-70b) plateaued at ~87–95% teacher-quality on the auto-keep ("high-confidence") bucket across 4 calibration iterations. Subtle defects kept slipping: multiple-correct ("25% din 3000" where two methods both compute it; "inversa fracției" where two definitions are both valid), incomplete-option sets, and garbled-source groundings. Adding stricter Groq lenses + an ensemble didn't break the ceiling — and a quick manual eyeball over-estimated quality at "95%" vs the strong judge's measured 86.9%.

**Root cause:** when the SAME free-tier model both generates and judges, it shares the generator's blind spots — it can't reliably catch the subtle correctness cases (per-option uniqueness, equivalence of two options). The grader's own confidence score (`meshConfidence`, often 1.0) is optimistic vs human/strong-AI judgment. A clean single-pass run is NOT validation (L194 in Master).

**Fix:** add a **stage-3 strong judge = Claude** as the final gate. Claude is available on the VPS at **$0 API credit** via the Claude CLI subprocess (`/usr/bin/claude`, subscription/keychain auth) — spawn `claude -p <prompt> --output-format json --model sonnet`, **strip `ANTHROPIC_API_KEY` from the spawn env** to force subscription auth (not metered API), parse a strict `RESULT: KEEP|DROP` line. Wired into `content-quality-mesh.ts:finalJudge` (Groq 2-judge ensemble kept as fallback; `MESH_CLAUDE_JUDGE=0` disables). A one-time Claude prune of the existing bucket dropped 17/130 (→ verified ≥97%); in-pipeline, a fresh chunk produced 10/10 clean.

**Prevention:** for quality-critical AI gates, don't let the generator be its own judge on a free tier — put a stronger, independent model on the final gate. Measure with an adversarial/strong judge + sampling, never with the grader's own score or a quick eyeball. On the VPS, Claude CLI subprocess (subscription, $0) is the strong judge; cost is latency (~3–5s/item), gated behind a flag. Cross-ref: Master L194 (mesh grader not validated without negative-control), `feedback_prefer_claude_cli_subscription`.

## L03 — 2026-06-04 — 4uPDF /api/extract-region page param = physical PDF page (no offset); renders vector figures too

**Symptom:** during the 2021 exam-bank batch (Test_14), the first figure-extraction loop wrote 10 visually-wrong crops — montage showed the temperature table where a square figure was expected, graph crops landed on the wrong items. fig_inspect.py reports figures under "PAGE 3", "PAGE 4" etc. but the extraction loop had passed `page=1, 2, 4, ...` (an ad-hoc offset, treating the cover/SI pages as a shift).

**Root cause:** the 4uPDF `/api/extract-region` `page` field is **1-based on the physical PDF** — i.e. exactly the fig_inspect "PAGE N" number (cover = page 1). There is no offset. Subtracting 2 for SII and a different amount for SIII mapped every figure to the wrong page. Separately, a `set -- $spec` bash loop silently failed to word-split (wrote files with the whole spec string as the slug → 10 junk 89-byte PNGs); switching to `read slug page x0 y0 x1 y1 <<< "$spec"` fixed it.

**Fix:** pass `page` = fig_inspect PAGE number verbatim. Always montage-verify (3×N grid, Read the PNG) before commit — the wrong-page crops are obvious at a glance. Delete junk files with `find ... -name "...* *.png" -delete` (space in name) before staging.

**Prevention:** the extract-region page is the physical page; never offset. Vector figures (e.g. the Test_15 SI.6 pie chart, which has NO raster IMG xref) render correctly via extract-region — estimate their bbox from `page.get_drawings()` union and pass the same fractions. Montage-verify is the cheap catch for any bbox/page mistake. Cross-ref: `knowledge/exam-bank-import-playbook.md` §2.6, memory `project_tutor_exam_bank_import`.

## L04 — 2026-06-04 — Official barem answer-key can be wrong; math-prove every MCQ key, override + document a typo

**Symptom:** importing 2022 Test_04, the official barem prints `SII.6 = a)` (= "8 dm"), but item 6 (regular pyramid VABCD, square base AB=2, triangle VBD equilateral, sum of the 4 lateral edges) is provably **8√2 dm = option b**: square diagonal BD=2√2, VBD equilateral ⇒ VB=VD=BD=2√2, regular pyramid ⇒ all 4 lateral edges = 2√2, sum = 4·2√2 = 8√2. Option a (8) would require each lateral edge = 2 = the base side, contradicting the equilateral condition.

**Root cause:** the official CNCE barem has a typo in the answer letter (or the OCR of the barem flipped a→b). Blindly transcribing the printed key would have given students a *wrong* auto-grade key — a student who correctly answers 8√2 (b) would be marked wrong. The "answer keys are GROUND-TRUTH from the barem" rule exists to stop *me inventing* keys, not to force-copy a provable typo.

**Fix:** use the **mathematically-proven** answer (b), set it as `correctAnswer`, and **document the discrepancy prominently** in the script header (`⚠️ BAREM-DISCREPANCY: barem prints "a" but correct is 8√2=b, <derivation>`) + flag it to the user. The `/review` mesh math verifier independently re-derived 8√2 and confirmed b — that adversarial second opinion is what makes the override safe.

**Prevention:** every MCQ key gets an independent math re-derivation in the `/review` mesh pass; never ship a key on the barem's word alone. When math contradicts a single printed barem letter and the math matches a *specific option*, prefer the math + document (don't silently copy, don't silently change). Cross-ref: `knowledge/exam-bank-import-playbook.md` §0 ground-rules + §7.

## L05 — 2026-06-04 — A "geometrically impossible" MCQ usually means a dropped √ (or symbol) in OCR — back-solve before trusting the text

**Symptom:** 2022 Test_05 SII.4 (rectangle, O = midpoint of diagonal AC, P on DC with PO⊥AC, "AP=3", "BC=5", find AB; barem key b = AB=5) is geometrically **impossible** as first read: PO⊥AC through the midpoint ⇒ PA=PC, and A→P (P on the side opposite AB) forces PA ≥ height = BC = 5, so PA=3 < 5 can't happen for any AB.

**Root cause:** the PDF text rendered `BC = √5 cm` but the first OCR pass dropped the radical, reading `BC = 5 cm`. With the true `BC = √5`: PA²=AD²+DP² ⇒ 9 = 5 + (AB−3)² ⇒ AB = 5 (rejecting AB=1 since PC=3 > DC=1). Everything is consistent and the barem key b=5 is correct.

**Fix:** when an MCQ looks impossible, **back-solve from the barem answer** to find what input value makes it consistent — it instantly revealed `BC` had to be √5, not 5. Re-read the PDF's secondary rendering (the layout block, not just the first text block) which showed `√5`. Transcribe `BC = √5 cm`.

**Prevention:** treat "impossible problem" as an OCR-symbol-loss signal (most often a dropped `√`, exponent, or sign), not a flawed source — official CNCE items are sound. Back-solving from the known key + re-reading both PDF text renderings recovers the true value. The `/review` math verifier re-derives with the corrected value and confirms. Cross-ref: `knowledge/exam-bank-import-playbook.md` §0.

## L06 — 2026-06-04 — Limba română import: 3 lessons (figure-restart, accent-render, verbatim-via-fitz)

Importing the 8 official EN VIII Limba română papers surfaced three reusable lessons.

**(a) Figure-bearing papers need `pm2 restart tutor` after data import — data-only imports don't.**
Tutor runs plain `next start` (NOT standalone). `next start` enumerates `public/` at server boot, so a newly committed+pulled figure (`public/exam-figures/*.png`) returns **404 until a restart**, even though the file is on disk. Pure-text paper imports (the 7 figure-less RO papers) render immediately with no restart — the app reads ExamPaper/ExamItem/ExamPassage rows from the DB at request time. Only the 2025 Model paper (Erasmus chart on A.3) needed `pm2 restart tutor --update-env` + ~8s boot wait (L67 transient 502) before its figure went 200. An existing Mate figure (present at the last `npm run build`) stayed 200 throughout — proof the difference is "present at boot" not "build vs no-build".

**(b) Accentuation MCQs lose their accent marks in fitz text extraction — render the region visually + re-encode with acute vowels.**
2025 Simulare B.1 ("corect accentuate") printed all four options as the same string `culturile; era` because the distinguishing accent (bold+underline on the stressed syllable) is a glyph attribute fitz drops. Rendered page-region to PNG, read it visually, encoded the stress with acute-accented vowels (`cúlturile`/`cultúrile`, `éra`/`erá`) so the student sees the distinction in HTML. **Ground-truth trap caught in the same item:** the verb `era` (imperfect of "a fi", 3sg) is stressed on the **final** syllable — `e-RÁ` (like `el cântá`) — NOT `éra` (that's the noun "epoch"). The barem key `d` (cultúrile; erá) is correct; my first intuition ("éra") was wrong. Verify stress against grammar, not gut, before encoding.

**(c) `fitz` (PyMuPDF) `get_text()` IS the verbatim source for prose/poetry — far safer than visual transcription.**
For figure-free Romanian literary texts, `python -c "import fitz; ..."` extracted both passages verbatim (including the long ~1-page nonfiction Text 2), which I cleaned (normalize `ş/ţ` cedilla → `ș/ț` comma-below; keep `[...]` ellipses + archaic spellings like Creangă's `mieu`, `sara`, `lacrâmi` verbatim) and pasted into the import script. No OCR symbol-loss risk for plain text (unlike the Mate radical-drop in L05) — the loss only hits glyph attributes (accents/bold), handled per (b). Verification: authenticated HTML render check greps for first+last line of each passage to confirm the full text shipped.

**Reusable tooling produced:** `/tmp/verify-ro-paper.mjs` (NextAuth login → POST score → assert auto rawPoints == sum-of-autoGradable-points + attempt persisted; handles MCQ-objective + TF_GRID-grid, variable points) + `/tmp/verify-ro-html2.mjs` (authenticated GET of the student take page → grep distinctive content). Cross-ref: `knowledge/exam-bank-import-playbook.md`.

## L07 — 2026-06-09 — Grile content: official verbatim > AI-regenerated; i18n every student-facing string; owner previews all

Long Tutor session (Grile/Capacitate section + voucher activation + auth + i18n). Three reusable lessons.

**(a) For a content section, copy GROUND-TRUTH official items VERBATIM — don't AI-regenerate.**
I first populated the new "Grile" section by publishing 343 AI_GENERATED clasa-V questions. The user rejected it hard: *"nu trebuia AI să facă regenerare de întrebări, ci să ia exact așa întrebările care erau marcate ca și grile... Sunt materiale oficiale și pot fi puse ad-literam."* Fix: revert the AI questions to DRAFT, copy the official MCQ `ExamItem`s (from the 53 exam-bank papers) into `Question` rows verbatim — content + options + key (letter→text from barem) + figure (figureUrl→imageUrl) + passage. `source=MANUAL`, no AI, no modification. Result: 540 Mate + 56 RO official grile. **Rule:** when content exists as ground-truth (official exams, baremuri), copy it verbatim; AI generation is only for scaling where no official source exists (and even then behind the quality-mesh gate). Don't reach for AI when you have the real thing. Cross-ref: `scripts/grile-from-exambank.mjs`.

**(b) Anglo-romană: EVERY student-facing string must be i18n'd — hardcoded English leaks on the RO locale.**
Repeatedly this session, hardcoded English surfaced on the Romanian UI: nav label `"Simulări"` hardcoded (broke EN), `SessionSelector` ("Questions Available", "Quick Session", "Start Session"...), `feedback-display` ("Correct!", "Explanation:"), signin password-toggle `aria-label` hardcoded RO (leaked "Arată parola" on EN). The user flagged it twice ("e iar anglo-romană", "e peste tot o anglo-romană"). **Rule:** never hardcode a user-facing string — route through `next-intl` with RO+EN keys, including aria-labels/titles. Server-computed labels (e.g. SESSION_TYPES.label) should send a `type` key and be translated client-side, not shipped as English text. Grep for quoted English in any student-facing component before shipping.

**(c) Gate STUDENTS to their package, but let the OWNER (SuperAdmin) preview everything.**
The Grile "Materie" dropdown reads `/api/student/domains` → enrolled domains only (package-gating — correct for students who pay per subject). But the owner (Alex, SuperAdmin) saw only Aviation + Drept and couldn't preview the Capacitate subjects he'd just built. Fix: in `/api/student/domains`, a SuperAdmin gets ALL active domains as `enrolled`; students stay package-gated. **Rule:** access-gating logic must special-case the owner/content-editor for preview, or you lock yourself out of your own content. Cross-ref: `src/app/api/student/domains/route.ts`.

**Reusable feature patterns shipped:** voucher activation without Stripe (100% voucher → enroll + `subscriptionStatus=active`, bypassing the card flow) for tester onboarding while real card payment waits on user-provided Stripe keys; passage-dependent grile via a collapsible "📖 Vezi textul" drawer (read-on-demand, fits per-question drill, no repetition) — option (c) chosen over inline-embed (repetitive) and full passage-grouping (breaks drill flow).

## L08 — 2026-06-09 — Group analytics on a CAPITOL, not the exam section; and decouple any feature that piggy-backed on the section label

The Grile import set `Question.topic = ExamItem.section` ("Subiectul I", "I.B"), so the Statistici "Topics" + "Weak Areas" grouped on exam sections — which tell a student nothing about WHICH skill is weak. Two reusable lessons from fixing it (commit `439eb1b`).

**(a) For a meaningful Weak-Areas signal, map to chapter-level capitole — and use the OFFICIAL micro-topic, not AI.**
The exam-bank `ExamItem.topic` already carries fine-grained official micro-topics (Mate: all 540 MCQ, ~290 distinct like "Cub. Volum"; RO: 32/56 like "Diftong"). Those are too sparse to aggregate (n=1..2). The fix is a **deterministic** micro→macro mapper (`scripts/lib/macro-topic.mjs`, no AI — consistent with L07a) collapsing them into 8 Mate + 6 RO capitole. **Rule:** weak-areas need buckets with enough volume to show signal; build them by mapping the official ground-truth label, not by AI-classifying content. Validate the mapper against ALL distinct live values + assert representative+tricky cases (72/72 smoke). Watch keyword collisions in RO/Mate text: "diferența de pătrate"⊃"pătrate", "media geometrică"⊃"geometr", "viteză, distanță"⊃"distanță", and inflected forms ("rapoarte" ⊉ substring "raport") — resolve with ordered first-match rules + anti-collision pre-rules + inflection-tolerant patterns.

**(b) When you repurpose a field, hunt every feature that parsed it.** `Question.topic` was also (ab)used by the official EN VIII timer: `estimateQuestionSeconds` matched `/ii-lea|subiectul ii/` and `isExamGrileSet` matched `/subiectul|i\.b/` on topic. Moving topic→capitol would have silently broken both. Decoupled them onto the proper signals: subject (`/român/`→3min), figure/`/geometrie/` capitol (→6min), and `sourceReference startsWith "exam-bank:"` for grile-set detection. Quantified the drift first (12/540 Sub-I-geometry items shift 4→6min — pedagogically sound) instead of assuming. **Rule:** `grep` the field name across `src/` before changing its semantics; a field's value is often load-bearing for code far from where it's set.

**(c) Re-classify is idempotent re-run, not a new script; and clean the derived aggregates.** The importer deletes `exam-bank:%` rows + recreates, so re-running it with the new mapper re-classified the 596 grile in place — no migration script. But per-user `Progress`/`WeakArea` rows are derived snapshots keyed by topic; after the change they held dead section-topics. Deleted the orphans (topics no longer existing as questions) so Statistici shows capitole immediately. **Rule:** when a source field feeds derived/aggregate tables, fixing the source isn't enough — sweep the stale derived rows too. Verified the full chain authenticated: served grile topic = "Geometrie plană" → answer → `Progress.topic` = "Geometrie plană".

## L09 — 2026-06-09 — Grile from an essay exam: anchor the MCQ in the official BAREM (no AI), and surface it where the audience looks

User: "make grile from the BAC materials, visible in the homepage dropdown." But BAC RO is an essay/short-answer exam — **zero official MCQ**. The naive read is "generate questions with AI" — which the user had rejected hard (L07a). The reframing the user themselves supplied: *"check again: the BAC-RO materials also contain the barem."*

**(a) When there's no official MCQ but there IS an official answer key, build barem-anchored MCQ — that's still "official", not "AI-generated".** For each Subiectul I A item: the question = the official cerință reformulated as a direct MCQ; the **correct option = the barem's model answer verbatim** (e.g. „depășit" → „învechit"); the distractors are plausible-but-wrong, written deterministically (no LLM). This satisfies L07a's own carve-out ("generation only where no official source exists") because the *correctness* is barem-locked — no AI judging needed, so the user's "NO quality gate" is right: there's nothing for a judge to second-guess. 13 BAC papers → 75 grile, `import-grile-bac-ro.mjs`, idempotent `bac-grile:%` tag. Comprehension grile carry the official passage inline (self-contained) so they're answerable.

**(b) A "make it visible HERE" request is two tasks: the content AND the surface.** The homepage demo dropdown grouped a flat free-text `Question.subject` list, mixing real curriculum banks with leftover seed data (Aviation pilot-theory "Fizică (14)"/"Matematică (9)", demo "Istorie (4)"). Made it domain-driven + grouped by exam level (slug `*-v-viii`→Capacitate, `*-ix-xii`→Bacalaureat), school-only, with the level suffix stripped from leaf labels ("Română" not "Română — Bacalaureat" under the Bacalaureat group). The MCQ-demo quiz API didn't return passages → comprehension grile would be unanswerable without an account → added a passage drawer. **Rule:** "show X in surface Y" means verify Y can actually render X (here: passages in a no-account MCQ widget), not just that the rows exist.

**(c) Honour the negative half of the instruction.** "Grile, NOT Simulări" — so the BAC ExamPapers (needed as the verbatim text/barem store) were set `isActive:false` to hide them from the Simulări list while the grile (active) surface in dropdown + Grile. Reversible; stated to the user. **Rule:** a "do X not Y" instruction has two obligations — deliver X and actively suppress Y, don't just add X alongside an untouched Y.

## L10 — 2026-06-10 — For a math exam, transcribe from the RENDERED PDF, not the fitz text dump; cross-check barem + hand-calc on every sign

Importing BAC Matematică (vs the earlier RO essay papers) exposed that `fitz get_text()` returns math **structurally garbled** — LaTeX-built fractions/exponents/matrices come out with tokens reordered across lines (`(2 1 2 4 1 i i i)` for `2(1−2i)+i(4+i)`). Transcribing the grile answer from that dump would have shipped wrong keys.

**(a) Render the PDF region to PNG and read it visually — that's the ground truth.** `fitz.get_pixmap(matrix=Matrix(4-5,…), clip=Rect(...))` of the exact item region, then read the image. The fitz text is fine as a *skeleton/locator*, never as the source of notation. Verified item-by-item at high zoom when a single read was ambiguous.

**(b) Three independent sources must agree before a grile key is locked: subject statement + official barem + your own hand-calc.** Two real traps caught this way on model 2024: item 1 looked like "=−1" in the subject but the barem + arithmetic both gave **1** (`2−4i+4i+i²=1`); item 2 I first read `f(x)=x²+ax+a, A(−3,−3)` (→ a=6) but a tight zoom showed `f(x)=x²+ax−a, A(3,−3)`, and the barem's `9+3a−a=−3 ⇒ a=−6` only closes with those exact signs. The barem is ground-truth (L09), but reconcile it with the statement and the math — a mismatch means *you* misread, and that's the signal to re-zoom, not to guess.

**(c) The UI has no KaTeX/MathJax → store math as plain Unicode inline** (`√`, `²`, `∘`, `e^(−x)`, `log₂`, matrices as `(0 0 1 / a −1 a / 1 0 0)`), exactly like the existing EN VIII Matematică bank. Verified live: the notation survives HTML rendering intact on the take page. So fidelity is a transcription discipline, not a rendering-stack problem.

**(d) "3 sub-categories, never mixed" (M1/M2/M3) = 3 domains + 3 subjectKeys, not one shared bucket.** Grile group by `(domainId, Question.subject)` and Simulări by `(examType, subjectName)` with the unique constraint `(examType, year, subjectKey, variant)` — so a shared `subjectKey:"matematica"` would collide `model-2024` across all three programs. Each program gets its own domain (`matematica-m{n}-ix-xii`), subjectKey (`matematica_m{n}`), and grile tag (`bac-grile-mate-m{n}:`). Empty programs (M2/M3 with no published rows) are hidden automatically by the level classifier.
