import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Poarta materiilor private e pusă manual, pe fiecare rută în parte.
 *
 * Inventarul celor 29 de rute a fost făcut o dată, cu `find`, în ziua în care s-a
 * construit bariera. Dacă mâine cineva adaugă a 30-a și uită `resolveDomainOrForbid`,
 * azi nu se plânge nimic: nici testele, nici compilarea. Materia privată a cuiva ar
 * fi vizibilă până la următorul audit — adică până când s-ar uita din nou cineva.
 *
 * Testul ăsta e plasa care lipsea: se plimbă singur peste toate rutele și pică pe
 * prima care n-are poarta.
 */

const ROUTES_DIR = path.join(process.cwd(), "src", "app", "api", "[domain]");
const GATE = "resolveDomainOrForbid";
/**
 * Se cere APELUL, nu doar numele.
 *
 * Prima versiune căuta numele cu `includes`, iar o mutație de probă
 * (`resolveDomainOrForbid` → `resolveDomainOrForbidXX`) a trecut testul: numele
 * stricat îl conține pe cel bun ca subșir. Ar fi trecut la fel o rută care
 * importă poarta și nu o cheamă niciodată — exact defectul pe care testul îl
 * caută.
 */
const APEL = /\bresolveDomainOrForbid\s*\(/;

/**
 * Rute care NU trec prin poartă, fiecare cu motivul ei.
 *
 * Lista e goală intenționat. Există ca excepțiile să fie scrise, nu tăcute: cine
 * are nevoie de una o adaugă aici cu motivul, și se vede în diff. O rută sub
 * `[domain]` care n-are nevoie de poartă e destul de greu de imaginat — ceea ce e
 * exact motivul pentru care o astfel de adăugare merită citită de un om.
 */
const EXCEPTII: { file: string; motiv: string }[] = [];

function routeFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...routeFiles(full));
    else if (entry.name === "route.ts") out.push(full);
  }
  return out;
}

describe("poarta materiilor private acoperă TOATE rutele de domeniu", () => {
  const files = fs.existsSync(ROUTES_DIR) ? routeFiles(ROUTES_DIR) : [];

  it("găsește rutele — un glob stricat n-are voie să treacă drept „totul e curat”", () => {
    // Dacă directorul se mută sau se redenumește, testul ar trece cu zero fișiere
    // și ar raporta acoperire perfectă pe nimic. Pragul e sub numărul de azi (29),
    // ca să nu ceară actualizare la fiecare rută nouă, dar destul de sus cât să
    // prindă o listă goală sau ciuntită.
    expect(fs.existsSync(ROUTES_DIR)).toBe(true);
    expect(files.length).toBeGreaterThanOrEqual(20);
  });

  it("fiecare rută cheamă poarta", () => {
    const scutite = new Set(EXCEPTII.map((e) => path.join(ROUTES_DIR, e.file)));
    const fara = files
      .filter((f) => !scutite.has(f))
      .filter((f) => !APEL.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(process.cwd(), f));

    expect(
      fara,
      fara.length
        ? `Rute fără poarta materiilor private:\n  ${fara.join("\n  ")}\n\n` +
          `Fiecare rută sub src/app/api/[domain] trebuie să cheme ${GATE} înainte de a ` +
          `citi ceva din materie — altfel o materie privată devine vizibilă oricui îi ` +
          `știe slug-ul. Dacă o rută chiar nu are nevoie de poartă, adaug-o în EXCEPTII ` +
          `din acest test, cu motivul.`
        : undefined,
    ).toEqual([]);
  });

  it("nu are excepții nedocumentate", () => {
    for (const e of EXCEPTII) {
      expect(e.motiv.trim().length, `Excepția ${e.file} n-are motiv scris`).toBeGreaterThan(20);
      expect(fs.existsSync(path.join(ROUTES_DIR, e.file)), `Excepția ${e.file} nu mai există`).toBe(true);
    }
  });
});
