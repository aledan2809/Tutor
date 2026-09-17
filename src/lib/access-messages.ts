/**
 * A parent can stop the messages about the free week and the subscription (access-lifecycle.ts).
 * They carry a price and a payment button, so each one says how to stop them, and stopping must be
 * one click (RO Law 506/2004 art. 12). Alerts about the child don't depend on this.
 */
export const ACCESS_MESSAGES_SETTING = "accessMessages";

/**
 * Where the switch is, as written in the messages themselves: Setări → Notificări, which every account
 * can open. „Cadență alerte" has it too, but opens only once a child is linked.
 */
export const ACCESS_MESSAGES_PAGE = "/dashboard/settings/notifications#mesaje-abonament";

/** Pure: did this account stop the messages? The stored value is `{ off: true }`. */
export function accessMessagesOff(value: unknown): boolean {
  return Boolean(value && typeof value === "object" && (value as { off?: unknown }).off === true);
}
