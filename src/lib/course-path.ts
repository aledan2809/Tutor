/**
 * Pasul următor pe un curs: întâi lecția, apoi testul ei.
 *
 * Cerință Alex (2026-09-24): un om înscris de firmă la un curs („Agent imobiliar",
 * cursurile Poștei) trebuie dus pe drumul cursului — lecția, apoi grilele din ea.
 * Panoul îi propunea doar „o sesiune scurtă de grile", iar grilele îi răspundeau
 * „termină o lecție" (poarta din `course-topics.ts`), fără să-i arate care lecție.
 *
 * Aceeași formă ca `course-topics.ts`: regula e pură și testabilă fără bază, iar
 * citirea din bază e o funcție subțire peste ea.
 */

import { prisma } from "./prisma";

export interface PathModule {
  title: string;
  questionTopic: string | null;
  /** Lecțiile publicate ale modulului, în ordinea de citire. */
  lessons: { id: string; title: string }[];
}

export interface CourseStep {
  /** Al câtelea modul (1..total), numărat doar între modulele cu lecții. */
  n: number;
  moduleTitle: string;
  /** „read" = are de citit lecția; „test" = a citit tot, urmează testul modulului. */
  step: "read" | "test";
  /** Lecția de deschis (prima necitită; la „test", prima lecție a modulului, pentru recitire). */
  lessonId: string;
  lessonTitle: string;
  /** Subiectul de test al modulului — testul pornește DOAR din el (pasul „test"). */
  questionTopic: string | null;
}

export interface CoursePath {
  total: number;
  done: number;
  /** Null = tot cursul e parcurs: panoul revine la grilele obișnuite. */
  current: CourseStep | null;
  /** Modulul de după cel curent, dacă există — al treilea pas din „Drumul tău". */
  next: { n: number; moduleTitle: string; lessonTitle: string } | null;
}

/**
 * Un modul e „gata" când lecțiile lui sunt citite și, dacă are un test cu întrebări,
 * omul a răspuns măcar o dată din el. Fără întrebări publicate, testul n-are ce
 * aștepta — altfel omul ar rămâne blocat pe un buton care nu pornește nimic.
 */
export function coursePath(
  modules: readonly PathModule[],
  completedLessonIds: ReadonlySet<string>,
  testedTopics: ReadonlySet<string>,
  topicsWithQuestions: ReadonlySet<string>,
): CoursePath | null {
  const withLessons = modules.filter((m) => m.lessons.length > 0);
  if (withLessons.length === 0) return null;

  // Aceeași regulă ca poarta (`unlockedCourseTopics`): un subiect purtat de mai multe
  // module se deschide abia când TOATE sunt citite. Un modul citit al cărui subiect e
  // încă închis de alt modul necitit nu cere acum testul — poarta l-ar refuza, iar omul
  // ar fi trimis în buclă la o lecție deja citită. Testul lui vine la modulul care
  // termină subiectul.
  const openTopic = (t: string) =>
    withLessons.every((m) => m.questionTopic !== t || m.lessons.every((l) => completedLessonIds.has(l.id)));

  const state = withLessons.map((m) => {
    const unread = m.lessons.find((l) => !completedLessonIds.has(l.id));
    const hasTest = !!m.questionTopic && topicsWithQuestions.has(m.questionTopic) && openTopic(m.questionTopic);
    const tested = !hasTest || testedTopics.has(m.questionTopic as string);
    return { m, unread, done: !unread && tested };
  });

  const idx = state.findIndex((s) => !s.done);
  const done = state.filter((s) => s.done).length;
  if (idx === -1) return { total: withLessons.length, done, current: null, next: null };

  const cur = state[idx];
  const lesson = cur.unread ?? cur.m.lessons[0];
  const after = withLessons[idx + 1];
  return {
    total: withLessons.length,
    done,
    current: {
      n: idx + 1,
      moduleTitle: cur.m.title,
      step: cur.unread ? "read" : "test",
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      questionTopic: cur.m.questionTopic,
    },
    next: after ? { n: idx + 2, moduleTitle: after.title, lessonTitle: after.lessons[0].title } : null,
  };
}

/**
 * Drumul pe curs al omului ăstuia, în materia asta. `null` = materia n-are curs
 * publicat cu lecții — panoul rămâne exact ca înainte.
 *
 * Toate cursurile publicate, în aceeași ordine ca poarta de test (`courseTopicsFor`).
 */
export async function coursePathFor(userId: string, domainId: string): Promise<CoursePath | null> {
  const courses = await prisma.course.findMany({
    where: { domainId, isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      modules: {
        orderBy: { order: "asc" },
        select: {
          title: true,
          questionTopic: true,
          lessons: {
            where: { isPublished: true },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            select: { id: true, title: true },
          },
        },
      },
    },
  });
  const modules: PathModule[] = courses.flatMap((c) => c.modules);
  if (!modules.some((m) => m.lessons.length > 0)) return null;

  const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const topics = [...new Set(modules.map((m) => m.questionTopic).filter((t): t is string => !!t))];

  const [done, withQuestions, tested] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds }, status: "COMPLETED" },
      select: { lessonId: true },
    }),
    topics.length
      ? prisma.question.groupBy({
          by: ["topic"],
          where: { domainId, status: "PUBLISHED", topic: { in: topics } },
        })
      : Promise.resolve([] as { topic: string | null }[]),
    // Doar „a răspuns vreodată din subiectul ăsta?" — o căutare de un rând pe subiect,
    // nu toate încercările omului (un curs are câteva module, deci câteva căutări mici).
    Promise.all(
      topics.map((topic) =>
        prisma.attempt
          .findFirst({ where: { userId, voided: false, question: { domainId, topic } }, select: { id: true } })
          .then((a) => (a ? topic : null))
      )
    ),
  ]);

  return coursePath(
    modules,
    new Set(done.map((d) => d.lessonId)),
    new Set(tested.filter((t): t is string => !!t)),
    new Set(withQuestions.map((q) => q.topic).filter((t): t is string => !!t)),
  );
}
