/**
 * What the 7-day trial and the pause look like in the dashboard (mockup approved 16.09.2026:
 * Reports/proba-zi8-control-parinte-2026-09-16).
 *
 * - A child is never shown a price or asked to get a parent to pay (EU: UCPD Annex I point 28).
 *   The offer goes to whoever pays: the parent, or a learner who pays for themselves.
 * - Numbers are real; what is blurred is a drawn placeholder, never hidden data (access-teaser.ts).
 */
import Link from "next/link";
import { fmtPrice } from "@/lib/pricing";
import { countRo } from "@/lib/ro-count";
import type { TeaserOffer, TeaserStats } from "@/lib/access-teaser";
import type { SeatHolderNote } from "@/lib/access-server";
import { firstName, holderWords } from "@/components/access/holder-words";

type Locale = "ro" | "en";

const card = "rounded-2xl border border-gray-800 bg-gray-900 p-5";

function Kpis({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {items.map((k) => (
        <div key={k.label} className="rounded-xl border border-gray-800 bg-gray-950/60 px-2 py-3 text-center">
          <b className="block text-xl text-white">{k.value}</b>
          <span className="text-[11px] text-gray-400">{k.label}</span>
        </div>
      ))}
    </div>
  );
}

/** A blurred placeholder with a lock label. The rows are drawn, not data. */
function Veiled({ label, kind }: { label: string; kind: "rows" | "chart" | "chips" }) {
  return (
    <div className="relative mt-2">
      <div aria-hidden="true" className="pointer-events-none select-none blur-[5px]">
        {kind === "rows" && (
          <ul className="space-y-2">
            {[64, 44, 80].map((w) => (
              <li key={w} className="flex justify-between">
                <span className="h-3 rounded bg-gray-700" style={{ width: `${w}%` }} />
                <span className="h-3 w-8 rounded bg-gray-700" />
              </li>
            ))}
          </ul>
        )}
        {kind === "chart" && (
          <div className="flex h-16 items-end gap-1.5">
            {[30, 48, 42, 65, 72, 86].map((h) => (
              <i key={h} className="flex-1 rounded-t bg-blue-600" style={{ height: `${h}%` }} />
            ))}
          </div>
        )}
        {kind === "chips" && (
          <div className="flex gap-2">
            {[56, 44, 70].map((w) => (
              <span key={w} className="h-6 rounded-full bg-gray-700" style={{ width: `${w}px` }} />
            ))}
          </div>
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-full border border-gray-700 bg-gray-950/85 px-3 py-1 text-xs text-gray-300">🔒 {label}</span>
      </div>
    </div>
  );
}

function OfferCard({ offer, locale, planName, cta }: { offer: TeaserOffer; locale: Locale; planName: string; cta: string }) {
  const ro = locale === "ro";
  const lei = (n: number) => fmtPrice(n, locale);
  return (
    <div className="mt-3">
      <p className="text-2xl font-bold text-white">
        {offer.code && <s className="mr-2 text-base font-medium text-gray-500">{lei(offer.normal)} lei</s>}
        {lei(offer.price)} lei <span className="text-sm font-normal text-gray-400">{ro ? "/ lună" : "/ month"}</span>
      </p>
      {offer.code && (
        <p className="mt-0.5 text-xs text-gray-400">
          {ro ? "cu codul" : "with code"}{" "}
          <span className="rounded border border-dashed border-amber-400/70 px-1.5 font-semibold text-amber-300">{offer.code}</span>
          {ro ? " · anulezi oricând" : " · cancel any time"}
        </p>
      )}
      <Link
        href={`/${locale}/dashboard/packages?plan=${offer.planKey}${offer.code ? `&voucher=${offer.code}` : ""}`}
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
        aria-label={`${cta} — ${planName}`}
      >
        {cta}
      </Link>
    </div>
  );
}

/** Trial countdown for whoever pays (never shown to a child whose parent pays). */
export function TrialBanner({
  locale,
  daysLeft,
  audience,
  pauseOn,
  holder = null,
}: {
  locale: Locale;
  daysLeft: number;
  audience: "parent" | "self";
  /** The day-8 pause is switched on; off, the account keeps the free tier after the trial. */
  pauseOn: boolean;
  /** Another parent's plan already covers the children but leaves this parent out: no Family offer. */
  holder?: SeatHolderNote | null;
}) {
  const ro = locale === "ro";
  const days = ro ? (daysLeft === 1 ? "mai ai o zi" : `mai ai ${daysLeft} zile`) : daysLeft === 1 ? "one day left" : `${daysLeft} days left`;
  const after = pauseOn
    ? ro
      ? "Când se termină proba, contul intră în pauză; tot ce ai lucrat rămâne salvat."
      : "When the trial ends the account is paused; everything you did stays saved."
    : ro
      ? "Când se termină proba, rămâi pe varianta gratuită; tot ce ai lucrat rămâne salvat."
      : "When the trial ends you keep the free tier; everything you did stays saved.";
  const left = audience === "parent" && holder ? holderWords(holder, ro) : null;
  const text = left
    ? ro
      ? `Ai tot pachetul cât ține proba. ${left.plan} După probă contul tău ${pauseOn ? "intră în pauză" : "rămâne pe varianta gratuită"}, iar copilul continuă normal. ${holder?.upgrade ? `Ca să rămâi în pachet, ${left.who} poate trece pe ${holder.upgrade}.` : left.noLargerPlan}`
      : `You have the whole package during the trial. ${left.plan} After the trial your account ${pauseOn ? "is paused" : "keeps the free tier"}, while your child carries on as usual. ${holder?.upgrade ? `To stay on the plan, ${left.who} can move to ${holder.upgrade}.` : left.noLargerPlan}`
    : audience === "parent"
      ? ro
        ? "Ai tot pachetul Family. Reminderele pe WhatsApp și SMS pornesc când pui cardul — nu plătești nimic până se termină proba."
        : "You have the whole Family package. WhatsApp and SMS reminders start once you add your card — you pay nothing until the trial ends."
      : ro
        ? `Ai tot pachetul, în afară de WhatsApp și SMS. ${after}`
        : `You have the whole package except WhatsApp and SMS. ${after}`;
  const href = `/${locale}/dashboard/packages?plan=${audience === "parent" ? "FAMILY" : "ELEV"}`;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-900/60 bg-blue-950/30 px-4 py-3 text-sm">
      <p className="text-blue-100">
        <span className="mr-2 rounded-full border border-blue-700/60 bg-blue-900/40 px-2 py-0.5 text-xs font-semibold text-blue-200">
          {ro ? "Proba gratuită" : "Free trial"} · {days}
        </span>
        <span className="text-blue-200/80">{text}</span>
      </p>
      {!left && (
        <Link href={href} className="shrink-0 rounded-lg border border-blue-700/60 px-3 py-1.5 text-xs font-semibold text-blue-100 hover:bg-blue-900/40">
          {audience === "parent" ? (ro ? "Continuă cu Family" : "Continue with Family") : ro ? "Vezi pachetele" : "See the plans"}
        </Link>
      )}
    </div>
  );
}

/** A learner's dashboard page while the account is paused. */
export function PausedLearnerScreen({
  locale,
  name,
  stats,
  payer,
  parentName,
  offer,
}: {
  locale: Locale;
  name: string | null;
  stats: TeaserStats;
  payer: "self" | "parent";
  parentName: string | null;
  offer: TeaserOffer | null;
}) {
  const ro = locale === "ro";
  return (
    <div className="mx-auto max-w-md space-y-3">
      <h1 className="text-2xl font-bold text-white">{ro ? `Salut${firstName(name) ? `, ${firstName(name)}` : ""}!` : `Hi${firstName(name) ? `, ${firstName(name)}` : ""}!`}</h1>
      <div className={card}>
        <span className="rounded-full border border-gray-600 bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-200">
          {ro ? "Perioada de probă s-a încheiat" : "The trial has ended"}
        </span>
        <p className="mt-3 text-sm text-gray-300">
          {ro ? "Contul tău e în pauză. Tot ce ai lucrat e salvat și te așteaptă." : "Your account is paused. Everything you did is saved and waiting for you."}
        </p>
        <Kpis
          items={[
            { value: String(stats.streak), label: ro ? "zile la rând" : "day streak" },
            { value: String(stats.exercises), label: ro ? "exerciții" : "exercises" },
            { value: stats.level ?? "—", label: ro ? "nivel" : "level" },
          ]}
        />
      </div>

      {payer === "self" && offer && (
        <div className={card}>
          <h2 className="font-semibold text-white">{ro ? "Pachetul Elev" : "The Student plan"}</h2>
          <p className="mt-1 text-sm text-gray-400">
            {ro ? "Exerciții, explicații complete, simulări de examen și grafice de progres." : "Exercises, full explanations, exam simulations and progress charts."}
          </p>
          <OfferCard offer={offer} locale={locale} planName="Elev" cta={ro ? "Vezi pachetul" : "See the plan"} />
          <p className="mt-2 text-xs text-gray-500">{ro ? "Anulezi oricând." : "Cancel any time."}</p>
        </div>
      )}

      <div className={card}>
        <h2 className="font-semibold text-white">{ro ? "Progresul tău pe capitole" : "Your progress by topic"}</h2>
        <Veiled kind="rows" label={ro ? "În pauză" : "Paused"} />
      </div>

      <div className={card}>
        <h2 className="font-semibold text-white">{ro ? "Exerciții, simulări, lecții" : "Exercises, simulations, lessons"}</h2>
        <p className="mt-1 text-sm text-gray-400">{ro ? "Revin când se reia accesul." : "They come back when access resumes."}</p>
      </div>

      {payer === "parent" && (
        <p className="px-1 text-xs text-gray-500">
          {ro
            ? `Accesul se reia când ${parentName ?? "părintele tău"} activează pachetul.`
            : `Access resumes when ${parentName ?? "your parent"} activates the plan.`}
        </p>
      )}
    </div>
  );
}

export type PausedChild = { id: string; name: string | null; stats: TeaserStats };

/** The parent's view of the family while the account is paused. */
export function PausedParentScreen({
  locale,
  kids,
  offer,
  holder = null,
}: {
  locale: Locale;
  kids: PausedChild[];
  offer: TeaserOffer | null;
  /** Another parent's plan covers the children but leaves this parent out: say so, offer nothing. */
  holder?: SeatHolderNote | null;
}) {
  const ro = locale === "ro";
  const first = firstName(kids[0]?.name);
  const left = holder ? holderWords(holder, ro) : null;
  const unlock = left ? (ro ? "când intri în pachet" : "once you're on the plan") : ro ? "după activare" : "after activation";
  return (
    <div className="mx-auto max-w-md space-y-3">
      <div className="rounded-2xl border border-amber-500/40 bg-gray-900 p-5">
        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
          {ro ? "Proba gratuită s-a încheiat" : "The free trial has ended"}
        </span>
        {left ? (
          <p className="mt-3 text-sm text-gray-300">
            {ro
              ? `${left.plan} Contul tău e în pauză, iar ${first ?? "copilul"} exersează în continuare. ${holder?.upgrade ? `Ca să vezi din nou progresul și să primești alertele, ${left.who} poate trece pe ${holder.upgrade} — atunci intri și tu în pachet, fără plată separată.` : left.noLargerPlan}`
              : `${left.plan} Your account is paused, while ${first ?? "your child"} keeps practising. ${holder?.upgrade ? `To see the progress and get alerts again, ${left.who} can move to ${holder.upgrade} — you're then on the plan too, with nothing to pay separately.` : left.noLargerPlan}`}
          </p>
        ) : (
          <p className="mt-3 text-sm text-gray-300">
            {ro
              ? `Tot ce a lucrat ${first ?? "copilul"} e păstrat. Vezi din nou totul, iar ${first ?? "copilul"} poate exersa din nou, imediat ce activezi pachetul.`
              : `Everything ${first ?? "your child"} did is kept. You see it all again, and ${first ?? "your child"} can practise again, as soon as you activate the plan.`}
          </p>
        )}
        {offer && !left && <OfferCard offer={offer} locale={locale} planName="Family" cta={ro ? "Activează Family" : "Activate Family"} />}
      </div>

      {kids.map((child) => (
        <div key={child.id} className="space-y-3">
          <h2 className="px-1 pt-2 text-lg font-semibold text-white">{child.name ?? (ro ? "Copilul tău" : "Your child")}</h2>
          <div className={card}>
            <h3 className="font-semibold text-white">{ro ? "Săptămâna de probă" : "The trial week"}</h3>
            <Kpis
              items={[
                { value: `${child.stats.practicedDays}/7`, label: ro ? "zile cu exerciții" : "days with exercises" },
                { value: String(child.stats.exercises), label: ro ? "exerciții" : "exercises" },
                { value: String(child.stats.streak), label: ro ? "zile la rând" : "day streak" },
              ]}
            />
          </div>
          {child.stats.weakTopics > 0 && (
            <div className={card}>
              <h3 className="font-semibold text-white">
                {ro
                  ? `Greșește des la ${countRo(child.stats.weakTopics, "un capitol", "capitole")}`
                  : child.stats.weakTopics === 1
                    ? "Often gets one topic wrong"
                    : `Often gets ${child.stats.weakTopics} topics wrong`}
              </h3>
              <Veiled kind="chips" label={ro ? `Care capitole — ${unlock}` : `Which topics — ${unlock}`} />
            </div>
          )}
          <div className={card}>
            <h3 className="font-semibold text-white">{ro ? "Raportul săptămânii" : "The weekly report"}</h3>
            <Veiled kind="chart" label={ro ? `Raportul — ${unlock}` : `The report — ${unlock}`} />
          </div>
          <div className={card}>
            <h3 className="font-semibold text-white">{ro ? "Reminderele și alertele" : "Reminders and alerts"}</h3>
            <p className="mt-1 text-sm text-gray-400">
              {left
                ? ro
                  ? `${firstName(child.name) ?? "Copilul"} primește în continuare reminderele din program; tu nu mai primești alerte cât contul tău e în pauză.`
                  : `${firstName(child.name) ?? "Your child"} still gets the scheduled reminders; you get no alerts while your account is paused.`
                : ro
                  ? `În pauză: ${firstName(child.name) ?? "copilul"} nu mai primește reminderele din program, iar tu nu mai primești alerte.`
                  : `Paused: ${firstName(child.name) ?? "your child"} no longer gets the scheduled reminders, and you get no alerts.`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
