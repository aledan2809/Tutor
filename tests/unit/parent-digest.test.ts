import { describe, it, expect } from "vitest";
import { digestSlot, digestText, localDayAndMinutes, safeTimeZone, type ChildDay } from "@/lib/escalation/parent-digest";
import { shouldRenotifyParentMode } from "@/lib/escalation/parent-monitor";

const child = (o: Partial<ChildDay>): ChildDay => ({
  name: "Rareș",
  ignored: [],
  answeredLater: 0,
  answered: 0,
  sessions: 0,
  unanswered: [],
  answeredSince: [],
  ...o,
});

describe("digestText", () => {
  it("nothing to tell: no message", () => {
    expect(digestText([])).toBeNull();
    expect(digestText([child({})])).toBeNull();
    expect(digestText([child({})], ["  "])).toBeNull();
  });

  it("one child: ignored reminders with times, a late answer, prompt answers, sessions, what's still open", () => {
    const t = digestText([child({ ignored: ["16:00", "19:00"], answeredLater: 1, answered: 1, sessions: 3, unanswered: ["19:00"] })]);
    expect(t?.title).toBe("Rezumatul zilei pe eTutor.ro: Rareș");
    expect(t?.message).toBe(
      "Rareș: 2 remindere ignorate (16:00, 19:00); a revenit mai târziu la unul dintre ele; a răspuns la un reminder; 3 sesiuni de studiu. Încă fără răspuns: reminderul de la 19:00.",
    );
  });

  it("singular forms read right", () => {
    expect(digestText([child({ ignored: ["08:00"], sessions: 1 })])?.message).toBe("Rareș: un reminder ignorat (08:00); o sesiune de studiu.");
    expect(digestText([child({ ignored: ["08:00"], answeredLater: 1 })])?.message).toBe("Rareș: un reminder ignorat (08:00); a revenit mai târziu la el.");
    expect(digestText([child({ answered: 2 })])?.message).toBe("Rareș: a răspuns la 2 remindere.");
  });

  it("from 20 up, a number takes „de” — unless it ends in 01–19", () => {
    expect(digestText([child({ sessions: 20 })])?.message).toBe("Rareș: 20 de sesiuni de studiu.");
    expect(digestText([child({ answered: 21 })])?.message).toBe("Rareș: a răspuns la 21 de remindere.");
    expect(digestText([child({ sessions: 19 })])?.message).toBe("Rareș: 19 sesiuni de studiu.");
    expect(digestText([child({ sessions: 101 })])?.message).toBe("Rareș: 101 sesiuni de studiu.");
    expect(digestText([child({ sessions: 120 })])?.message).toBe("Rareș: 120 de sesiuni de studiu.");
  });

  it("several children: one line each, only for those with news", () => {
    const t = digestText([child({ ignored: ["16:00"] }), child({ name: "Ana" }), child({ name: "Ion", sessions: 2 })]);
    expect(t?.title).toBe("Rezumatul zilei pe eTutor.ro");
    expect(t?.message.split("\n")).toEqual(["Rareș: un reminder ignorat (16:00).", "Ion: 2 sesiuni de studiu."]);
  });

  it("a child without a name: a neutral title", () => {
    expect(digestText([child({ name: null, sessions: 1 })])).toEqual({
      title: "Rezumatul zilei pe eTutor.ro",
      message: "Copilul: o sesiune de studiu.",
    });
  });

  it("an earlier reminder answered since, and the other alerts of the day", () => {
    const t = digestText([child({ answeredSince: ["30.09 19:00"] })], ["Prag atins: Rareș", "Prag atins: Rareș"]);
    expect(t?.message.split("\n")).toEqual([
      "Rareș: a răspuns între timp la reminderul de la 30.09 19:00.",
      "Alte alerte: Prag atins: Rareș.",
    ]);
    expect(digestText([child({})], ["Bifele materiei copilului au rămas în urmă"])).toEqual({
      title: "Rezumatul zilei pe eTutor.ro",
      message: "Alte alerte: Bifele materiei copilului au rămas în urmă.",
    });
  });
});

describe("digestSlot / localDayAndMinutes", () => {
  const BUC = "Europe/Bucharest";
  // 01.10.2026 18:59 UTC = 21:59 in Bucharest (summer time); 19:00 UTC = 22:00.
  it("comes at the chosen time in the parent's own time zone, not before", () => {
    expect(digestSlot("22:00", new Date("2026-10-01T18:59:00Z"), BUC)).toBeNull();
    expect(digestSlot("22:00", new Date("2026-10-01T19:00:00Z"), BUC)).toBe("2026-10-01");
    expect(digestSlot("22:00", new Date("2026-10-01T19:00:00Z"), "UTC")).toBeNull();
  });

  it("a time after the day's last run still goes, for its own day, just after midnight", () => {
    // 23:50 chosen; the 23:45 run is too early and the next one is at 00:00 the next day.
    expect(digestSlot("23:50", new Date("2026-10-01T20:45:00Z"), BUC)).toBeNull();
    expect(digestSlot("23:50", new Date("2026-10-01T21:00:00Z"), BUC)).toBe("2026-10-01");
    expect(digestSlot("23:50", new Date("2026-10-01T23:30:00Z"), BUC)).toBe("2026-10-01");
    // …but not hours later: a morning time doesn't send yesterday's.
    expect(digestSlot("23:50", new Date("2026-10-02T03:00:00Z"), BUC)).toBeNull();
    expect(digestSlot("08:00", new Date("2026-10-01T21:00:00Z"), BUC)).toBeNull();
    expect(digestSlot("08:00", new Date("2026-10-01T05:00:00Z"), BUC)).toBe("2026-10-01");
    expect(digestSlot("08:00", new Date("2026-10-02T04:00:00Z"), BUC)).toBeNull();
  });

  it("the local day is the parent's", () => {
    expect(localDayAndMinutes(new Date("2026-10-01T22:30:00Z"), BUC)).toEqual({ day: "2026-10-02", minutes: 90 });
  });

  it("a time zone that doesn't exist falls back to Bucharest", () => {
    expect(safeTimeZone("Europe/Bucharest")).toBe("Europe/Bucharest");
    expect(safeTimeZone("America/New_York")).toBe("America/New_York");
    expect(safeTimeZone("Mars/Olympus")).toBe("Europe/Bucharest");
    expect(safeTimeZone(null)).toBe("Europe/Bucharest");
  });
});

describe("DIGEST in the re-alert cadence", () => {
  it("never re-alerts: everything waits for the digest", () => {
    expect(shouldRenotifyParentMode({ mode: "DIGEST", everyH: 6, at: "22:00" }, null, new Date())).toBe(false);
  });
});
