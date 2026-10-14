import { NextResponse } from "next/server";
import { bandForDomainSlug } from "@/lib/curriculum";
import { visibleTopicsFor } from "@/lib/curriculum-service";
import { courseTopicsFor } from "@/lib/course-topics";
import { coursePathFor } from "@/lib/course-path";

/**
 * „Se testează doar din materia învățată" — aceeași poartă ca `[domain]/session/start`
 * (regulile din 24.08 și 08.09.2026), pentru rutele care pornesc un test fără să treacă
 * pe acolo: `student/assessment` (testul inițial) și `student/sessions/quick`.
 * Revizia OpenAI din 14.10.2026 a găsit testul inițial pornind fără capitolele confirmate.
 *
 *  - materie cu programă, capitole neconfirmate → 409 `needsCurriculumSetup`;
 *  - materie cu programă → doar capitolele bifate ca parcurse;
 *  - materie cu curs publicat → doar modulele cu lecțiile terminate;
 *  - altfel → fără filtru (`topicIn` null), ca înainte.
 */
export type TestTopicGate =
  | { ok: true; kind: "curriculum" | "course" | null; topicIn: string[] | null }
  | { ok: false; response: NextResponse };

export async function testTopicGate(
  userId: string,
  domain: { id: string; slug: string }
): Promise<TestTopicGate> {
  if (bandForDomainSlug(domain.slug)) {
    const topicIn = await visibleTopicsFor(userId, domain.slug);
    if (topicIn === null) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Curriculum setup required", needsCurriculumSetup: true, domainSlug: domain.slug },
          { status: 409 }
        ),
      };
    }
    return { ok: true, kind: "curriculum", topicIn };
  }
  const courseTopics = await courseTopicsFor(userId, domain.id);
  if (courseTopics !== null) return { ok: true, kind: "course", topicIn: courseTopics };
  return { ok: true, kind: null, topicIn: null };
}

/**
 * Un test cu poartă care iese gol nu e o bancă goală: spune ce e de făcut (capitolele
 * bifate n-au încă grile / lecția de citit), cu aceleași semnale ca `session/start`.
 */
export async function emptyGatedTestResponse(
  userId: string,
  domain: { id: string; slug: string },
  kind: "curriculum" | "course"
): Promise<NextResponse> {
  if (kind === "course") {
    const path = await coursePathFor(userId, domain.id);
    return NextResponse.json(
      {
        error: "No questions in completed modules",
        emptyBecauseCourse: true,
        hint: "Termină o lecție ca să se deschidă testul modulului ei.",
        lessonId: path?.current?.lessonId ?? null,
      },
      { status: 409 }
    );
  }
  return NextResponse.json(
    {
      error: "No questions in covered chapters",
      needsCurriculumSetup: false,
      emptyBecauseCurriculum: true,
      domainSlug: domain.slug,
    },
    { status: 409 }
  );
}
