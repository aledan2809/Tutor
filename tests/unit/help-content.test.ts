import { describe, it, expect } from "vitest";
import {
  ELEV,
  MEDITATOR,
  PARINTE,
  HOW_IT_WORKS,
  HELP_ROLES,
  helpContentFor,
  inviteBlurb,
  telegramHelpReply,
  type HelpRole,
  type Locale,
} from "@/content/help";
import {
  CASCADE_GRACE_MINUTES,
  ESCALATION_LEVELS,
  ESCALATION_PRESETS,
  NUDGE_MAX_AGE_HOURS,
  ON_TIME_WINDOW_MIN,
  PARENT_RENOTIFY_MIN,
  QUIET_HOURS_DEFAULT,
} from "@/lib/escalation/config";
import {
  DEFAULT_LEVELS,
  LEADERBOARD_TOP,
  ON_TIME_BONUS,
  STREAK_RECOVERY,
  XP_REWARDS,
} from "@/lib/gamification-constants";

const LOCALES: Locale[] = ["ro", "en"];
const all = (role: HelpRole, locale: Locale) =>
  helpContentFor(role, locale)
    .flatMap((s) => [s.title, ...s.paragraphs, ...(s.bullets ?? []), ...(s.links ?? []).map((l) => l.label)])
    .join("\n");

describe("help content — shape", () => {
  it("covers every role in every locale", () => {
    for (const role of HELP_ROLES) {
      for (const loc of LOCALES) expect(helpContentFor(role, loc).length).toBeGreaterThan(4);
    }
  });

  it("keeps the same sections, in the same order, across locales", () => {
    for (const [role, c] of [["student", ELEV], ["parent", PARINTE], ["meditator", MEDITATOR]] as const) {
      expect(c.ro.map((s) => s.id), `${role} section ids drifted`).toEqual(c.en.map((s) => s.id));
    }
  });

  it("has no empty title or paragraph anywhere", () => {
    for (const role of HELP_ROLES) {
      for (const loc of LOCALES) {
        for (const s of helpContentFor(role, loc)) {
          expect(s.title.trim(), `${role}/${loc}/${s.id}`).not.toBe("");
          expect(s.paragraphs.length).toBeGreaterThan(0);
          for (const p of s.paragraphs) expect(p.trim()).not.toBe("");
        }
      }
    }
  });

  it("uses no duplicate anchor id within a role", () => {
    for (const role of HELP_ROLES) {
      const ids = helpContentFor(role, "ro").map((s) => s.id);
      expect(new Set(ids).size, `${role} has a duplicate anchor`).toBe(ids.length);
    }
  });

  it("links only into the app", () => {
    for (const role of HELP_ROLES) {
      for (const loc of LOCALES) {
        for (const s of helpContentFor(role, loc)) {
          for (const l of s.links ?? []) expect(l.href.startsWith("/dashboard")).toBe(true);
        }
      }
    }
  });

  it("points every HowItWorks block at a section that exists", () => {
    const anchors = new Set(HELP_ROLES.flatMap((r) => helpContentFor(r, "ro").map((s) => s.id)));
    for (const [key, byLocale] of Object.entries(HOW_IT_WORKS)) {
      for (const loc of LOCALES) {
        expect(anchors.has(byLocale[loc].more), `${key}/${loc} → #${byLocale[loc].more}`).toBe(true);
        expect(byLocale[loc].steps.length).toBeGreaterThanOrEqual(2);
        expect(byLocale[loc].steps.length).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe("help content — house rules", () => {
  // Standing rule: never call it AI in anything a customer reads.
  it('never says "AI"', () => {
    for (const role of HELP_ROLES) {
      for (const loc of LOCALES) expect(all(role, loc)).not.toMatch(/\bAI\b/);
    }
    for (const b of Object.values(HOW_IT_WORKS)) {
      for (const loc of LOCALES) expect(b[loc].steps.join("\n")).not.toMatch(/\bAI\b/);
    }
  });

  // June decision: XP → puncte, streak → serie, leaderboard → clasament.
  it("uses the Romanian words, not the English gamification jargon", () => {
    for (const role of HELP_ROLES) {
      expect(all(role, "ro")).not.toMatch(/\b(XP|streak|leaderboard|badge)\b/i);
    }
    for (const b of Object.values(HOW_IT_WORKS)) {
      expect(b.ro.steps.join("\n")).not.toMatch(/\b(XP|streak|leaderboard|badge)\b/i);
    }
  });
});

describe("help content — the numbers come from the code", () => {
  // The whole reason the copy lives in a module that imports the constants: a
  // retyped number goes stale the first time someone tunes the cascade.
  const cascade = HOW_IT_WORKS.cascade.ro.steps.join("\n");

  it("quotes the real cascade delays", () => {
    for (const ch of ["TELEGRAM", "EMAIL", "WHATSAPP"]) {
      const min = ESCALATION_LEVELS.find((l) => l.channel === ch)!.delayMinutes;
      expect(cascade).toContain(String(min));
    }
  });

  it("quotes the real presets and quiet hours", () => {
    expect(cascade).toContain(String(ESCALATION_PRESETS.BLAND[1].delayMinutes));
    expect(cascade).toContain(String(ESCALATION_PRESETS.INSISTENT[1].delayMinutes));
    expect(cascade).toContain(QUIET_HOURS_DEFAULT.start);
    expect(cascade).toContain(QUIET_HOURS_DEFAULT.end);
    expect(cascade).toContain(String(CASCADE_GRACE_MINUTES.morning));
    expect(cascade).toContain(String(CASCADE_GRACE_MINUTES.evening));
    expect(cascade).toContain(String(PARENT_RENOTIFY_MIN));
  });

  it("quotes the real on-time window wherever the report is explained", () => {
    expect(HOW_IT_WORKS.rapoarte.ro.steps.join("\n")).toContain(String(ON_TIME_WINDOW_MIN));
    expect(all("parent", "ro")).toContain(String(ON_TIME_WINDOW_MIN));
  });

  it("quotes the real points, levels and recovery rules", () => {
    const p = HOW_IT_WORKS.progress.ro.steps.join("\n");
    expect(p).toContain(String(XP_REWARDS.CORRECT_ANSWER));
    expect(p).toContain(String(XP_REWARDS.FAST_ANSWER_BONUS));
    expect(p).toContain(String(XP_REWARDS.SESSION_COMPLETE));
    expect(p).toContain(String(XP_REWARDS.PERFECT_SCORE));
    expect(p).toContain(String(ON_TIME_BONUS));
    expect(p).toContain(String(LEADERBOARD_TOP));
    expect(p).toContain(String(STREAK_RECOVERY.maxMissedDays));
    expect(p).toContain(String(STREAK_RECOVERY.requiredCorrect));
    for (const lvl of DEFAULT_LEVELS) expect(p).toContain(lvl.name);
  });

  it("quotes the real nudge auto-stop", () => {
    expect(HOW_IT_WORKS.watcher.ro.steps.join("\n")).toContain(String(NUDGE_MAX_AGE_HOURS));
  });
});

describe("invite blurb and bot help", () => {
  // Same source as the help page, so the email and the page cannot disagree.
  it("takes the tutor blurb verbatim from the tutor help section", () => {
    expect(inviteBlurb("TUTOR")[0]).toBe(MEDITATOR.ro[0].paragraphs[0]);
    expect(inviteBlurb("PARENT")[0]).toBe(PARINTE.ro[0].paragraphs[0]);
    expect(inviteBlurb("CHILD")[0]).toBe(ELEV.ro[0].paragraphs[0]);
  });

  it("tells an invited tutor what they get and that they pay nothing", () => {
    const text = inviteBlurb("TUTOR").join(" ");
    expect(text).toMatch(/progresul elevului/i);
    expect(text).toMatch(/nu plătești nimic/i);
  });

  it("gives the bot a help reply listing its commands", () => {
    const r = telegramHelpReply();
    expect(r).toContain("/help");
    expect(r).toContain("/stop");
    expect(r).toMatch(/memento/i);
  });
});
