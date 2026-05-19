import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const fast = process.argv.includes('--fast');
const base = process.argv.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:5178/?v=capture-axe-sequence';
const outDir = path.resolve('artifacts/axe-fx-sequence', fast ? 'fast' : 'normal');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
await page.addInitScript(enabled => localStorage.setItem('altarbound_fast_mode', enabled ? '1' : '0'), fast);
await page.goto(base, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /NORMAL MODE/ }).click();
await page.getByRole('button', { name: /Orc/ }).click();
await page.getByRole('button', { name: /NEXT · Battle/ }).first().click();
await page.waitForSelector('.battlePage.pokelikeBattle .battleGrid');
await page.evaluate(async () => {
  const selector = '.combatFxOverlay.fx-slash.fxMeasured .fxMover';
  const start = performance.now();
  while (performance.now() - start < 16000) {
    const mover = document.querySelector(selector);
    if (mover && Number(getComputedStyle(mover).opacity || 0) > 0.12) return;
    await new Promise(r => setTimeout(r, 8));
  }
});
const delay = fast ? 42 : 120;
const frames = [];
for (let i = 1; i <= 8; i++) {
  const file = path.join(outDir, `frame-${String(i).padStart(2,'0')}.png`);
  await page.screenshot({ path: file, fullPage: false });
  frames.push(file);
  await page.waitForTimeout(delay);
}
console.log(JSON.stringify({ url: base, fast, frames }, null, 2));
await browser.close();
