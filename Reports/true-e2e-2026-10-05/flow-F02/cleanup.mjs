import {createRequire} from 'module';
const r=createRequire('/Users/danciulescu/Projects/REAL/package.json');
const {PrismaClient}=r('/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client');
const db=new PrismaClient({datasources:{db:{url:'postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa'}}});
const users=await db.user.findMany({where:{OR:[
 {email:{in:['qa-e2e-1005-parinte-1791185623763@example.com','qa-e2e-1005-parinte-mobile-1791185688893@example.com','qa-e2e-1005-parinte-desktop-1791185927042@example.com']}},
 {username:{in:['qa-e2e-1005-copil-mobile-17911','qa-e2e-1005-copil-desktop-1791']}}]},select:{id:true,email:true,username:true}});
console.log(users);
for(const u of users){ try{ await db.user.delete({where:{id:u.id}}); console.log('deleted',u.id);}catch(e){console.log('FAIL',u.id,e.message.slice(0,200));} }
await db.$disconnect();
