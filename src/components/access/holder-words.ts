/**
 * Words shared by the pause screen, the trial banner and the family page — plain functions, so the
 * client family page can use them without the server screens (review r6, sweep S3).
 */
import type { SeatHolderNote } from "@/lib/access-server";

/** First name, or null when the account has none: `"".split(" ")[0]` is "", not null (review r6, U3). */
export function firstName(name: string | null | undefined): string | null {
  return name?.trim().split(/\s+/)[0] || null;
}

/**
 * For a parent the family's plan leaves out (loadSeatHolder): who has the plan, and what would take
 * this parent in. Nothing here is a price or a payment button — the plan is the other parent's.
 */
export function holderWords(holder: SeatHolderNote, ro: boolean) {
  const first = firstName(holder.name);
  const Who = first ?? (ro ? "Celălalt părinte" : "The other parent");
  const who = first ?? (ro ? "celălalt părinte" : "the other parent");
  const plan =
    holder.parents <= 1
      ? ro
        ? `${Who} are pachetul ${holder.plan}, care include un singur părinte.`
        : `${Who} has the ${holder.plan} plan, which includes one parent.`
      : ro
        ? `${Who} are pachetul ${holder.plan}, iar locurile de părinte din el sunt ocupate.`
        : `${Who} has the ${holder.plan} plan, and its parent seats are taken.`;
  const noLargerPlan = ro ? "Nu există un pachet cu mai mulți părinți." : "There is no plan with more parents.";
  return { who, plan, noLargerPlan };
}
