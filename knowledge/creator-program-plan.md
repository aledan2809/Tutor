# Tutor — Creator Program (revenue-share) + recruitment plan

> **Status: PLANNED — execution DEFERRED until the platform domain is decided** (user is
> trying to secure `tutor.com`). Until then: market the IDEA only, no platform URL exposed.
> Created 2026-05-26.

## Changelog
- [2026-05-26] v1.0: Initial plan (program model + subjects + idea-first recruitment + creator page).

---

## 1. The program — content creators with perpetual commissions

**Offer:** an educator/expert adds content (question banks/grile, lessons, bibliography) for a
subject → earns a **perpetual commission** from the revenue attributable to their content, for
as long as it keeps generating paying users.

**Attribution model (recommended):**
- **Pro-rata by consumption**: each month, a subscriber's revenue is split among creators in
  proportion to how much of each creator's content the subscriber used (questions solved /
  lessons viewed) that month. Fair for a subscription model where a learner uses content from
  several creators.
- **Perpetual**: the creator keeps earning while their content is used (not a one-time payment).
- **Rate (proposed):** ~**40% of net attributable revenue** (in line with edu marketplaces;
  tunable against Tutor's existing Stripe plan pricing).
- **Payouts:** Stripe Connect (Express) → monthly payout above a threshold (e.g. 100 RON).
- **Quality gate:** ADMIN review/approval before publish + rating → commissions tied to good content.

**Product build required (separate from promotion):** Creator account/role, content→creator
attribution, consumption tracking, monthly commission calc, Stripe Connect payouts, creator
dashboard. *(Estimate on request.)*

Tutor today = practice/grile platform organised **domain → subject → topic**, roles
Student/Instructor/Admin/SuperAdmin, Stripe subscription plans (SuperAdmin: plans/revenue/vouchers).
Existing vertical: **Drept** (INM/Barou — "Udroiu" references). No creator-commission model yet.

## 2. Subjects (RO market, prioritised)

| Priority | Subject / vertical | Why |
|---|---|---|
| 1 | Drept — INM / Barou / Admitere | base already exists (Udroiu); high willingness to pay |
| 2 | Medicină — Rezidențiat / Admitere UMF | huge grile market |
| 3 | Bacalaureat (Mate, Română, Istorie, Bio, Info) | high volume, seasonal |
| 4 | Permis auto — legislație | massive volume, standardised content |
| 5 | Certificări IT / Limbi străine (Cambridge/IELTS) | niches with paying power |

## 3. Recruitment promotion — IDEA-FIRST (no platform URL)

**Principle:** the teaser sells the concept (perpetual commissions for educators) and sends to
the **creator page** (NOT the platform). Platform + domain stay hidden until ready. Collect a
**waitlist** → convert once domain + onboarding are live.

- **Audience:** teachers / subject experts (recruiting CREATORS, not students).
- **Channel:** TeInformez FB page (cross-promo) + LinkedIn (educators — currently manual, not wired to MA).
- **Structure:** 1 subject/week, rotating priorities; **deferred start** (proposed ~early July,
  after current campaigns end ~22 Jun).
- **Per-week arc:** pain ("your teaching expertise, unmonetised") → offer ("perpetual commission
  from what you teach") → mechanics ("transparent, here's how") → CTA ("apply as a creator on your subject").
- **CTA destination (per user 2026-05-26):** the **creator page + waitlist** — NO link to the
  current `tutor.knowbest.ro`.

## 4. Creator page (separate, stable URL) — DEFERRED to new domain

Per user 2026-05-26: **do not build until the new domain is decided** (then host it on the final
domain, e.g. `tutor.com/creatori`). Spec for when we build:
- Hero: "Predai? Transformă-ți expertiza în venit recurent." (concept-first, brand minimal)
- How it works (3 steps): add content on your subject → learners use it → earn perpetual commission
- Commission model (transparent): ~40% attributable, perpetual, monthly payouts
- Open subjects + FAQ (eligibility, calculation, payouts, exclusivity)
- Waitlist/apply form: name, email, subject, short experience

## 5. Phasing

1. **Now:** plan persisted (this doc). Nothing marketed.
2. **When domain decided:** build creator page on the final domain + waitlist form.
3. **Then:** launch idea-first teaser campaign (rotating subjects) → CTA = creator page/waitlist.
4. **Later:** build the commission/Stripe-Connect product → activate waitlisted creators → full launch.

## Open decisions / blockers
- **Domain** (tutor.com or alternative) — blocks the creator page + teaser CTA.
- Commission rate confirmation vs current plan pricing.
- LinkedIn channel for educator reach (not wired to MA; manual for now).
