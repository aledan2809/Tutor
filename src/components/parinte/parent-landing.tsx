import Image from "next/image";
import Link from "next/link";
import type { EscalationChannel } from "@prisma/client";
import SubjectQuizDemo from "@/components/SubjectQuizDemo";
import { SiteHeader } from "@/components/SiteHeader";
import { Brand } from "@/components/Brand";
import type { LandingChannel } from "@/lib/parent-landing";
import { chainStepTiming, type LandingFacts, type Locale, type landingCopy } from "./landing-copy";
import { LandingStickyCta } from "./landing-sticky-cta";
import s from "./parent-landing.module.css";

export type OtherPlanRow = { key: string; name: string; seats: string; price: string };

type Copy = ReturnType<typeof landingCopy>;

const HERO_ID = "parinte-sus";
const FINAL_ID = "parinte-final";

const ICON_CLASS: Record<EscalationChannel, string> = {
  PUSH: s.icApp,
  TELEGRAM: s.icTg,
  EMAIL: s.icMail,
  WHATSAPP: s.icWa,
  SMS: s.icSms,
  CALL: s.icMail,
};

function ChannelIcon({ channel }: { channel: EscalationChannel }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (channel) {
    case "PUSH":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case "TELEGRAM":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7z" />
        </svg>
      );
    case "WHATSAPP":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z" />
        </svg>
      );
    case "SMS":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <path d="M10 18h4" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
  }
}

const TERMS_ICONS = [
  <svg key="cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>,
  <svg key="rep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>,
  <svg key="fam" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="7" r="3" /><path d="M3 21v-1a6 6 0 0 1 12 0v1" /><circle cx="17.5" cy="9.5" r="2.5" /><path d="M16 21v-.5a4.5 4.5 0 0 1 5-4.47" /></svg>,
  <svg key="one" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 7l3-2v14" /><path d="M9 19h7" /></svg>,
  <svg key="clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
];

function Cup() {
  return (
    <svg className={s.cup} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="16" width="22" height="18" rx="3" fill="#6b4226" />
      <path d="M28 20 q8 0 8 6 q0 6 -8 6" fill="none" stroke="#6b4226" strokeWidth="3" />
      <path d="M12 14 c-2 -4 2 -4 0 -8" fill="none" stroke="#b5652f" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 14 c-2 -4 2 -4 0 -8" fill="none" stroke="#b5652f" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ParentLanding({
  locale,
  copy,
  facts,
  channel,
  code,
  payHref,
  freeHref,
  otherPlans,
}: {
  locale: Locale;
  copy: Copy;
  facts: LandingFacts;
  channel: LandingChannel;
  code: string | null;
  payHref: string;
  freeHref: string;
  otherPlans: OtherPlanRow[];
}) {
  const c = copy;
  const flyer = channel === "flyer";

  return (
    <div className={s.root}>
      {/* 1. Hero — continues the flyer: the same photo in the background, the same price.
          The site header sits over the photo but outside the section: inside a section it would no
          longer be the page's header (banner) for screen readers. */}
      <div className={s.heroShell}>
      <div className={s.heroHeader}>
        <SiteHeader locale={locale} tone="light" />
      </div>
      <section className={s.hero} id={HERO_ID}>
        <div className={s.heroPhoto} aria-hidden="true">
          <Image
            src="/images/parinte/mama-cafea.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 960px) 60vw, 100vw"
            className={s.heroImg}
          />
        </div>
        <span className={`${s.pill} ${s.pillOver}`}>{c.hero.pill}</span>
        {c.hero.badge && (
          <div className={s.trialBadge} aria-label={`${c.hero.badge.big} ${c.hero.badge.mid}, ${c.hero.badge.small}`}>
            <b>{c.hero.badge.big}</b>
            <span>{c.hero.badge.mid}</span>
            <small>{c.hero.badge.small}</small>
          </div>
        )}

        <div className={s.heroSheet}>
          <span className={`${s.pill} ${s.pillInline}`}>{c.hero.pill}</span>
          {c.hero.arrival && (
            <p className={s.arrival}>
              <span className={s.tick} aria-hidden="true">✓</span>
              {c.hero.arrival}
            </p>
          )}
          <h1 className={s.heroTitle}>
            {c.hero.titleLines[0]}
            <br />
            {c.hero.titleLines[1]}
          </h1>
          <p className={s.heroSub}>{c.hero.sub}</p>

          {c.hero.price && (
            <div className={s.priceCard}>
              <Cup />
              <div className={s.prices}>
                {c.hero.oldPrice && <span className={s.old}>{c.hero.oldPrice}</span>}
                <span className={s.newPrice}>
                  {c.hero.price}
                  <sup>*</sup>
                  <small>{c.hero.perMonth}</small>
                </span>
              </div>
              {code && (
                <div className={s.codeBox}>
                  <span className={s.codeLabel}>{c.hero.codeLabel}</span>
                  <span className={s.codeChip}>
                    {code} <i aria-hidden="true">✓</i>
                  </span>
                </div>
              )}
            </div>
          )}

          <div className={s.ctaRow}>
            <Link className={s.btn} href={payHref}>
              {c.hero.ctaPay} <span aria-hidden="true">→</span>
            </Link>
            {c.hero.ctaFree && (
              <Link className={s.btnGhost} href={freeHref}>
                {c.hero.ctaFree}
              </Link>
            )}
          </div>
          <p className={s.trialLine}>
            <span aria-hidden="true">✓</span>
            {c.hero.trialLine}
          </p>
          <p className={s.fine}>{c.hero.fine}</p>
          <a className={s.scrollCue} href="#cum-functioneaza">
            {c.hero.scrollCue} <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      </div>
      <div className={s.fadeToApp} aria-hidden="true" />

      {/* 2. The parent's worries */}
      <section className={s.s}>
        <div className={s.wrap}>
          <div className={s.center}>
            <p className={s.kicker}>{c.worries.kicker}</p>
            <h2 className={s.sTitle}>{c.worries.title}</h2>
          </div>
          <div className={s.worries}>
            {c.worries.items.map((w) => (
              <article key={w.q} className={s.worry}>
                <p className={s.q}>{w.q}</p>
                <p className={s.a}>
                  <b>{c.worries.answerLead}</b> {w.a}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How it works, in detail — channels and minutes read from the engine */}
      <section className={s.s} id="cum-functioneaza">
        <div className={`${s.wrap} ${s.narrow}`}>
          <div className={s.center}>
            <p className={s.kicker}>{c.how.kicker}</p>
            <h2 className={s.sTitle}>{c.how.title}</h2>
            <p className={s.sLead}>{c.how.lead}</p>
          </div>

          <div className={s.how}>
            <div className={s.howStep}>
              <span className={s.num}>1</span>
              <h3>{c.how.step1.title}</h3>
              <div className={s.howBody}>
                <p>{c.how.step1.text}</p>
              </div>
            </div>

            <div className={s.howStep}>
              <span className={s.num}>2</span>
              <h3>{c.how.step2.title}</h3>
              <div className={s.howBody}>
                <ol className={s.chain} style={{ ["--steps" as string]: facts.chain.length }}>
                  {facts.chain.map((step, i) => (
                    <li key={step.channel} className={s.node}>
                      <span className={`${s.ic} ${ICON_CLASS[step.channel]}`}>
                        <ChannelIcon channel={step.channel} />
                      </span>
                      <b>{c.how.step2.channelLabel[step.channel]}</b>
                      <em>{chainStepTiming(step, i, locale, { morning: facts.graceMorningMin, evening: facts.graceEveningMin })}</em>
                      <span className={`${s.tag} ${step.paid ? s.tagPaid : s.tagFree}`}>
                        {step.paid ? c.how.step2.paid : c.how.step2.free}
                      </span>
                    </li>
                  ))}
                </ol>
                <div className={s.stop}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 12 3 3 5-6" />
                  </svg>
                  <span>{c.how.step2.stop}</span>
                </div>
                <ul className={s.facts}>
                  {c.how.step2.facts.map((f) => (
                    <li key={f.lead}>
                      <b>{f.lead}</b> {f.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={s.howStep}>
              <span className={s.num}>3</span>
              <h3>{c.how.step3.title}</h3>
              <div className={s.howBody}>
                <p>{c.how.step3.text}</p>
                <ul className={s.facts}>
                  {c.how.step3.facts.map((f) => (
                    <li key={f.lead}>
                      <b>{f.lead}</b> {f.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={s.howStep}>
              <span className={s.num}>4</span>
              <h3>{c.how.step4.title}</h3>
              <div className={s.howBody}>
                <p>{c.how.step4.text}</p>
                <div className={s.seeGrid}>
                  {c.how.step4.tiles.map((tile) => (
                    <div key={tile.title} className={s.see}>
                      <b>{tile.title}</b>
                      <span>{tile.text}</span>
                    </div>
                  ))}
                </div>
                <div className={s.report}>
                  <div className={s.reportH}>
                    <span className={s.ex}>{c.how.step4.report.label}</span>
                    <span>{c.how.step4.report.when}</span>
                  </div>
                  <p className={s.reportName}>{c.how.step4.report.name}</p>
                  <div className={s.reportStats}>
                    <div className={s.stOk}><b>4</b><span>{c.how.step4.report.onTime}</span></div>
                    <div className={s.stLate}><b>1</b><span>{c.how.step4.report.late}</span></div>
                    <div className={s.stMiss}><b>0</b><span>{c.how.step4.report.ignored}</span></div>
                  </div>
                  <p className={s.trend}>{c.how.step4.report.trend}</p>
                  <p className={s.weak}>
                    {c.how.step4.report.weak}{" "}
                    {c.how.step4.report.chips.map((chip) => (
                      <span key={chip} className={s.chip}>{chip}</span>
                    ))}
                  </p>
                </div>
                <p className={s.legend}>{c.how.step4.legend}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. A real quiz, no account (existing component) */}
      <section className={s.s}>
        <div className={`${s.wrap} ${s.narrow} ${s.center}`}>
          <h2 className={`${s.sTitle} ${s.sTitleSm}`}>{c.quiz.title}</h2>
          <p className={s.sLead}>{c.quiz.sub}</p>
          <div className={s.quizBox}>
            <SubjectQuizDemo locale={locale} cta={{ href: freeHref, label: c.quiz.cta ?? undefined }} />
          </div>
        </div>
      </section>

      {/* 5. From the flyer (or this page) to the app */}
      <section className={s.s}>
        <div className={s.wrap}>
          <div className={s.center}>
            <p className={s.kicker}>{c.journey.kicker}</p>
            <h2 className={s.sTitle}>{c.journey.title}</h2>
            <p className={s.sLead}>{c.journey.lead}</p>
          </div>

          <ol className={`${s.journey} ${flyer ? s.journeyFlyer : s.journeySite}`}>
            {flyer && (
              <li className={`${s.j} ${s.jFlyer}`}>
                <span className={s.jDot} aria-hidden="true">✓</span>
                <div className={s.jBody}>
                  <div className={s.jVisual}>
                    <div className={s.flyerCard}>
                      <Image src="/images/parinte/flyer-cafea.jpg" alt="" width={480} height={640} sizes="190px" />
                      <span className={s.qrRing} aria-hidden="true" />
                    </div>
                  </div>
                  <span className={s.jLabel}>{c.journey.flyerStep.label}</span>
                  <h3>{c.journey.flyerStep.title}</h3>
                  <p>{c.journey.flyerStep.text}</p>
                </div>
              </li>
            )}

            <li className={s.j}>
              <span className={s.jDot} aria-hidden="true">1</span>
              <div className={s.jBody}>
                <div className={s.jVisual} aria-hidden="true">
                  <div className={s.phone}>
                    <Brand className={s.phBrand} />
                    <p className={s.phTitle}>{c.journey.phone.signupTitle}</p>
                    {c.journey.phone.codeIncluded && <span className={s.phChip}>{c.journey.phone.codeIncluded}</span>}
                    {c.journey.phone.fields.map(([label, value]) => (
                      <div key={label} className={s.phField}>
                        <span>{label}</span>
                        <i>{value}</i>
                      </div>
                    ))}
                    <div className={s.phBtn}>{c.journey.phone.signupButton}</div>
                  </div>
                </div>
                <span className={s.jLabel}>{c.journey.steps[0].label}</span>
                <h3>{c.journey.steps[0].title}</h3>
                <p>{c.journey.steps[0].text}</p>
              </div>
            </li>

            <li className={s.j}>
              <span className={s.jDot} aria-hidden="true">2</span>
              <div className={s.jBody}>
                <div className={s.jVisual} aria-hidden="true">
                  <div className={s.phone}>
                    <p className={s.phTitle}>{c.journey.phone.plansTitle}</p>
                    <div className={s.phPlan}>
                      <div className={s.phPlanH}>
                        <b>Family</b>
                        {c.journey.phone.planBadge && <span className={s.phBadge}>{c.journey.phone.planBadge}</span>}
                      </div>
                      <p className={s.phDim}>{c.journey.phone.planSeats}</p>
                      <p className={s.phPrice}>
                        {c.journey.phone.planOld && <s>{c.journey.phone.planOld}</s>} <b>{c.journey.phone.planPrice}</b> {c.journey.phone.planPer}
                      </p>
                      <p className={s.phDim}>{c.journey.phone.planNote}</p>
                    </div>
                    <div className={s.phBtn}>{c.journey.phone.planButton}</div>
                    <p className={s.phFoot}>{c.journey.phone.planFoot}</p>
                  </div>
                </div>
                <span className={s.jLabel}>{c.journey.steps[1].label}</span>
                <h3>{c.journey.steps[1].title}</h3>
                <p>{c.journey.steps[1].text}</p>
              </div>
            </li>

            <li className={s.j}>
              <span className={s.jDot} aria-hidden="true">3</span>
              <div className={s.jBody}>
                <div className={s.jVisual} aria-hidden="true">
                  <div className={s.phone}>
                    <p className={s.phTitle}>{c.journey.phone.inviteTitle}</p>
                    <p className={s.phDim}>{c.journey.phone.inviteText}</p>
                    <div className={s.phCode}>K7M 2QX</div>
                    <div className={s.phRow}>
                      <div className={s.phBtn}>{c.journey.phone.inviteSend}</div>
                      <div className={`${s.phBtn} ${s.phBtnGhost}`}>{c.journey.phone.inviteCopy}</div>
                    </div>
                    <p className={s.phJoined}>
                      👦 Andrei · <span className={s.phOk}>{c.journey.phone.inviteJoined}</span>
                    </p>
                  </div>
                </div>
                <span className={s.jLabel}>{c.journey.steps[2].label}</span>
                <h3>{c.journey.steps[2].title}</h3>
                <p>{c.journey.steps[2].text}</p>
              </div>
            </li>

            <li className={s.j}>
              <span className={s.jDot} aria-hidden="true">4</span>
              <div className={s.jBody}>
                <div className={s.jVisual} aria-hidden="true">
                  <div className={s.phone}>
                    <div className={s.phLock}>
                      <p className={s.phTime}>{c.journey.phone.lockTime}</p>
                      <p className={s.phDate}>{c.journey.phone.lockDate}</p>
                      <div className={s.phNotif}>
                        <b>{c.journey.phone.notifFrom}</b>
                        <span>{c.journey.phone.notifText}</span>
                      </div>
                    </div>
                    <div className={s.phMiniReport}>
                      <p className={s.phDim} style={{ marginTop: 0 }}>{c.journey.phone.miniReport}</p>
                      <div className={s.phMiniRow}>
                        <div><b style={{ color: "#34d399" }}>4</b><span>{c.how.step4.report.onTime}</span></div>
                        <div><b style={{ color: "#fbbf24" }}>1</b><span>{c.how.step4.report.late}</span></div>
                        <div><b style={{ color: "#f87171" }}>0</b><span>{c.how.step4.report.ignored}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <span className={s.jLabel}>{c.journey.steps[3].label}</span>
                <h3>{c.journey.steps[3].title}</h3>
                <p>{c.journey.steps[3].text}</p>
              </div>
            </li>
          </ol>

          <div className={`${s.center} ${s.journeyCta}`}>
            <Link className={s.btn} href={payHref}>
              {c.hero.ctaPay} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. The offer, in plain words */}
      <section className={s.s}>
        <div className={s.wrap}>
          <div className={s.center}>
            <p className={s.kicker}>{c.offer.kicker}</p>
            <h2 className={s.sTitle}>{c.offer.title}</h2>
          </div>

          <div className={s.offerGrid}>
            <div className={s.planCard}>
              <div className={s.planTop}>
                <span className={s.planName}>Family</span>
                <span className={s.planSeats}>{c.offer.planSeats}</span>
              </div>
              {c.offer.planFlag && <span className={s.planFlag}>{c.offer.planFlag}</span>}
              {c.offer.planPrice && (
                <div className={s.planPrice}>
                  {c.offer.planOld && <s>{c.offer.planOld}</s>}
                  <b>{c.offer.planPrice}</b>
                  <span>{c.offer.planPer}</span>
                </div>
              )}
              <p className={s.planNote}>{c.offer.planNote}</p>
              <ul className={s.ticks}>
                {c.offer.ticks.map((tick) => (
                  <li key={tick}>{tick}</li>
                ))}
              </ul>
              <Link className={s.btn} href={payHref}>
                {c.offer.ctaPay} <span aria-hidden="true">→</span>
              </Link>
              {c.offer.ctaFree && (
                <Link className={s.alt} href={freeHref}>
                  {c.offer.ctaFree}
                </Link>
              )}
            </div>

            <div className={s.offerSide}>
              {c.offer.terms && code && (
                <div className={s.terms}>
                  <h3>
                    {c.offer.terms.title[0]} <span className={s.codeChip}>{code}</span>, {c.offer.terms.title[1]}
                  </h3>
                  <ul>
                    {c.offer.terms.items.map((item, i) => (
                      <li key={item.lead}>
                        <span className={s.termsIcon}>{TERMS_ICONS[Math.min(i, TERMS_ICONS.length - 1)]}</span>
                        <span>
                          <b>{item.lead}</b>
                          {item.text ? ` ${item.text}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {otherPlans.length > 0 && (
                <div className={s.others}>
                  <h3>{c.offer.othersTitle}</h3>
                  <div className={s.othersGrid}>
                    {otherPlans.map((p) => (
                      <div key={p.key} className={s.o}>
                        <b>{p.name}</b>
                        <span>{p.seats}</span>
                        <em>
                          {p.price} lei <small>{c.offer.planPer}</small>
                        </em>
                      </div>
                    ))}
                  </div>
                  <p className={s.dim}>
                    {c.offer.othersNote}{" "}
                    <Link className={s.dimLink} href={`/${locale}/elev`}>
                      {c.offer.studentLink}
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Questions parents ask */}
      <section className={s.s}>
        <div className={`${s.wrap} ${s.narrow}`}>
          <h2 className={`${s.sTitle} ${s.center}`}>{c.faq.title}</h2>
          <div className={s.faq}>
            {c.faq.items.map((item, i) => (
              <details key={item.q} open={i === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. The last call, with the photo in the background */}
      <section className={s.final} id={FINAL_ID}>
        <div className={s.finalPhoto} aria-hidden="true">
          <Image src="/images/parinte/mama-cafea.jpg" alt="" fill sizes="(min-width: 960px) 58vw, 100vw" className={s.finalImg} />
        </div>
        <div className={`${s.wrap} ${s.finalInner}`}>
          <p className={s.kicker}>{c.final.kicker}</p>
          <h2 className={s.finalTitle}>
            {c.final.titleLines[0]}
            <br />
            {c.final.titleLines[1]}
          </h2>
          <p className={s.finalSub}>{c.final.sub}</p>
          {c.final.price && (
            <div className={s.finalPrice}>
              {c.final.oldPrice && <s>{c.final.oldPrice}</s>}
              <b>{c.final.price}</b>
              <span>{c.final.per}</span>
            </div>
          )}
          <div className={s.ctaRow}>
            <Link className={s.btn} href={payHref}>
              {c.final.ctaPay} <span aria-hidden="true">→</span>
            </Link>
            {c.final.ctaFree && (
              <Link className={`${s.btnGhost} ${s.btnGhostOnDark}`} href={freeHref}>
                {c.final.ctaFree}
              </Link>
            )}
          </div>
          <p className={s.fine}>{c.final.fine}</p>
        </div>
      </section>

      <p className={s.identity}>{c.identity}</p>

      <LandingStickyCta
        href={payHref}
        price={c.sticky.price}
        sub={c.sticky.sub}
        cta={c.sticky.cta}
        heroId={HERO_ID}
        finalId={FINAL_ID}
      />
    </div>
  );
}
