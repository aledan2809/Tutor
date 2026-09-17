import { describe, it, expect } from "vitest";
import {
  ESCALATION_LADDER,
  isPaidSubscriber,
  isPaidChannelDeliverable,
  resolveCascadeWindow,
  meteredChannelsCovered,
  coveredByPayingParent,
  rungCannotReach,
  SELECT_ACOPERIRE_CANALE,
} from "@/lib/escalation/segmentation";
import { ESCALATION_LEVELS, CASCADE_GRACE_MINUTES } from "@/lib/escalation/config";

describe("Escalation segmentation", () => {
  describe("isPaidSubscriber", () => {
    it("active / trialing (unexpired) are paid", () => {
      expect(isPaidSubscriber({ subscriptionStatus: "active", subscriptionEndsAt: null })).toBe(true);
      expect(isPaidSubscriber({ subscriptionStatus: "trialing", subscriptionEndsAt: null })).toBe(true);
      const future = new Date(Date.now() + 60_000);
      expect(isPaidSubscriber({ subscriptionStatus: "active", subscriptionEndsAt: future })).toBe(true);
    });
    it("expired / canceled / past_due / null are free", () => {
      const past = new Date(Date.now() - 60_000);
      expect(isPaidSubscriber({ subscriptionStatus: "active", subscriptionEndsAt: past })).toBe(false);
      for (const s of ["canceled", "past_due", null]) {
        expect(isPaidSubscriber({ subscriptionStatus: s, subscriptionEndsAt: null })).toBe(false);
      }
    });
  });

  describe("isPaidChannelDeliverable", () => {
    const base = {
      telegramLinked: false,
      telegramEnabled: false,
      whatsappConfigured: false,
      smsConfigured: false,
      emailConfigured: false,
    };
    it("PUSH is always deliverable", () => {
      expect(isPaidChannelDeliverable("PUSH", base)).toBe(true);
    });
    it("Email needs SMTP configured (else skip, not retry-forever)", () => {
      expect(isPaidChannelDeliverable("EMAIL", base)).toBe(false);
      expect(isPaidChannelDeliverable("EMAIL", { ...base, emailConfigured: true })).toBe(true);
    });
    it("Telegram needs linked AND enabled", () => {
      expect(isPaidChannelDeliverable("TELEGRAM", base)).toBe(false);
      expect(isPaidChannelDeliverable("TELEGRAM", { ...base, telegramLinked: true })).toBe(false);
      expect(isPaidChannelDeliverable("TELEGRAM", { ...base, telegramEnabled: true })).toBe(false);
      expect(isPaidChannelDeliverable("TELEGRAM", { ...base, telegramLinked: true, telegramEnabled: true })).toBe(true);
    });
    it("WhatsApp needs config; SMS needs its gateway", () => {
      expect(isPaidChannelDeliverable("WHATSAPP", base)).toBe(false);
      expect(isPaidChannelDeliverable("WHATSAPP", { ...base, whatsappConfigured: true })).toBe(true);
      expect(isPaidChannelDeliverable("SMS", base)).toBe(false);
      expect(isPaidChannelDeliverable("SMS", { ...base, smsConfigured: true })).toBe(true);
    });
  });

  describe("resolveCascadeWindow", () => {
    it("maps reminder messageType to a time window", () => {
      expect(resolveCascadeWindow("morning_quiz")).toBe("morning");
      expect(resolveCascadeWindow("evening_complex")).toBe("evening");
      expect(resolveCascadeWindow("missed_session")).toBe("default");
      expect(resolveCascadeWindow(undefined)).toBe("default");
    });
  });

  describe("ESCALATION_LADDER (notify-ladder wiring)", () => {
    it("has one step per escalation level", () => {
      expect(ESCALATION_LADDER.steps).toHaveLength(ESCALATION_LEVELS.length);
    });
    it("maps channels into the notify-ladder union (Telegram→push)", () => {
      expect(ESCALATION_LADDER.steps.map((s) => s.channel)).toEqual([
        "push",
        "push",
        "email",
        "whatsapp",
        "sms",
      ]);
    });
    it("graceMsFor resolves fast morning, slow evening", () => {
      const g = (mt: string) => ESCALATION_LADDER.graceMsFor!(ESCALATION_LADDER.steps[0], mt);
      expect(g("morning_quiz")).toBe(CASCADE_GRACE_MINUTES.morning * 60_000);
      expect(g("evening_complex")).toBe(CASCADE_GRACE_MINUTES.evening * 60_000);
      expect(g("missed_session")).toBe(CASCADE_GRACE_MINUTES.default * 60_000);
      expect(g("morning_quiz")).toBeLessThan(g("evening_complex"));
    });
  });
});

describe("meteredChannelsCovered — cine plătește canalele contorizate", () => {
  const free = { subscriptionStatus: null, subscriptionEndsAt: null };

  it("firma cu canale incluse acoperă un om fără abonament (cazul Poșta)", () => {
    expect(meteredChannelsCovered({ ...free, organization: { meteredIncluded: true } })).toBe(true);
  });

  it("firma fără canale incluse nu acoperă pe nimeni", () => {
    expect(meteredChannelsCovered({ ...free, organization: { meteredIncluded: false } })).toBe(false);
  });

  it("fără firmă, răspunde exact ca abonamentul individual", () => {
    expect(meteredChannelsCovered(free)).toBe(false);
    expect(meteredChannelsCovered({ subscriptionStatus: "active", subscriptionEndsAt: null })).toBe(true);
    expect(
      meteredChannelsCovered({
        subscriptionStatus: "active",
        subscriptionEndsAt: new Date(Date.now() - 86_400_000),
      }),
    ).toBe(false);
  });

  it("firma acoperă și peste un abonament expirat", () => {
    expect(
      meteredChannelsCovered({
        subscriptionStatus: "active",
        subscriptionEndsAt: new Date(Date.now() - 86_400_000),
        organization: { meteredIncluded: true },
      }),
    ).toBe(true);
  });
});

describe("meteredChannelsCovered — legătura reală cu clientul B2B trece prin înscriere", () => {
  // Măsurat pe producție: firma „Poșta Română (demo)" are 3 materii și ZERO membri.
  // Cursanții sunt conturi obișnuite (`organizationId` null), legate de client prin
  // înscrierea la materia lui. O poartă care s-ar fi uitat doar la apartenența
  // contului ar fi trecut toate testele și n-ar fi acoperit niciun cursant real.
  const cursantPosta = {
    subscriptionStatus: null,
    subscriptionEndsAt: null,
    organization: null,
    enrollments: [{ id: "inscriere-la-materia-postei" }],
  };

  it("un cursant fără abonament și fără firmă pe cont e acoperit prin înscriere", () => {
    expect(meteredChannelsCovered(cursantPosta)).toBe(true);
  });

  it("fără nicio înscriere acoperită, rămâne pe regula veche", () => {
    expect(meteredChannelsCovered({ ...cursantPosta, enrollments: [] })).toBe(false);
    expect(meteredChannelsCovered({ ...cursantPosta, enrollments: null })).toBe(false);
  });

  it("cele două căi sunt independente — oricare singură ajunge", () => {
    expect(
      meteredChannelsCovered({
        subscriptionStatus: null,
        subscriptionEndsAt: null,
        organization: { meteredIncluded: true },
        enrollments: [],
      }),
    ).toBe(true);
  });
});

describe("SELECT_ACOPERIRE_CANALE — filtrul e partea care contează", () => {
  it("cere doar înscrierile active la materii ale unei firme cu canale incluse", () => {
    // Fără `where`, `enrollments` ar fi toate înscrierile omului, iar predicatul de
    // mai sus ar deschide canalele plătite pentru oricine e înscris undeva.
    expect(SELECT_ACOPERIRE_CANALE.enrollments.where).toEqual({
      isActive: true,
      domain: { organization: { meteredIncluded: true } },
    });
    expect(SELECT_ACOPERIRE_CANALE.enrollments.take).toBe(1);
    expect(SELECT_ACOPERIRE_CANALE.subscriptionEndsAt).toBe(true);
  });

  it("citește doar legăturile PARENT active, cu data de expirare a părintelui", () => {
    // Fără `relation: "PARENT"`, un meditator cu abonament ar acoperi toți elevii lui.
    // Fără `subscriptionEndsAt`, predicatul n-ar putea vedea un abonament expirat.
    expect(SELECT_ACOPERIRE_CANALE.guardianLinks.where.status).toBe("active");
    expect(SELECT_ACOPERIRE_CANALE.guardianLinks.where.relation).toBe("PARENT");
    expect(SELECT_ACOPERIRE_CANALE.guardianLinks.select.parent.select).toEqual({
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      freeForever: true,
      isSuperAdmin: true,
      subscriptionPlan: { select: { name: true, familyPlanKey: true, maxParents: true, maxChildren: true } },
      paidExtraChildSeats: true,
      childrenLinks: { where: { status: "active", relation: "PARENT" }, orderBy: { createdAt: "asc" }, select: { childId: true } },
    });
    // Without the child's own id the seat order can't be read.
    expect(SELECT_ACOPERIRE_CANALE.id).toBe(true);
  });
});

describe("coveredByPayingParent — copilul dintr-un pachet de familie", () => {
  const free = { subscriptionStatus: null, subscriptionEndsAt: null };
  const link = (parent: { subscriptionStatus: string | null; subscriptionEndsAt: Date | null; freeForever?: boolean } | null) => ({ parent });

  it("un părinte cu abonament activ sau în perioada gratuită acoperă copilul", () => {
    expect(coveredByPayingParent({ guardianLinks: [link({ subscriptionStatus: "active", subscriptionEndsAt: null })] })).toBe(true);
    expect(coveredByPayingParent({ guardianLinks: [link({ subscriptionStatus: "trialing", subscriptionEndsAt: null })] })).toBe(true);
  });

  it("un abonament anulat, restant sau expirat nu acoperă", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(coveredByPayingParent({ guardianLinks: [link({ subscriptionStatus: "canceled", subscriptionEndsAt: null })] })).toBe(false);
    expect(coveredByPayingParent({ guardianLinks: [link({ subscriptionStatus: "past_due", subscriptionEndsAt: null })] })).toBe(false);
    expect(coveredByPayingParent({ guardianLinks: [link({ subscriptionStatus: "active", subscriptionEndsAt: past })] })).toBe(false);
  });

  it("fără legături, sau cu un părinte lipsă, nu acoperă", () => {
    expect(coveredByPayingParent({})).toBe(false);
    expect(coveredByPayingParent({ guardianLinks: null })).toBe(false);
    expect(coveredByPayingParent({ guardianLinks: [] })).toBe(false);
    expect(coveredByPayingParent({ guardianLinks: [link(null)] })).toBe(false);
  });

  it("contul „Gratuit permanent” acoperă ca un abonament: al lui și al copilului lui", () => {
    expect(meteredChannelsCovered({ ...free, freeForever: true })).toBe(true);
    expect(coveredByPayingParent({ guardianLinks: [link({ ...free, freeForever: true })] })).toBe(true);
    expect(SELECT_ACOPERIRE_CANALE.freeForever).toBe(true);
    expect(SELECT_ACOPERIRE_CANALE.guardianLinks.select.parent.select.freeForever).toBe(true);
  });

  it("Family acoperă copilul pentru care are loc: al doilea copil cere loc suplimentar plătit (review r6, S1)", () => {
    const family = { subscriptionStatus: "active", subscriptionEndsAt: null, subscriptionPlan: { name: "Family", familyPlanKey: "FAMILY" } };
    const kids = [{ childId: "c1" }, { childId: "c2" }];
    const covered = (id: string, paidExtraChildSeats = 0) =>
      coveredByPayingParent({ id, guardianLinks: [link({ ...family, childrenLinks: kids, paidExtraChildSeats } as never)] });
    expect(covered("c1")).toBe(true);
    expect(covered("c2")).toBe(false);
    // The add-on seat covers the second child; cancelled (0 again), it doesn't.
    expect(covered("c2", 1)).toBe(true);
    // „Gratuit permanent" has no child limit.
    expect(coveredByPayingParent({ id: "c2", guardianLinks: [link({ ...free, freeForever: true, childrenLinks: kids } as never)] })).toBe(true);
  });

  it("administratorul platformei acoperă copilul, cum îl socotește și accesul (review r6, A7)", () => {
    expect(coveredByPayingParent({ guardianLinks: [link({ ...free, isSuperAdmin: true } as never)] })).toBe(true);
    expect(SELECT_ACOPERIRE_CANALE.guardianLinks.where.parent.OR).toContainEqual({ isSuperAdmin: true });
  });

  it("un abonament Elev (pentru un singur cont) nu acoperă copilul; un pachet de familie sau unul fără plan înregistrat da", () => {
    const elev = { name: "Self (elev)", familyPlanKey: "ELEV" };
    const family = { name: "Family", familyPlanKey: "FAMILY" };
    expect(coveredByPayingParent({ guardianLinks: [link({ subscriptionStatus: "active", subscriptionEndsAt: null, subscriptionPlan: elev } as never)] })).toBe(false);
    expect(coveredByPayingParent({ guardianLinks: [link({ subscriptionStatus: "active", subscriptionEndsAt: null, subscriptionPlan: family } as never)] })).toBe(true);
    // Accounts activated by hand have a paid status but no plan row: they keep covering (2 on production, 17.09).
    expect(coveredByPayingParent({ guardianLinks: [link({ subscriptionStatus: "active", subscriptionEndsAt: null, subscriptionPlan: null } as never)] })).toBe(true);
  });

  it("ajunge un singur părinte plătitor dintre mai mulți", () => {
    expect(
      coveredByPayingParent({
        guardianLinks: [link(free), link({ subscriptionStatus: "active", subscriptionEndsAt: null })],
      }),
    ).toBe(true);
  });

  it("meteredChannelsCovered deschide canalele pentru copilul unei familii care plătește", () => {
    expect(meteredChannelsCovered(free)).toBe(false);
    expect(
      meteredChannelsCovered({ ...free, guardianLinks: [link({ subscriptionStatus: "active", subscriptionEndsAt: null })] }),
    ).toBe(true);
    expect(
      meteredChannelsCovered({ ...free, guardianLinks: [link({ subscriptionStatus: "canceled", subscriptionEndsAt: null })] }),
    ).toBe(false);
  });
});

describe("rungCannotReach — treptele care nu pot ajunge la om se sar", () => {
  const ok = { hasEmail: true, hasPhone: true, covered: true, isTest: false, parentAuthorized: false };

  it("emailul fără adresă nu poate ajunge", () => {
    expect(rungCannotReach("EMAIL", { ...ok, hasEmail: false })).toBe("no_email");
    expect(rungCannotReach("EMAIL", ok)).toBeNull();
  });

  it("WhatsApp și SMS pe un cont neacoperit nu pot ajunge", () => {
    for (const channel of ["WHATSAPP", "SMS"] as const) {
      expect(rungCannotReach(channel, { ...ok, covered: false })).toBe("not_covered");
    }
  });

  it("contul de test și părintele care a autorizat trec de acoperire", () => {
    for (const channel of ["WHATSAPP", "SMS"] as const) {
      expect(rungCannotReach(channel, { ...ok, covered: false, isTest: true })).toBeNull();
      expect(rungCannotReach(channel, { ...ok, covered: false, parentAuthorized: true })).toBeNull();
    }
  });

  it("WhatsApp și SMS fără număr de telefon nu pot ajunge", () => {
    for (const channel of ["WHATSAPP", "SMS"] as const) {
      expect(rungCannotReach(channel, { ...ok, hasPhone: false })).toBe("no_phone");
    }
  });

  it("notificarea din aplicație și Telegram nu depind de email sau telefon", () => {
    const nimic = { hasEmail: false, hasPhone: false, covered: false, isTest: false, parentAuthorized: false };
    expect(rungCannotReach("PUSH", nimic)).toBeNull();
    expect(rungCannotReach("TELEGRAM", nimic)).toBeNull();
  });
});
