import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/access-server", () => ({ loadPauseStartsAt: async () => null }));

import {
  assertInviteCaps,
  inviteEmailHtml,
  InviteRateLimitError,
  INVITE_DAILY_CAP_PER_ADDRESS,
  INVITE_DAILY_CAP_PER_INVITER,
} from "@/lib/family-invite";
import { INVITE_CHANNEL, INVITE_TARGET_ROLE } from "@/lib/family";
import { releaseSignupSlot, resetSignupLimit, SIGNUPS_PER_IP_PER_HOUR, takeSignupSlot } from "@/lib/signup-limit";
import { siteConsentCapReached } from "@/lib/parent-consent-server";
import { CONSENT_EMAILS_PER_DAY_SITE, CONSENT_TO_PREFIX, consentToId } from "@/lib/parent-consent";

/**
 * True E2E 2026-10-05 §6, step 5 — the two P1 findings confirmed on QA:
 * S1 the invitation email put the inviter's typed name into the HTML as is, with no ceiling;
 * S2 signup sends a consent email to any typed address, with no ceiling per network or per site.
 */

describe("invitation email (S1)", () => {
  it("escapes the inviter's name", () => {
    const html = inviteEmailHtml({
      inviterName: '<a href="https://evil.example">Click</a><img src=x onerror=alert(1)>',
      target: INVITE_TARGET_ROLE.CHILD,
      acceptUrl: "https://etutor.ro/family/accept/abc",
    });
    expect(html).not.toContain("<a href=\"https://evil");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;a href=&quot;https:&#x2F;&#x2F;evil.example&quot;&gt;");
  });

  it("keeps the name to one short line", () => {
    const html = inviteEmailHtml({
      inviterName: `Ana\n\nSubject: altceva ${"x".repeat(200)}`,
      target: INVITE_TARGET_ROLE.PARENT,
      acceptUrl: "https://etutor.ro/family/accept/abc",
    });
    expect(html).toContain("Ana Subject: altceva");
    expect(html).not.toContain("x".repeat(100));
  });

  it("still reads normally without a name", () => {
    const html = inviteEmailHtml({ inviterName: null, target: INVITE_TARGET_ROLE.TUTOR, acceptUrl: "https://etutor.ro/x" });
    expect(html).toContain("<p>te invită pe eTutor.ro ca <strong>meditator</strong>.</p>");
    expect(html).toContain('<a href="https:&#x2F;&#x2F;etutor.ro&#x2F;x">');
  });
});

describe("invitation ceilings (S1)", () => {
  const NOW = new Date("2026-10-06T10:00:00Z");
  function fakeDb(byInviter: number, toAddress: number) {
    const calls: unknown[] = [];
    return {
      calls,
      familyInvite: {
        count: async (args: { where: Record<string, unknown> }) => {
          calls.push(args.where);
          return "inviterId" in args.where ? byInviter : toAddress;
        },
      },
    };
  }

  it("lets an invitation through under both ceilings", async () => {
    const db = fakeDb(INVITE_DAILY_CAP_PER_INVITER - 1, INVITE_DAILY_CAP_PER_ADDRESS - 1);
    await expect(
      assertInviteCaps(db as never, { inviterId: "u1", channel: INVITE_CHANNEL.EMAIL, email: "a@b.ro", now: NOW }),
    ).resolves.toBeUndefined();
    // Both counts look back exactly one day; the address is matched whatever its capitals.
    const [inviter, address] = db.calls as Record<string, { gte?: Date; equals?: string; mode?: string }>[];
    expect(inviter.createdAt.gte).toEqual(new Date("2026-10-05T10:00:00Z"));
    expect(address.email).toEqual({ equals: "a@b.ro", mode: "insensitive" });
  });

  it(`stops the ${INVITE_DAILY_CAP_PER_INVITER + 1}th invitation of the day from one account`, async () => {
    const db = fakeDb(INVITE_DAILY_CAP_PER_INVITER, 0);
    const err = await assertInviteCaps(db as never, { inviterId: "u1", channel: INVITE_CHANNEL.CODE, now: NOW }).catch((e) => e);
    expect(err).toBeInstanceOf(InviteRateLimitError);
    expect(err.reason).toBe("inviter");
    expect(err.message).toMatch(/mâine/);
  });

  it(`stops the ${INVITE_DAILY_CAP_PER_ADDRESS + 1}rd email of the day to one address, from anyone`, async () => {
    const db = fakeDb(0, INVITE_DAILY_CAP_PER_ADDRESS);
    const err = await assertInviteCaps(db as never, { inviterId: "u2", channel: INVITE_CHANNEL.EMAIL, email: "A@B.ro", now: NOW }).catch((e) => e);
    expect(err).toBeInstanceOf(InviteRateLimitError);
    expect(err.reason).toBe("address");
  });

  it("does not count addresses for invitations that send no email", async () => {
    const db = fakeDb(0, 99);
    await expect(
      assertInviteCaps(db as never, { inviterId: "u1", channel: INVITE_CHANNEL.WHATSAPP, email: "a@b.ro", now: NOW }),
    ).resolves.toBeUndefined();
    expect(db.calls).toHaveLength(1);
  });
});

describe("new accounts per network (S2)", () => {
  beforeEach(() => resetSignupLimit());

  it(`allows ${SIGNUPS_PER_IP_PER_HOUR} accounts an hour from one address, then refuses`, () => {
    const t0 = 1_000_000_000;
    for (let i = 0; i < SIGNUPS_PER_IP_PER_HOUR; i++) expect(takeSignupSlot("1.2.3.4", t0 + i)).toBe(true);
    expect(takeSignupSlot("1.2.3.4", t0 + 10)).toBe(false);
    // Another address is not affected.
    expect(takeSignupSlot("5.6.7.8", t0 + 10)).toBe(true);
  });

  it("counts at once, so requests sent together can't all pass", () => {
    const results = Array.from({ length: 20 }, () => takeSignupSlot("2.2.2.2", 5_000_000_000));
    expect(results.filter(Boolean)).toHaveLength(SIGNUPS_PER_IP_PER_HOUR);
  });

  it("frees a slot an hour after the oldest account", () => {
    const t0 = 2_000_000_000;
    for (let i = 0; i < SIGNUPS_PER_IP_PER_HOUR; i++) takeSignupSlot("9.9.9.9", t0 + i * 1000);
    expect(takeSignupSlot("9.9.9.9", t0 + 3_599_999)).toBe(false);
    expect(takeSignupSlot("9.9.9.9", t0 + 3_600_000)).toBe(true);
  });

  it("gives the slot back when no account was made", () => {
    const t0 = 3_000_000_000;
    for (let i = 0; i < SIGNUPS_PER_IP_PER_HOUR; i++) takeSignupSlot("3.3.3.3", t0 + i);
    releaseSignupSlot("3.3.3.3", t0 + 2);
    expect(takeSignupSlot("3.3.3.3", t0 + 10)).toBe(true);
    expect(takeSignupSlot("3.3.3.3", t0 + 11)).toBe(false);
  });

  it("never limits requests with no known address", () => {
    for (let i = 0; i < 20; i++) expect(takeSignupSlot("unknown")).toBe(true);
  });
});

describe("consent emails per site per day (S2)", () => {
  it("counts only live per-recipient markers", async () => {
    const now = new Date("2026-10-06T10:00:00Z");
    let seen: unknown;
    const db = {
      verificationToken: {
        count: async (args: { where: unknown }) => {
          seen = args.where;
          return CONSENT_EMAILS_PER_DAY_SITE - 1;
        },
      },
    };
    expect(await siteConsentCapReached(db, now)).toBe(false);
    expect(seen).toEqual({ identifier: { startsWith: CONSENT_TO_PREFIX }, expires: { gt: now } });
    // The prefix is the one each recipient's marker carries.
    expect(consentToId("Parinte@Gmail.com").startsWith(CONSENT_TO_PREFIX)).toBe(true);
  });

  it("stops at the ceiling", async () => {
    const db = { verificationToken: { count: async () => CONSENT_EMAILS_PER_DAY_SITE } };
    expect(await siteConsentCapReached(db)).toBe(true);
  });
});
