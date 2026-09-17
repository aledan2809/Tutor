import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * A rung this run has claimed (ESCALATING) must never stay claimed because the run hit an error:
 * closed later as stuck, with no send time, its chain led nowhere (review r6, X6). And the wait for
 * the child's study time comes after the checks that skip a rung (X1).
 */

type Row = Record<string, unknown>;
const state = vi.hoisted(() => ({
  rung: null as Row | null,
  sendResult: true,
  optimal: true,
  failNotificationCreate: false,
  failEncouragement: false,
  failFailureRecord: false,
  updateMany: [] as { where: Row; data: Row }[],
  created: [] as Row[],
}));

vi.mock("@/lib/notifications/service", () => ({ sendNotification: vi.fn(async () => state.sendResult) }));
vi.mock("@/lib/notifications/test-account", () => ({ resolveIsTestForUser: async () => false }));
vi.mock("@/lib/access-server", () => ({ pausedUserIds: async () => new Set<string>() }));
vi.mock("@/lib/phone-setting", () => ({ getUserPhone: async () => null }));
vi.mock("@/lib/escalation/timing", () => ({
  isQuietHours: () => false,
  isOptimalNotificationTime: async () => state.optimal,
}));
vi.mock("@/lib/prisma", () => {
  const escalationEvent = {
    findUnique: vi.fn(async () => state.rung),
    findFirst: vi.fn(async () => null),
    updateMany: vi.fn(async (args: { where: Row; data: Row }) => {
      state.updateMany.push(args);
      const meta = args.data.metadata as Row | undefined;
      // The failure record after a send that didn't go out, the first time it is written.
      if (state.failFailureRecord && meta?.sendFailures !== undefined && args.where.status === "ESCALATING") {
        state.failFailureRecord = false;
        throw new Error("database hiccup");
      }
      return { count: 1 };
    }),
    update: vi.fn(async () => ({})),
    create: vi.fn(async (args: { data: Row }) => {
      state.created.push(args.data);
      return {};
    }),
  };
  const prisma = {
    escalationEvent,
    session: { findFirst: vi.fn(async () => null) },
    notification: {
      create: vi.fn(async () => {
        if (state.failNotificationCreate) throw new Error("database hiccup");
        return {};
      }),
    },
    userGamification: {
      findFirst: vi.fn(async () => {
        if (state.failEncouragement) throw new Error("database hiccup");
        return null;
      }),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn({ escalationEvent })),
  };
  return { prisma };
});

import { processEscalationEvent } from "@/lib/escalation/engine";

function rung(over: Row = {}): Row {
  return {
    id: "r1",
    userId: "child",
    sessionId: null,
    level: 1,
    status: "PENDING",
    channel: "PUSH",
    templateId: "t",
    isTest: false,
    createdAt: new Date(),
    metadata: { reason: "evening_quick" },
    user: {
      name: "Ana",
      email: "ana@example.test",
      telegramChatId: "123",
      notificationPreference: null,
      organization: null,
      enrollments: [],
      guardianLinks: [],
    },
    ...over,
  };
}

/** The writes that put the claimed rung back (the claim itself is PENDING → ESCALATING). */
const releases = () => state.updateMany.filter((u) => u.where.status === "ESCALATING");

beforeEach(() => {
  state.rung = rung();
  state.sendResult = true;
  state.optimal = true;
  state.failNotificationCreate = false;
  state.failEncouragement = false;
  state.failFailureRecord = false;
  state.updateMany = [];
  state.created = [];
  delete process.env.FEATURE_TELEGRAM_NUDGES;
  delete process.env.TELEGRAM_BOT_TOKEN;
});

describe("un memento revendicat nu rămâne blocat la o eroare (review r6, X6)", () => {
  it("trimis, dar eroare după: e socotit trimis, ca lanțul să continue", async () => {
    state.failNotificationCreate = true;
    await expect(processEscalationEvent("r1")).rejects.toThrow("database hiccup");
    const last = releases().at(-1);
    expect(last?.data.status).toBe("COMPLETED");
    expect(last?.data.sentAt).toBeInstanceOf(Date);
  });

  it("eroare înainte de trimitere: se întoarce la așteptare, fără să fie socotit trimis", async () => {
    process.env.FEATURE_TELEGRAM_NUDGES = "true";
    process.env.TELEGRAM_BOT_TOKEN = "x";
    state.rung = rung({ channel: "TELEGRAM" });
    state.failEncouragement = true;
    await expect(processEscalationEvent("r1")).rejects.toThrow("database hiccup");
    const last = releases().at(-1);
    expect(last?.data.status).toBe("PENDING");
    expect(last?.data.sentAt).toBeUndefined();
    expect((last?.data.metadata as Row).nextAttemptAt).toEqual(expect.any(String));
  });

  it("trimitere eșuată și eroare la notarea ei: eșecul tot se numără", async () => {
    state.sendResult = false;
    state.failFailureRecord = true;
    await expect(processEscalationEvent("r1")).rejects.toThrow("database hiccup");
    const last = releases().at(-1);
    expect(last?.data.status).toBe("PENDING");
    expect((last?.data.metadata as Row).sendFailures).toBe(1);
  });
});

describe("așteptarea orei de studiu (review r6, X1)", () => {
  it("o treaptă care se sare (canal oprit) nu așteaptă ora de studiu înainte", async () => {
    state.optimal = false;
    state.rung = rung({
      level: 2,
      channel: "TELEGRAM",
      user: { ...(rung().user as Row), notificationPreference: { telegram: false } },
    });
    await processEscalationEvent("r1");
    // Skipped at once: no wait was written, the next rung exists.
    expect(state.updateMany.some((u) => (u.data.metadata as Row | undefined)?.deferredOnce)).toBe(false);
    expect(state.created).toHaveLength(1);
  });

  it("o treaptă care pleacă așteaptă o dată; a doua oară în același lanț nu mai așteaptă", async () => {
    state.optimal = false;
    state.rung = rung({ level: 2 });
    await processEscalationEvent("r1");
    expect(state.updateMany.some((u) => (u.data.metadata as Row | undefined)?.deferredOnce === true)).toBe(true);

    state.updateMany = [];
    state.rung = rung({ level: 3, metadata: { reason: "evening_quick", deferredOnce: true } });
    await processEscalationEvent("r1");
    // Claimed and sent, no second wait.
    expect(state.updateMany[0]?.data.status).toBe("ESCALATING");
  });
});
