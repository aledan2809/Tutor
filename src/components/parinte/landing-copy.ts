/**
 * Words of the parents' page (/parinte), RO + EN. Every number is passed in — from the engine's
 * config, the free-trial rule and the database — so a change there rewrites the page instead of
 * leaving it quietly wrong (the old page promised „WhatsApp" only and a promo that had ended).
 *
 * Plain language on purpose: the reader is a parent who just scanned a flyer, not a user of the app.
 */
import type { EscalationChannel } from "@prisma/client";
import type { ChainStep, LandingChannel, LandingOffer } from "@/lib/parent-landing";
import { discountedMinorUnits } from "@/lib/voucher-checkout";
import { fmtPrice } from "@/lib/pricing";
import { countRo } from "@/lib/ro-count";

export type Locale = "ro" | "en";

export type LandingFacts = {
  /** Free days this visitor would still get at checkout (0 when a signed-in account has used them). */
  freeTrialDays: number;
  /** The whole free period, counted once per account. */
  trialTotalDays: number;
  /** The day-8 pause is switched on (access.ts). Off, an unpaid account keeps the free tier instead. */
  pauseOn: boolean;
  chain: ChainStep[];
  /** Minutes between channels for a morning / an evening study reminder. */
  graceMorningMin: number;
  graceEveningMin: number;
  quietStart: string;
  quietEnd: string;
  gentleEmailAfterMin: number;
  standardStepMin: number;
  insistentStepMin: number;
  parentAlertAfterMin: number;
  parentRenotifyMin: number;
  nudgeMaxAgeHours: number;
  /** A parent's repeating reminder also stops after this many sends (often well before the hours). */
  nudgeMaxFires: number;
  onTimeWindowMin: number;
  inviteValidDays: number;
  secondChildPct: number;
  thirdChildPct: number;
};

export type LandingContext = {
  facts: LandingFacts;
  offer: LandingOffer | null;
  channel: LandingChannel;
  /** The Family plan's normal monthly price (minor units), null if the plan isn't active. */
  familyNormalMinor: number | null;
  /** Both campaign codes are valid with identical conditions — the page may say so. */
  codesAlike: boolean;
  flyerCode: string;
  onlineCode: string;
  /** The offer's code only discounts Family (so it doesn't apply to the other plans). */
  codeFamilyOnly: boolean;
  /** The visitor already has an account and is signed in. */
  signedIn: boolean;
  /** The channel's own code was used on this account, so the page offers the other one (pickLandingCode). */
  codeSwapped?: boolean;
};

export type Lead = { lead: string; text: string };

const price = (minor: number, locale: Locale) => fmtPrice(minor / 100, locale);

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

const minutesRo = (n: number) => countRo(n, "un minut", "minute");
const hoursRo = (n: number) => countRo(n, "o oră", "ore");
const daysRo = (n: number) => countRo(n, "o zi", "zile");
const minutesEn = (n: number) => (n === 1 ? "one minute" : `${n} minutes`);
const hoursEn = (n: number) => (n === 1 ? "one hour" : `${n} hours`);
const daysEn = (n: number) => (n === 1 ? "one day" : `${n} days`);

/**
 * How the free days are said. A new visitor gets the whole period („Primele 7 zile sunt gratuite");
 * a signed-in account gets what it has left („Mai ai 4 zile gratuite").
 */
function trialWords(locale: Locale, n: number, remaining: boolean) {
  if (locale === "ro") {
    const short = n === 1 ? "o zi gratuită" : `${daysRo(n)} gratuite`;
    return {
      short,
      sentence: remaining
        ? `Mai ai ${short}`
        : n === 1
          ? "Prima zi e gratuită"
          : `Primele ${daysRo(n)} sunt gratuite`,
      lead: remaining ? `Încă ${short}` : n === 1 ? "Prima zi gratuită" : `Primele ${short}`,
      start: `Începe cu ${short}`,
      badge: { big: n === 1 ? "1 ZI" : `${n} ZILE`, mid: n === 1 ? "GRATUITĂ" : "GRATUITE" },
    };
  }
  const short = n === 1 ? "one free day" : `${n} free days`;
  return {
    short,
    sentence: remaining ? `You have ${short} left` : n === 1 ? "The first day is free" : `The first ${n} days are free`,
    lead: remaining ? (n === 1 ? "One more free day" : `${n} more free days`) : n === 1 ? "The first day free" : `The first ${n} days free`,
    start: `Start with ${short}`,
    badge: { big: n === 1 ? "1 DAY" : `${n} DAYS`, mid: "FREE" },
  };
}

/** Title and description for the page and for its link previews (WhatsApp, Facebook). */
export function landingMeta(locale: Locale, freeTrialDays: number): { title: string; description: string; imageAlt: string } {
  const trial = freeTrialDays > 0 ? ` ${trialWords(locale, freeTrialDays, false).sentence}.` : "";
  return locale === "ro"
    ? {
        title: "Pentru părinți — liniștea ta, cât o cafea pe lună | eTutor.ro",
        description: `Vezi în fiecare zi ce a lucrat copilul și unde greșește, fără să-l mai întrebi tu.${trial}`,
        imageAlt: "Femeie zâmbind, cu o cafea în mână",
      }
    : {
        title: "For parents — peace of mind for the price of a coffee | eTutor.ro",
        description: `See every day what your child worked on and where they get it wrong, without having to ask.${trial}`,
        imageAlt: "Smiling woman holding a coffee",
      };
}

function formatDate(d: Date, locale: Locale, style: "short" | "long"): string {
  return new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-GB", {
    timeZone: "Europe/Bucharest",
    ...(style === "short" ? { day: "2-digit", month: "2-digit", year: "numeric" } : { day: "numeric", month: "long", year: "numeric" }),
  }).format(d);
}

const CHANNEL_LABEL: Record<Locale, Record<EscalationChannel, string>> = {
  ro: { PUSH: "Notificare în aplicație", TELEGRAM: "Telegram", EMAIL: "Email", WHATSAPP: "WhatsApp", SMS: "SMS", CALL: "Apel" },
  en: { PUSH: "In-app notification", TELEGRAM: "Telegram", EMAIL: "Email", WHATSAPP: "WhatsApp", SMS: "Text message (SMS)", CALL: "Call" },
};

/**
 * When a step of the chain goes out. The wait between channels follows the reminder's time of day
 * (short in the morning, longer in the evening — see CASCADE_GRACE_MINUTES), so it is shown as that
 * range rather than one number the engine doesn't use for study reminders.
 */
export function chainStepTiming(
  step: ChainStep,
  index: number,
  locale: Locale,
  grace: { morning: number; evening: number },
): string {
  const ro = locale === "ro";
  // Word joiners keep „6–18" on one line inside the narrow chain boxes.
  const span = grace.morning === grace.evening ? `${grace.morning}` : `${grace.morning}⁠–⁠${grace.evening}`;
  let when: string;
  if (index === 0) when = ro ? "imediat" : "straight away";
  else if (index === 1) when = ro ? `după ${span} minute` : `after ${span} minutes`;
  else when = ro ? `după încă ${span} minute` : `after another ${span} minutes`;
  if (step.maxPerDay) {
    const n = step.maxPerDay;
    when += ro ? ` · cel mult ${n === 1 ? "unul" : n} pe zi` : ` · at most ${n === 1 ? "one" : n} a day`;
  }
  return when;
}

export function landingCopy(locale: Locale, ctx: LandingContext) {
  const ro = locale === "ro";
  const { facts, offer } = ctx;
  const n = facts.freeTrialDays;
  const hasTrial = n > 0;
  const trial = trialWords(locale, n, ctx.signedIn && n < facts.trialTotalDays);
  const flyer = ctx.channel === "flyer";
  const code = offer?.code ?? null;
  const offerPrice = offer ? price(offer.discountedMinor, locale) : null;
  const normalPrice = offer ? price(offer.normalMinor, locale) : ctx.familyNormalMinor ? price(ctx.familyNormalMinor, locale) : null;
  const mainPrice = offerPrice ?? normalPrice;
  const expiresShort = offer?.expiresAt ? formatDate(offer.expiresAt, locale, "short") : null;
  const expiresLong = offer?.expiresAt ? formatDate(offer.expiresAt, locale, "long") : null;
  const hasTelegram = facts.chain.some((s) => s.channel === "TELEGRAM");

  const trialRule = hasTrial
    ? ro
      ? ` Zilele gratuite, ${facts.trialTotalDays} în total, se socotesc de la crearea contului.`
      : ` The free days, ${facts.trialTotalDays} in all, count from the day the account is created.`
    : "";
  const fine = ro
    ? offer
      ? `*Family (1 părinte + 1 copil), pentru o materie. Activezi codul ${code}${expiresShort ? ` până la ${expiresShort}` : ""}; ${
          offer.recurring ? "reducerea rămâne în fiecare lună cât ții abonamentul ales atunci" : "reducerea se aplică la prima plată"
        }. Fiecare cod se folosește o singură dată pe cont.${trialRule}`
      : `*Family (1 părinte + 1 copil), pentru o materie.${trialRule}`
    : offer
      ? `*Family (1 parent + 1 child), for one subject. Activate code ${code}${expiresShort ? ` by ${expiresShort}` : ""}; ${
          offer.recurring ? "the discount stays on every monthly payment for as long as you keep that subscription" : "the discount applies to the first payment"
        }. Each code can be used once per account.${trialRule}`
      : `*Family (1 parent + 1 child), for one subject.${trialRule}`;

  const ctaPay = mainPrice ? (ro ? `Începe cu ${mainPrice} lei/lună` : `Start with ${mainPrice} lei/month`) : ro ? "Începe cu Family" : "Start with Family";
  // Without free days left there is nothing to try without a card.
  const ctaFree = hasTrial ? (ro ? "Încearcă fără card" : "Try without a card") : null;

  return {
    hero: {
      pill: ro ? "Pentru părinți" : "For parents",
      arrival: code
        ? ctx.codeSwapped
          ? ro
            ? `Codul ${code} se aplică singur`
            : `Code ${code} applies by itself`
          : ro
            ? flyer ? `Codul ${code} de pe flyer e deja pus` : `Codul online ${code} se aplică singur`
            : flyer ? `The ${code} code from the flyer is already in` : `Online code ${code} applies by itself`
        : null,
      titleLines: ro ? ["Liniștea ta,", "cât o cafea pe lună."] : ["Peace of mind,", "for the price of a coffee."],
      sub: ro
        ? "Vezi azi ce a lucrat copilul tău și cum progresează, din telefon — nu doar ce-ți spune el."
        : "See today what your child worked on and how they are doing, from your phone — not just what they tell you.",
      oldPrice: offer ? `${normalPrice} lei` : null,
      price: mainPrice ? `${mainPrice} lei` : null,
      perMonth: ro ? "/ lună" : "/ month",
      codeLabel: ro ? "cu codul" : "with code",
      ctaPay,
      ctaFree,
      trialLine: hasTrial
        ? ro
          ? `${trial.sentence}. Dacă anulezi înainte, nu plătești nimic.`
          : `${trial.sentence}. Cancel before that and you pay nothing.`
        : ro
          ? "Anulezi oricând, din pagina Abonament."
          : "Cancel any time from the Subscription page.",
      fine,
      scrollCue: ro ? "Vezi cum funcționează" : "See how it works",
      badge: hasTrial ? { ...trial.badge, small: ro ? "fără card" : "no card" } : null,
    },

    worries: {
      kicker: ro ? "Hai să fim sinceri" : "Let's be honest",
      title: ro ? "Nu nota te frământă, ci „oare chiar învață?”" : "It's not the grade that worries you — it's “are they actually learning?”",
      answerLead: ro ? "Cu eTutor.ro" : "With eTutor.ro",
      items: ro
        ? [
            { q: "Stă o oră „la învățat”. Dar a învățat ceva sau doar a ținut manualul deschis?", a: "vezi negru pe alb câte exerciții a făcut azi, la ce capitol și unde a greșit." },
            { q: "De obicei afli că n-a înțeles un capitol abia la teză — când e prea târziu.", a: "afli la timp, pe telefon, dacă sare peste exerciții zile la rând." },
            { q: "Plătești meditații lună de lună. De unde știi că lecțiile chiar prind?", a: "vezi capitolele la care greșește des — ora de meditații se face pe ce nu știe, nu pe ghicite." },
          ]
        : [
            { q: "They sit an hour “studying”. Did they learn anything, or just keep the book open?", a: "you see in black and white how many exercises they did today, on which topic, and where they went wrong." },
            { q: "You usually find out they didn't get a topic only at the test — when it's too late.", a: "you find out in time, on your phone, if they skip their exercises for days." },
            { q: "You pay for tutoring every month. How do you know the lessons stick?", a: "you see the topics they keep getting wrong — so tutoring works on what they don't know, not on guesses." },
          ],
    },

    how: {
      kicker: ro ? "Cum funcționează, pe larg" : "How it works, in detail",
      title: ro ? "Nu mai ești tu cel care întreabă „ai învățat?”" : "You're no longer the one asking “did you study?”",
      lead: ro ? "Patru lucruri se întâmplă singure, în fiecare zi în care copilul are program." : "Four things happen on their own, every day your child has study time scheduled.",
      step1: ro
        ? {
            title: "Programul îl face copilul, ultimul cuvânt e al tău",
            text: "Copilul își alege zilele, orele și materiile. Tu le poți schimba oricând, din telefon, iar ce ai stabilit tu rămâne așa. La ora din program primește primul reminder. În zilele de vacanță pe care le marchezi nu pleacă nimic.",
          }
        : {
            title: "Your child makes the schedule; you have the last word",
            text: "They pick the days, times and subjects. You can change them any time from your phone, and what you set stays that way. At the scheduled time the first reminder goes out. On the holidays you mark, nothing is sent.",
          },
      step2: {
        title: ro ? "Dacă nu reacționează, reminderul trece pe alt canal" : "If they don't react, the reminder moves to another channel",
        channelLabel: CHANNEL_LABEL[locale],
        free: ro ? "gratuit" : "free",
        paid: ro ? "inclus în Family" : "included in Family",
        stop: ro
          ? `Lanțul se oprește când apasă pe notificarea din aplicație${hasTelegram ? " sau pe butonul din mesajul de pe Telegram" : ""}, ori când termină o sesiune. Doar citirea unui email sau a unui mesaj nu-l oprește.`
          : `The chain stops when they tap the in-app notification${hasTelegram ? " or the button in the Telegram message" : ""}, or finish a session. Just reading an email or a message doesn't stop it.`,
        facts: [
          ro
            ? { lead: "Ritmul ține de ora reminderului.", text: `Dimineața, când timpul e scurt, trecem la canalul următor după ${minutesRo(facts.graceMorningMin)}; seara, după ${minutesRo(facts.graceEveningMin)}.` }
            : { lead: "The pace follows the time of day.", text: `In the morning, when time is short, we move to the next channel after ${minutesEn(facts.graceMorningMin)}; in the evening, after ${minutesEn(facts.graceEveningMin)}.` },
          ro
            ? { lead: "Sau îl alegi tu.", text: `Blând (aplicație, apoi email după ${minutesRo(facts.gentleEmailAfterMin)}), Standard (câte ${minutesRo(facts.standardStepMin)} între canale) sau Insistent (câte ${minutesRo(facts.insistentStepMin)}).` }
            : { lead: "Or you pick it.", text: `Gentle (app, then email after ${minutesEn(facts.gentleEmailAfterMin)}), Standard (${minutesEn(facts.standardStepMin)} between channels) or Insistent (${minutesEn(facts.insistentStepMin)}).` },
          ro
            ? { lead: "Noaptea e liniște.", text: `Între ${facts.quietStart} și ${facts.quietEnd} pleacă doar notificarea din aplicație; restul așteaptă dimineața.` }
            : { lead: "Nights are quiet.", text: `Between ${facts.quietStart} and ${facts.quietEnd} only the in-app notification goes out; the rest waits until morning.` },
          ...(hasTelegram
            ? [
                ro
                  ? { lead: "Nimic de instalat, dacă nu vrei.", text: "Reminderele pot veni doar pe Telegram; legătura se face o singură dată, într-un minut." }
                  : { lead: "Nothing to install if you'd rather not.", text: "Reminders can come over Telegram alone; connecting takes a minute, once." },
              ]
            : []),
        ] as Lead[],
      },
      step3: {
        title: ro ? "Pe tine te anunțăm la final, nu la fiecare reminder" : "We tell you at the end, not at every reminder",
        text: ro
          ? `Nu primești fiecare reminder al copilului. Afli pe ce canal a reacționat — iar dacă a ignorat tot lanțul, într-o zi cu program, primești o alertă la ${minutesRo(facts.parentAlertAfterMin)} după ultimul reminder.`
          : `You don't get every reminder your child gets. You find out which channel they reacted on — and if they ignored the whole chain on a scheduled day, you get an alert ${minutesEn(facts.parentAlertAfterMin)} after the last reminder.`,
        facts: [
          ro
            ? { lead: "Cât timp nu reacționează,", text: `te anunțăm din nou la fiecare ${minutesRo(facts.parentRenotifyMin)} — sau cum alegi: din câteva în câteva ore, o dată pe zi, ori o singură dată.` }
            : { lead: "While there's still no reaction,", text: `we alert you again every ${minutesEn(facts.parentRenotifyMin)} — or as you choose: every few hours, once a day, or only once.` },
          ro
            ? { lead: "Vrei să-l împingi chiar tu?", text: `Trimiți un reminder pe loc, din aplicație. Se repetă până reacționează, de cel mult ${facts.nudgeMaxFires} ori și cel mult ${hoursRo(facts.nudgeMaxAgeHours)}.` }
            : { lead: "Want to nudge them yourself?", text: `Send a reminder right away from the app. It repeats until they react, at most ${facts.nudgeMaxFires} times and for at most ${hoursEn(facts.nudgeMaxAgeHours)}.` },
        ] as Lead[],
      },
      step4: {
        title: ro ? "Vezi tot, oricând deschizi aplicația" : "See everything, whenever you open the app",
        text: ro ? "Fiecare copil are capitolul lui. Datele sunt la zi — nu aștepți raportul ca să vezi cum a fost azi." : "Each child has their own chapter. The data is always current — no need to wait for the report to see how today went.",
        tiles: ro
          ? [
              { title: "Sesiuni", text: "ce a lucrat și cu ce scor" },
              { title: "Remindere", text: "ce a primit și dacă a reacționat" },
              { title: "Program", text: "zilele și orele de studiu" },
              { title: "Vacanță", text: "zilele fără remindere" },
            ]
          : [
              { title: "Sessions", text: "what they worked on and the score" },
              { title: "Reminders", text: "what they received and whether they reacted" },
              { title: "Schedule", text: "study days and hours" },
              { title: "Holidays", text: "days without reminders" },
            ],
        report: ro
          ? { label: "Exemplu de raport", when: "duminică, 19:00", name: "Andrei · Matematică", onTime: "la timp", late: "întârziată", ignored: "ignorate", trend: "↑ Mai bine decât în ultimele 5 săptămâni", weak: "Greșește des la:", chips: ["fracții", "puteri"] }
          : { label: "Sample report", when: "Sunday, 7 pm", name: "Andrei · Maths", onTime: "on time", late: "late", ignored: "ignored", trend: "↑ Better than the last 5 weeks", weak: "Often gets wrong:", chips: ["fractions", "powers"] },
        legend: ro
          ? `Raportul vine zilnic sau săptămânal, în ziua și la ora alese de tine. La timp = a început în cel mult ${minutesRo(facts.onTimeWindowMin)} de la reminder · întârziată = mai târziu, în aceeași zi · ignorată = nicio reacție în ziua aceea.`
          : `The report comes daily or weekly, on the day and at the time you choose. On time = started within ${minutesEn(facts.onTimeWindowMin)} of the reminder · late = later the same day · ignored = no reaction that day.`,
      },
    },

    quiz: {
      // Signed in: the button leads to the family page, not to a new account.
      cta: ctx.signedIn ? (ro ? "Continuă în contul tău" : "Continue in your account") : null,
      title: ro ? "Vezi exact ce exersează copilul" : "See exactly what your child practises",
      sub: ro ? "Alege o materie și încearcă un test real chiar acum — fără cont." : "Pick a subject and try a real quiz right now — no account.",
    },

    journey: {
      kicker: ro ? (flyer ? "Ce urmează după ce ai scanat" : "Ce urmează după un click") : flyer ? "What happens after you scan" : "What happens after one click",
      title: ro ? (flyer ? "De pe flyer în aplicație, în 4 pași" : "De aici în aplicație, în 4 pași") : flyer ? "From the flyer to the app, in 4 steps" : "From here to the app, in 4 steps",
      lead: ro
        ? `Durează cam 5 minute.${code ? ` Codul ${code} te urmează singur până la plată.` : ""}`
        : `It takes about 5 minutes.${code ? ` Code ${code} follows you all the way to payment.` : ""}`,
      flyerStep: ro
        ? { label: "Ai făcut deja", title: "Ai scanat flyerul", text: "Sau ai scris eTutor.ro/cafea. Ai ajuns aici, cu codul pus." }
        : { label: "Already done", title: "You scanned the flyer", text: "Or typed eTutor.ro/cafea. You're here, with the code in." },
      steps: ro
        ? [
            { label: "Pasul 1", title: "Îți faci contul", text: code ? "Nume, email și o parolă. Codul e deja trecut." : "Nume, email și o parolă." },
            {
              label: "Pasul 2",
              title: "Alegi Family",
              text: `${mainPrice ? `Vezi direct ${mainPrice} lei pe lună. ` : ""}Pui cardul${hasTrial ? `, iar ${lowerFirst(trial.sentence)}` : " și plătești lunar"}.`,
            },
            { label: "Pasul 3", title: "Îți inviți copilul", text: "Are contul lui și vede doar ce e al lui." },
            { label: "Pasul 4", title: "Îi pui programul — gata", text: "Reminderele pleacă singure; tu primești raportul." },
          ]
        : [
            { label: "Step 1", title: "Create your account", text: code ? "Name, email and a password. The code is already in." : "Name, email and a password." },
            {
              label: "Step 2",
              title: "Choose Family",
              text: `${mainPrice ? `You see ${mainPrice} lei a month straight away. ` : ""}Add your card${hasTrial ? ` — ${lowerFirst(trial.sentence)}` : " and pay monthly"}.`,
            },
            { label: "Step 3", title: "Invite your child", text: "They get their own account and see only what's theirs." },
            { label: "Step 4", title: "Set their schedule — done", text: "Reminders go out on their own; you get the report." },
          ],
      phone: ro
        ? {
            signupTitle: "Cont de părinte",
            codeIncluded: code ? `✓ Codul ${code} e inclus` : null,
            fields: [["Nume", "Maria Popescu"], ["Email", "maria@exemplu.ro"], ["Parolă", "••••••••••"]] as [string, string][],
            signupButton: "Creează contul",
            plansTitle: "Alege pachetul",
            planSeats: "1 părinte + 1 copil",
            planBadge: offer ? `${offer.code} −${offer.percentOff}%` : null,
            planOld: offer ? price(offer.normalMinor, locale) : null,
            planPrice: mainPrice ? `${mainPrice} lei` : "",
            planPer: "/ lună",
            planNote: `o materie${hasTrial ? ` · ${trial.short}` : ""}`,
            planButton: hasTrial ? trial.start : "Alege Family",
            planFoot: "🔒 Plată securizată · anulezi oricând",
            inviteTitle: "Invită copilul",
            inviteText: `Îi trimiți codul pe email sau i-l dai tu. Expiră în ${daysRo(facts.inviteValidDays)}.`,
            inviteSend: "Trimite",
            inviteCopy: "Copiază",
            inviteJoined: "s-a alăturat ✓",
            lockTime: "16:00",
            lockDate: "marți, 22 septembrie",
            notifFrom: "eTutor.ro · acum",
            notifText: "E ora de matematică. Te așteaptă 5 întrebări.",
            miniReport: "Raportul tău de duminică",
          }
        : {
            signupTitle: "Parent account",
            codeIncluded: code ? `✓ Code ${code} included` : null,
            fields: [["Name", "Maria Popescu"], ["Email", "maria@example.com"], ["Password", "••••••••••"]] as [string, string][],
            signupButton: "Create account",
            plansTitle: "Choose a plan",
            planSeats: "1 parent + 1 child",
            planBadge: offer ? `${offer.code} −${offer.percentOff}%` : null,
            planOld: offer ? price(offer.normalMinor, locale) : null,
            planPrice: mainPrice ? `${mainPrice} lei` : "",
            planPer: "/ month",
            planNote: `one subject${hasTrial ? ` · ${trial.short}` : ""}`,
            planButton: hasTrial ? trial.start : "Choose Family",
            planFoot: "🔒 Secure payment · cancel any time",
            inviteTitle: "Invite your child",
            inviteText: `Send them the code by email or give it to them. It expires in ${daysEn(facts.inviteValidDays)}.`,
            inviteSend: "Send",
            inviteCopy: "Copy",
            inviteJoined: "joined ✓",
            lockTime: "16:00",
            lockDate: "Tuesday, 22 September",
            notifFrom: "eTutor.ro · now",
            notifText: "Maths time. 5 questions are waiting.",
            miniReport: "Your Sunday report",
          },
    },

    offer: {
      kicker: ro ? (flyer ? "Oferta de pe flyer" : "Oferta online") : flyer ? "The flyer offer" : "The online offer",
      title: mainPrice
        ? ro ? `Ce primești pentru ${mainPrice} lei pe lună` : `What you get for ${mainPrice} lei a month`
        : ro ? "Ce primești cu Family" : "What you get with Family",
      planSeats: ro ? "1 părinte + 1 copil · o materie" : "1 parent + 1 child · one subject",
      planFlag: code ? (ro ? `Cu codul ${code}` : `With code ${code}`) : null,
      planOld: offer ? `${normalPrice} lei` : null,
      planPrice: mainPrice ? `${mainPrice} lei` : null,
      planPer: ro ? "/ lună" : "/ month",
      planNote: offer?.recurring
        ? ro
          ? `${hasTrial ? `${trial.lead}, apoi ` : ""}${mainPrice} lei în fiecare lună — cât ții abonamentul, nu doar prima lună.`
          : `${hasTrial ? `${trial.lead}, then ` : ""}${mainPrice} lei every month — for as long as you keep the subscription, not just the first month.`
        : ro
          ? hasTrial ? `${trial.lead}, apoi plătești lunar.` : "Plătești lunar."
          : hasTrial ? `${trial.lead}, then you pay monthly.` : "You pay monthly.",
      ticks: ro
        ? [
            "Cont pentru tine și cont separat pentru copil",
            "Tu ai ultimul cuvânt la orele și materiile copilului",
            `Remindere ${listChannels(facts.chain, "ro")}`,
            "Alertă pentru tine doar când ignoră tot lanțul de remindere",
            "Raport zilnic sau săptămânal, cu locurile unde greșește des",
            "Simulări de examen și lecții structurate, la materiile care le au",
            "Anulezi oricând, din pagina Abonament",
          ]
        : [
            "An account for you and a separate one for your child",
            "You have the last word on your child's hours and subjects",
            `Reminders ${listChannels(facts.chain, "en")}`,
            "An alert for you only when they ignore the whole reminder chain",
            "Daily or weekly report, with the topics they often get wrong",
            "Exam simulations and structured lessons, for subjects that have them",
            "Cancel any time from the Subscription page",
          ],
      ctaPay,
      ctaFree: ctaFree ? (ro ? "sau încearcă fără card" : "or try without a card") : null,
      terms: offer
        ? {
            title: ro ? ["Codul", "pe înțeles"] : ["Code", "in plain words"],
            items: [
              ...(expiresLong
                ? [ro ? { lead: `Îl activezi până pe ${expiresLong}.`, text: "După această dată codul nu se mai poate folosi." } : { lead: `Activate it by ${expiresLong}.`, text: "After that date the code can no longer be used." }]
                : []),
              offer.recurring
                ? ro ? { lead: `Plătești ${offerPrice} lei în fiecare lună`, text: "cât timp păstrezi abonamentul ales atunci." } : { lead: `You pay ${offerPrice} lei every month`, text: "for as long as you keep that subscription." }
                : ro ? { lead: `Prima plată e ${offerPrice} lei`, text: "apoi prețul normal." } : { lead: `The first payment is ${offerPrice} lei`, text: "then the normal price." },
              ...(ctx.codeFamilyOnly
                ? [ro ? { lead: "E doar pentru Family", text: "(1 părinte + 1 copil), pentru o materie." } : { lead: "It's for Family only", text: "(1 parent + 1 child), for one subject." }]
                : []),
              ctx.codesAlike
                ? ro
                  ? { lead: "Fiecare cod se folosește o singură dată pe cont.", text: `Codul de pe flyer (${ctx.flyerCode}) și cel de pe site (${ctx.onlineCode}) au exact aceleași condiții.` }
                  : { lead: "Each code can be used once per account.", text: `The flyer code (${ctx.flyerCode}) and the site code (${ctx.onlineCode}) have exactly the same conditions.` }
                : ro ? { lead: "Se folosește o singură dată pe cont.", text: "" } : { lead: "It can be used once per account.", text: "" },
              ...(hasTrial
                ? [ro ? { lead: `${trial.sentence}.`, text: "Dacă anulezi înainte, nu plătești nimic." } : { lead: `${trial.sentence}.`, text: "Cancel before that and you pay nothing." }]
                : []),
            ] as Lead[],
          }
        : null,
      othersTitle: ro ? "Vrei și al doilea părinte sau meditatorul?" : "Want the second parent or the tutor too?",
      othersNote: ro
        ? `Prețuri pentru o materie.${offer && ctx.codeFamilyOnly ? ` Codul ${code} nu se aplică acestor pachete.` : ""} Al doilea copil se adaugă la ${facts.secondChildPct}% mai puțin decât prețul normal al pachetului, al treilea la ${facts.thirdChildPct}% mai puțin.`
        : `Prices for one subject.${offer && ctx.codeFamilyOnly ? ` Code ${code} doesn't apply to these plans.` : ""} A second child is added at ${facts.secondChildPct}% off the plan's normal price, a third at ${facts.thirdChildPct}% off.`,
      studentLink: ro ? "Ești elev și plătești singur? Vezi pagina pentru elevi →" : "A student paying for yourself? See the students' page →",
      seats: (parents: number, children: number, tutors: number) =>
        ro
          ? `${parents === 1 ? "1 părinte" : `${parents} părinți`} + ${children === 1 ? "1 copil" : `${children} copii`}${tutors > 0 ? " + meditator" : ""}`
          : `${parents === 1 ? "1 parent" : `${parents} parents`} + ${children === 1 ? "1 child" : `${children} children`}${tutors > 0 ? " + tutor" : ""}`,
    },

    faq: {
      title: ro ? "Întrebări pe care și le pun părinții" : "Questions parents ask",
      items: faqItems(locale, ctx, trial),
    },

    final: {
      kicker: ro ? "Cât o cafea pe lună" : "For the price of a coffee",
      titleLines: ro ? ["Liniștea ta", "începe azi."] : ["Peace of mind", "starts today."],
      sub: ro
        ? `${ctx.signedIn ? "Alegi Family din pagina Abonament." : "Îți faci contul în 2 minute."}${
            code ? ` Codul ${code} e deja pus${hasTrial ? `, iar ${lowerFirst(trial.sentence)}` : ""}.` : hasTrial ? ` ${trial.sentence}.` : ""
          }`
        : `${ctx.signedIn ? "You choose Family on the Subscription page." : "Your account takes 2 minutes."}${
            code ? ` Code ${code} is already in${hasTrial ? `, and ${lowerFirst(trial.sentence)}` : ""}.` : hasTrial ? ` ${trial.sentence}.` : ""
          }`,
      oldPrice: offer ? normalPrice : null,
      price: mainPrice ? `${mainPrice} lei` : null,
      per: ro ? "/ lună*" : "/ month*",
      ctaPay,
      ctaFree,
      fine,
    },

    sticky: {
      price: mainPrice ? (ro ? `${mainPrice} lei / lună` : `${mainPrice} lei / month`) : "Family",
      sub: [hasTrial ? trial.short : null, code ? (ro ? `cod ${code}` : `code ${code}`) : null].filter(Boolean).join(" · "),
      cta: ro ? "Începe" : "Start",
    },

    identity: "Class RDA Impex SRL · office@eTutor.ro · eTutor.ro",
  };
}

function listChannels(chain: ChainStep[], locale: Locale): string {
  const names: Record<Locale, Partial<Record<EscalationChannel, string>>> = {
    ro: { PUSH: "în aplicație", TELEGRAM: "pe Telegram", EMAIL: "pe email", WHATSAPP: "pe WhatsApp", SMS: "prin SMS" },
    en: { PUSH: "in the app", TELEGRAM: "on Telegram", EMAIL: "by email", WHATSAPP: "on WhatsApp", SMS: "by text message" },
  };
  const parts = chain.map((s) => names[locale][s.channel]).filter((x): x is string => Boolean(x));
  if (parts.length <= 1) return parts.join("");
  const and = locale === "ro" ? " și " : " and ";
  return `${parts.slice(0, -1).join(", ")}${and}${parts[parts.length - 1]}`;
}

function faqItems(locale: Locale, ctx: LandingContext, trial: ReturnType<typeof trialWords>): { q: string; a: string }[] {
  const ro = locale === "ro";
  const n = ctx.facts.freeTrialDays;
  const hasTrial = n > 0;
  const remaining = ctx.signedIn && n < ctx.facts.trialTotalDays;
  const offer = ctx.offer;
  const normal = offer ? fmtPrice(offer.normalMinor / 100, locale) : ctx.familyNormalMinor ? fmtPrice(ctx.familyNormalMinor / 100, locale) : null;
  const familyNormalMinor = offer?.normalMinor ?? ctx.familyNormalMinor;
  // Same arithmetic as the add-on checkout: the plan's normal price less the child discount.
  const secondChild = familyNormalMinor
    ? fmtPrice(discountedMinorUnits(familyNormalMinor, ctx.facts.secondChildPct) / 100, locale)
    : null;
  const expiresLong = offer?.expiresAt
    ? new Intl.DateTimeFormat(ro ? "ro-RO" : "en-GB", { timeZone: "Europe/Bucharest", day: "numeric", month: "long" }).format(offer.expiresAt)
    : null;
  const hasTelegram = ctx.facts.chain.some((s) => s.channel === "TELEGRAM");
  const hasEmail = ctx.facts.chain.some((s) => s.channel === "EMAIL");

  const items: { q: string; a: string }[] = [];
  // What happens after the free days without a card depends on whether the pause is switched on.
  const afterTrial = ctx.facts.pauseOn
    ? ro
      ? " Dacă nu alegi un abonament până atunci, contul intră în pauză, al tău și al copilului. Nimic nu se șterge: tot ce a lucrat revine imediat ce plătești."
      : " If you don't choose a subscription by then, the account is paused, yours and your child's. Nothing is deleted: everything they did comes back as soon as you pay."
    : ro
      ? " După ele, fără abonament, contul rămâne pe varianta gratuită."
      : " After that, without a subscription, the account keeps the free tier.";
  items.push(
    ro
      ? {
          q: "Pot încerca înainte să plătesc?",
          a: hasTrial
            ? `Da. ${trial.sentence}, fără card: tot pachetul Family, în afară de WhatsApp și SMS (acolo plătim fiecare mesaj).${afterTrial} Poți pune și cardul de la început, direct pe Family; dacă anulezi în zilele gratuite, nu plătești nimic.${offer ? " Codul rămâne salvat în cont până plătești." : ""}`
            : `Zilele gratuite ale contului tău (${ctx.facts.trialTotalDays}) au trecut. Poți anula oricând, din pagina Abonament.`,
        }
      : {
          q: "Can I try before I pay?",
          a: hasTrial
            ? `Yes. ${trial.sentence}, without a card: the whole Family package, except WhatsApp and SMS (we pay for each of those messages).${afterTrial} You can also add your card from the start, straight on Family; cancel within the free days and you pay nothing.${offer ? " The code stays saved on your account until you pay." : ""}`
            : `Your account's free days (${ctx.facts.trialTotalDays}) have passed. You can cancel any time from the Subscription page.`,
        },
    ro
      ? {
          q: "Când plătesc prima dată?",
          a: hasTrial
            ? `${
                remaining
                  ? `După ${n === 1 ? "ziua gratuită care ți-a rămas" : `cele ${daysRo(n)} gratuite care ți-au rămas`}.`
                  : `După ${n === 1 ? "ziua gratuită, socotită" : `cele ${daysRo(n)} gratuite, socotite`} de la crearea contului.`
              } Apoi o dată pe lună, cât ții abonamentul.`
            : "Când alegi pachetul. Apoi o dată pe lună, cât ții abonamentul.",
        }
      : {
          q: "When do I pay for the first time?",
          a: hasTrial
            ? `${
                remaining
                  ? `After ${n === 1 ? "the free day you have left" : `the ${n} free days you have left`}.`
                  : `After ${n === 1 ? "the free day" : `the ${n} free days`}, counted from the day the account is created.`
              } Then once a month, for as long as you keep the subscription.`
            : "When you choose the plan. Then once a month, for as long as you keep the subscription.",
        },
  );
  if (offer && expiresLong && normal) {
    items.push(
      ro
        ? { q: `Ce se întâmplă dacă nu activez codul până pe ${expiresLong}?`, a: `Family revine la prețul normal, ${normal} lei pe lună. Contul și tot ce a lucrat copilul rămân.` }
        : { q: `What if I don't activate the code by ${expiresLong}?`, a: `Family goes back to its normal price, ${normal} lei a month. The account and everything your child has done stay.` },
    );
  }
  if (hasEmail || hasTelegram) {
    const where = ro
      ? [hasEmail ? "pe email" : null, hasTelegram ? "pe Telegram" : null].filter(Boolean).join(" sau ")
      : [hasEmail ? "by email" : null, hasTelegram ? "on Telegram" : null].filter(Boolean).join(" or ");
    items.push(
      ro
        ? { q: "Copilul are nevoie de telefon?", a: `Nu neapărat. Poate exersa și de pe calculator, iar reminderele îi pot veni ${where}.` }
        : { q: "Does my child need a phone?", a: `Not necessarily. They can practise on a computer too, and reminders can reach them ${where}.` },
    );
  }
  const secondChildWords = ro
    ? `Al doilea copil se adaugă din aplicație, la ${ctx.facts.secondChildPct}% mai puțin decât prețul normal al pachetului${secondChild ? `: ${secondChild} lei pe lună la Family` : ""}.`
    : `A second child is added from the app at ${ctx.facts.secondChildPct}% off the plan's normal price${secondChild ? `: ${secondChild} lei a month on Family` : ""}.`;
  items.push(
    ro
      ? { q: "Vedeți conversațiile noastre de pe Telegram sau WhatsApp?", a: "Nu. Doar trimitem reminderele. Pe Telegram te dezabonezi oricând scriind /stop." }
      : { q: "Can you see our Telegram or WhatsApp conversations?", a: "No. We only send the reminders. On Telegram you can unsubscribe any time by sending /stop." },
    ro
      ? { q: "Cum anulez?", a: "Din pagina Abonament, cu butonul „Gestionează abonamentul”. Fără telefoane și fără formulare." }
      : { q: "How do I cancel?", a: "From the Subscription page, with the “Manage subscription” button. No phone calls, no forms." },
    ro
      ? {
          q: offer ? "Am doi copii. Pot folosi codul pentru amândoi?" : "Am doi copii. Cât costă al doilea?",
          a: `${offer ? "Codul reduce abonamentul Family, care e pentru un copil. " : ""}${secondChildWords}`,
        }
      : {
          q: offer ? "I have two children. Can I use the code for both?" : "I have two children. What does the second cost?",
          a: `${offer ? "The code discounts the Family subscription, which is for one child. " : ""}${secondChildWords}`,
        },
  );
  if (offer && ctx.codesAlike) {
    items.push(
      ro
        ? { q: "Pe flyer e alt cod. E alt preț?", a: `Nu. ${ctx.flyerCode} (de pe flyer) și ${ctx.onlineCode} (de pe site) au exact aceleași condiții.` }
        : { q: "The flyer has a different code. Is it a different price?", a: `No. ${ctx.flyerCode} (from the flyer) and ${ctx.onlineCode} (from the site) have exactly the same conditions.` },
    );
  }
  return items;
}
