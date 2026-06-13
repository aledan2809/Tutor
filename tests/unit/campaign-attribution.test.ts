import { describe, it, expect } from "vitest";
import {
  serializeAttribution,
  parseAttribution,
  attributionFromParams,
  summarizeCampaignSignups,
  type CampaignReportRow,
} from "@/lib/campaign-attribution";

describe("campaign attribution", () => {
  describe("serialize / parse round-trip", () => {
    it("round-trips a full attribution", () => {
      const a = {
        campaign: "bac",
        voucher: "BAC2026FREE",
        landingPath: "/bac",
        utmSource: "facebook",
        utmMedium: "cpc",
        utmCampaign: "bac2026",
        utmContent: "ad-a",
        utmTerm: "bacalaureat",
      };
      expect(parseAttribution(serializeAttribution(a))).toEqual(a);
    });

    it("serializes empty attribution to empty string", () => {
      expect(serializeAttribution({})).toBe("");
      expect(serializeAttribution({ campaign: "   " })).toBe("");
    });

    it("parse returns null for empty / malformed / non-object input", () => {
      expect(parseAttribution("")).toBeNull();
      expect(parseAttribution(undefined)).toBeNull();
      expect(parseAttribution("not json")).toBeNull();
      expect(parseAttribution("123")).toBeNull();
      expect(parseAttribution("[1,2]")).toBeNull();
      expect(parseAttribution("{}")).toBeNull();
    });

    it("whitelists keys and drops unknown fields", () => {
      const raw = JSON.stringify({ campaign: "evaluare", evil: "x", __proto__: "y" });
      expect(parseAttribution(raw)).toEqual({ campaign: "evaluare" });
    });

    it("caps field length at 200 chars", () => {
      const long = "a".repeat(500);
      const parsed = parseAttribution(JSON.stringify({ campaign: long }));
      expect(parsed?.campaign).toHaveLength(200);
    });
  });

  describe("attributionFromParams", () => {
    it("applies campaign + voucher defaults and forwards utm", () => {
      const params = new URLSearchParams(
        "utm_source=facebook&utm_medium=cpc&utm_content=v1"
      );
      const attr = attributionFromParams(params, "/bac", {
        campaign: "bac",
        voucher: "BAC2026FREE",
      });
      expect(attr).toEqual({
        landingPath: "/bac",
        campaign: "bac",
        voucher: "BAC2026FREE",
        utmSource: "facebook",
        utmMedium: "cpc",
        utmContent: "v1",
      });
    });

    it("falls back to utm_campaign when no explicit campaign default", () => {
      const params = new URLSearchParams("utm_campaign=spring&utm_source=email");
      const attr = attributionFromParams(params, "/x");
      expect(attr.campaign).toBe("spring");
      expect(attr.utmCampaign).toBe("spring");
      expect(attr.utmSource).toBe("email");
    });

    it("keeps only landingPath when nothing else is present", () => {
      const attr = attributionFromParams(new URLSearchParams(""), "/bac");
      expect(attr).toEqual({ landingPath: "/bac" });
    });
  });

  describe("summarizeCampaignSignups", () => {
    const rows: CampaignReportRow[] = [
      { campaign: "bac", voucherCode: "BAC2026FREE", converted: true },
      { campaign: "bac", voucherCode: "BAC2026FREE", converted: false },
      { campaign: "evaluare", voucherCode: "EVALUARE100", converted: true },
      { campaign: null, voucherCode: null, converted: false },
    ];

    it("computes totals with conversion rate", () => {
      const r = summarizeCampaignSignups(rows);
      expect(r.totals).toEqual({ signups: 4, converted: 2, conversionRate: 0.5 });
    });

    it("buckets per campaign with (direct) fallback, sorted by signups", () => {
      const r = summarizeCampaignSignups(rows);
      expect(r.byCampaign[0]).toEqual({
        key: "bac",
        signups: 2,
        converted: 1,
        conversionRate: 0.5,
      });
      expect(r.byCampaign.find((b) => b.key === "(direct)")).toEqual({
        key: "(direct)",
        signups: 1,
        converted: 0,
        conversionRate: 0,
      });
    });

    it("buckets per voucher with (none) fallback", () => {
      const r = summarizeCampaignSignups(rows);
      expect(r.byVoucher.find((b) => b.key === "EVALUARE100")).toEqual({
        key: "EVALUARE100",
        signups: 1,
        converted: 1,
        conversionRate: 1,
      });
      expect(r.byVoucher.find((b) => b.key === "(none)")?.signups).toBe(1);
    });

    it("handles empty input", () => {
      expect(summarizeCampaignSignups([])).toEqual({
        byCampaign: [],
        byVoucher: [],
        totals: { signups: 0, converted: 0, conversionRate: 0 },
      });
    });
  });
});
