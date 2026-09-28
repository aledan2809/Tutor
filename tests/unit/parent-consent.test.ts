import { describe, it, expect } from "vitest";
import { consentState, maskEmail, consentEmail, type ConsentFacts } from "@/lib/parent-consent";

const now = new Date("2026-09-28T10:00:00Z");
const day = 24 * 60 * 60 * 1000;
const learner: ConsentFacts = {
  accountRole: "STUDENT", learning: true, isChild: false, staff: false, isParent: false, isGuest: false, organizationId: null,
  companyCovered: false, paying: false, birthYear: null, parentConsentEmail: null, parentConsentRequestedAt: null, parentConsentAt: null, parentConsentRefusedAt: null,
};

describe("consentState", () => {
  it("not asked: a child a parent covers, staff, guests, company learners, parents", () => {
    for (const u of [
      { ...learner, isChild: true }, { ...learner, staff: true }, { ...learner, isGuest: true },
      { ...learner, organizationId: "org" }, { ...learner, accountRole: "PARENT" }, { ...learner, accountRole: null, learning: false },
      { ...learner, companyCovered: true }, { ...learner, accountRole: null, isParent: true },
    ]) expect(consentState(u, now).kind).toBe("none");
  });
  it("a learner on their own without a year: asked first", () => {
    expect(consentState(learner, now).kind).toBe("ask-age");
    expect(consentState({ ...learner, accountRole: null }, now).kind).toBe("ask-age");
  });
  it("16 or over: nothing to ask", () => {
    expect(consentState({ ...learner, birthYear: 2009 }, now).kind).toBe("none");
  });
  it("under 16: parent's email, then 7 days of waiting, then blocked", () => {
    const minor = { ...learner, birthYear: 2012 };
    expect(consentState(minor, now).kind).toBe("ask-parent");
    const asked = { ...minor, parentConsentEmail: "mama@x.ro", parentConsentRequestedAt: new Date(now.getTime() - 2 * day) };
    expect(consentState(asked, now)).toEqual({ kind: "waiting", parentEmail: "mama@x.ro", daysLeft: 5 });
    const late = { ...asked, parentConsentRequestedAt: new Date(now.getTime() - 7 * day) };
    expect(consentState(late, now)).toEqual({ kind: "blocked", reason: "no-answer", parentEmail: "mama@x.ro" });
    expect(consentState({ ...late, parentConsentAt: now }, now).kind).toBe("none");
    expect(consentState({ ...asked, parentConsentRefusedAt: now }, now)).toMatchObject({ kind: "blocked", reason: "refused" });
  });
  it("a refusal holds: a new request pending or a parent link doesn't reopen the account; a later yes does", () => {
    const refused = { ...learner, birthYear: 2012, parentConsentEmail: "tata@x.ro", parentConsentRequestedAt: now, parentConsentRefusedAt: now };
    expect(consentState(refused, now).kind).toBe("blocked");
    expect(consentState({ ...refused, isChild: true }, now).kind).toBe("blocked");
    expect(consentState({ ...refused, parentConsentAt: now }, now).kind).toBe("none");
    // Nor does a company course joined afterwards.
    expect(consentState({ ...refused, companyCovered: true }, now).kind).toBe("blocked");
  });
  it("a company course doesn't replace the answer of a declared minor still waiting", () => {
    const waiting = { ...learner, birthYear: 2013, companyCovered: true, parentConsentEmail: "m@x.ro", parentConsentRequestedAt: now };
    expect(consentState(waiting, now).kind).toBe("waiting");
    expect(consentState({ ...waiting, parentConsentAt: now }, now).kind).toBe("none");
    expect(consentState({ ...learner, birthYear: 1990, companyCovered: true }, now).kind).toBe("none");
  });
  it("a paying account isn't locked out without an answer (still asked); a refusal still stops it", () => {
    const late = { ...learner, birthYear: 2012, paying: true, parentConsentEmail: "m@x.ro", parentConsentRequestedAt: new Date(now.getTime() - 9 * day) };
    expect(consentState(late, now)).toEqual({ kind: "waiting", parentEmail: "m@x.ro", daysLeft: 0 });
    expect(consentState({ ...late, parentConsentRefusedAt: now }, now).kind).toBe("blocked");
  });
});

describe("helpers", () => {
  it("masks the parent's address", () => {
    expect(maskEmail("mama.pop@gmail.com")).toBe("m***@gmail.com");
  });
  it("the email escapes the child's name", () => {
    const m = consentEmail("ro", "<b>Ana</b>", "ana.pop", "https://etutor.ro/ro/acord-parinte/abc", 5);
    expect(m.html).toContain("&lt;b&gt;Ana");
    expect(m.html).not.toContain("<b>Ana");
    expect(m.html).toContain('href="https://etutor.ro/ro/acord-parinte/abc"');
    expect(m.html).toContain("mai merge 5 zile");
    // The subject never carries the typed name (it would carry any text to any address).
    expect(consentEmail("ro", "Contul tău e blocat — intră pe x.ro", "a", "u", 5).subject).toBe("Acordul unui părinte pentru un cont de elev pe eTutor.ro");
  });
});
