import { describe, it, expect } from "vitest";
import { lockedText, setByLabel, type LockOwner } from "@/lib/guardian-lock";

const maria: LockOwner = { id: "p1", name: "Maria Ionescu" };
const owners = new Map<string, LockOwner>([["p1", maria], ["p2", { id: "p2", name: null }]]);

describe("cine are ultimul cuvânt la program și materii", () => {
  it("părintele vede al cui e fiecare element", () => {
    expect(setByLabel(null, "p1", owners)).toEqual({ setBy: "child", setByName: null });
    expect(setByLabel("p1", "p1", owners)).toEqual({ setBy: "you", setByName: null });
    expect(setByLabel("p1", "p2", owners)).toEqual({ setBy: "guardian", setByName: "Maria Ionescu" });
  });

  it("un adult care nu mai e părintele copilului nu mai ține blocat nimic", () => {
    expect(setByLabel("p9-removed", "p1", owners)).toEqual({ setBy: "child", setByName: null });
  });

  it("ce a pus meditatorul familiei apare cu numele lui (fără să blocheze), nu ca „pus de copil”", () => {
    const tutors = new Map<string, LockOwner>([["t1", { id: "t1", name: "Dl. Popescu" }]]);
    expect(setByLabel("t1", "p1", owners, tutors)).toEqual({ setBy: "tutor", setByName: "Dl. Popescu" });
    expect(setByLabel("t1", "t1", owners, tutors)).toEqual({ setBy: "you", setByName: null });
    expect(setByLabel(null, "t1", owners, tutors)).toEqual({ setBy: "child", setByName: null });
  });

  it("copilul află cine a hotărât și ce poate face: să vorbească, nu să ceară prin aplicație", () => {
    expect(lockedText(maria, "reminder")).toBe("Maria Ionescu a stabilit acest program. Ca să-l schimbați, vorbiți împreună.");
    expect(lockedText({ id: "p2", name: "  " }, "subject")).toBe("Părintele tău a scos această materie. Ca s-o adaugi înapoi, vorbiți împreună.");
  });
});
