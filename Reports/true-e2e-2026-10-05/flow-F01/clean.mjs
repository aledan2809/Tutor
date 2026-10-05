import {createRequire} from 'module';
const r=createRequire('/Users/danciulescu/Projects/REAL/package.json');
const {PrismaClient}=r('/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client');
const db=new PrismaClient({datasources:{db:{url:'postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa'}}});
const us=await db.user.findMany({where:{email:{startsWith:'qa-e2e-1005-elev',mode:'insensitive'}},select:{id:true,email:true}});
console.log(us.length);
for(const u of us){ try{ await db.user.delete({where:{id:u.id}}); }catch(e){console.log('fail',u.email,e.message.slice(0,200));} }
console.log('left',await db.user.count({where:{email:{contains:'qa-e2e-1005',mode:'insensitive'}}}));
await db.$disconnect();
