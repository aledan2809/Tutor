import { describe, it, expect } from "vitest";
import { feedbackDeepLink } from "@/lib/feedback-admin";

describe("the link an alert carries", () => {
  it("points at one complaint, not at the list", () => {
    // An alert that lands on the queue costs the reader the work of finding
    // which item needs them — the friction that let seven valid reports go
    // unread for two months.
    const url = feedbackDeepLink("cmabc123");
    expect(url).toContain("/dashboard/admin/feedback");
    expect(url).toContain("id=cmabc123");
  });

  it("is absolute, because Telegram buttons refuse a relative URL", () => {
    expect(feedbackDeepLink("x")).toMatch(/^https?:\/\//);
  });

  it("escapes an id rather than splicing it raw into the query", () => {
    expect(feedbackDeepLink("a b&c=d")).toContain("id=a%20b%26c%3Dd");
  });
});
