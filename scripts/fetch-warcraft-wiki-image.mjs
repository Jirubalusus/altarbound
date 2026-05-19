import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = path.resolve('public/warcraft3-assets/portraits');
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://warcraft.wiki.gg/wiki/Grunt_(Warcraft_III)', { waitUntil: 'networkidle', timeout: 90000 });
async function saveByAlt(alt, file) {
  const dataUrl = await page.evaluate(async ({ alt }) => {
    const img = [...document.images].find(i => i.alt === alt);
    if (!img) throw new Error(`missing ${alt}`);
    if (!img.complete || !img.naturalWidth) await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, 64, 64);
    return c.toDataURL('image/png');
  }, { alt });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  await fs.writeFile(path.join(outDir, file), Buffer.from(base64, 'base64'));
}
await saveByAlt('BTNGrunt.png', 'grunt.png');
await saveByAlt('BTNGrunt-Reforged.png', 'grunt-reforged-candidate.png');
await fs.writeFile(path.join(outDir, 'catalog.json'), JSON.stringify({
  assets: [
    { id: 'grunt', file: 'grunt.png', source: 'Warcraft Wiki', sourcePage: 'https://warcraft.wiki.gg/wiki/Grunt_(Warcraft_III)', sourceImage: 'https://warcraft.wiki.gg/images/BTNGrunt.png?e14832', originalName: 'BTNGrunt.png', assetStyle: 'Warcraft III classic command-card portrait', notes: 'Chosen Grunt portrait. Replaces generic WoW orc head after user correction.' },
    { id: 'grunt_reforged_candidate', file: 'grunt-reforged-candidate.png', source: 'Warcraft Wiki', sourcePage: 'https://warcraft.wiki.gg/wiki/Grunt_(Warcraft_III)', sourceImage: 'https://warcraft.wiki.gg/images/thumb/BTNGrunt-Reforged.png/64px-BTNGrunt-Reforged.png?a4c182', originalName: 'BTNGrunt-Reforged.png', assetStyle: 'Warcraft III Reforged portrait candidate', notes: 'Kept as alternate candidate only.' }
  ],
  licenseNote: 'Prototype/reference use. Warcraft assets are protected by their owners; review rights before commercial/public distribution.'
}, null, 2));
await fs.writeFile(path.join(outDir, 'README.md'), `# Warcraft III portrait assets\n\nSourced Warcraft III portrait overrides for Altarbound.\n\n- \`grunt.png\`: classic Warcraft III \`BTNGrunt.png\` from Warcraft Wiki's Grunt (Warcraft III) page.\n- \`grunt-reforged-candidate.png\`: Reforged candidate kept for comparison.\n\nLegal note: prototype/reference use only; review Blizzard/Warcraft Wiki licensing before commercial/public distribution.\n`);
await browser.close();
console.log(`saved portraits to ${outDir}`);
