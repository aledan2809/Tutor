import { describe, it, expect } from "vitest";
import { billingSummary, daysUntil, parseBrokerSubscription, periodFieldsFrom } from "@/lib/billing-period";
import { needsSubscriptionSync, SUBSCRIPTION_SYNC_TTL_MS } from "@/lib/subscription-sync";

/** The month after payment, as the payer sees it (Alex, 13.10.2026: „evidența lunii după plată"). */
const NOW = new Date("2026-10-13T10:00:00Z");
const d = (iso: string) => new Date(iso);

describe("rezumatul brokerului (contract v3)", () => {
  it("se citește câmp cu câmp; ce lipsește sau e stricat devine null", () => {
    expect(parseBrokerSubscription(null)).toBeNull();
    expect(parseBrokerSubscription({ currentPeriodEnd: "2026-11-13T10:00:00Z" })).toBeNull(); // fără status
    expect(
      parseBrokerSubscription({ status: "active", currentPeriodEnd: "2026-11-13T10:00:00Z", cancelAtPeriodEnd: "yes", cancelAt: "nu e dată", recurringAmount: -5 }),
    ).toEqual({
      status: "active",
      currentPeriodEnd: "2026-11-13T10:00:00.000Z",
      cancelAtPeriodEnd: false,
      cancelAt: null,
      trialEnd: null,
      endedAt: null,
      recurringAmount: null,
      currency: null,
      interval: null,
    });
  });

  it("ce se ține pe cont: sfârșitul perioadei, oprirea programată (fără dată = la sfârșitul perioadei), prețul", () => {
    const sub = parseBrokerSubscription({ status: "active", currentPeriodEnd: "2026-11-13T10:00:00Z", cancelAtPeriodEnd: true, recurringAmount: 3486 })!;
    expect(periodFieldsFrom(sub, NOW)).toEqual({
      subscriptionPeriodEnd: d("2026-11-13T10:00:00Z"),
      subscriptionCancelAt: d("2026-11-13T10:00:00Z"),
      subscriptionPrice: 3486,
      subscriptionSyncedAt: NOW,
    });
    const renewing = parseBrokerSubscription({ status: "active", currentPeriodEnd: "2026-11-13T10:00:00Z", cancelAtPeriodEnd: false })!;
    expect(periodFieldsFrom(renewing, NOW).subscriptionCancelAt).toBeNull();
  });
});

describe("ce vede plătitorul", () => {
  const base = { subscriptionStatus: "active", subscriptionEndsAt: null } as const;

  it("se reînnoiește: plătit până pe…, câte zile, următoarea plată și suma", () => {
    expect(billingSummary({ ...base, subscriptionPeriodEnd: d("2026-11-13T10:00:00Z"), subscriptionPrice: 3486 }, NOW)).toEqual({
      kind: "renews",
      at: "2026-11-13T10:00:00.000Z",
      daysLeft: 31,
      amountMinor: 3486,
    });
  });
  it("în proba cu card: prima plată, fără sumă", () => {
    expect(billingSummary({ subscriptionStatus: "trialing", subscriptionEndsAt: null, subscriptionPeriodEnd: d("2026-10-16T10:00:00Z") }, NOW)).toEqual({
      kind: "trial",
      at: "2026-10-16T10:00:00.000Z",
      daysLeft: 3,
    });
  });
  it("oprit din portal: acces până la data opririi, nimic de încasat", () => {
    expect(
      billingSummary({ ...base, subscriptionPeriodEnd: d("2026-11-13T10:00:00Z"), subscriptionCancelAt: d("2026-11-13T10:00:00Z") }, NOW),
    ).toMatchObject({ kind: "ends", daysLeft: 31 });
  });
  it("plătit pe o perioadă fixă (an din cod, plată sosită după anulare): până la data de pe cont", () => {
    expect(billingSummary({ ...base, subscriptionEndsAt: d("2026-10-14T09:00:00Z") }, NOW)).toEqual({ kind: "fixed", at: "2026-10-14T09:00:00.000Z", daysLeft: 1 });
  });
  it("plată refuzată: data următoarei reîncercări a băncii, sau că nu mai reîncearcă", () => {
    expect(billingSummary({ subscriptionStatus: "past_due", subscriptionEndsAt: NOW, subscriptionRetryAt: d("2026-10-16T10:00:00Z") }, NOW)).toEqual({
      kind: "retrying",
      retryAt: "2026-10-16T10:00:00.000Z",
    });
    expect(billingSummary({ subscriptionStatus: "past_due", subscriptionEndsAt: NOW }, NOW)).toEqual({ kind: "retrying", retryAt: null });
  });
  it("nimic de spus: fără pachet, anulat, perioadă necunoscută încă sau trecută", () => {
    expect(billingSummary({ subscriptionStatus: null, subscriptionEndsAt: null }, NOW)).toBeNull();
    expect(billingSummary({ subscriptionStatus: "canceled", subscriptionEndsAt: NOW }, NOW)).toBeNull();
    expect(billingSummary({ ...base }, NOW)).toBeNull();
    expect(billingSummary({ ...base, subscriptionPeriodEnd: d("2026-10-01T00:00:00Z") }, NOW)).toBeNull();
  });
  it("zilele se rotunjesc în sus: în ultima zi „o zi”, niciodată 0 cât ține accesul", () => {
    expect(daysUntil(d("2026-10-13T11:00:00Z"), NOW)).toBe(1);
    expect(daysUntil(d("2026-10-12T00:00:00Z"), NOW)).toBe(0);
  });
});

describe("citirea din broker la cerere", () => {
  const sub = { subscriptionStatus: "active", stripeSubscriptionId: "sub_1", subscriptionSyncedAt: null as Date | null };
  it("doar pentru un abonament pe card, când copia lipsește sau e veche", () => {
    expect(needsSubscriptionSync(sub, NOW)).toBe(true);
    expect(needsSubscriptionSync({ ...sub, subscriptionSyncedAt: new Date(NOW.getTime() - 60_000) }, NOW)).toBe(false);
    expect(needsSubscriptionSync({ ...sub, subscriptionSyncedAt: new Date(NOW.getTime() - SUBSCRIPTION_SYNC_TTL_MS - 1) }, NOW)).toBe(true);
    expect(needsSubscriptionSync({ ...sub, stripeSubscriptionId: null }, NOW)).toBe(false);
    expect(needsSubscriptionSync({ ...sub, subscriptionStatus: "canceled" }, NOW)).toBe(false);
  });
});
