/**
 * Which notification channels a package includes — pure, code-defined (no schema /
 * billing coupling). Free accounts get the zero-cost channels (in-app push + email);
 * paid accounts additionally get the metered channels (WhatsApp + SMS).
 *
 * Gating is driven by `subscriptionStatus` only (a stable field), so this stays
 * decoupled from however plans/prices are modelled in the billing layer.
 */

export type NotifChannel = "push" | "email" | "whatsapp" | "sms";

export const ALL_CHANNELS: NotifChannel[] = ["push", "email", "whatsapp", "sms"];
export const FREE_CHANNELS: NotifChannel[] = ["push", "email"];

/** A subscription counts as paid when it is active or trialing. */
export function isPaidStatus(subscriptionStatus: string | null | undefined): boolean {
  return subscriptionStatus === "active" || subscriptionStatus === "trialing";
}

/** The channels a user/child may use, given their subscription status. */
export function allowedChannels(subscriptionStatus: string | null | undefined): NotifChannel[] {
  return isPaidStatus(subscriptionStatus) ? [...ALL_CHANNELS] : [...FREE_CHANNELS];
}

export function isChannelAllowed(channel: NotifChannel, subscriptionStatus: string | null | undefined): boolean {
  return allowedChannels(subscriptionStatus).includes(channel);
}

/**
 * Clamp a set of requested channel toggles to those the plan allows. A channel the
 * plan doesn't include can only ever be turned OFF, never ON — so a free account
 * can't enable WhatsApp/SMS via a direct API call.
 */
export function clampChannelWrite(
  requested: Partial<Record<NotifChannel, boolean>>,
  subscriptionStatus: string | null | undefined,
): { applied: Partial<Record<NotifChannel, boolean>>; blocked: NotifChannel[] } {
  const allowed = new Set(allowedChannels(subscriptionStatus));
  const applied: Partial<Record<NotifChannel, boolean>> = {};
  const blocked: NotifChannel[] = [];
  for (const ch of ALL_CHANNELS) {
    if (requested[ch] === undefined) continue;
    if (requested[ch] === true && !allowed.has(ch)) {
      blocked.push(ch); // refuse to enable a channel the plan doesn't include
    } else {
      applied[ch] = requested[ch];
    }
  }
  return { applied, blocked };
}
