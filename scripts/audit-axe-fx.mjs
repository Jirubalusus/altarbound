import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const fast = process.argv.includes('--fast');
const base = process.argv.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:5178/?v=axe-polish-audit';
const outDir = path.resolve('artifacts/axe-fx-audit');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
if (fast) await page.addInitScript(() => localStorage.setItem('altarbound_fast_mode','1'));
else await page.addInitScript(() => localStorage.setItem('altarbound_fast_mode','0'));
await page.goto(base, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /NORMAL MODE/ }).click();
await page.getByRole('button', { name: /Orc/ }).click();
await page.getByRole('button', { name: /NEXT · Battle/ }).first().click();
await page.waitForSelector('.battlePage.pokelikeBattle .battleGrid');

const samples = [];
const framePaths = [];
const started = Date.now();
while (Date.now() - started < 14000 && samples.length < 14) {
  const s = await page.evaluate(() => {
    const mover = document.querySelector('.combatFxOverlay.fx-slash.fxMeasured .fxMover');
    const axe = document.querySelector('.combatFxOverlay.fx-slash.fxMeasured .fxMover>.fxProjectile');
    const grid = document.querySelector('.battleGrid');
    if (!mover || !axe || !grid) return null;
    const mr = mover.getBoundingClientRect();
    const ar = axe.getBoundingClientRect();
    const gr = grid.getBoundingClientRect();
    const ms = getComputedStyle(mover);
    const bg = getComputedStyle(axe).backgroundImage;
    const opacity = Number(ms.opacity || 0);
    if (opacity <= 0.10) return null;
    return {
      t: Math.round(performance.now()),
      mx: Math.round(mr.left), my: Math.round(mr.top),
      ax: Math.round(ar.left + ar.width / 2), ay: Math.round(ar.top + ar.height / 2),
      aw: Math.round(ar.width), ah: Math.round(ar.height), opacity,
      grid: { left: Math.round(gr.left), top: Math.round(gr.top), right: Math.round(gr.right), bottom: Math.round(gr.bottom) },
      bg,
      clipped: ar.left < gr.left || ar.right > gr.right || ar.top < gr.top || ar.bottom > gr.bottom
    };
  });
  if (s) {
    samples.push(s);
    const file = path.join(outDir, `frame-${String(samples.length).padStart(2, '0')}.png`);
    await page.screenshot({ path: file, fullPage: false });
    framePaths.push(file);
    await page.waitForTimeout(45);
  } else {
    await page.waitForTimeout(35);
  }
}

const xs = samples.map(s => s.ax);
const ys = samples.map(s => s.ay);
const report = {
  url: base,
  sampleCount: samples.length,
  xRange: xs.length ? [Math.min(...xs), Math.max(...xs)] : null,
  yRange: ys.length ? [Math.min(...ys), Math.max(...ys)] : null,
  clippedFrames: samples.filter(s => s.clipped).length,
  backgroundOk: samples.some(s => /orc-war-axe-vfx/.test(s.bg)),
  samples,
  frames: framePaths
};
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
