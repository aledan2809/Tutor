// Al doilea curs publicat dintr-o materie: testul modulului lui trebuie să se deschidă după lectură.
// Pe baza de test QA (docker tutor_qa), niciodată pe producție.
//   cd /Users/danciulescu/Projects/Tutor && DATABASE_URL=postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa npx tsx Reports/al-doilea-curs-2026-09-24/verificare-al-doilea-curs.ts
import { prisma } from "@/lib/prisma";
import { courseTopicsFor } from "@/lib/course-topics";

const TAG = "qa-curs2";
const results: boolean[] = [];
const check = (n: string, ok: boolean, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  — ${d}` : ""}`); };

async function wipe() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}-` } } });
  await prisma.domain.deleteMany({ where: { slug: { startsWith: `${TAG}-` } } });
}

async function main() {
  await wipe();
  const s = Date.now();
  const user = await prisma.user.create({ data: { email: `${TAG}-${s}@demo.tutor.app`, name: "QA curs 2" } });
  const domain = await prisma.domain.create({ data: { name: `Curs2 QA ${s}`, slug: `${TAG}-${s}`, isActive: true } });
  const mk = async (title: string, order: number, topic: string, published = true) => {
    const c = await prisma.course.create({ data: { domainId: domain.id, title, slug: `${TAG}-${s}-${order}`, order, isPublished: published } });
    const m = await prisma.courseModule.create({ data: { courseId: c.id, order: 1, title: `${title} M1`, questionTopic: topic } });
    const l = await prisma.lesson.create({ data: { domainId: domain.id, subject: "qa", topic, title: `${title} L1`, slug: `${TAG}-${s}-l${order}`, content: "x", isPublished: true, moduleId: m.id } });
    return l.id;
  };
  const l1 = await mk("Curs A", 0, "TemaA");
  const l2 = await mk("Curs B", 1, "TemaB");
  const l3 = await mk("Curs C nepublicat", 2, "TemaC", false);

  check("nimic citit → niciun test deschis", JSON.stringify(await courseTopicsFor(user.id, domain.id)) === "[]");

  await prisma.lessonProgress.create({ data: { userId: user.id, lessonId: l2, status: "COMPLETED" } });
  const onlyB = await courseTopicsFor(user.id, domain.id);
  check("lecția din AL DOILEA curs terminată → testul lui se deschide", JSON.stringify(onlyB) === '["TemaB"]', JSON.stringify(onlyB));

  await prisma.lessonProgress.create({ data: { userId: user.id, lessonId: l1, status: "COMPLETED" } });
  const both = await courseTopicsFor(user.id, domain.id);
  check("ambele cursuri citite → ambele teste", JSON.stringify(both) === '["TemaA","TemaB"]', JSON.stringify(both));

  await prisma.lessonProgress.create({ data: { userId: user.id, lessonId: l3, status: "COMPLETED" } });
  const unpub = await courseTopicsFor(user.id, domain.id);
  check("cursul nepublicat nu deschide nimic", !unpub?.includes("TemaC"), JSON.stringify(unpub));

  // Același subiect („TemaA") și într-un al doilea curs, cu o lecție NECITITĂ: testul se închide la loc —
  // întrebările țin de subiect, deci lectura cursului A nu deschide ce n-a citit în D.
  const c4 = await prisma.course.create({ data: { domainId: domain.id, title: "Curs D", slug: `${TAG}-${s}-4`, order: 3, isPublished: true } });
  const m4 = await prisma.courseModule.create({ data: { courseId: c4.id, order: 1, title: "D M1", questionTopic: "TemaA" } });
  const l4 = await prisma.lesson.create({ data: { domainId: domain.id, subject: "qa", topic: "TemaA", title: "Curs D L1", slug: `${TAG}-${s}-l4`, content: "x", isPublished: true, moduleId: m4.id } });
  const shared = await courseTopicsFor(user.id, domain.id);
  check("subiect comun, citit doar într-un curs → rămâne închis", JSON.stringify(shared) === '["TemaB"]', JSON.stringify(shared));
  await prisma.lessonProgress.create({ data: { userId: user.id, lessonId: l4.id, status: "COMPLETED" } });
  const dup = await courseTopicsFor(user.id, domain.id);
  check("subiect comun, citit în ambele → se deschide, o singură dată", JSON.stringify(dup) === '["TemaA","TemaB"]', JSON.stringify(dup));

  const noCourse = await prisma.domain.create({ data: { name: `Fara curs ${s}`, slug: `${TAG}-${s}-nc`, isActive: true } });
  check("materie fără curs → null (poartă neaplicată, ca înainte)", (await courseTopicsFor(user.id, noCourse.id)) === null);
}

main().catch((e) => { console.error(e); results.push(false); }).finally(async () => {
  await wipe(); await prisma.$disconnect();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} ${ok === results.length ? "TOATE TREC" : "EȘECURI"}`);
  process.exit(ok === results.length ? 0 : 1);
});
