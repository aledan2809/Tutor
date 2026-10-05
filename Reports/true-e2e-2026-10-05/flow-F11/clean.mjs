import { prisma } from './db.mjs';
const r1 = await prisma.recipient.deleteMany({ where:{ OR:[{lastName:{contains:'qa-e2e-1005'}},{domain:{slug:{startsWith:'qa-e2e-1005'}}}] } });
const r2 = await prisma.user.deleteMany({ where:{ OR:[{email:{startsWith:'qa-e2e-1005'}},{username:{startsWith:'qa-e2e-1005'}}] } });
if (process.argv[2]==='all'){
  await prisma.lessonProgress.deleteMany({where:{lesson:{slug:{startsWith:'qa-e2e-1005'}}}});
  await prisma.lesson.deleteMany({where:{slug:{startsWith:'qa-e2e-1005'}}});
  await prisma.course.deleteMany({where:{slug:{startsWith:'qa-e2e-1005'}}});
  await prisma.domain.deleteMany({where:{slug:{startsWith:'qa-e2e-1005'}}});
}
console.log('clean', r1.count, r2.count);
await prisma.$disconnect();
