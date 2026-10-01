import { describe, it, expect, vi, beforeEach } from "vitest";

// A parent on the daily digest gets threshold / curriculum-lag alerts in it, not on their devices.
const notificationCreate = vi.fn();
const prefFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { create: (...a: unknown[]) => notificationCreate(...a) },
    notificationPreference: { findUnique: (...a: unknown[]) => prefFindUnique(...a) },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/access-server", () => ({ pausedUserIds: vi.fn().mockResolvedValue(new Set()) }));
const resolveUserAlertChannels = vi.fn();
vi.mock("@/lib/escalation/parent-monitor", () => ({
  escapeHtml: (s: string) => s,
  userInQuietHours: vi.fn().mockResolvedValue(false),
  resolveUserAlertChannels: (...a: unknown[]) => resolveUserAlertChannels(...a),
  deliverParentAlert: vi.fn(),
}));
const webPushToUser = vi.fn();
vi.mock("@/lib/notifications/service", () => ({
  webPushToUser: (...a: unknown[]) => webPushToUser(...a),
  telegramAlertToUser: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/email", () => ({ sendAppEmail: vi.fn().mockResolvedValue(false) }));

import { deliverThresholdAlert } from "@/lib/escalation/threshold-monitor";

const WATCHER = { url: "/dashboard/watcher", label: "Vezi copilul" };
const INSTRUCTOR = { url: "/dashboard/instructor/students", label: "Vezi elevii" };

describe("deliverThresholdAlert and the daily digest", () => {
  beforeEach(() => {
    notificationCreate.mockReset().mockResolvedValue({ id: "n1" });
    prefFindUnique.mockReset();
    resolveUserAlertChannels.mockReset().mockResolvedValue(["PUSH"]);
    webPushToUser.mockReset().mockResolvedValue(1);
  });

  it("a parent on the digest: the alert stays in the app, nothing on their devices", () => {
    prefFindUnique.mockResolvedValue({ selfAlertMode: "DIGEST" });
    return deliverThresholdAlert("p1", "Prag atins: Rareș", "m", { studentId: "c1" }, WATCHER).then((r) => {
      expect(r).toBe(true);
      expect(notificationCreate).toHaveBeenCalledTimes(1);
      expect(resolveUserAlertChannels).not.toHaveBeenCalled();
      expect(webPushToUser).not.toHaveBeenCalled();
    });
  });

  it("a parent on any other mode still gets it on their devices", async () => {
    prefFindUnique.mockResolvedValue({ selfAlertMode: "FIXED_AT" });
    expect(await deliverThresholdAlert("p1", "Prag atins: Rareș", "m", { studentId: "c1" }, WATCHER)).toBe(true);
    expect(webPushToUser).toHaveBeenCalledTimes(1);
  });

  it("an instructor's alert isn't touched by the parent setting", async () => {
    prefFindUnique.mockResolvedValue({ selfAlertMode: "DIGEST" });
    await deliverThresholdAlert("i1", "Prag atins: Rareș", "m", { studentId: "c1" }, INSTRUCTOR);
    expect(prefFindUnique).not.toHaveBeenCalled();
    expect(webPushToUser).toHaveBeenCalledTimes(1);
  });
});
