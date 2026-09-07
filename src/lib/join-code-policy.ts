/**
 * Cât timp și de câte ori mai e bun un cod de acces.
 *
 * Codul e singura cale prin care cineva intră singur într-o materie privată.
 * Până acum era o cheie care nu se strica niciodată: fără expirare, fără limită
 * de folosiri, iar intrarea cu el nu lăsa nicio urmă (emiterea era auditată,
 * folosirea nu). Un cod ajuns într-un grup de WhatsApp rămânea bun la nesfârșit,
 * iar singura reacție era să-l schimbi — adică să-l schimbi pentru toți.
 *
 * `Voucher`, din aceeași schemă, are de mult toate trei. Asta le aduce și aici.
 */

export interface JoinCodeState {
  expiresAt: Date | null;
  maxUses: number | null;
  uses: number;
}

export type JoinCodeVerdict = "ok" | "expired" | "exhausted";

/** Codul implicit trăiește o lună. Un cod fără termen e o cheie pierdută pentru totdeauna. */
export const DEFAULT_EXPIRY_DAYS = 30;

/** Peste asta nu se mai poate seta un termen — un „an" e tot o cheie uitată. */
export const MAX_EXPIRY_DAYS = 365;

export function expiryFromDays(days: number | null, now: Date): Date | null {
  if (days === null) return null;
  const clamped = Math.min(Math.max(Math.trunc(days), 1), MAX_EXPIRY_DAYS);
  return new Date(now.getTime() + clamped * 24 * 60 * 60 * 1000);
}

/**
 * Verdictul e separat de mesaj intenționat: cine cheamă funcția asta răspunde cu
 * ACELAȘI 404 în toate cazurile. Un cod greșit, unul expirat și unul epuizat
 * trebuie să arate identic din afară — altfel cineva află, încercând, care coduri
 * sunt vii.
 */
export function checkJoinCode(state: JoinCodeState, now: Date): JoinCodeVerdict {
  if (state.expiresAt !== null && state.expiresAt.getTime() <= now.getTime()) return "expired";
  if (state.maxUses !== null && state.uses >= state.maxUses) return "exhausted";
  return "ok";
}

export function isJoinCodeUsable(state: JoinCodeState, now: Date): boolean {
  return checkJoinCode(state, now) === "ok";
}

/** Câte folosiri au mai rămas, pentru panoul de admin. `null` = nelimitat. */
export function usesLeft(state: JoinCodeState): number | null {
  if (state.maxUses === null) return null;
  return Math.max(0, state.maxUses - state.uses);
}
