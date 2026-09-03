/**
 * Help content lives in typed modules, not in the i18n JSON.
 *
 * Three reasons, in order of weight: the sections are multi-paragraph prose with
 * links, which is unreadable as flat JSON strings; the modules import the real
 * constants so no number in the copy can drift from the code that enforces it;
 * and the same text is needed by the invite email and the Telegram bot, which run
 * in Node and would otherwise have to plumb next-intl through.
 *
 * The short chrome (menu label, page title, buttons) stays in ro.json/en.json, so
 * the key-parity check still means something.
 */

export type Locale = "ro" | "en";
export type HelpRole = "student" | "parent" | "meditator";

export interface HelpLink {
  label: string;
  /** In-app path; the help page renders these with the locale-aware Link. */
  href: string;
}

export interface HelpSection {
  /** Anchor id — `HowItWorks` blocks deep-link to `#<id>`, so renaming breaks links. */
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  links?: HelpLink[];
}

export type HelpContent = Record<Locale, HelpSection[]>;

/** Pages that carry an inline „Cum funcționează” block. */
export type HowItWorksKey =
  | "watcher"
  | "rapoarte"
  | "cascade"
  | "progress"
  | "notifSettings";

export interface HowItWorksBlock {
  steps: string[];
  /** Anchor on /dashboard/ajutor with the long version. */
  more: string;
}
