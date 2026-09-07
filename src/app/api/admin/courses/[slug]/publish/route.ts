import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireContentAdmin, ownsDomain } from "@/lib/merchant-auth";
import { withErrorHandling, ApiErrors } from "@/lib/api-error-handler";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

/**
 * POST /api/admin/courses/[slug]/publish { publish, includeQuestions? }
 *
 * „Publică cursul" ca o singură operație, fiindcă asta e ce vrea de fapt cineva
 * care apasă butonul: un curs publicat ale cărui lecții rămân ciorne e o listă de
 * capitole pe care nu le poate deschide nimeni, iar lecții publicate fără grile
 * sunt un curs fără test. Cele trei stări se mișcă împreună sau deloc.
 *
 * Reversibilă: `publish: false` le retrage pe toate trei. Nimic nu se șterge.
 *
 * Grilele se leagă de modul prin `Question.topic`, nu printr-o cheie străină (vezi
 * comentariul de pe `CourseModule.questionTopic`), deci se selectează pe topic ȘI
 * pe materia cursului — altfel un topic omonim din altă materie ar fi publicat din
 * greșeală.
 */

const bodySchema = z.object({
  publish: z.boolean(),
  /** Implicit true: un curs fără test publicat nu e un curs. */
  includeQuestions: z.boolean().default(true),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withErrorHandling(async () => {
    const { error, scope, userId } = await requireContentAdmin();
    if (error) return error;

    const { slug } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return ApiErrors.badRequest("Invalid request body");
    const { publish, includeQuestions } = parsed.data;

    const course = await prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        domainId: true,
        domain: { select: { id: true, slug: true, organizationId: true } },
        modules: { select: { id: true, questionTopic: true } },
      },
    });
    if (!course) return ApiErrors.notFound();

    // 404, nu 403: un curs din afara scope-ului trebuie să se citească drept
    // inexistent. Poarta e pe ORG fiindcă pentru PLATFORM `ownsDomain` nu poate
    // decât să treacă — calea superadminului rămâne neschimbată.
    if (scope.kind === "ORG" && !ownsDomain(scope, course.domain)) return ApiErrors.notFound();

    const moduleIds = course.modules.map((m) => m.id);
    const topics = course.modules.map((m) => m.questionTopic).filter((t): t is string => Boolean(t));

    const lessons = await prisma.lesson.updateMany({
      where: { moduleId: { in: moduleIds }, isPublished: !publish },
      data: { isPublished: publish },
    });

    const questions =
      includeQuestions && topics.length
        ? await prisma.question.updateMany({
            where: {
              domainId: course.domainId,
              topic: { in: topics },
              status: publish ? "DRAFT" : "PUBLISHED",
            },
            data: { status: publish ? "PUBLISHED" : "DRAFT" },
          })
        : { count: 0 };

    await prisma.course.update({ where: { id: course.id }, data: { isPublished: publish } });

    await logAudit({
      action: publish ? "COURSE_PUBLISH" : "COURSE_UNPUBLISH",
      performedById: userId,
      targetType: "Course",
      metadata: {
        courseId: course.id,
        slug,
        title: course.title,
        domainSlug: course.domain.slug,
        lessons: lessons.count,
        questions: questions.count,
        includeQuestions,
      },
    });

    return NextResponse.json({
      course: { slug, title: course.title, isPublished: publish },
      lessons: lessons.count,
      questions: questions.count,
    });
  });
}
