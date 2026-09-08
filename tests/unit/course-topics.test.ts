import { describe, it, expect } from "vitest";
import {
  unlockedCourseTopics,
  courseReadingProgress,
  type CourseModuleProgress,
} from "@/lib/course-topics";

const M = (order: number, topic: string | null, lessons: string[]): CourseModuleProgress => ({
  order,
  questionTopic: topic,
  lessonIds: lessons,
});

const CURS: CourseModuleProgress[] = [
  M(1, "Fundamente", ["l1"]),
  M(2, "Prospectare", ["l2"]),
  M(3, "Evaluare", ["l3"]),
];

describe("unlockedCourseTopics — testezi doar din ce ai citit", () => {
  it("cine n-a citit nimic nu primește nicio întrebare", () => {
    expect(unlockedCourseTopics(CURS, new Set())).toEqual([]);
  });

  it("deblochează exact modulele terminate, în ordine", () => {
    expect(unlockedCourseTopics(CURS, new Set(["l1"]))).toEqual(["Fundamente"]);
    expect(unlockedCourseTopics(CURS, new Set(["l1", "l2"]))).toEqual(["Fundamente", "Prospectare"]);
  });

  it("nu pedepsește pe cine sare peste un modul", () => {
    expect(unlockedCourseTopics(CURS, new Set(["l3"]))).toEqual(["Evaluare"]);
  });

  it("un modul cu mai multe lecții cere TOATE lecțiile, nu una", () => {
    const doua = [M(1, "Fundamente", ["a", "b"])];
    expect(unlockedCourseTopics(doua, new Set(["a"]))).toEqual([]);
    expect(unlockedCourseTopics(doua, new Set(["a", "b"]))).toEqual(["Fundamente"]);
  });

  it("un modul fără lecții e deblocat — n-are ce aștepta cititorul", () => {
    expect(unlockedCourseTopics([M(1, "Teorie", [])], new Set())).toEqual(["Teorie"]);
  });

  it("un modul fără test nu apare, oricât ai citi", () => {
    expect(unlockedCourseTopics([M(1, null, ["l1"])], new Set(["l1"]))).toEqual([]);
  });

  it("lecții terminate din alt curs nu deblochează nimic aici", () => {
    expect(unlockedCourseTopics(CURS, new Set(["altceva"]))).toEqual([]);
  });

  it("curs gol → nimic, fără excepție", () => {
    expect(unlockedCourseTopics([], new Set(["l1"]))).toEqual([]);
  });
});

describe("courseReadingProgress — cât a parcurs", () => {
  it("numără doar modulele care au ceva de citit", () => {
    const mix = [M(1, "A", ["l1"]), M(2, "B", []), M(3, "C", ["l3"])];
    expect(courseReadingProgress(mix, new Set(["l1"]))).toEqual({ done: 1, total: 2 });
  });

  it("zero din zero pe un curs fără lecții", () => {
    expect(courseReadingProgress([M(1, "A", [])], new Set())).toEqual({ done: 0, total: 0 });
  });

  it("tot cursul citit", () => {
    expect(courseReadingProgress(CURS, new Set(["l1", "l2", "l3"]))).toEqual({ done: 3, total: 3 });
  });
});
