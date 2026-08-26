/**
 * The shape of a sprint: which positions are direct operations and which are
 * chained expressions.
 *
 * A sprint used to be twenty chains. It is now half direct operations
 * (`22 × 34`, `84 ÷ 12`) and half chains (`25 × 5 − 40 ÷ 8 − 95`), because they
 * train two different things and the exam wants both: raw speed on a single
 * operation, and carrying an intermediate result through a precedence rule.
 *
 * Kept apart from the generators so the split can be read, tested and changed
 * in one place — and so each kind keeps its OWN progression. A chain's
 * difficulty ramp is indexed by its position among the chains, not among all
 * twenty questions; otherwise halving their number would also halve the ramp
 * and the hardest chain of the session would never be reached.
 *
 * Pure: no DB, no IO, no RNG.
 */

export type SlotKind = "single" | "chain";

/**
 * Alternating, starting with a direct operation.
 *
 * Alternating rather than blocked (ten singles, then ten chains) on purpose:
 * switching between "one operation, fast" and "hold the intermediate" is itself
 * the thing that trips people up under time pressure, and a blocked session
 * lets the student settle into one mode and never practise the switch.
 */
export function planSlots(total: number): SlotKind[] {
  return Array.from({ length: Math.max(0, total) }, (_, i) =>
    i % 2 === 0 ? "single" : "chain"
  );
}

/** How many of `kind` the plan contains in total. */
export function countOfKind(slots: readonly SlotKind[], kind: SlotKind): number {
  return slots.reduce((n, s) => n + (s === kind ? 1 : 0), 0);
}

/**
 * The 0-based position of `index` among the slots of its own kind — the number
 * a per-kind progression should be indexed by.
 */
export function ordinalWithinKind(slots: readonly SlotKind[], index: number): number {
  let n = 0;
  for (let i = 0; i < index && i < slots.length; i++) {
    if (slots[i] === slots[index]) n += 1;
  }
  return n;
}

/** How many direct-operation slots are still ahead of (and including) `index`. */
export function remainingOfKind(
  slots: readonly SlotKind[],
  index: number,
  kind: SlotKind
): number {
  let n = 0;
  for (let i = index; i < slots.length; i++) {
    if (slots[i] === kind) n += 1;
  }
  return n;
}
