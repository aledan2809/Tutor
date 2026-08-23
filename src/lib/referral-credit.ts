/**
 * Motorul de câștiguri din recomandări — nucleu PUR (fără DB, fără rețea, fără stare).
 *
 * Modelul decis de user (2026-06-04, „MODEL FINAL UNIFICAT"), cu DOUĂ tipuri de câștig:
 *
 *   (A) RECOMANDARE  — 50% din abonamentul ACTUAL al invitatului, doar pe primele
 *                      3 plăți încasate. Clienții (elev/părinte) primesc CREDIT;
 *                      meditatorii/creatorii primesc BANI.
 *   (B) CONȚINUT     — 50% din plata cumpărătorului, PERPETUU. Doar creatori, în bani.
 *                      (Meditatorul care publică materiale = creator; nu se plătește de două ori.)
 *
 * Reguli care nu se negociază, pentru că userul le-a ridicat explicit:
 *   • Se acordă DOAR pe plată efectiv încasată, lună de lună — niciodată în avans.
 *   • La refund trebuie să existe CLAWBACK, inclusiv pe creditul deja CONSUMAT.
 *
 * De ce e separat de `referral.ts`: acela implementează modelul vechi (comision
 * perpetuu în bani) care e încă în producție. Nucleul ăsta poate fi verificat și
 * revizuit singur, înainte ca cineva să atingă facturarea. Cablarea la plăți cere
 * politica de refund din Legal (NO-TOUCH CRITIC) — nu se ghicește.
 */

/** Cine a făcut recomandarea decide dacă primește credit sau bani. */
export type PromoterKind = "CLIENT" | "TUTOR" | "CREATOR";

/** (A) recomandare, plafonată la 3 luni · (B) conținut, perpetuu. */
export type EarningType = "REFERRAL" | "CONTENT";

/** CREDIT se consumă din facturile proprii; CASH se plătește afară. */
export type Payout = "CREDIT" | "CASH";

export const EARNING_PCT = 0.5;
export const REFERRAL_MAX_PAID_MONTHS = 3;

export type Earning = {
  type: EarningType;
  payout: Payout;
  /** bani, în subunități (bani/cenți) — niciodată zecimale în plutitor */
  amount: number;
  /** a câta plată încasată a invitatului a generat câștigul (1-based) */
  monthIndex: number;
};

/**
 * Clienții primesc credit; meditatorii și creatorii primesc bani.
 * Câștigul din CONȚINUT e mereu în bani — un creator nu e neapărat abonat,
 * deci creditul n-ar avea unde să se consume.
 */
export function payoutFor(kind: PromoterKind, type: EarningType): Payout {
  if (type === "CONTENT") return "CASH";
  return kind === "CLIENT" ? "CREDIT" : "CASH";
}

/**
 * Câștigul pentru O plată încasată. Întoarce `null` când nu se cuvine nimic —
 * apelantul nu trebuie să deducă asta din zero, ca să nu confunde „fără drept"
 * cu „drept de zero lei".
 *
 * `monthIndex` numără DOAR plățile încasate ale invitatului, 1-based. O lună
 * ratată nu consumă din fereastră: contează plățile, nu calendarul.
 */
export function earningFor(input: {
  kind: PromoterKind;
  type: EarningType;
  paymentAmount: number;
  monthIndex: number;
}): Earning | null {
  const { kind, type, paymentAmount, monthIndex } = input;
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) return null;
  if (!Number.isInteger(monthIndex) || monthIndex < 1) return null;
  if (type === "REFERRAL" && monthIndex > REFERRAL_MAX_PAID_MONTHS) return null;

  // Rotunjire în jos: platforma nu plătește niciodată mai mult decât procentul.
  const amount = Math.floor(paymentAmount * EARNING_PCT);
  if (amount <= 0) return null;

  return { type, payout: payoutFor(kind, type), amount, monthIndex };
}

// ─────────────────────────── Credit ───────────────────────────

export type CreditApplication = {
  /** cât se ia din credit pentru factura asta */
  creditUsed: number;
  /** cât rămâne de plătit cu cardul */
  charged: number;
  /** soldul de credit după aplicare */
  balanceAfter: number;
};

/**
 * Creditul acoperă factura până se epuizează — parțial dacă nu ajunge.
 * Nu produce niciodată sold negativ și nu „dă rest": un credit mai mare decât
 * factura rămâne pentru facturile următoare.
 */
export function applyCredit(balance: number, invoiceAmount: number): CreditApplication {
  const safeBalance = Math.max(0, Math.floor(balance || 0));
  const safeInvoice = Math.max(0, Math.floor(invoiceAmount || 0));
  const creditUsed = Math.min(safeBalance, safeInvoice);
  return {
    creditUsed,
    charged: safeInvoice - creditUsed,
    balanceAfter: safeBalance - creditUsed,
  };
}

// ─────────────────────────── Clawback ───────────────────────────

export type Clawback = {
  /** cât se scade din soldul de credit disponibil */
  fromBalance: number;
  /**
   * Partea care NU mai poate fi recuperată din sold, pentru că a fost deja
   * consumată pe o factură. Ea NU devine sold negativ — devine o datorie
   * explicită, ca să fie o decizie de business (se recuperează la următoarea
   * factură? se anulează?), nu un efect tăcut.
   */
  alreadyConsumed: number;
  balanceAfter: number;
};

/**
 * Storno la refund. `granted` = cât s-a acordat pe plata refundată;
 * `balance` = soldul de credit disponibil ACUM.
 *
 * Cazul care contează, și de care userul s-a temut explicit: creditul a fost deja
 * cheltuit. Atunci soldul se duce la zero, iar restul se raportează separat ca
 * `alreadyConsumed`. Un sold negativ ar fi ascuns problema într-un număr.
 */
export function clawbackCredit(balance: number, granted: number): Clawback {
  const safeBalance = Math.max(0, Math.floor(balance || 0));
  const safeGranted = Math.max(0, Math.floor(granted || 0));
  const fromBalance = Math.min(safeBalance, safeGranted);
  return {
    fromBalance,
    alreadyConsumed: safeGranted - fromBalance,
    balanceAfter: safeBalance - fromBalance,
  };
}

/**
 * Storno pentru câștigurile în BANI. Ce e încă în perioada de reținere se poate
 * anula curat; ce a fost deja plătit afară devine datorie de recuperat.
 */
export function clawbackCash(input: {
  pendingAmount: number;
  paidAmount: number;
  granted: number;
}): { voided: number; recoverable: number } {
  const pending = Math.max(0, Math.floor(input.pendingAmount || 0));
  const paid = Math.max(0, Math.floor(input.paidAmount || 0));
  const granted = Math.max(0, Math.floor(input.granted || 0));
  const voided = Math.min(pending, granted);
  const rest = granted - voided;
  return { voided, recoverable: Math.min(paid, rest) };
}

/**
 * Soldul după o serie de câștiguri și facturi, în ordinea în care s-au întâmplat.
 * Fold pur — aceeași intrare dă mereu același sold, deci se poate recalcula din
 * istoric fără să depindă de un contor ținut pe undeva.
 */
export type LedgerEvent =
  | { kind: "earn"; amount: number }
  | { kind: "invoice"; amount: number }
  | { kind: "clawback"; amount: number };

export function foldCreditBalance(events: LedgerEvent[]): {
  balance: number;
  charged: number;
  unrecovered: number;
} {
  let balance = 0;
  let charged = 0;
  let unrecovered = 0;
  // Nu doar null/undefined: `for...of` arunca pe orice non-iterabil, iar istoricul
  // va veni candva din DB/JSON, unde tipul nu mai e garantat de compilator.
  for (const e of Array.isArray(events) ? events : []) {
    if (e.kind === "earn") {
      balance += Math.max(0, Math.floor(e.amount || 0));
    } else if (e.kind === "invoice") {
      const r = applyCredit(balance, e.amount);
      balance = r.balanceAfter;
      charged += r.charged;
    } else {
      const r = clawbackCredit(balance, e.amount);
      balance = r.balanceAfter;
      unrecovered += r.alreadyConsumed;
    }
  }
  return { balance, charged, unrecovered };
}
