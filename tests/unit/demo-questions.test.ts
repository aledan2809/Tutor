import { describe, it, expect } from "vitest";
import { demoAnswerable } from "@/lib/demo-questions";

/** The no-account demo shows only items that can be answered as shown (seen live 13.10.2026). */
describe("demoAnswerable", () => {
  const fig = "În figura alăturată este reprezentată schița unei grădini de plante aromatice, în formă de romb ABCD.";
  it("keeps an item about its figure when the figure is there", () => {
    expect(demoAnswerable({ content: fig, imageUrl: "/exam-figures/en-viii-2021-mate-model-2-s2-4.png" })).toBe(true);
  });
  it("drops an item about its figure when there is none to show", () => {
    expect(demoAnswerable({ content: fig, imageUrl: null })).toBe(false);
    expect(demoAnswerable({ content: "Pe graficul de mai jos, f(2) este egal cu:", imageUrl: null })).toBe(false);
    expect(demoAnswerable({ content: "În desenul alăturat, unghiul ABC are:", imageUrl: null })).toBe(false);
  });
  it("keeps an item that needs no figure", () => {
    expect(demoAnswerable({ content: "Rezultatul calculului 2 + 2 · 3 este egal cu:", imageUrl: null })).toBe(true);
    // „figura" in another sense (a figure of speech) isn't a drawing.
    expect(demoAnswerable({ content: "Figura de stil din versul „ochii tăi, două stele” este:", imageUrl: null })).toBe(true);
  });
});
