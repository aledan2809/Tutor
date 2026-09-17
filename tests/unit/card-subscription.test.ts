import { describe, it, expect } from "vitest";
import { cardShaped, eventIsForCurrentSubscription, subscriptionEnded } from "@/lib/card-subscription";

const DAY = 24 * 60 * 60 * 1000;

describe("abonamentul plătit cu cardul", () => {
  it("are forma unui abonament Stripe: plătit fără dată de sfârșit, sau o reînnoire reîncercată", () => {
    expect(cardShaped({ subscriptionStatus: "active", subscriptionEndsAt: null })).toBe(true);
    expect(cardShaped({ subscriptionStatus: "trialing", subscriptionEndsAt: null })).toBe(true);
    expect(cardShaped({ subscriptionStatus: "past_due", subscriptionEndsAt: new Date(Date.now() + 10 * DAY) })).toBe(true);
  });

  it("un an dintr-un cod de 100% are dată de sfârșit: nu e abonament pe card", () => {
    expect(cardShaped({ subscriptionStatus: "active", subscriptionEndsAt: new Date(Date.now() + 300 * DAY) })).toBe(false);
  });

  it("un abonament oprit sau o grație expirată nu mai plătește nimic", () => {
    expect(cardShaped({ subscriptionStatus: "canceled", subscriptionEndsAt: new Date(Date.now() - DAY) })).toBe(false);
    expect(cardShaped({ subscriptionStatus: "past_due", subscriptionEndsAt: new Date(Date.now() - DAY) })).toBe(false);
    expect(cardShaped({ subscriptionStatus: null, subscriptionEndsAt: null })).toBe(false);
  });
});

describe("evenimentele unui abonament lăsat în urmă", () => {
  it("schimbă contul doar când sunt ale abonamentului pe care îl are acum", () => {
    expect(eventIsForCurrentSubscription("sub_new", "sub_new")).toBe(true);
    // Abonamentul vechi, rămas pornit după o plată nouă: reînnoirea, refuzul sau sfârșitul lui nu ating contul.
    expect(eventIsForCurrentSubscription("sub_new", "sub_old")).toBe(false);
  });

  it("când nu știm (cont de dinainte să păstrăm id-ul, broker vechi) e al contului", () => {
    expect(eventIsForCurrentSubscription(null, "sub_x")).toBe(true);
    expect(eventIsForCurrentSubscription("sub_x", null)).toBe(true);
    expect(eventIsForCurrentSubscription(undefined, undefined)).toBe(true);
  });
});

describe("un abonament oprit rămâne oprit (review r6, P1)", () => {
  it("ce vine după anulare e întârziat, chiar dacă un cod de 100% a făcut contul activ din nou", () => {
    // Anularea golește id-ul din cont, deci doar lista abonamentelor încheiate mai știe de el.
    expect(eventIsForCurrentSubscription(null, "sub_old")).toBe(true);
    expect(subscriptionEnded(["sub_old"], "sub_old")).toBe(true);
  });

  it("un abonament nou, sau un eveniment fără id, nu e oprit", () => {
    expect(subscriptionEnded(["sub_old"], "sub_new")).toBe(false);
    expect(subscriptionEnded(["sub_old"], null)).toBe(false);
    expect(subscriptionEnded([], "sub_old")).toBe(false);
  });

  it("o valoare stricată în setări nu oprește nimic", () => {
    expect(subscriptionEnded("sub_old", "sub_old")).toBe(false);
    expect(subscriptionEnded(null, "sub_old")).toBe(false);
    expect(subscriptionEnded({ sub_old: true }, "sub_old")).toBe(false);
  });
});
