import { ELEV } from "./elev";
import { PARINTE } from "./parinte";
import { MEDITATOR } from "./meditator";
import type { HelpRole, HelpSection, Locale } from "./types";

export { ELEV, PARINTE, MEDITATOR };
export { HOW_IT_WORKS } from "./how-it-works";
export { inviteBlurb } from "./invite-blurb";
export { telegramHelpReply } from "./telegram-help";
export type { HelpRole, HelpSection, HowItWorksKey, Locale } from "./types";

const BY_ROLE = {
  student: ELEV,
  parent: PARINTE,
  meditator: MEDITATOR,
} as const;

export function helpContentFor(role: HelpRole, locale: Locale): HelpSection[] {
  return BY_ROLE[role][locale];
}

/** Tab order on /dashboard/ajutor. */
export const HELP_ROLES: HelpRole[] = ["student", "parent", "meditator"];
