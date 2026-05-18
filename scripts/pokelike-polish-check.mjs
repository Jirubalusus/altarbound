import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.ALTARBOUND_URL || 'http://127.0.0.1:4173/?v=playwright-polish';
const outDir = path.resolve('artifacts/pokelike-polish');
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', msg => { if (['error', 'warning'].includes(msg.type())) errors.push(`${msg.type()}: ${msg.text()}`); });
page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));

async function shot(name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
}
async function assertNoBadImages(label) {
  await page.waitForFunction(() => [...document.images].every(img => img.complete), null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(500);
  const bad = await page.evaluate(() => [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src));
  if (bad.length) throw new Error(`${label}: broken images: ${bad.join(', ')}`);
}

await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.setItem('altarbound_fast_mode','1'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.pokelikeMenu .logo');
await shot('01-menu');

await page.getByRole('button', { name: /NORMAL MODE/i }).click();
await page.waitForSelector('.starterCard');
await assertNoBadImages('starter');
await shot('02-race-select');

await page.getByRole('button', { name: /Orc Starter|Orc/i }).first().click();
await page.waitForSelector('.pokelikeBoard');
await assertNoBadImages('map');
await shot('03-map');

const firstActive = page.locator('.node.active').first();
await firstActive.click();
await page.waitForSelector('.pokelikeBattle');
await assertNoBadImages('battle');
await shot('04-battle');

await page.waitForTimeout(6500);
const bodyText = await page.locator('body').innerText();
if (bodyText.includes('Victory Reward') || bodyText.includes('Choose one reward')) {
  throw new Error('Unexpected battle victory reward screen appeared after battle');
}
if (!bodyText.includes('TEAM') || !bodyText.includes('PATH')) {
  throw new Error('Did not return to map shell after battle');
}
await shot('05-after-battle-map');

const metrics = await page.evaluate(() => {
  const board = document.querySelector('.pokelikeBoard')?.getBoundingClientRect();
  const nodes = [...document.querySelectorAll('.node')].map(n => n.getBoundingClientRect());
  return {
    title: document.title,
    badImages: [...document.images].filter(img => !img.complete || img.naturalWidth === 0).length,
    hasMenuClass: !!document.querySelector('.pokelikeMenu'),
    board: board && { width: board.width, height: board.height, left: board.left, right: board.right },
    nodesVisible: nodes.filter(r => r.width > 0 && r.height > 0 && r.left >= -5 && r.right <= innerWidth + 5).length,
    nodeCount: nodes.length,
    text: document.body.innerText.slice(0, 250)
  };
});

if (metrics.badImages !== 0) throw new Error(`Bad image count: ${metrics.badImages}`);
if (!metrics.board || metrics.board.width < 420 || metrics.board.height < 520) throw new Error(`Board geometry too small: ${JSON.stringify(metrics.board)}`);
if (metrics.nodesVisible < Math.min(12, metrics.nodeCount)) throw new Error(`Too few visible nodes: ${metrics.nodesVisible}/${metrics.nodeCount}`);
if (errors.length) throw new Error(`Console/page errors: ${errors.join('\n')}`);

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify({ ok: true, metrics, screenshots: ['01-menu.png','02-race-select.png','03-map.png','04-battle.png','05-after-battle-map.png'] }, null, 2));
await browser.close();
console.log(JSON.stringify({ ok: true, outDir, metrics }, null, 2));
