import { describe, it, expect } from "vitest";
import { coursePath, type PathModule } from "@/lib/course-path";

const M = (title: string, topic: string | null, lessons: string[]): PathModule => ({
  title,
  questionTopic: topic,
  lessons: lessons.map((id) => ({ id, title: `Titlu ${id}` })),
});

const CURS = [M("Fundamente", "T1", ["l1"]), M("Prospectare", "T2", ["l2"]), M("Evaluare", "T3", ["l3"])];
const ALL_Q = new Set(["T1", "T2", "T3"]);
const none = new Set<string>();

describe("coursePath — întâi lecția, apoi testul ei", () => {
  it("cine n-a citit nimic e trimis la prima lecție", () => {
    const p = coursePath(CURS, none, none, ALL_Q);
    expect(p?.current).toMatchObject({ n: 1, step: "read", lessonId: "l1", moduleTitle: "Fundamente" });
    expect(p?.next).toMatchObject({ n: 2, moduleTitle: "Prospectare" });
    expect(p).toMatchObject({ total: 3, done: 0 });
  });

  it("după lectură urmează testul aceluiași modul, nu lecția următoare", () => {
    const p = coursePath(CURS, new Set(["l1"]), none, ALL_Q);
    expect(p?.current).toMatchObject({ n: 1, step: "test" });
  });

  it("după test trece la lecția următoare", () => {
    const p = coursePath(CURS, new Set(["l1"]), new Set(["T1"]), ALL_Q);
    expect(p?.current).toMatchObject({ n: 2, step: "read", lessonId: "l2" });
    expect(p?.done).toBe(1);
  });

  it("un modul fără întrebări publicate nu blochează omul pe un test care nu pornește", () => {
    const p = coursePath(CURS, new Set(["l1"]), none, new Set(["T2", "T3"]));
    expect(p?.current).toMatchObject({ n: 2, step: "read" });
  });

  it("un modul cu mai multe lecții trimite la prima NECITITĂ", () => {
    const p = coursePath([M("Mare", "T1", ["a", "b", "c"])], new Set(["a"]), none, ALL_Q);
    expect(p?.current).toMatchObject({ step: "read", lessonId: "b" });
  });

  it("tot parcursul gata → current null, panoul revine la grile", () => {
    const p = coursePath(CURS, new Set(["l1", "l2", "l3"]), ALL_Q, ALL_Q);
    expect(p).toMatchObject({ total: 3, done: 3, current: null, next: null });
  });

  it("modulele fără lecții nu se numără; fără nicio lecție → null", () => {
    expect(coursePath([M("Gol", "T1", [])], none, none, ALL_Q)).toBeNull();
    const p = coursePath([M("Gol", "T9", []), ...CURS], none, none, ALL_Q);
    expect(p).toMatchObject({ total: 3, current: { n: 1, lessonId: "l1" } });
  });

  it("subiect comun cu un modul necitit: nu cere un test pe care poarta l-ar refuza (fără buclă)", () => {
    // Două cursuri, fiecare cu o „Introducere”; primul e citit, al doilea nu.
    const two = [M("Intro A", "Intro", ["a1"]), M("Altceva", "T2", ["x"]), M("Intro B", "Intro", ["b1"])];
    const p = coursePath(two, new Set(["a1"]), none, new Set(["Intro", "T2"]));
    expect(p?.current).toMatchObject({ n: 2, step: "read", lessonId: "x" });
    const p2 = coursePath(two, new Set(["a1", "x", "b1"]), new Set(["T2"]), new Set(["Intro", "T2"]));
    expect(p2?.current).toMatchObject({ n: 1, step: "test", questionTopic: "Intro" });
  });

  it("pasul „test” poartă subiectul modulului, ca testul să pornească doar din el", () => {
    const p = coursePath(CURS, new Set(["l1"]), none, ALL_Q);
    expect(p?.current).toMatchObject({ step: "test", questionTopic: "T1" });
  });

  it("ultimul modul n-are „următorul”", () => {
    const p = coursePath(CURS, new Set(["l1", "l2"]), new Set(["T1", "T2"]), ALL_Q);
    expect(p?.current).toMatchObject({ n: 3 });
    expect(p?.next).toBeNull();
  });
});
