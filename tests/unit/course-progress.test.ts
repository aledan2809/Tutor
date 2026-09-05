import { describe, it, expect } from "vitest";
import { moduleProgress, courseProgress, nextModuleIndex, MODULE_PASS_RATIO } from "@/lib/course-progress";

const facts = (o: Partial<Parameters<typeof moduleProgress>[0]> = {}) => ({
  lessonCount: 0, lessonsRead: 0, questionCount: 0, answeredCorrect: 0, ...o,
});

describe("moduleProgress — un modul e gata cand e si citit, si trecut", () => {
  it("lectii citite dar testul nedat → nu e complet", () => {
    const r = moduleProgress(facts({ lessonCount: 3, lessonsRead: 3, questionCount: 10, answeredCorrect: 0 }));
    expect(r.lessonsPercent).toBe(100);
    expect(r.testPercent).toBe(0);
    expect(r.complete).toBe(false);
    expect(r.percent).toBe(50);
  });

  it("test trecut dar lectii necitite → nu e complet", () => {
    const r = moduleProgress(facts({ lessonCount: 3, lessonsRead: 0, questionCount: 10, answeredCorrect: 10 }));
    expect(r.complete).toBe(false);
  });

  it("si citit, si trecut → complet", () => {
    expect(moduleProgress(facts({ lessonCount: 2, lessonsRead: 2, questionCount: 10, answeredCorrect: 8 })).complete).toBe(true);
  });

  it("pragul de trecere e 80%, nu 100% — 7 din 10 nu ajunge, 8 da", () => {
    expect(MODULE_PASS_RATIO).toBe(0.8);
    const base = { lessonCount: 1, lessonsRead: 1, questionCount: 10 };
    expect(moduleProgress(facts({ ...base, answeredCorrect: 7 })).complete).toBe(false);
    expect(moduleProgress(facts({ ...base, answeredCorrect: 8 })).complete).toBe(true);
  });

  it("pragul se rotunjeste in SUS: din 3 intrebari trebuie 3, nu 2", () => {
    const base = { lessonCount: 0, lessonsRead: 0, questionCount: 3 };
    expect(moduleProgress(facts({ ...base, answeredCorrect: 2 })).complete).toBe(false);
    expect(moduleProgress(facts({ ...base, answeredCorrect: 3 })).complete).toBe(true);
  });

  it("modul fara test se judeca doar pe lectii", () => {
    const r = moduleProgress(facts({ lessonCount: 2, lessonsRead: 2 }));
    expect(r.percent).toBe(100);
    expect(r.complete).toBe(true);
  });

  it("modul fara lectii se judeca doar pe test", () => {
    expect(moduleProgress(facts({ questionCount: 5, answeredCorrect: 5 })).complete).toBe(true);
  });

  it("modul GOL nu e complet — altfel ar umfla procentul cursului", () => {
    const r = moduleProgress(facts());
    expect(r.empty).toBe(true);
    expect(r.complete).toBe(false);
    expect(r.percent).toBe(0);
  });

  it("nu trece de 100% daca s-a raspuns de mai multe ori decat sunt intrebari", () => {
    const r = moduleProgress(facts({ lessonCount: 1, lessonsRead: 5, questionCount: 2, answeredCorrect: 9 }));
    expect(r.lessonsPercent).toBe(100);
    expect(r.testPercent).toBe(100);
    expect(r.percent).toBe(100);
  });
});

describe("courseProgress", () => {
  const done = moduleProgress(facts({ lessonCount: 1, lessonsRead: 1, questionCount: 5, answeredCorrect: 5 }));
  const empty = moduleProgress(facts());

  it("un curs fara module e 0, nu NaN", () => {
    expect(courseProgress([])).toEqual({ percent: 0, modulesComplete: 0, modulesTotal: 0 });
  });

  it("modulele GOALE se numara: un modul scris din opt NU inseamna 100%", () => {
    const r = courseProgress([done, empty, empty, empty, empty, empty, empty, empty]);
    expect(r.modulesTotal).toBe(8);
    expect(r.modulesComplete).toBe(1);
    expect(r.percent).toBe(13); // 100/8, nu 100
  });

  it("toate terminate → 100%", () => {
    expect(courseProgress([done, done]).percent).toBe(100);
  });
});

describe("nextModuleIndex", () => {
  const done = moduleProgress(facts({ questionCount: 2, answeredCorrect: 2 }));
  const started = moduleProgress(facts({ lessonCount: 2, lessonsRead: 1 }));
  const empty = moduleProgress(facts());

  it("trimite la primul modul neterminat", () => {
    expect(nextModuleIndex([done, started, done])).toBe(1);
  });
  it("sare peste modulele goale — n-ar avea ce deschide acolo", () => {
    expect(nextModuleIndex([done, empty, started])).toBe(2);
  });
  it("null cand totul e gata", () => {
    expect(nextModuleIndex([done, done])).toBeNull();
  });
  it("null cand tot ce a ramas e gol", () => {
    expect(nextModuleIndex([done, empty])).toBeNull();
  });
});
