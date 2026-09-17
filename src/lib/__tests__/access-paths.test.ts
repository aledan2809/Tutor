import { describe, it, expect } from "vitest";
import { dashboardPath, isPausedPath } from "@/lib/access-paths";

describe("paginile închise unui cont în pauză", () => {
  it("prima pagină, învățarea și urmărirea copilului", () => {
    for (const p of ["/ro/dashboard", "/ro/dashboard/practice", "/en/dashboard/exams/abc", "/ro/dashboard/rapoarte", "/ro/dashboard/watcher", "/ro/dashboard/watcher/notifications"]) {
      expect(isPausedPath(p)).toBe(true);
    }
  });

  it("rămân deschise drumurile înapoi: Abonament, setări, ajutor, familia, setările alertelor", () => {
    for (const p of ["/ro/dashboard/packages", "/ro/dashboard/packages?plan=FAMILY", "/ro/dashboard/settings/reminders", "/ro/dashboard/family", "/ro/dashboard/help", "/ro/dashboard/watcher/setari"]) {
      expect(isPausedPath(p)).toBe(false);
    }
  });

  it("nu confundă prefixele (practice-ul nu închide „practices”)", () => {
    expect(isPausedPath("/ro/dashboard/practiceX")).toBe(false);
    expect(dashboardPath("/ro/dashboard/practice/")).toBe("/dashboard/practice");
    expect(dashboardPath("/ro")).toBe("/");
  });
});
