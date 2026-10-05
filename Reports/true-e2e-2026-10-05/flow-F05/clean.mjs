import {prisma} from './lib.mjs';
const dom=await prisma.domain.findFirst({where:{name:'Matematica cl. VIII'}});
const us=await prisma.user.findMany({where:{OR:[{name:{contains:'qa-e2e-1005'}},{email:{contains:'qa-e2e-1005'}}]},select:{id:true}});
const ids=us.map(u=>u.id);
console.log('recip',(await prisma.recipient.deleteMany({where:{userId:{in:ids}}})).count);
for(const id of ids){ await prisma.user.delete({where:{id}}).catch(e=>console.log('fail',id,String(e).slice(-120))); }
await prisma.domain.update({where:{id:dom.id},data:{joinCode:null,joinCodeExpiresAt:null,joinCodeMaxUses:null,joinCodeUses:0}});
console.log('left',await prisma.user.count({where:{OR:[{name:{contains:'qa-e2e-1005'}},{email:{contains:'qa-e2e-1005'}}]}}));
await prisma.$disconnect();
