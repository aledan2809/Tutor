# etutor.ro — Monetization & Family Plans (spec)

> Source of truth for the Parent/Student/Tutor monetization build. Prices below are
> **placeholders the owner sets** (config, not hardcoded). Co-designed 2026-06; build is phased.

## 0. Positioning (DONE — Faza A, commit c0e1ae9)
- Homepage leads with **"tests already EXIST"** (1.400+ verified questions: BAC / Evaluare Națională / admitere / by grade), NOT "generate a test" (which read as ad-hoc/AI).
- Paste-your-own-material demo kept as a **secondary bonus**, button "Începe testul" (not "Generează").
- Ecosystem rule: **no word "AI" in user-facing copy** (see memory `feedback_etutor_no_ai_wording`).

## 1. Roles (separate accounts)
- **Elev/Student** — the learner. Can self-pay (no parent) and track own progress.
- **Părinte/Watcher** — the **payer**. Pays to know the child learns + progresses. Receives WhatsApp chasing/escalation, progress summaries.
- **Meditator/Instructor** — optional 3rd account (existing `Instructor` infra: `InstructorGoal`, `InstructorMessage`, `EscalationThreshold`, `instructorEnabled`). Sees child progress, the tests, and **where the child got wrong**; configures own notifications (escalations, progress summaries). **Never pays** — invited/paid for by the parent.
- **2 parents / 1 child** supported: both see progress, each configures notifications independently.

NEW model to build: **Parent↔Child↔Tutor linkage** + multi-guardian (no Family/Guardian model exists yet).

## 2. Plans (who + visibility)
| Plan | Accounts | Sees progress | Uplift (example — owner confirms) |
|---|---|---|---|
| **Self** | Student | the student | base per-subject price |
| **Family** | 1 Parent + Child | parent + WhatsApp chasing/escalation | hook (included) |
| **Family Duo** | **2 Parents** + Child | both parents, notifications configured separately | small flat (~+9 RON/mo) |
| **Trio** | Parent(s) + Child + **Meditator** | + meditator (tests / mistakes / escalations) | premium (~+29 RON/mo) |

The Parent page MUST clearly explain the **Trio** option and that **the parent pays including for the meditator** (transparent).

## 3. Pricing axes (Spotify-family best practices — attractive, easy decision)
- **Base unit**: materie/lună (placeholder 19.90 RON). Existing seasonal pricing in STRATEGY (Feb–Jul exam season, summer vacation).
- **Sibling discount** (one bill, more children, lower per-head): child #1 full · #2 −25% · #3+ −40%.
- **Multi-subject / child**: 1 full · 2nd −15% · **All-inclusive** flat (placeholder 49 RON/child/mo).
- **Annual**: −2 months (~−16%) + loyalty 15→30% consecutive years (STRATEGY).
- **Psychology**: highlight Family/Trio as "Cel mai ales", show per-child cost dropping, one bill, monthly/annual toggle with savings, charm pricing, free trial no card.

## 4. Free trial → conversion
- **7 days**, max **5 questions/subject/day** — but those **count + participate in gamification** (XP, streak).
- CTA when quota hit: **"Vrei mai mult? Update la Premium"**.
- **Countdown −30%** if the parent pays for any subject **during the trial**.
- Existing infra: `subscriptionStatus` ("trialing"/"active"), `SubscriptionPlan.trialDays`, Stripe checkout/webhook/plans. NEW: per-subject daily quota + gamification-counting + the countdown discount.

## 5. Enrollment flow (Parent)
1. Parent enters child data: **child name + child phone + parent phone**.
2. **Demo button → personalized WhatsApp test messages** to the child/parent (WOW effect).
3. "How it works" shown end-to-end: child practices → **WhatsApp chasing** (nudge child) → **escalation to parent** → eventually **to meditator** (Trio).
4. CTA: enroll self + child (+ optionally meditator for Trio).

## 6. WhatsApp (LIVE via the `whatsapp` project / Meta Cloud API)
- Same shared WABA already sending for PRO + 4pro-eat. Lib `@aledan/whatsapp` (templates + `template-manager` for Meta Business API).
- **Tutor TODO**: add Meta creds to Tutor env (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WABA_ID` from `Master/credentials/whatsapp.env`) — currently missing → Tutor skips sends.
- **Templates**: reuse existing approved (`reminder24h`, `reminder2h`, `renewal*`); submit NEW ones (trial-demo, trial-expiry, chasing) via `template-manager` (~24-48h Meta approval).
- **Trial-expiry reminders**: WhatsApp at **24h** and **2h** before trial ends if unpaid → needs a **cron/worker** (Tutor is `next start`, no worker yet).
- **Anti-abuse** on the public demo button (rate-limit per IP/number; ideally gate behind trial start).

## 7. Promo campaigns (MA-driven) — coupon layer
- **Tutor (this project)**: flexible **coupon/campaign-code** system — code + %/period + targeted subjects/plans → applied at Stripe checkout. + landing with **UTM attribution** (ecosystem pattern: MA Launch Plan → UTM).
- **MarketingAutomation (separate project/session)**: owns campaign content/scheduling/sends (email/WhatsApp/social), e.g. "Învață din timp! Apucă-te de învățat din vară! −X%", referencing the Tutor promo code. Decoupled.

## 8. Phased build (status)
- **A. Homepage reposition** — ✅ DONE (c0e1ae9)
- **B.** Parent page (Trio + Duo explained) + Student page — marketing + how-it-works + CTA
- **C.** Backend: Parent↔Child↔Meditator model + 4 plans + trial rules (7d / 5q-subject-day / gamification)
- **D.** Countdown −30% + Stripe coupons + meditator view of child mistakes
- **E.** WhatsApp: creds in Tutor + demo WOW + 24h/2h trial-expiry reminders (cron)
- **(MA, separate)** seasonal promo campaigns referencing Tutor coupon codes
