import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const url=process.argv.find(a=>/^https?:/.test(a)) || 'http://127.0.0.1:5178/?v=board-audit';
const outDir=path.resolve('artifacts/board-audit');
fs.mkdirSync(outDir,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:768}, deviceScaleFactor:1});
await page.goto(url,{waitUntil:'networkidle'});
await page.getByText('NORMAL MODE').click().catch(()=>{});
await page.getByRole('button', { name:/Grunt Orc/i }).click().catch(async()=>{
  const b=page.locator('button').filter({hasText:'Orc'}).first();
  await b.click();
});
await page.waitForSelector('.node .nodeWar3Asset',{timeout:10000});
await page.waitForFunction(() => [...document.querySelectorAll('.node .nodeWar3Asset')].every(img => img.complete && img.naturalWidth > 0), null, { timeout: 15000 }).catch(()=>{});
await page.screenshot({path:path.join(outDir,'board-map.png'), fullPage:false});
const report=await page.evaluate(()=>{
  const imgs=[...document.querySelectorAll('.node .nodeWar3Asset')];
  return {
    count: imgs.length,
    generated: imgs.filter(i=>i.currentSrc.includes('/generated-assets/board-nodes/')).length,
    srcs: [...new Set(imgs.map(i=>i.getAttribute('src')))].sort(),
    broken: imgs.filter(i=>!i.complete || i.naturalWidth===0).map(i=>({src:i.getAttribute('src'), complete:i.complete, naturalWidth:i.naturalWidth})),
    types:[...document.querySelectorAll('.node')].map(n=>({type:[...n.classList].find(c=>['battle','elite','tavern','altar','training','item','fountain','special','tower','boss'].includes(c)), disabled:n.disabled, active:n.classList.contains('active')})).slice(0,20)
  };
});
fs.writeFileSync(path.join(outDir,'report.json'), JSON.stringify({url, report}, null, 2));
console.log(JSON.stringify({url, report}, null, 2));
await browser.close();
