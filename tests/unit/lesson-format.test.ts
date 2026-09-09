import { describe, it, expect } from "vitest";
import { pregatesteLectia, eReplica } from "@/lib/lesson-format";

describe("pregatesteLectia", () => {
  it("scoate ipotezele și lasă un marker numerotat în locul lor", () => {
    const { corp, ipoteze } = pregatesteLectia(
      "Text înainte.\n\n> **Ipoteză de lucru.** Presupunem ceva anume.\n\nText după."
    );
    expect(ipoteze).toHaveLength(1);
    expect(ipoteze[0]).toEqual({ n: 1, text: "Presupunem ceva anume." });
    expect(corp).toContain("[1](#ip-1)");
    expect(corp).not.toContain("Ipoteză de lucru");
  });

  it("numerotează în ordinea apariției", () => {
    const { ipoteze } = pregatesteLectia(
      "> **Ipoteză de lucru.** Prima.\n\nx\n\n> **Ipoteză de lucru.** A doua.\n"
    );
    expect(ipoteze.map((i) => [i.n, i.text])).toEqual([[1, "Prima."], [2, "A doua."]]);
  });

  it("strânge o ipoteză scrisă pe mai multe rânduri într-o singură frază", () => {
    const { ipoteze } = pregatesteLectia(
      "> **Ipoteză de lucru.** Prima parte\n> a doua parte.\n"
    );
    expect(ipoteze[0].text).toBe("Prima parte a doua parte.");
  });

  it("NU atinge un citat obișnuit — replica de spus rămâne citat", () => {
    const src = '> „Bună ziua, sunt factorul de la Poșta Română."\n';
    const { corp, ipoteze } = pregatesteLectia(src);
    expect(ipoteze).toHaveLength(0);
    expect(corp).toContain("Bună ziua");
  });

  it("acceptă și scrierea fără diacritice", () => {
    const { ipoteze } = pregatesteLectia("> **Ipoteza de lucru.** Fara diacritice.\n");
    expect(ipoteze).toHaveLength(1);
  });

  it("un text fără ipoteze rămâne neschimbat în esență", () => {
    const { corp, ipoteze } = pregatesteLectia("Doar text.\n\n## Titlu\n\nAlt text.");
    expect(ipoteze).toHaveLength(0);
    expect(corp).toContain("## Titlu");
  });
});

describe("eReplica", () => {
  it("recunoaște ghilimelele românești", () => {
    expect(eReplica("„Bună ziua")).toBe(true);
    expect(eReplica('"Hello')).toBe(true);
  });
  it("un citat obișnuit nu e replică", () => {
    expect(eReplica("Presupunem că")).toBe(false);
  });
});
