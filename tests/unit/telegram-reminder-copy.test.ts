import { describe, it, expect } from "vitest";
import { buildTelegramReminderText, buttonLabelFor } from "@/lib/notifications/service";
import { encouragementFor } from "@/lib/escalation/engine";
import { buildTelegramButtonUrl, safeRedirectPath } from "@/lib/escalation/tap-link";

describe("buildTelegramReminderText", () => {
  // THE regression. Before the fix, the Telegram rung discarded the reminder's own
  // title/message and printed an English stats blob:
  //   "64 sessions this week | 3-day streak at risk | 6170 XP (Instructor) | 61 reminders sent"
  // The child was never told what to study.
  it("carries the reminder's own session copy", () => {
    const t = buildTelegramReminderText({
      userName: "Rares",
      title: "Sesiune rapidă · 14:00",
      message: "Sesiune rapidă programată la 14:00 — hai să începem.",
      encouragement: "🔥 3 zile la rând — nu rupe seria azi.",
    });
    expect(t).toContain("Sesiune rapidă · 14:00");
    expect(t).toContain("programată la 14:00");
    expect(t).toContain("🔥 3 zile la rând");
  });

  it("never leaks the internal nag counter or the level label", () => {
    const t = buildTelegramReminderText({
      userName: "Rares",
      title: "Sesiune rapidă · 14:00",
      message: "Sesiune rapidă programată la 14:00 — hai să începem.",
      encouragement: "🔥 3 zile la rând — nu rupe seria azi.",
    });
    expect(t).not.toMatch(/reminders sent/i);
    expect(t).not.toMatch(/\bXP\b/);
    expect(t).not.toMatch(/Instructor|Cadet/);
    expect(t).not.toMatch(/sessions this week|streak at risk|streak lost/i);
  });

  it("keeps a custom reminder label — a parent's own name for the slot", () => {
    const t = buildTelegramReminderText({
      userName: "Rares",
      title: "Matematică de seară",
      message: "Sesiune lungă programată la 21:00 — hai să începem.",
      encouragement: null,
    });
    expect(t).toContain("Matematică de seară");
  });

  it("falls back to generic copy when the cascade carries no reminder", () => {
    const t = buildTelegramReminderText({
      userName: "Rares", title: null, message: null, encouragement: null,
    });
    expect(t).toContain("quiz scurt");
    expect(t).toContain("Rares");
  });

  it("omits the encouragement block entirely when there is none", () => {
    const t = buildTelegramReminderText({
      userName: "Rares", title: null,
      message: "Sesiune rapidă programată la 14:00 — hai să începem.",
      encouragement: null,
    });
    // Pe șirul BRUT, nu pe unul curățat: `trimEnd()` ștergea exact defectul pe care
    // aserțiunea pretindea că-l caută, deci nu putea pica niciodată.
    expect(t.endsWith("\n")).toBe(false);
    expect(t).not.toContain("🔥");
  });

  // Escaparea trăiește ACUM în builder, lângă `<b>`-ul pe care îl protejează. Înainte
  // era în apelant — o refactorizare distanță de a trimite HTML stricat, deci 400 de la
  // Telegram, treaptă marcată eșuată și cascadă urcată degeaba.
  it("escapes its own inputs — a user-set label cannot break the HTML", () => {
    const t = buildTelegramReminderText({
      userName: "A & B",
      title: "Mate <b> fizica",
      message: "5 > 3 & gata",
      encouragement: null,
    });
    expect(t).toContain("A &amp; B");
    expect(t).toContain("Mate &lt;b&gt; fizica");
    expect(t).toContain("5 &gt; 3 &amp; gata");
    // Singurele etichete rămase sunt cele pe care le pune builder-ul.
    expect(t.match(/<b>/g)?.length).toBe(1);
    expect(t.match(/<\/b>/g)?.length).toBe(1);
  });
});

describe("encouragementFor", () => {
  // A broken streak must stay SILENT. "streak lost" on a reminder is discouragement,
  // and this rung exists to get the child to start, not to score him.
  it("says nothing when the streak is broken", () => {
    expect(encouragementFor(0)).toBeNull();
    expect(encouragementFor(-3)).toBeNull();
    expect(encouragementFor(NaN)).toBeNull();
  });

  it("encourages a first day rather than counting it", () => {
    expect(encouragementFor(1)).toContain("Prima zi");
  });

  it("counts a real streak", () => {
    expect(encouragementFor(3)).toContain("3 zile la rând");
    expect(encouragementFor(30)).toContain("30 zile la rând");
  });

  it("is always positive — never mentions loss or risk", () => {
    for (const n of [1, 2, 5, 100]) {
      const line = encouragementFor(n)!;
      expect(line).not.toMatch(/pierdut|risc|rupt|at risk|lost/i);
    }
  });
});

describe("buttonLabelFor", () => {
  it("offers to START the session when the link opens one", () => {
    expect(buttonLabelFor("/dashboard/practice?start=quick&domain=mate")).toBe("Începe sesiunea");
  });

  it("falls back to opening the app for a plain link", () => {
    expect(buttonLabelFor("/dashboard/rapoarte")).toBe("Deschide eTutor");
    expect(buttonLabelFor(undefined)).toBe("Deschide eTutor");
  });

  it("is not fooled by 'start' appearing outside a query parameter", () => {
    expect(buttonLabelFor("/dashboard/start-here")).toBe("Deschide eTutor");
  });
});

describe("buildTelegramButtonUrl", () => {
  const base = "https://etutor.ro";

  // THE fix: a Telegram tap must count as an acknowledgement. A plain link left
  // `acknowledgedAt` null, so the cascade escalated to the next rung even after the
  // student had answered on the free channel.
  it("routes an in-app target through the ack endpoint", () => {
    const u = buildTelegramButtonUrl({
      base,
      rawUrl: "/dashboard/practice?start=quick&domain=aviation",
      escalationEventId: "evt_123",
    })!;
    expect(u.startsWith(`${base}/api/escalation/ack?`)).toBe(true);
    const q = new URL(u).searchParams;
    expect(q.get("e")).toBe("evt_123");
    expect(q.get("to")).toBe("/dashboard/practice?start=quick&domain=aviation");
  });

  it("links straight to the target when there is no event to acknowledge", () => {
    expect(
      buildTelegramButtonUrl({ base, rawUrl: "/dashboard/rapoarte", escalationEventId: undefined })
    ).toBe(`${base}/dashboard/rapoarte`);
  });

  it("passes an absolute target through untouched", () => {
    expect(
      buildTelegramButtonUrl({ base, rawUrl: "https://x.test/a", escalationEventId: "evt_1" })
    ).toBe("https://x.test/a");
  });

  it("returns null with no base — Telegram rejects relative URLs, so send plain text", () => {
    expect(buildTelegramButtonUrl({ base: "", rawUrl: "/x", escalationEventId: "e" })).toBeNull();
  });

  // Fără țintă rămâne rădăcina, exact ca înainte de rutarea prin confirmare — `/`
  // redirectează oricum spre dashboard sau login, după sesiune. Aserțiunea inițială
  // cerea `/dashboard` și a picat: testul greșea, nu codul.
  it("keeps the previous root target when the reminder carries no link", () => {
    const u = buildTelegramButtonUrl({ base, rawUrl: undefined, escalationEventId: "evt_1" })!;
    expect(new URL(u).searchParams.get("to")).toBe("/");
  });
});

describe("safeRedirectPath", () => {
  it("accepts a relative in-app path", () => {
    expect(safeRedirectPath("/dashboard/practice?start=quick")).toBe("/dashboard/practice?start=quick");
  });

  // `//evil.com` is protocol-relative — a browser treats it as absolute. Without this
  // guard the ack route is an open redirect reachable from any Telegram message.
  it("refuses a protocol-relative path", () => {
    expect(safeRedirectPath("//evil.test/steal")).toBe("/dashboard");
  });

  it("refuses an absolute URL and a scheme", () => {
    expect(safeRedirectPath("https://evil.test")).toBe("/dashboard");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("refuses CR/LF (header splitting)", () => {
    expect(safeRedirectPath("/ok\r\nSet-Cookie: a=b")).toBe("/dashboard");
  });

  it("falls back when there is nothing", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
  });
});
