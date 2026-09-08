/**
 * Testezi doar din ce ai apucat să înveți.
 *
 * Cerință user (2026-09-08), cu analogia lui: un elev la începutul clasei a VIII-a
 * nu e testat din capitolele la care clasa n-a ajuns încă. Aceeași regulă pentru un
 * curs: modulul 5 nu are ce căuta în test dacă omul e la lecția 2.
 *
 * Poarta există deja pentru materiile școlare, unde ce s-a predat se bifează manual
 * (`visibleTopicsFor` + `CurriculumCheck`). La un curs nu trebuie bifat nimic: se
 * știe deja din `LessonProgress`, pe care cititorul de lecții îl scrie singur când
 * ajungi la capătul lecției. Asta doar CITEȘTE urmărirea care există.
 *
 * Cele două jumătăți sunt separate intenționat: regula e pură și testabilă fără
 * bază de date, iar interogarea e o funcție subțire peste ea. Aceeași formă se
 * poate folosi oriunde altundeva vrem „doar din materia parcursă".
 */

import { prisma } from "./prisma";

export interface CourseModuleProgress {
  order: number;
  /** Valoarea `Question.topic` care aparține modulului. Null = modulul n-are test. */
  questionTopic: string | null;
  /** Lecțiile publicate ale modulului. Goală = n-are ce citi. */
  lessonIds: string[];
}

/**
 * Subiectele deblocate: cele ale modulelor ale căror lecții au fost TERMINATE.
 *
 * Un modul fără lecții e deblocat — n-are ce aștepta cititorul. Un modul cu mai
 * multe lecții cere toate lecțiile terminate, nu una: altfel „parcurs" ar însemna
 * „început", iar testul ar întreba din ce n-a citit.
 *
 * Nu presupune ordine: dacă cineva citește modulul 3 înaintea modulului 2, i se
 * deblochează 3. Cursul se citește de sus în jos, dar poarta nu are motiv să
 * pedepsească pe cine sare — verifică lectura, nu disciplina.
 */
export function unlockedCourseTopics(
  modules: readonly CourseModuleProgress[],
  completedLessonIds: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  for (const m of modules) {
    if (!m.questionTopic) continue;
    const allRead = m.lessonIds.every((id) => completedLessonIds.has(id));
    if (allRead) out.push(m.questionTopic);
  }
  return out;
}

/** Câte module din câte a terminat — pentru mesajul arătat elevului. */
export function courseReadingProgress(
  modules: readonly CourseModuleProgress[],
  completedLessonIds: ReadonlySet<string>,
): { done: number; total: number } {
  const withLessons = modules.filter((m) => m.lessonIds.length > 0);
  const done = withLessons.filter((m) => m.lessonIds.every((id) => completedLessonIds.has(id))).length;
  return { done, total: withLessons.length };
}

/**
 * Subiectele deblocate pentru omul ăsta, în materia asta.
 *
 * `null` înseamnă „materia nu are curs publicat" — apelantul se poartă exact ca
 * înainte. Un array gol înseamnă „are curs, dar n-a terminat nicio lecție", ceea
 * ce e un mesaj util, nu o bancă goală.
 */
export async function courseTopicsFor(userId: string, domainId: string): Promise<string[] | null> {
  const course = await prisma.course.findFirst({
    where: { domainId, isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      modules: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          questionTopic: true,
          lessons: { where: { isPublished: true }, select: { id: true } },
        },
      },
    },
  });
  if (!course || course.modules.length === 0) return null;

  const modules: CourseModuleProgress[] = course.modules.map((m) => ({
    order: m.order,
    questionTopic: m.questionTopic,
    lessonIds: m.lessons.map((l) => l.id),
  }));

  const allLessonIds = modules.flatMap((m) => m.lessonIds);
  const done = allLessonIds.length
    ? await prisma.lessonProgress.findMany({
        where: { userId, lessonId: { in: allLessonIds }, status: "COMPLETED" },
        select: { lessonId: true },
      })
    : [];

  return unlockedCourseTopics(modules, new Set(done.map((d) => d.lessonId)));
}
