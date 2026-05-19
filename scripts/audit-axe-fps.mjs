import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const fast = process.argv.includes('--fast');
const base = process.argv.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:5178/?v=axe-fps-audit';
const outDir = path.resolve('artifacts/axe-fx-fps');
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

const result = await page.evaluate(async () => {
  const selector = '.combatFxOverlay.fx-slash.fxMeasured .fxMover';
  const axeSelector = '.combatFxOverlay.fx-slash.fxMeasured .fxMover>.fxProjectile';
  const startWait = performance.now();
  while (performance.now() - startWait < 16000) {
    const mover = document.querySelector(selector);
    if (mover && Number(getComputedStyle(mover).opacity || 0) > 0.08) break;
    await new Promise(r => setTimeout(r, 12));
  }
  const lockedMover = document.querySelector(selector);
  const samples = [];
  const sampleStart = performance.now();
  return await new Promise(resolve => {
    function tick(now) {
      const mover = lockedMover;
      const axe = mover?.querySelector('.fxProjectile');
      const grid = document.querySelector('.battleGrid');
      if (mover && axe && grid) {
        const mr = mover.getBoundingClientRect();
        const ar = axe.getBoundingClientRect();
        const gr = grid.getBoundingClientRect();
        const opacity = Number(getComputedStyle(mover).opacity || 0);
        samples.push({
          t: Math.round(now - sampleStart),
          mx: +(mr.left + mr.width / 2).toFixed(2),
          my: +(mr.top + mr.height / 2).toFixed(2),
          ax: +(ar.left + ar.width / 2).toFixed(2),
          ay: +(ar.top + ar.height / 2).toFixed(2),
          opacity,
          clipped: ar.left < gr.left || ar.right > gr.right || ar.top < gr.top || ar.bottom > gr.bottom,
          bg: getComputedStyle(axe).backgroundImage,
          moverAnim: getComputedStyle(mover).animationName,
          axeAnim: getComputedStyle(axe).animationName
        });
      }
      if (document.querySelector(selector) !== lockedMover) return resolve(samples);
      if (now - sampleStart < 1050) requestAnimationFrame(tick);
      else resolve(samples);
    }
    requestAnimationFrame(tick);
  });
});

const visible = result.filter(s => s.opacity > 0.08);
const xs = visible.map(s => s.ax);
const deltas = visible.slice(1).map((s,i) => s.ax - visible[i].ax);
const nonZeroSteps = deltas.filter(d => Math.abs(d) > 0.5).length;
const hugeJumps = deltas.filter(d => Math.abs(d) > 55).length;
const report = {
  url: base,
  rafSamples: result.length,
  visibleSamples: visible.length,
  xRange: xs.length ? [Math.min(...xs), Math.max(...xs)] : null,
  nonZeroSteps,
  hugeJumps,
  clippedFrames: visible.filter(s => s.clipped).length,
  backgroundOk: visible.some(s => /orc-war-axe-vfx/.test(s.bg)),
  moverAnimation: visible[0]?.moverAnim,
  axeAnimation: visible[0]?.axeAnim,
  firstVisible: visible.slice(0, 8),
  lastVisible: visible.slice(-8)
};
fs.writeFileSync(path.join(outDir, 'fps-report.json'), JSON.stringify(report, null, 2));
await page.screenshot({ path: path.join(outDir, 'fps-final.png'), fullPage: false });
console.log(JSON.stringify(report, null, 2));
await browser.close();
