/**
 * How far along a course someone is — the rule, pure and testable.
 *
 * A module counts as done when its lessons are read AND its test has been passed.
 * Both halves matter: reading without answering proves nothing, and answering
 * without reading is possible but is not what a course is for.
 *
 * A module with no lessons is judged on its test alone; a module with no test, on
 * its lessons alone. A module with neither is not "complete" — it is empty, and
 * calling an empty module done would inflate every percentage above it.
 */

export interface ModuleFacts {
  lessonCount: number;
  lessonsRead: number;
  /** Questions that belong to this module (Question.topic = module.questionTopic). */
  questionCount: number;
  /** Distinct questions from this module the learner has answered correctly at least once. */
  answeredCorrect: number;
}

export interface ModuleProgress {
  lessonsPercent: number;
  testPercent: number;
  /** 0-100 for the module as a whole. */
  percent: number;
  complete: boolean;
  empty: boolean;
}

/** Passing a module's test means most of it, not all of it — 80%. */
export const MODULE_PASS_RATIO = 0.8;

const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

export function moduleProgress(f: ModuleFacts): ModuleProgress {
  const hasLessons = f.lessonCount > 0;
  const hasTest = f.questionCount > 0;
  const lessonsPercent = pct(Math.min(f.lessonsRead, f.lessonCount), f.lessonCount);
  const testPercent = pct(Math.min(f.answeredCorrect, f.questionCount), f.questionCount);

  if (!hasLessons && !hasTest) {
    return { lessonsPercent: 0, testPercent: 0, percent: 0, complete: false, empty: true };
  }

  const halves = [hasLessons ? lessonsPercent : null, hasTest ? testPercent : null].filter(
    (x): x is number => x !== null
  );
  const percent = Math.round(halves.reduce((a, b) => a + b, 0) / halves.length);

  const lessonsDone = !hasLessons || f.lessonsRead >= f.lessonCount;
  const testDone = !hasTest || f.answeredCorrect >= Math.ceil(f.questionCount * MODULE_PASS_RATIO);

  return { lessonsPercent, testPercent, percent, complete: lessonsDone && testDone, empty: false };
}

/**
 * The course as a whole: the average across its modules, empty ones included.
 *
 * Empty modules are counted, deliberately. Dropping them would make a course with
 * one written module out of eight read as 100% — the number would describe the
 * work done rather than the course, and it is the course the learner is asking about.
 */
export function courseProgress(modules: ModuleProgress[]): { percent: number; modulesComplete: number; modulesTotal: number } {
  if (modules.length === 0) return { percent: 0, modulesComplete: 0, modulesTotal: 0 };
  return {
    percent: Math.round(modules.reduce((a, m) => a + m.percent, 0) / modules.length),
    modulesComplete: modules.filter((m) => m.complete).length,
    modulesTotal: modules.length,
  };
}

/**
 * Which module the learner should open next: the first that is not complete.
 * Returns null when every module is done. Empty modules are skipped — sending
 * someone to a module with nothing in it would be a dead end, not a next step.
 */
export function nextModuleIndex(modules: ModuleProgress[]): number | null {
  const i = modules.findIndex((m) => !m.complete && !m.empty);
  return i === -1 ? null : i;
}
