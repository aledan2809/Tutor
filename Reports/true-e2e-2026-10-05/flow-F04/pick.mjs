import {chromium,BASE} from './lib.mjs';
const b=await chromium.launch(); const ctx=await b.newContext({storageState:'child-state-M.json',viewport:{width:390,height:844},isMobile:true});
const page=await ctx.newPage(); await page.goto(BASE+'/ro/dashboard'); await page.waitForTimeout(2500);
await page.getByText('Matematica cl. VIII').first().click(); await page.waitForTimeout(3000); console.log(page.url()); await b.close();
