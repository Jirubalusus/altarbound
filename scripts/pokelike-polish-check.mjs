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

const sourceText = await fs.readFile(path.resolve('src/main.jsx'), 'utf8');
const wowItemRefs = [...sourceText.matchAll(/asset:'(wow-assets\/items\/[^']+\.png)'/g)].map(m => m[1]);
const missingWowItems = [];
for (const asset of wowItemRefs) {
  try { await fs.access(path.resolve('public', asset)); }
  catch { missingWowItems.push(asset); }
}
const characterCatalog = JSON.parse(await fs.readFile(path.resolve('public/wow-assets/character-faces/catalog.json'), 'utf8'));
const missingCharacterAssets = [];
for (const entry of characterCatalog) {
  try { await fs.access(path.resolve('public', entry.asset)); }
  catch { missingCharacterAssets.push(entry.asset); }
}
const bannedWeaponOrSpellCharacterIcons = new Set([
  'ability_warrior_savageblow','ability_warrior_bloodfrenzy','inv_spear_05',
  'ability_warrior_rampage','spell_nature_bloodlust','spell_nature_chainlightning',
  'ability_hunter_aimedshot','ability_hunter_markedfordeath','ability_hunter_swiftstrike',
  'spell_arcane_starfire','spell_nature_abolishmagic','spell_nature_resistnature',
  'ability_druid_maul','ability_racial_bearform','spell_frost_arcticwinds',
  'inv_hammer_04','ability_warrior_bladestorm','spell_nature_lightning',
  'ability_warstomp','spell_nature_healingwavegreater','spell_shadow_carrionswarm',
  'spell_frost_frostnova','ability_theblackarrow','classicon_deathknight'
]);
const nonFaceCharacterIcons = characterCatalog.filter(entry => bannedWeaponOrSpellCharacterIcons.has(entry.wowIcon) || /^inv_weapon_/.test(entry.wowIcon || '') || /^spell_/.test(entry.wowIcon || '')).map(entry => `${entry.id}:${entry.wowIcon}`);
if (wowItemRefs.length < 10 || missingWowItems.length || sourceText.includes('sprites/items') || sourceText.includes('item?.icon')) {
  throw new Error(`Item cards must use sourced WoW/Warcraft icons, not generated sprites/emoji fallbacks: ${JSON.stringify({wowItemRefs:wowItemRefs.length, missingWowItems, usesSpritesItems:sourceText.includes('sprites/items'), usesItemIconFallback:sourceText.includes('item?.icon')})}`);
}
const warcraftPortraitOverrides = ['public/warcraft3-assets/portraits/grunt.png'];
const missingWarcraftPortraits = [];
for (const asset of warcraftPortraitOverrides) {
  try { await fs.access(path.resolve(asset)); }
  catch { missingWarcraftPortraits.push(asset); }
}
if (characterCatalog.length < 56 || missingCharacterAssets.length || missingWarcraftPortraits.length || nonFaceCharacterIcons.length || sourceText.includes('sprites/models/') || sourceText.includes('war3-assets/portraits/')) {
  throw new Error(`All units/heroes must use sourced face/portrait WoW/Warcraft character assets, not weapons/spells or generated/local model placeholders: ${JSON.stringify({characterAssets:characterCatalog.length, missingCharacterAssets, missingWarcraftPortraits, nonFaceCharacterIcons, usesSpriteModels:sourceText.includes('sprites/models/'), usesOldPortraits:sourceText.includes('war3-assets/portraits/')})}`);
}

await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.setItem('altarbound_fast_mode','1'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.pokelikeMenu .logo');
const menuMotion = await page.evaluate(() => ({
  transitionShell: !!document.querySelector('.appScreenTransition'),
  backdrop: !!document.querySelector('.aaaBackdrop'),
  animationName: getComputedStyle(document.querySelector('.appScreenTransition')).animationName
}));
if (!menuMotion.transitionShell || !menuMotion.backdrop || !menuMotion.animationName.includes('altarScreenEnterPro')) {
  throw new Error(`AAA menu motion layer missing: ${JSON.stringify(menuMotion)}`);
}
await shot('01-menu');

await page.getByRole('button', { name: /NORMAL MODE/i }).click();
await page.waitForSelector('.starterCard');
await assertNoBadImages('starter');
await shot('02-race-select');
const raceGruntPortrait = await page.evaluate(() => [...document.querySelectorAll('.officialCharacterIcon')].find(img => img.alt === 'Grunt')?.src || 'missing');
if (!raceGruntPortrait.includes('/warcraft3-assets/portraits/grunt.png')) throw new Error(`Race select Grunt must use classic Warcraft III BTNGrunt portrait: ${raceGruntPortrait}`);

await page.getByRole('button', { name: /Orc Starter|Orc/i }).first().click();
await page.waitForSelector('.pokelikeBoard');
await assertNoBadImages('map');
const routeStart = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('.node')];
  const byStep = Object.fromEntries([...new Set(nodes.map(n => n.dataset.step))].map(step => [step, nodes.filter(n => n.dataset.step === step).length]));
  const active = nodes.filter(n => n.classList.contains('active'));
  const disabled = nodes.filter(n => n.disabled);
  const positions = nodes.map(n => {
    const board = document.querySelector('.pokelikeBoard').getBoundingClientRect();
    const disc = n.querySelector('.nodeDisc')?.getBoundingClientRect();
    const left = parseFloat(n.style.left);
    const top = parseFloat(n.style.top);
    return {
      step:n.dataset.step,
      lane:n.dataset.lane,
      left,
      top,
      discCx: disc ? (disc.left + disc.width/2 - board.left) : null,
      discCy: disc ? (disc.top + disc.height/2 - board.top) : null,
      errX: disc ? Math.abs((disc.left + disc.width/2 - board.left) - board.width*left/100) : 999,
      errY: disc ? Math.abs((disc.top + disc.height/2 - board.top) - board.height*top/100) : 999
    };
  });
  return { byStep, activeCount: active.length, disabledCount: disabled.length, nodeCount:nodes.length, positions };
});
if (JSON.stringify(routeStart.byStep) !== JSON.stringify({0:2,1:3,2:4,3:3,4:2,5:1})) throw new Error(`Route is not diamond 2-3-4-3-2-1: ${JSON.stringify(routeStart.byStep)}`);
if (routeStart.activeCount !== 2) throw new Error(`Initial active nodes should be exactly 2, got ${routeStart.activeCount}`);
const nodeAssetMetrics = await page.evaluate(() => {
  const nodes=[...document.querySelectorAll('.node')];
  const imgs=nodes.map(n=>n.querySelector('.nodeWar3Asset')).filter(Boolean);
  const disabledImgs=nodes.filter(n=>n.disabled).map(n=>n.querySelector('.nodeWar3Asset')).filter(Boolean);
  return {
    nodes: nodes.length,
    war3Assets: imgs.length,
    oldSpriteIcons: document.querySelectorAll('.node .spriteNode').length,
    oldTopOverlayVisible: !![...document.querySelectorAll('.boardTopRoom,.waterLane,.coral,.dockGap,.startMarker')].find(el => getComputedStyle(el).display !== 'none'),
    routeLegendVisible: !![...document.querySelectorAll('.routeLegend')].find(el => getComputedStyle(el).display !== 'none'),
    usesWowMapBackground: getComputedStyle(document.querySelector('.wowRouteBoard') || document.querySelector('.pokelikeBoard')).backgroundImage.includes('/wow-map-backgrounds/route-clean-'),
    nonValidatedSources: imgs.map(img=>img.src).filter(src=>!(src.includes('/warcraft3-assets/portraits/') || src.includes('/wow-assets/character-faces/') || src.includes('/wow-assets/characters/') || src.includes('/war3-assets/models/') || src.includes('/war3-assets/route-icons/') || src.includes('/hive-assets/nodes/') || src.includes('/hive-assets/nodes-readable/'))),
    illogicalItemNodes: nodes.filter(n=>n.classList.contains('item')).map(n=>n.querySelector('.nodeWar3Asset')?.src || '').filter(src=>!src.includes('/hive-assets/nodes-readable/item.png') || /raider|headhunter|grunt/.test(src)).length,
    nonOrcBattleNodes: nodes.filter(n=>n.classList.contains('battle')).map(n=>n.querySelector('.nodeWar3Asset')?.src || '').filter(src=>!src.includes('/warcraft3-assets/portraits/grunt.png')).length,
    nonFactionMapNodes: nodes.filter(n=>['battle','elite','tavern','altar','special','training','boss','tower'].some(cls=>n.classList.contains(cls))).map(n=>n.querySelector('.nodeWar3Asset')?.src || '').filter(src=>!(src.includes('/warcraft3-assets/portraits/') || src.includes('/wow-assets/character-faces/')) || src.includes('/wow-assets/characters/')).length,
    nonHiveObjectNodes: nodes.filter(n=>['item','fountain'].some(cls=>n.classList.contains(cls))).map(n=>n.querySelector('.nodeWar3Asset')?.src || '').filter(src=>!(src.includes('/hive-assets/nodes/') || src.includes('/hive-assets/nodes-readable/'))).length,
    hiddenFutureAssets: disabledImgs.filter(img=>{
      const cs=getComputedStyle(img);
      return cs.visibility==='hidden' || cs.display==='none' || Number(cs.opacity) < 0.75;
    }).length,
    generatedNodeChrome: nodes.filter(n=>{
      const d=n.querySelector('.nodeDisc');
      const nodeBefore=getComputedStyle(n,'::before');
      const nodeAfter=getComputedStyle(n,'::after');
      const discBefore=d ? getComputedStyle(d,'::before') : null;
      const discAfter=d ? getComputedStyle(d,'::after') : null;
      const visible = ps => ps && ps.display !== 'none' && ps.content !== 'none';
      return visible(nodeBefore) || visible(nodeAfter) || visible(discBefore) || visible(discAfter);
    }).length
  };
});
if (nodeAssetMetrics.war3Assets !== nodeAssetMetrics.nodes || nodeAssetMetrics.oldSpriteIcons !== 0 || nodeAssetMetrics.oldTopOverlayVisible || !nodeAssetMetrics.routeLegendVisible || !nodeAssetMetrics.usesWowMapBackground || nodeAssetMetrics.nonValidatedSources.length || nodeAssetMetrics.illogicalItemNodes || nodeAssetMetrics.nonOrcBattleNodes || nodeAssetMetrics.nonFactionMapNodes || nodeAssetMetrics.nonHiveObjectNodes || nodeAssetMetrics.hiddenFutureAssets || nodeAssetMetrics.generatedNodeChrome) throw new Error(`Map nodes must use race-dependent Warcraft/WoW assets on a WoW route background with no generated circles/peanas: ${JSON.stringify(nodeAssetMetrics)}`);
const mapMotion = await page.evaluate(() => {
  const reachable = document.querySelector('.wowRouteBoard .mapEdges line.reachable') || document.querySelector('.wowRouteBoard .mapEdges line');
  const activeIcon = document.querySelector('.wowRouteBoard .node.active .nodeWar3Asset');
  return {
    reachableDash: reachable ? getComputedStyle(reachable).animationName : 'missing',
    activeNodePulse: activeIcon ? getComputedStyle(activeIcon).animationName : 'missing',
    shellBackdrop: !!document.querySelector('.wcFrame .aaaBackdrop')
  };
});
if (!mapMotion.reachableDash.includes('altarPathDash') || !mapMotion.activeNodePulse.includes('altarNodePulse') || !mapMotion.shellBackdrop) {
  throw new Error(`AAA route-map motion layer missing: ${JSON.stringify(mapMotion)}`);
}
const maxNodeCenterError = Math.max(...routeStart.positions.map(p => Math.max(p.errX, p.errY)));
if (maxNodeCenterError > 4) throw new Error(`Route node discs are not centered on the mathematical grid; max error ${maxNodeCenterError.toFixed(2)}px: ${JSON.stringify(routeStart.positions)}`);
await shot('03-map');

async function resolveChoiceIfNeeded() {
  if (await page.locator('.choicePanel').count()) {
    const title = (await page.locator('.choicePanel h1').first().innerText()).toLowerCase();
    if (title.includes('item chest')) {
      await page.locator('.equipGrid button').first().click();
    } else if (title.includes('training')) {
      const trainable = page.locator('.choicePanel .pickCard:not([disabled])').first();
      if (await trainable.count()) await trainable.click();
      else await page.getByRole('button', { name: /skip/i }).click();
    } else {
      await page.locator('.choicePanel .pickCard').first().click();
    }
    await page.waitForTimeout(350);
  }
}

// First smoke route: click the guaranteed normal battle opener. This validates no post-battle reward
// and avoids random late elite/boss fights timing out the deploy check.
await page.locator('.node.active').first().click();
await page.waitForSelector('.pokelikeBattle');
await page.waitForSelector('.battleRoster .modelBattleCard');
const battleMetrics = await page.evaluate(() => ({
  panels: [...document.querySelectorAll('.battlePanel')].map(p => p.querySelectorAll('.modelBattleCard').length),
  rosters: document.querySelectorAll('.battleRoster').length
}));
if (battleMetrics.rosters !== 2 || battleMetrics.panels.some(n => n < 1)) throw new Error(`Battle does not render roster rows: ${JSON.stringify(battleMetrics)}`);
const battleMotion = await page.evaluate(() => ({
  transitionShell: !!document.querySelector('.pokelikeBattle.appScreenTransition'),
  backdrop: !!document.querySelector('.pokelikeBattle .aaaBackdrop.battleFX'),
  activeCards: document.querySelectorAll('.modelBattleCard.activeFighter').length,
  logAnimation: getComputedStyle(document.querySelector('.log p')).animationName
}));
if (!battleMotion.transitionShell || !battleMotion.backdrop || battleMotion.activeCards < 2 || !battleMotion.logAnimation.includes('altarLogIn')) {
  throw new Error(`AAA battle motion layer missing: ${JSON.stringify(battleMotion)}`);
}
await assertNoBadImages('battle');
await shot('04-battle');

await page.waitForFunction(() => !document.querySelector('.pokelikeBattle'), null, { timeout: 180000 }).catch(() => {});
await page.waitForTimeout(500);
const bodyText = await page.locator('body').innerText();
if (bodyText.includes('Victory Reward') || bodyText.includes('Choose one reward')) {
  throw new Error('Unexpected battle victory reward screen appeared after battle');
}
if (!bodyText.includes('TEAM') || !bodyText.includes('PATH')) {
  throw new Error('Did not return to map shell after battle');
}
const routeAfter = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('.node')];
  const active = nodes.filter(n => n.classList.contains('active'));
  return { activeCount: active.length, activeLanes: active.map(n => Number(n.dataset.lane)), activeSteps: active.map(n => Number(n.dataset.step)) };
});
if (routeAfter.activeCount < 1 || routeAfter.activeCount > 2) throw new Error(`After picking a route, next choices should be connected only, got ${JSON.stringify(routeAfter)}`);
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
