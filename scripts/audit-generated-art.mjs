import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const url=process.argv.find(a=>/^https?:/.test(a)) || 'http://127.0.0.1:5178/?v=all-art-audit';
const outDir=path.resolve('artifacts/all-art-audit'); fs.mkdirSync(outDir,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:768},deviceScaleFactor:1});
await page.goto(url,{waitUntil:'networkidle'});
await page.getByRole('button',{name:/NORMAL MODE/}).click();
await page.getByRole('button',{name:/Orc/}).click();
await page.getByRole('button',{name:/NEXT · Battle/}).first().click();
await page.waitForSelector('.battlePage.pokelikeBattle .modelSprite img');
const battleReport=await page.evaluate(async()=>{
  const imgs=[...document.querySelectorAll('.modelSprite img,.wcPortrait img')];
  await Promise.all(imgs.map(img=>img.complete?null:new Promise(r=>{img.onload=img.onerror=r;})));
  const srcs=imgs.map(img=>img.getAttribute('src'));
  const generated=srcs.filter(s=>/generated-assets\/characters/.test(s));
  const broken=imgs.filter(img=>!img.naturalWidth).map(img=>img.getAttribute('src'));
  const selector='.combatFxOverlay.fxMeasured .fxMover>.fxProjectile';
  const start=performance.now();
  while(performance.now()-start<10000){
    const p=document.querySelector(selector);
    if(p && getComputedStyle(p).backgroundImage.includes('generated-assets/effects')) break;
    await new Promise(r=>setTimeout(r,25));
  }
  const p=document.querySelector(selector);
  return {imageCount:imgs.length,generatedCount:generated.length,broken,projectileBg:p?getComputedStyle(p).backgroundImage:null,actor:p?.closest('.combatFxOverlay')?.dataset.actorId||null};
});
await page.screenshot({path:path.join(outDir,'battle-generated-art.png'), fullPage:false});
await browser.close();
console.log(JSON.stringify({url,battleReport},null,2));
