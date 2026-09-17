import { describe, it, expect } from "vitest";
import { countRo } from "@/lib/ro-count";

describe("un număr cu substantivul lui, în română", () => {
  it("unu își are forma lui", () => {
    expect(countRo(1, "un capitol", "capitole")).toBe("un capitol");
  });

  it("„de” apare de la 20, și după sute rotunde", () => {
    expect(countRo(2, "o zi", "zile")).toBe("2 zile");
    expect(countRo(19, "o zi", "zile")).toBe("19 zile");
    expect(countRo(20, "un capitol", "capitole")).toBe("20 de capitole");
    expect(countRo(101, "o zi", "zile")).toBe("101 zile");
    expect(countRo(120, "o zi", "zile")).toBe("120 de zile");
    expect(countRo(200, "o zi", "zile")).toBe("200 de zile");
  });

  it("zero fără „de”", () => {
    expect(countRo(0, "un exercițiu", "exerciții")).toBe("0 exerciții");
  });
});
