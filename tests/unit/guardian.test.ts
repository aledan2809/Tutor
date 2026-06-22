import { describe, it, expect } from "vitest";
import { watcherSeesAllStudents } from "@/lib/guardian";

describe("guardian scoping — watcherSeesAllStudents", () => {
  it("instructor or admin sees all students (teaching)", () => {
    expect(watcherSeesAllStudents({ enrollments: [{ roles: ["INSTRUCTOR"] }] })).toBe(true);
    expect(watcherSeesAllStudents({ enrollments: [{ roles: ["ADMIN"] }] })).toBe(true);
    expect(
      watcherSeesAllStudents({ enrollments: [{ roles: ["STUDENT"] }, { roles: ["INSTRUCTOR"] }] })
    ).toBe(true);
  });

  it("a pure parent watcher does NOT see all (scoped to linked children)", () => {
    expect(watcherSeesAllStudents({ enrollments: [{ roles: ["WATCHER"] }] })).toBe(false);
    expect(watcherSeesAllStudents({ enrollments: [{ roles: ["WATCHER", "STUDENT"] }] })).toBe(false);
  });

  it("null / empty is false", () => {
    expect(watcherSeesAllStudents(null)).toBe(false);
    expect(watcherSeesAllStudents(undefined)).toBe(false);
    expect(watcherSeesAllStudents({ enrollments: [] })).toBe(false);
  });
});
