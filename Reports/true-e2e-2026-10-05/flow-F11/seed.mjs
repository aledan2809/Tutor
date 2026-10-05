import { prisma, bcrypt } from './db.mjs';
const P='qa-e2e-1005';
const admin = await prisma.user.upsert({ where:{email:`${P}-admin@demo.tutor.app`}, update:{isSuperAdmin:true},
  create:{ email:`${P}-admin@demo.tutor.app`, username:`${P}-admin`, name:`${P} Admin`, password: await bcrypt.hash('QaE2e-1005-pass!',10), isSuperAdmin:true, emailVerified:new Date(), locale:'ro' }});
async function dom(name, slug, joinCode, withLessons){
  const d = await prisma.domain.upsert({ where:{slug}, update:{}, create:{ name, slug, isActive:true, joinCode } });
  const c = await prisma.course.upsert({ where:{slug:slug+'-curs'}, update:{}, create:{ domainId:d.id, title:name.replace('Materie','Curs'), slug:slug+'-curs', isPublished:true }});
  if (withLessons){
    const m = await prisma.courseModule.upsert({ where:{courseId_order:{courseId:c.id,order:1}}, update:{}, create:{ courseId:c.id, order:1, title:'Modulul 1 qa-e2e-1005' }});
    for (const i of [1,2]) await prisma.lesson.upsert({ where:{slug:`${slug}-l${i}`}, update:{}, create:{ domainId:d.id, subject:'qa', topic:'qa', title:`Lecția ${i} qa-e2e-1005`, slug:`${slug}-l${i}`, content:`# Lecția ${i}\n\nConținut de test.`, isPublished:true, moduleId:m.id, order:i }});
  }
  return d;
}
const A = await dom(`Materie ${P} cu lectii`, `${P}-cu-lectii`, 'QAE2E1005A', true);
const B = await dom(`Materie ${P} fara lectii`, `${P}-fara-lectii`, null, false);
console.log(JSON.stringify({admin:admin.id,A:A.id,B:B.id}));
await prisma.$disconnect();
