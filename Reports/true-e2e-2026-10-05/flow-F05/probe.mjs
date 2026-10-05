import {prisma,chromium,devices,BASE,DIR} from './lib.mjs';
const dom=await prisma.domain.findFirst({where:{name:'Matematica cl. VIII'},select:{id:true,joinCode:true,joinCodeUses:true}});
console.log('before',dom.joinCodeUses);
const b=await chromium.launch(); const ctx=await b.newContext({...devices["iPhone 13"],locale:"ro-RO"}); const p=await ctx.newPage();
const reqs=[]; p.on('request',r=>{if(r.url().includes('guest-access')||r.url().includes('join'))reqs.push(r.method()+' '+r.url().replace(BASE,''))});
await p.goto(`${BASE}/ro/acces/${dom.joinCode}`,{waitUntil:'networkidle'});
await p.fill('#g-nume','qa-e2e-1005-probe');await p.fill('#g-prenume','Pr');await p.fill('#g-tel','0711000'+String(Date.now()).slice(-3));
await p.click('text=Intră la curs'); await p.waitForURL(/dashboard/,{timeout:20000}).catch(()=>{}); await p.waitForTimeout(3000);
console.log(reqs);
const d=await prisma.domain.findUnique({where:{id:dom.id},select:{joinCodeUses:true}});console.log('after',d.joinCodeUses, await prisma.user.count({where:{name:{contains:'qa-e2e-1005-probe'}}}));
await p.screenshot({path:DIR+'/probe-after.png'});
// lessons page text
console.log((await p.innerText('main')).slice(0,600));
await b.close();await prisma.$disconnect();
