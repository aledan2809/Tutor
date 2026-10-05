import { createRequire } from 'module';
const req = createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json');
const { chromium, devices } = req('playwright');
const b=await chromium.launch(); const c=await b.newContext({...devices['iPhone 13'],locale:'ro-RO'}); const p=await c.newPage();
await p.goto('http://localhost:3113/ro/acces/KG7o73BCbJ6KtM-ps8LNtQxx'); await p.waitForTimeout(1500);
const ins=await p.locator('input').evaluateAll(e=>e.map(x=>x.id||x.name||x.type)); console.log(ins);
await p.locator('input').nth(0).fill('Test'); await p.locator('input').nth(1).fill('Qa-e2e-1005'); if(ins.length>2) await p.locator('input').nth(2).fill('0799300999');
await p.getByRole('button',{name:'Intră la curs'}).click({force:true}); await p.waitForTimeout(2500);
await p.screenshot({path:'mobile-23-invalid-token-submit.png'}); console.log(p.url(), (await p.innerText('body')).slice(0,400)); await b.close();
