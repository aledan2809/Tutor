# Lessons Learned — Tutor

> Capture incident root causes here. One entry per lesson: L## — YYYY-MM-DD — <short title>.
> Format: **Symptom / Root cause / Fix / Prevention**.

## L18 — 2026-06-25 — A public endpoint that serves `Question` by `subject` alone leaks restricted-domain content (subjects aren't unique per domain)
**Symptom**: While wiring licență provenance, `GET /api/public/practice/quiz?subject=Licență` (no auth) returned Rareș's private thesis grile — content, options, correct index, explanation — to anyone. Same for the Rareș-only aviație domains via `subject=Physics`/`Mathematics`.
**Root cause**: the public demo quiz filtered only `{ status: PUBLISHED, type: MULTIPLE_CHOICE, subject }` with **no domain check**. Generic subject strings ("Licență", "Mathematics", "Physics") exist in BOTH public curriculum domains AND restricted (Rareș-only) domains, so a subject-only filter pulls the restricted rows too. Restricted-domain access control (`domain-access.ts` allowlist) gates the authenticated practice/session routes but the public demo route never applied it.
**Fix**: the public quiz now resolves public domain IDs (`isRestrictedDomainSlug(slug) === false`) and adds `domainId: { in: publicDomainIds }` to the query. Verified on prod: `subject=Licență/Physics/Mathematics` → 0; public subjects (`Matematica cl. VIII`, `Matematică M1 — Bacalaureat`) → 5. Commit `b5b8fe1`.
**Prevention**: ANY endpoint (especially no-auth/public) that selects `Question` by a non-domain field (subject, topic, tag) MUST also constrain by domain access — subjects/topics are not unique per domain. When adding a restricted domain, audit every public/demo content endpoint for subject-only filters.

## L16 — 2026-06-25 — Content verification must be module-appropriate (never AI-verify deterministic/spatial)
**Symptom**: Asked to "verify" all of Rareș's generated content the same way. Blindly AI-verifying everything would falsely reject correct answers in the spatial cube exercise.
**Root cause**: Two classes of content need two verification methods. (a) Deterministic generators (cube, clock, audio-memory, arithmetic) compute the answer in code → correct by construction; an LLM re-solving the cube is unreliable (LLMs are weak at spatial reasoning) and would mark correct answers wrong. (b) LLM-generated content (knowledge grile, thesis grile) genuinely needs an independent correctness check.
**Fix**: `scripts/verify-rares-content.mjs` — Abilități → CODE checks (cube re-derived from the stored `[CUBEVOICE]` payload, clock/memory vs their stimulus, arithmetic re-evaluated, monitoring structural). Aviație-Cunoștințe + Licență → AI cross-model re-solve (Gemini verifying Groq-generated; Licență grounded on its stored explanation since the passage isn't stored). Failures → `status=DRAFT` (hidden, reversible), not deleted. Result: Abilități 0/440 issues; LLM content 33 drafted.
**Prevention**: Before "verifying" generated content, classify it: deterministic → code re-derivation; LLM-guessed → cross-model AI (different model than the generator). Bake cross-model verification into the generator going forward (done for Aviație-Cunoștințe wave 2).

## L17 — 2026-06-25 — Shared-channel wiring ≠ working delivery (WABA template + transport prerequisites)
**Symptom**: After saving an email address + WhatsApp number for the student, the cascade still showed Email/WhatsApp/Telegram as "sărit" (skipped). User assumed it was a bug.
**Root cause**: "sărit" = the deliverability guard found the transport unusable, not a code defect. Telegram skipped = student not linked; Email skipped = no real Resend key / unverified sender domain; WhatsApp skipped = WhatsApp Cloud API creds not set. Additionally, even after wiring the shared WABA creds, sends failed because the code calls a fixed template name (`study_reminder`) that did not exist on the shared WABA — wiring credentials is necessary but not sufficient.
**Fix**: Wired Tutor to the shared WABA + shared Resend key (sending from the only verified domain, techbiz.ae); created + got Meta-approval for the `study_reminder` ro template on the shared WABA; live-verified delivery to the student. Telegram already had its own bot — only the user-side link is missing.
**Prevention**: When reusing a shared channel, verify the full chain: (1) creds wired, (2) the exact template name the code sends is approved on that WABA, (3) the sender domain is verified (email), (4) the recipient is linked (Telegram). Treat "address present in UI" as necessary-not-sufficient.

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

## L11 — 2026-06-13 — Deploy with the FULL DEPLOY_REGISTRY command; a truncated one skips `postinstall: prisma generate` → stale-client build fail + downtime

Deploying the campaign-tracking migration (`0023_campaign_signup`) I ran a *remembered* truncated command (`git pull && npm run build && pm2 restart`) instead of the registry's full one (`git pull && npm install && npx prisma migrate deploy && npm run build && pm2 restart`). The migration applied fine, but the build failed: `prisma.campaignSignup` did not exist on the generated client. Tutor regenerates the client via `"postinstall": "prisma generate"` — skipping `npm install` skipped the regen, so `next build` typechecked the new admin route against a stale client and exited 1. Worse: the `pm2 restart` ran *after* the failed build (chained with `&&` it shouldn't have, but I'd split the steps), serving a broken `.next` → `curl 127.0.0.1:3013` returned `000` (down) until I re-ran `prisma generate && npm run build && pm2 restart`.

**(a) Use the canonical command from `DEPLOY_REGISTRY.md` verbatim — don't reconstruct it from memory.** The registry row for a project encodes exactly the steps that matter (here `npm install` for the postinstall generate + `migrate deploy`). A schema/dep-bearing deploy that drops `npm install` builds against a stale Prisma client.

**(b) Never `pm2 restart` until the build has actually succeeded.** Restarting on a failed build swaps the live process onto a broken/partial `.next`. Gate the restart on the build's exit code (chain with `&&`, or check before restarting), and curl the local port after.

**(c) For a migration that adds a *model* (not just a column), the client MUST be regenerated before build** — a new column on an existing model often still typechecks, but a new model's accessor (`prisma.campaignSignup`) does not exist until `prisma generate` runs.

## L12 — 2026-06-13 — Activating a dormant cron exposes latent loops; guard for re-detection, undeliverable channels, and dead-end rungs BEFORE flipping it on

The escalation ladder had been built but never run (cron unscheduled). Turning it on surfaced three latent bugs that unit tests on the happy path never hit — caught by reasoning through the *steady state*, then verified live with a controlled manual run before leaving the schedule active.

**(a) "No active escalation" ≠ "not recently escalated".** `detectMissedSessions` excluded only PENDING/ESCALATING events. A finished chain is all-COMPLETED → the user has "no active escalation" → re-detected every run → a fresh L1 + in-app reminder every 15 min, forever. Fix = a **cooldown** (exclude users with ANY escalation event created within N days, N > full-ladder duration). The "is this entity already being processed?" check for any recurring job must cover *recently-finished*, not just *in-flight*.

**(b) A channel that can't deliver must be SKIPPED, not retried.** With WhatsApp/SMS unconfigured, the send returns false → the engine reverted to PENDING → retried forever. Added `isPaidChannelDeliverable` (WhatsApp needs config OR a linked+enabled Telegram; SMS needs its gateway) → escalate past an undeliverable rung. A boolean "send failed" can't distinguish "try later" from "can never send here" — decide deliverability *before* attempting.

**(c) An instructor-facing rung with no instructor is the END of the chain, not a failure to retry.** Self-serve students have no INSTRUCTOR enrollment → the L5 email send returned false → infinite retry. Pre-check (`userHasInstructor`) and terminate instead.

**(d) Activate guarded + staged.** Opt-in env flag (deploy ≠ activate), recency window + per-run cap (bounded blast radius — measured 4 real students first), then a **manual single cron run inspected** (events created? channel? isTest stamped? in-app rows?) *before* scheduling the 15-min job. When the manual run revealed bug (a), `ESCALATION_DETECT_ENABLED=false` was the instant kill-switch while fixing — the reason the flag exists.

## L13 — 2026-06-13 — A `loading` state must be cleared on EVERY resolution path — empty and error included, not just the happy one

A real Google-login student (enrolled only in the leftover non-curriculum `aviation` demo domain) hit an infinite spinner on the Practice page. Cause: `loading` started `true` and was only ever cleared by the *second* effect (`/session/next`), which is gated on `selectedDomain`. When the domain list filtered to empty (non-curriculum/zero-grile enrollments), `selectedDomain` was never set → the second effect never ran → `loading` stayed `true` forever. The domains `fetch().catch(() => {})` made it worse: a fetch error also hung.

**(a) Every state that gates the UI must be resolved on all branches** — success-with-data, success-empty, AND error. Here: clear `loading` when the list is empty and in `.catch`. The happy path being correct hides the empty/error paths, which are exactly the ones real edge-case users hit.

**(b) Empty ≠ loading.** "No items" is a *resolved* state with its own message ("choose your subjects"), not a perpetual spinner. Distinguish "still fetching" from "fetched, nothing to show".

**(c) Don't swallow fetch errors into the loading state.** `.catch(() => {})` left `loading=true`; at minimum clear the gating state in catch so the UI shows an error/empty message.

**Adjacent product issue (flagged, not fixed):** real RO students shouldn't be able to enroll in `aviation` (leftover demo), and Google-OAuth signup may skip subject selection → users land with no curriculum subjects. Separate onboarding/data cleanup.

## L14 — 2026-06-22 — `window` is a Postgres reserved keyword; quote it in raw SQL (a seed in a BEGIN block silently rolled back the whole transaction)

The family-plan build added a `StudyReminder.window` column. Prisma created it fine (the migration's `"window" TEXT` is quoted), but a hand-written seed used `INSERT ... (id, "userId", label, window, ...)` — unquoted — which Postgres parsed as the start of a `WINDOW` clause → `syntax error at or near "window"`. Because the seed was wrapped in `BEGIN; ...; COMMIT;`, the error aborted the transaction and the *earlier* statements (the Premium update + Guardian insert that had reported `UPDATE 1` / `INSERT 0 1`) were **rolled back** — the verification SELECTs then showed nothing applied, which momentarily looked like the writes had failed.

**(a) Quote reserved identifiers in raw SQL** — `"window"`, `"order"`, `"user"`, `"end"`, etc. Prisma quotes everything it generates, so reserved-word column names only bite hand-written SQL.
**(b) `UPDATE 1` / `INSERT 0 1` inside an open transaction is not "done"** — a later error rolls them back. Read to the final `COMMIT` (vs `ROLLBACK`) before trusting any row counts, and re-run the verification SELECTs after commit.
**(c) Prefer column names that aren't SQL keywords** when you know data will be touched by raw SQL/ops scripts (would have avoided this entirely).

## L15 — 2026-06-23 — A channel that fails-and-retries silently stalls the whole chain; the deliverability guard must cover EVERY such channel, and "stall" must be measured from the last delivered touch

The parent-monitoring "no-reaction" alert never fired in the first live test. Root cause chain: SMTP wasn't configured on prod → the EMAIL rung's send returned false → the engine reverted the event to PENDING and retried it every cron forever. EMAIL had been left out of the deliverability guard (only the "paid" channels — Telegram/WhatsApp/SMS — were gated) on the assumption email is "always available". A perpetually-PENDING event = an "active" chain, and parent-monitoring only opens an episode once the child's chain is *done* → it never opened → the parent was never alerted.

**(a) Any channel whose send can fail must be in the deliverability guard — skip it when its transport isn't configured, don't retry-forever.** "Free" ≠ "always deliverable": email needs SMTP just as WhatsApp needs a token. Gate EMAIL on `SMTP_HOST`.
**(b) A stuck-PENDING rung silently freezes everything downstream that keys off "chain done"** (here: parent monitoring). When adding a consumer that waits for terminal state, make sure no rung can hang non-terminally.
**(c) "Stall" / inactivity windows must be measured from the last time you actually REACHED the user (last `sentAt`), not from `createdAt` of skipped/undeliverable rungs** — those are created "now" and reset the clock, hiding a hours-old lapse.
**(d) Verify cross-component flows with the real prod config, not just unit tests** — the unit tests were green; the bug only showed with SMTP-absent prod + a multi-cron-pass cascade. A live cron run + DB inspection caught it.
