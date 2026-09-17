import { describe, it, expect } from "vitest";
import {
  accessOpensPaidFeatures,
  resolveAccess,
  seatHolder,
  trialDaysLeft,
  trialStartOf,
  type AccessInput,
  type AccessPerson,
} from "@/lib/access";

const DAY = 24 * 60 * 60 * 1000;
const at = (iso: string) => new Date(iso);

function person(over: Partial<AccessPerson> = {}): AccessPerson {
  return {
    createdAt: at("2026-09-21T10:00:00+03:00"),
    subscriptionStatus: null,
    subscriptionEndsAt: null,
    freeForever: false,
    isSuperAdmin: false,
    ...over,
  };
}

function input(over: Partial<AccessInput> = {}): AccessInput {
  return {
    now: at("2026-09-23T10:00:00+03:00"),
    pauseStartsAt: at("2026-09-18T12:00:00+03:00"),
    self: person(),
    parents: [],
    orgCovered: false,
    staff: false,
    ...over,
  };
}

describe("cine are acces complet, fără probă și fără pauză", () => {
  it("administratorul platformei", () => {
    expect(resolveAccess(input({ self: person({ isSuperAdmin: true }) }))).toEqual({ kind: "full", reason: "staff" });
  });

  it("contul bifat „Gratuit permanent” — și după ce i-ar fi trecut proba", () => {
    const old = person({ createdAt: at("2026-01-01T00:00:00Z"), freeForever: true });
    expect(resolveAccess(input({ self: old, now: at("2026-12-01T00:00:00Z") }))).toEqual({ kind: "full", reason: "free_forever" });
  });

  it("abonamentul plătit sau în perioada gratuită cu card; unul expirat nu mai contează", () => {
    expect(resolveAccess(input({ self: person({ subscriptionStatus: "active" }) }))).toEqual({ kind: "full", reason: "paid" });
    expect(resolveAccess(input({ self: person({ subscriptionStatus: "trialing" }) }))).toEqual({ kind: "full", reason: "paid" });
    const expired = person({ subscriptionStatus: "active", subscriptionEndsAt: at("2026-01-01T00:00:00Z"), createdAt: at("2025-01-01T00:00:00Z") });
    expect(resolveAccess(input({ self: expired, now: at("2026-10-01T00:00:00Z") })).kind).toBe("paused");
  });

  it("copilul unui părinte care plătește sau e bifat gratuit permanent", () => {
    const child = person({ createdAt: at("2025-05-01T00:00:00Z") });
    const later = at("2026-10-15T00:00:00Z");
    expect(resolveAccess(input({ self: child, now: later, parents: [person({ subscriptionStatus: "active" })] }))).toEqual({ kind: "full", reason: "family_paid" });
    expect(resolveAccess(input({ self: child, now: later, parents: [person({ freeForever: true })] }))).toEqual({ kind: "full", reason: "free_forever" });
  });

  it("al doilea părinte din Family Duo / Family Trio, acoperit de pachetul primului părinte", () => {
    const spouse = person({ createdAt: at("2025-05-01T00:00:00Z") });
    const later = at("2026-10-15T00:00:00Z");
    const owner = person({ subscriptionStatus: "active", subscriptionPlan: { name: "Family Duo", familyPlanKey: "FAMILY_DUO" } });
    expect(resolveAccess(input({ self: spouse, now: later, coParents: [owner] }))).toEqual({ kind: "full", reason: "family_paid" });
    expect(resolveAccess(input({ self: spouse, now: later, coParents: [person({ freeForever: true })] }))).toEqual({ kind: "full", reason: "free_forever" });
    expect(resolveAccess(input({ self: spouse, now: later, coParents: [person()] })).kind).toBe("paused");
  });

  it("Family e pentru un părinte: un al doilea adult legat de copil nu primește Family Duo gratis", () => {
    const second = person({ createdAt: at("2025-05-01T00:00:00Z") });
    const later = at("2026-10-15T00:00:00Z");
    const familyOwner = person({ subscriptionStatus: "active", subscriptionPlan: { name: "Family", familyPlanKey: "FAMILY" } });
    const trioOwner = person({ subscriptionStatus: "active", subscriptionPlan: { name: "Trio", familyPlanKey: "TRIO" } });
    const familyTrioOwner = person({ subscriptionStatus: "active", subscriptionPlan: { name: "Family Trio", familyPlanKey: "FAMILY_TRIO" } });
    expect(resolveAccess(input({ self: second, now: later, coParents: [familyOwner] })).kind).toBe("paused");
    expect(resolveAccess(input({ self: second, now: later, coParents: [trioOwner] })).kind).toBe("paused");
    expect(resolveAccess(input({ self: second, now: later, coParents: [familyTrioOwner] }))).toEqual({ kind: "full", reason: "family_paid" });
    // A subscription marked paid by hand, without a plan, keeps covering as before.
    expect(resolveAccess(input({ self: second, now: later, coParents: [person({ subscriptionStatus: "active" })] }))).toEqual({ kind: "full", reason: "family_paid" });
  });

  it("Family Duo ia doi părinți, în ordinea în care au fost legați: al treilea adult nu e acoperit", () => {
    const later = at("2026-10-15T00:00:00Z");
    const owner = person({ subscriptionStatus: "active", subscriptionPlan: { name: "Family Duo", familyPlanKey: "FAMILY_DUO" } });
    const spouse = person({ createdAt: at("2025-05-01T00:00:00Z") });
    const third = person({ createdAt: at("2025-05-01T00:00:00Z") });
    const d = (iso: string) => at(iso);
    // The spouse was linked second: covered, even though a third adult is linked too.
    expect(
      resolveAccess(input({ self: spouse, now: later, coParentGroups: [{ linkedAt: d("2026-09-02T10:00:00Z"), others: [{ person: owner, linkedAt: d("2026-09-01T10:00:00Z") }, { person: third, linkedAt: d("2026-09-20T10:00:00Z") }] }] })),
    ).toEqual({ kind: "full", reason: "family_paid" });
    // The third adult, linked after both: no seat left.
    expect(
      resolveAccess(input({ self: third, now: later, coParentGroups: [{ linkedAt: d("2026-09-20T10:00:00Z"), others: [{ person: owner, linkedAt: d("2026-09-01T10:00:00Z") }, { person: spouse, linkedAt: d("2026-09-02T10:00:00Z") }] }] })).kind,
    ).toBe("paused");
    // „Gratuit permanent" has no seat limit.
    const ff = person({ freeForever: true });
    expect(
      resolveAccess(input({ self: third, now: later, coParentGroups: [{ linkedAt: d("2026-09-20T10:00:00Z"), others: [{ person: ff, linkedAt: d("2026-09-01T10:00:00Z") }, { person: spouse, linkedAt: d("2026-09-02T10:00:00Z") }] }] })),
    ).toEqual({ kind: "full", reason: "free_forever" });
  });

  it("Family acoperă copiii pentru care are loc, în ordinea legării; un loc suplimentar anulat nu mai acoperă (review r6, S1)", () => {
    const later = at("2026-10-15T00:00:00Z");
    const parent = (paidExtraChildSeats: number) =>
      person({ subscriptionStatus: "active", subscriptionPlan: { name: "Family", familyPlanKey: "FAMILY" }, paidExtraChildSeats, childIds: ["c1", "c2"] });
    const first = person({ id: "c1", createdAt: at("2025-05-01T00:00:00Z") });
    const second = person({ id: "c2", createdAt: at("2025-05-01T00:00:00Z") });
    expect(resolveAccess(input({ self: first, now: later, parents: [parent(0)] }))).toEqual({ kind: "full", reason: "family_paid" });
    expect(resolveAccess(input({ self: second, now: later, parents: [parent(1)] }))).toEqual({ kind: "full", reason: "family_paid" });
    expect(resolveAccess(input({ self: second, now: later, parents: [parent(0)] }))).toEqual({ kind: "paused", since: expect.any(Date), payer: "parent" });
  });

  it("cel care plătește ține mereu un loc, chiar legat ultimul: Family Duo tot doi părinți acoperă (review r6, A2)", () => {
    const later = at("2026-10-15T00:00:00Z");
    // Father and grandmother linked the child in the free week; the mother bought Family Duo after.
    const mother = person({ subscriptionStatus: "active", subscriptionPlan: { name: "Family Duo", familyPlanKey: "FAMILY_DUO" } });
    const father = person({ createdAt: at("2025-05-01T00:00:00Z") });
    const grandma = person({ createdAt: at("2025-05-01T00:00:00Z") });
    const d = (iso: string) => at(iso);
    expect(
      resolveAccess(input({ self: father, now: later, coParentGroups: [{ linkedAt: d("2026-09-01T10:00:00Z"), others: [{ person: grandma, linkedAt: d("2026-09-02T10:00:00Z") }, { person: mother, linkedAt: d("2026-09-10T10:00:00Z") }] }] })),
    ).toEqual({ kind: "full", reason: "family_paid" });
    expect(
      resolveAccess(input({ self: grandma, now: later, coParentGroups: [{ linkedAt: d("2026-09-02T10:00:00Z"), others: [{ person: father, linkedAt: d("2026-09-01T10:00:00Z") }, { person: mother, linkedAt: d("2026-09-10T10:00:00Z") }] }] })).kind,
    ).toBe("paused");
  });

  it("meditatorul unei familii care plătește un loc de meditator e acoperit, chiar dacă e și elev", () => {
    const later = at("2026-10-15T00:00:00Z");
    const tutor = person({ createdAt: at("2025-05-01T00:00:00Z") });
    const trio = person({ subscriptionStatus: "active", subscriptionPlan: { name: "Trio", familyPlanKey: "TRIO" } });
    const family = person({ subscriptionStatus: "active", subscriptionPlan: { name: "Family", familyPlanKey: "FAMILY" } });
    expect(resolveAccess(input({ self: tutor, now: later, tutorFamilies: [trio] }))).toEqual({ kind: "full", reason: "family_paid" });
    // Family has no tutor seat: nothing to lend.
    expect(resolveAccess(input({ self: tutor, now: later, tutorFamilies: [family] })).kind).toBe("paused");
    // The family stopped paying: the tutor's coverage stops too.
    expect(resolveAccess(input({ self: tutor, now: later, tutorFamilies: [person({ subscriptionPlan: { name: "Trio", familyPlanKey: "TRIO" } })] })).kind).toBe("paused");
  });

  it("un abonament Elev nu acoperă copilul (altfel proba fără card + cel mai ieftin plan = Family)", () => {
    const child = person({ createdAt: at("2025-05-01T00:00:00Z") });
    const later = at("2026-10-15T00:00:00Z");
    const elevParent = person({ subscriptionStatus: "active", subscriptionPlan: { name: "Self (elev)", familyPlanKey: "ELEV" } });
    expect(resolveAccess(input({ self: child, now: later, parents: [elevParent] })).kind).toBe("paused");
    // The parent's own Elev subscription still gives the parent full access.
    expect(resolveAccess(input({ self: elevParent, now: later }))).toEqual({ kind: "full", reason: "paid" });
  });

  it("o reînnoire refuzată de bancă (Stripe mai încearcă) nu pune familia în pauză", () => {
    const later = at("2026-10-15T00:00:00Z");
    const retrying = person({ createdAt: at("2025-05-01T00:00:00Z"), subscriptionStatus: "past_due", subscriptionPlan: { name: "Family", familyPlanKey: "FAMILY" } });
    expect(resolveAccess(input({ self: retrying, now: later }))).toEqual({ kind: "full", reason: "paid" });
    const child = person({ createdAt: at("2025-05-01T00:00:00Z") });
    expect(resolveAccess(input({ self: child, now: later, parents: [retrying] }))).toEqual({ kind: "full", reason: "family_paid" });
    // Once Stripe gives up it cancels: that ends it.
    expect(resolveAccess(input({ self: { ...retrying, subscriptionStatus: "canceled" }, now: later })).kind).toBe("paused");
  });

  it("cursantul plătit de firmă și meditatorul/instructorul", () => {
    const old = person({ createdAt: at("2025-05-01T00:00:00Z") });
    const later = at("2026-10-15T00:00:00Z");
    expect(resolveAccess(input({ self: old, now: later, orgCovered: true }))).toEqual({ kind: "full", reason: "org" });
    expect(resolveAccess(input({ self: old, now: later, staff: true }))).toEqual({ kind: "full", reason: "staff" });
  });
});

describe("proba de 7 zile", () => {
  const created = at("2026-09-21T10:00:00+03:00");

  it("cont nou: 7 zile din ziua creării, apoi pauză", () => {
    const self = person({ createdAt: created });
    const day1 = resolveAccess(input({ self, now: created }));
    expect(day1).toEqual({ kind: "trial", endsAt: new Date(created.getTime() + 7 * DAY), daysLeft: 7, via: "own" });

    const day7 = resolveAccess(input({ self, now: new Date(created.getTime() + 6.5 * DAY) }));
    expect(day7.kind === "trial" && day7.daysLeft).toBe(1);

    const day8 = resolveAccess(input({ self, now: new Date(created.getTime() + 7 * DAY) }));
    expect(day8).toEqual({ kind: "paused", since: new Date(created.getTime() + 7 * DAY), payer: "self" });
  });

  it("cât timp pauza e oprită, un cont nou are tot proba, iar unul vechi rămâne gratuit ca azi", () => {
    const self = person({ createdAt: created });
    expect(resolveAccess(input({ self, now: created, pauseStartsAt: null })).kind).toBe("trial");
    expect(resolveAccess(input({ self, now: new Date(created.getTime() + 30 * DAY), pauseStartsAt: null }))).toEqual({ kind: "free" });
  });

  it("contul care exista la pornirea pauzei primește 7 zile de atunci", () => {
    const switchOn = at("2026-09-25T09:00:00+03:00");
    const old = person({ createdAt: at("2026-03-01T00:00:00Z") });
    expect(trialStartOf(old.createdAt, switchOn)).toEqual(switchOn);
    expect(trialDaysLeft(old.createdAt, switchOn, switchOn)).toBe(7);
    expect(resolveAccess(input({ self: old, pauseStartsAt: switchOn, now: new Date(switchOn.getTime() + 3 * DAY) })).kind).toBe("trial");
    expect(resolveAccess(input({ self: old, pauseStartsAt: switchOn, now: new Date(switchOn.getTime() + 7 * DAY) })).kind).toBe("paused");
  });

  it("copilul primește proba părintelui, chiar dacă propria lui s-a terminat", () => {
    const child = person({ createdAt: at("2026-08-01T00:00:00Z") });
    const parent = person({ createdAt: created });
    const now = new Date(created.getTime() + 2 * DAY);
    expect(resolveAccess(input({ self: child, parents: [parent], now, pauseStartsAt: at("2026-08-02T00:00:00Z") }))).toEqual({
      kind: "trial",
      endsAt: new Date(created.getTime() + 7 * DAY),
      daysLeft: 5,
      via: "family",
    });
  });

  it("în pauză, copilul legat de părinte așteaptă plata părintelui", () => {
    const child = person({ createdAt: created });
    const parent = person({ createdAt: created });
    const later = new Date(created.getTime() + 10 * DAY);
    expect(resolveAccess(input({ self: child, parents: [parent], now: later }))).toMatchObject({ kind: "paused", payer: "parent" });
  });
});

describe("funcțiile plătite", () => {
  it("se deschid în probă și cu acces complet, nu și gratuit sau în pauză", () => {
    expect(accessOpensPaidFeatures({ kind: "full", reason: "paid" })).toBe(true);
    expect(accessOpensPaidFeatures({ kind: "trial", endsAt: new Date(), daysLeft: 3, via: "own" })).toBe(true);
    expect(accessOpensPaidFeatures({ kind: "free" })).toBe(false);
    expect(accessOpensPaidFeatures({ kind: "paused", since: new Date(), payer: "self" })).toBe(false);
  });
});

describe("părintele lăsat în afara pachetului altui părinte", () => {
  const plan = (name: string, familyPlanKey: string) => ({ name, familyPlanKey });
  const family = person({ subscriptionStatus: "active", subscriptionPlan: plan("Family", "FAMILY") });
  const duo = person({ subscriptionStatus: "active", subscriptionPlan: plan("Family Duo", "FAMILY_DUO") });
  const trio = person({ subscriptionStatus: "active", subscriptionPlan: plan("Trio", "TRIO") });

  it("Family acoperă copilul, dar nu și al doilea părinte: îi spunem cine are pachetul și că Family Duo îl include", () => {
    const found = seatHolder([[family]]);
    expect(found?.holder).toBe(family);
    expect(found?.plan.label).toBe("Family");
    expect(found?.upgrade?.label).toBe("Family Duo");
    // Trio (meditator, un părinte) urcă la Family Trio.
    expect(seatHolder([[trio]])?.upgrade?.label).toBe("Family Trio");
  });

  it("al treilea adult lângă Family Duo: nu există un pachet cu mai mulți părinți", () => {
    const found = seatHolder([[duo, person()]]);
    expect(found?.plan.label).toBe("Family Duo");
    expect(found?.upgrade).toBeNull();
    // Un Family cu două locuri trecute pe rând: Family Duo n-ar adăuga niciun loc, deci nu e propus.
    const widened = person({ subscriptionStatus: "active", subscriptionPlan: { name: "Family", familyPlanKey: "FAMILY", maxParents: 2 } });
    expect(seatHolder([[widened, person()]])?.upgrade).toBeNull();
  });

  it("un copil pe care nu-l acoperă nimeni: cumpărarea unui pachet rămâne calea, fără notă", () => {
    expect(seatHolder([[family], [person()]])).toBeNull();
    expect(seatHolder([])).toBeNull();
    // Elev plătește doar pentru contul propriu, nu pentru familie.
    expect(seatHolder([[person({ subscriptionStatus: "active", subscriptionPlan: plan("Elev", "ELEV") })]])).toBeNull();
    // Un pachet oprit nu mai acoperă pe nimeni.
    expect(seatHolder([[person({ subscriptionStatus: "canceled", subscriptionPlan: plan("Family", "FAMILY") })]])).toBeNull();
  });

  it("„Gratuit permanent” nu are limită de locuri, deci nu e numit ca deținător", () => {
    expect(seatHolder([[person({ freeForever: true })]])).toBeNull();
    // Primul plătitor cu limită, în ordinea legării, e cel numit.
    expect(seatHolder([[person({ freeForever: true }), family]])?.holder).toBe(family);
  });
});
