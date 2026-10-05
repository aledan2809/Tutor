import {chromium,BASE} from './lib.mjs';
const b=await chromium.launch(); const ctx=await b.newContext({storageState:'parent-state.json'});
const r=await ctx.request.post(BASE+'/api/dashboard/family/invite',{data:{target:'CHILD',channel:'CODE'}});
console.log(r.status(),await r.text()); await b.close();
