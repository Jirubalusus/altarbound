import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const FAST_MODE_KEY = 'altarbound_fast_mode';

const RACES = {
  human:{name:'Human', color:'#69a7ff', starter:'footman', style:'armor, healing, disciplined lines'},
  orc:{name:'Orc', color:'#79c65b', starter:'grunt', style:'brutal melee, rage, bloodlust'},
  nightelf:{name:'Night Elf', color:'#b987ff', starter:'archer', style:'ranged pressure, evasion, nature'},
  undead:{name:'Undead', color:'#9dd7d1', starter:'ghoul', style:'sacrifice, decay, resurrection'}
};

const UNITS = {
  footman:{name:'Footman', race:'human', icon:'🛡️', role:'Tank', tier:1, hp:44, atk:8, armor:3, spd:36, ability:'Defend', evo:'captain_footman', tags:['Melee','Armored']},
  captain_footman:{name:'Captain Footman', race:'human', icon:'🛡️⭐', role:'Tank', tier:2, hp:66, atk:12, armor:5, spd:38, ability:'Shield Wall', evolved:true, tags:['Melee','Armored','Leader']},
  rifleman:{name:'Rifleman', race:'human', icon:'🔫', role:'Ranged', tier:1, hp:34, atk:12, armor:1, spd:42, ability:'Long Rifles', evo:'sharpshooter', tags:['Ranged']},
  sharpshooter:{name:'Sharpshooter', race:'human', icon:'🎯', role:'Ranged', tier:2, hp:48, atk:17, armor:2, spd:48, ability:'Headshot', evolved:true, targetLast:true, tags:['Ranged']},
  priest:{name:'Priest', race:'human', icon:'✨', role:'Healer', tier:1, hp:32, atk:6, armor:1, spd:39, ability:'Heal', evo:'high_priest', tags:['Caster','Healer']},
  high_priest:{name:'High Priest', race:'human', icon:'🌟', role:'Healer', tier:2, hp:46, atk:8, armor:2, spd:43, ability:'Greater Heal', evolved:true, tags:['Caster','Healer']},
  knight:{name:'Knight', race:'human', icon:'🐎', role:'Bruiser', tier:2, hp:58, atk:15, armor:4, spd:46, ability:'Charge', evo:'champion_knight', tags:['Melee','Armored']},
  champion_knight:{name:'Champion Knight', race:'human', icon:'🏇', role:'Bruiser', tier:3, hp:78, atk:22, armor:5, spd:50, ability:'Royal Charge', evolved:true, tags:['Melee','Armored']},
  gryphon:{name:'Gryphon Rider', race:'human', icon:'🦅', role:'Elite', tier:3, hp:62, atk:24, armor:3, spd:52, ability:'Storm Hammer', targetLast:true, tags:['Flying','Ranged']},

  grunt:{name:'Grunt', race:'orc', icon:'🪓', role:'Bruiser', tier:1, hp:54, atk:11, armor:2, spd:34, ability:'Berserker Strength', evo:'grunt_veteran', tags:['Melee']},
  grunt_veteran:{name:'Grunt Veteran', race:'orc', icon:'🪓🔥', role:'Bruiser', tier:2, hp:76, atk:17, armor:3, spd:38, ability:'Blood Rage', evolved:true, tags:['Melee']},
  headhunter:{name:'Troll Headhunter', race:'orc', icon:'🗡️', role:'Ranged', tier:1, hp:36, atk:12, armor:1, spd:44, ability:'Spear Volley', evo:'berserker', tags:['Ranged']},
  berserker:{name:'Troll Berserker', race:'orc', icon:'🗡️🔥', role:'Ranged', tier:2, hp:52, atk:18, armor:1, spd:53, ability:'Berserk', evolved:true, tags:['Ranged']},
  shaman:{name:'Shaman', race:'orc', icon:'⚡', role:'Caster', tier:1, hp:35, atk:8, armor:1, spd:40, ability:'Bloodlust', evo:'storm_shaman', tags:['Caster']},
  storm_shaman:{name:'Storm Shaman', race:'orc', icon:'🌩️', role:'Caster', tier:2, hp:50, atk:12, armor:2, spd:45, ability:'Storm Bloodlust', evolved:true, tags:['Caster']},
  raider:{name:'Raider', race:'orc', icon:'🐺', role:'Assassin', tier:2, hp:48, atk:16, armor:2, spd:55, ability:'Ensnare', evo:'wolf_captain', targetLast:true, tags:['Melee','Fast']},
  wolf_captain:{name:'Wolf Captain', race:'orc', icon:'🐺👑', role:'Assassin', tier:3, hp:66, atk:23, armor:3, spd:60, ability:'Backline Ensnare', evolved:true, targetLast:true, tags:['Melee','Fast']},
  tauren:{name:'Tauren', race:'orc', icon:'🐂', role:'Elite', tier:3, hp:90, atk:25, armor:4, spd:30, ability:'Pulverize', tags:['Melee','Armored']},

  archer:{name:'Archer', race:'nightelf', icon:'🏹', role:'Ranged', tier:1, hp:32, atk:11, armor:1, spd:50, ability:'Marksmanship', evo:'sentinel_archer', targetLast:false, tags:['Ranged']},
  sentinel_archer:{name:'Sentinel Archer', race:'nightelf', icon:'🏹🌙', role:'Ranged', tier:2, hp:45, atk:17, armor:2, spd:57, ability:'Moon Mark', evolved:true, targetLast:true, tags:['Ranged']},
  huntress:{name:'Huntress', race:'nightelf', icon:'🌙', role:'Skirmisher', tier:1, hp:42, atk:10, armor:2, spd:48, ability:'Bounce', evo:'moon_huntress', tags:['Melee','Ranged']},
  moon_huntress:{name:'Moon Huntress', race:'nightelf', icon:'🌙⭐', role:'Skirmisher', tier:2, hp:60, atk:15, armor:3, spd:54, ability:'Moon Glaive', evolved:true, tags:['Melee','Ranged']},
  dryad:{name:'Dryad', race:'nightelf', icon:'🍃', role:'Control', tier:1, hp:36, atk:9, armor:1, spd:52, ability:'Slow Poison', evo:'elder_dryad', tags:['Ranged','Magic']},
  elder_dryad:{name:'Elder Dryad', race:'nightelf', icon:'🍃✨', role:'Control', tier:2, hp:52, atk:13, armor:2, spd:57, ability:'Abolish Magic', evolved:true, tags:['Ranged','Magic']},
  druid_claw:{name:'Druid of the Claw', race:'nightelf', icon:'🐻', role:'Tank', tier:2, hp:58, atk:14, armor:3, spd:39, ability:'Bear Form', evo:'elder_bear', tags:['Melee','Caster']},
  elder_bear:{name:'Elder Bear Druid', race:'nightelf', icon:'🐻🌲', role:'Tank', tier:3, hp:84, atk:20, armor:5, spd:41, ability:'Roar', evolved:true, tags:['Melee','Caster']},
  chimaera:{name:'Chimaera', race:'nightelf', icon:'🐉', role:'Elite', tier:3, hp:70, atk:27, armor:2, spd:45, ability:'Corrosive Breath', targetLast:true, tags:['Flying','Magic']},

  ghoul:{name:'Ghoul', race:'undead', icon:'🧟', role:'Melee', tier:1, hp:40, atk:10, armor:1, spd:50, ability:'Cannibalize', evo:'frenzied_ghoul', tags:['Melee']},
  frenzied_ghoul:{name:'Frenzied Ghoul', race:'undead', icon:'🧟🔥', role:'Melee', tier:2, hp:58, atk:16, armor:2, spd:60, ability:'Ghoul Frenzy', evolved:true, tags:['Melee','Fast']},
  crypt_fiend:{name:'Crypt Fiend', race:'undead', icon:'🕷️', role:'Ranged', tier:1, hp:48, atk:12, armor:2, spd:38, ability:'Web', evo:'crypt_reaver', tags:['Ranged']},
  crypt_reaver:{name:'Crypt Reaver', race:'undead', icon:'🕷️☠️', role:'Ranged', tier:2, hp:66, atk:18, armor:3, spd:42, ability:'Burrow Web', evolved:true, targetLast:true, tags:['Ranged']},
  necromancer:{name:'Necromancer', race:'undead', icon:'💀', role:'Caster', tier:1, hp:34, atk:7, armor:1, spd:39, ability:'Raise Dead', evo:'dark_necromancer', tags:['Caster']},
  dark_necromancer:{name:'Dark Necromancer', race:'undead', icon:'💀🔮', role:'Caster', tier:2, hp:50, atk:11, armor:2, spd:43, ability:'Cripple', evolved:true, tags:['Caster']},
  abomination:{name:'Abomination', race:'undead', icon:'🧟‍♂️', role:'Tank', tier:2, hp:78, atk:16, armor:3, spd:28, ability:'Disease Cloud', evo:'plague_abom', tags:['Melee','Armored']},
  plague_abom:{name:'Plague Abomination', race:'undead', icon:'☣️', role:'Tank', tier:3, hp:104, atk:23, armor:4, spd:30, ability:'Plague Burst', evolved:true, tags:['Melee','Armored']},
  frost_wyrm:{name:'Frost Wyrm', race:'undead', icon:'🐲', role:'Elite', tier:3, hp:74, atk:28, armor:3, spd:36, ability:'Freezing Breath', targetLast:true, tags:['Flying','Magic']}
};

const HEROES = {
  paladin:{name:'Paladin', race:'human', icon:'🔨', hp:70, atk:13, armor:4, spd:38, skills:['Holy Light','Divine Shield','Devotion Aura'], ultimate:'Resurrection'},
  archmage:{name:'Archmage', race:'human', icon:'🧙', hp:52, atk:16, armor:1, spd:42, skills:['Blizzard','Water Elemental','Brilliance Aura'], ultimate:'Arcane Storm'},
  mountain_king:{name:'Mountain King', race:'human', icon:'⛰️', hp:76, atk:18, armor:3, spd:34, skills:['Storm Bolt','Thunder Clap','Bash'], ultimate:'Avatar'},
  blood_mage:{name:'Blood Mage', race:'human', icon:'🔥', hp:55, atk:17, armor:1, spd:43, skills:['Flame Strike','Banish','Siphon Mana'], ultimate:'Phoenix'},
  blademaster:{name:'Blademaster', race:'orc', icon:'🗡️', hp:64, atk:20, armor:2, spd:55, skills:['Wind Walk','Mirror Image','Critical Strike'], ultimate:'Bladestorm'},
  far_seer:{name:'Far Seer', race:'orc', icon:'🌩️', hp:56, atk:15, armor:1, spd:45, skills:['Chain Lightning','Feral Spirit','Far Sight'], ultimate:'Earthquake'},
  tauren_chief:{name:'Tauren Chieftain', race:'orc', icon:'🐂', hp:84, atk:18, armor:3, spd:32, skills:['Shockwave','War Stomp','Endurance Aura'], ultimate:'Reincarnation'},
  shadow_hunter:{name:'Shadow Hunter', race:'orc', icon:'🧿', hp:58, atk:13, armor:2, spd:47, skills:['Healing Wave','Hex','Serpent Ward'], ultimate:'Big Bad Voodoo'},
  demon_hunter:{name:'Demon Hunter', race:'nightelf', icon:'😈', hp:68, atk:18, armor:2, spd:54, skills:['Mana Burn','Immolation','Evasion'], ultimate:'Metamorphosis'},
  keeper:{name:'Keeper of the Grove', race:'nightelf', icon:'🌳', hp:60, atk:14, armor:2, spd:41, skills:['Entangling Roots','Force of Nature','Thorns Aura'], ultimate:'Tranquility'},
  priestess:{name:'Priestess of the Moon', race:'nightelf', icon:'🌕', hp:56, atk:17, armor:2, spd:50, skills:['Searing Arrows','Scout','Trueshot Aura'], ultimate:'Starfall'},
  warden:{name:'Warden', race:'nightelf', icon:'🗡️', hp:62, atk:19, armor:2, spd:58, skills:['Fan of Knives','Blink','Shadow Strike'], ultimate:'Vengeance'},
  death_knight:{name:'Death Knight', race:'undead', icon:'☠️', hp:74, atk:17, armor:3, spd:44, skills:['Death Coil','Death Pact','Unholy Aura'], ultimate:'Animate Dead'},
  dreadlord:{name:'Dreadlord', race:'undead', icon:'🦇', hp:72, atk:16, armor:2, spd:40, skills:['Carrion Swarm','Sleep','Vampiric Aura'], ultimate:'Inferno'},
  lich:{name:'Lich', race:'undead', icon:'❄️', hp:54, atk:18, armor:1, spd:39, skills:['Frost Nova','Frost Armor','Dark Ritual'], ultimate:'Death and Decay'},
  crypt_lord:{name:'Crypt Lord', race:'undead', icon:'🪲', hp:86, atk:16, armor:4, spd:31, skills:['Impale','Carrion Beetles','Spiked Carapace'], ultimate:'Locust Swarm'},
  naga:{name:'Naga Sea Witch', race:'neutral', icon:'🐍', hp:58, atk:18, armor:2, spd:49, skills:['Forked Lightning','Frost Arrows','Mana Shield'], ultimate:'Tornado'},
  panda:{name:'Pandaren Brewmaster', race:'neutral', icon:'🐼', hp:82, atk:18, armor:3, spd:37, skills:['Breath of Fire','Drunken Haze','Drunken Brawler'], ultimate:'Storm Earth Fire'},
  beastmaster:{name:'Beastmaster', race:'neutral', icon:'🐻', hp:72, atk:15, armor:3, spd:40, skills:['Summon Bear','Quilbeast','Hawk'], ultimate:'Stampede'},
  dark_ranger:{name:'Dark Ranger', race:'neutral', icon:'🏹☠️', hp:58, atk:19, armor:2, spd:51, skills:['Silence','Black Arrow','Life Drain'], ultimate:'Charm'}
};

const ITEMS = [
  {name:'Claws of Attack', asset:'wow-assets/items/claws-of-attack.png', wowIcon:'inv_misc_monsterclaw_03', desc:'+4 attack', atk:4},
  {name:'Ring of Protection', asset:'wow-assets/items/ring-of-protection.png', wowIcon:'inv_jewelry_ring_01', desc:'+2 armor', armor:2},
  {name:'Boots of Speed', asset:'wow-assets/items/boots-of-speed.png', wowIcon:'inv_boots_05', desc:'+12 speed', spd:12},
  {name:'Orb of Fire', asset:'wow-assets/items/orb-of-fire.png', wowIcon:'inv_misc_orb_05', desc:'+2 attack, burn chance', atk:2, burn:true},
  {name:'Pendant of Energy', asset:'wow-assets/items/pendant-of-energy.png', wowIcon:'inv_jewelry_talisman_06', desc:'Hero power fills faster', power:1.25},
  {name:'Backstab Dagger', asset:'wow-assets/items/backstab-dagger.png', wowIcon:'inv_weapon_shortblade_05', desc:'Attacks the last enemy', targetLast:true},
  {name:'Guardian Shield', asset:'wow-assets/items/guardian-shield.png', wowIcon:'inv_shield_05', desc:'Protects your last unit from first hit', protectLast:true},
  {name:'Healing Charm', asset:'wow-assets/items/healing-charm.png', wowIcon:'inv_jewelry_talisman_03', desc:'Small self heal each action', regen:5},
  {name:'Spell Ward', asset:'wow-assets/items/spell-ward.png', wowIcon:'spell_holy_magicalsentry', desc:'+1 armor and resists curses', armor:1, cleanse:true},
  {name:'War Drum', asset:'wow-assets/items/war-drum.png', wowIcon:'inv_misc_drum_01', desc:'+2 attack to holder and next ally', atk:2}
];

const UNIT_BY_RACE = Object.keys(UNITS).filter(k=>!UNITS[k].evolved).reduce((acc,k)=>{ const r=UNITS[k].race; (acc[r]??=[]).push(k); return acc;},{});
const HERO_BY_RACE = Object.keys(HEROES).filter(k=>HEROES[k].race!=='neutral').reduce((acc,k)=>{ const r=HEROES[k].race; (acc[r]??=[]).push(k); return acc;},{});
const NEUTRAL_HEROES = Object.keys(HEROES).filter(k=>HEROES[k].race==='neutral');
const uid = () => Math.random().toString(36).slice(2,9);
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const rand = arr => arr[Math.floor(Math.random()*arr.length)];
const sample = (arr,n)=>{ const copy=[...arr]; const out=[]; while(copy.length&&out.length<n){ out.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]); } return out; };

function scaledLevel(gameLevel, offset=0){ return Math.max(1, gameLevel + offset - Math.floor(Math.random()*2)); }
function tierForLevel(level){ return level<4?1:level<8?2:3; }
function makeUnit(id, level=1){
  const b=UNITS[id]; const maxHp=Math.round(b.hp + level*5); return {uid:uid(), kind:'unit', id, level, xp:0, hp:maxHp, maxHp, abilityRank:0, promoted:!!b.evolved, item:null, cursed:false, speed:0};
}
function makeHero(id, level=1){
  const b=HEROES[id]; const maxHp=Math.round(b.hp + level*6); return {uid:uid(), kind:'hero', id, level, xp:0, hp:maxHp, maxHp, skillRanks:[1,1,1], ultimateUnlocked:false, ultimateRank:0, selectedSkill:0, item:null, item2:null, power:0, cursed:false, speed:0};
}
function baseOf(c){ return c.kind==='unit'?UNITS[c.id]:HEROES[c.id]; }
function itemStats(c){ const items=[c.item,c.item2].filter(Boolean); return items.reduce((a,it)=>({atk:a.atk+(it.atk||0), armor:a.armor+(it.armor||0), spd:a.spd+(it.spd||0)}),{atk:0,armor:0,spd:0}); }
function stats(c){ const b=baseOf(c), it=itemStats(c); return {hp:c.maxHp, atk:b.atk + Math.floor(c.level*1.7)+it.atk, armor:b.armor + Math.floor(c.level/4)+it.armor, spd:b.spd + Math.floor(c.level/3)+it.spd}; }
function fullName(c){ return baseOf(c).name; }
function healFull(c){ return {...c, hp:c.maxHp, cursed:false, power:c.kind==='hero'?0:c.power, speed:0}; }
function addXp(c, amount){
  let n={...c, xp:c.xp+amount};
  let need=80+n.level*30;
  while(n.xp>=need && n.level<12){ n.xp-=need; n.level++; const oldMax=n.maxHp; n.maxHp=Math.round((baseOf(n).hp||40)+n.level*(n.kind==='hero'?6:5)); n.hp=Math.min(n.maxHp,n.hp+(n.maxHp-oldMax)+8); need=80+n.level*30; }
  return n;
}
function canPromote(u){ return u.kind==='unit' && UNITS[u.id].evo && u.level>=5; }
function promote(u){ const id=UNITS[u.id].evo; const maxHp=Math.round(UNITS[id].hp + u.level*5); return {...u,id,promoted:true,maxHp,hp:maxHp,abilityRank:Math.max(1,u.abilityRank)}; }
function canTrain(c){ if(!c) return false; if(c.kind==='unit') return canPromote(c) || c.abilityRank<3; if(c.kind==='hero') return (!c.ultimateUnlocked && c.level>=4) || c.skillRanks.some(r=>r<3) || (c.ultimateUnlocked&&c.ultimateRank<2); }


const PORTRAIT_OVERRIDES = {
  footman:'human footman', captain_footman:'human footman captain', rifleman:'human rifleman', sharpshooter:'human rifleman elite', priest:'human priest', high_priest:'human priest elite', knight:'human knight', champion_knight:'human knight champion', gryphon:'human gryphon',
  grunt:'orc grunt', grunt_veteran:'orc grunt veteran', headhunter:'orc troll', berserker:'orc troll berserker', shaman:'orc shaman', storm_shaman:'orc shaman storm', raider:'orc raider', wolf_captain:'orc raider captain', tauren:'orc tauren',
  archer:'nightelf archer', sentinel_archer:'nightelf archer sentinel', huntress:'nightelf huntress', moon_huntress:'nightelf huntress moon', dryad:'nightelf dryad', elder_dryad:'nightelf dryad elder', druid_claw:'nightelf druid', elder_bear:'nightelf bear', chimaera:'nightelf chimaera',
  ghoul:'undead ghoul', frenzied_ghoul:'undead ghoul frenzy', crypt_fiend:'undead fiend', crypt_reaver:'undead fiend reaver', necromancer:'undead necromancer', dark_necromancer:'undead necromancer dark', abomination:'undead abomination', plague_abom:'undead abomination plague', frost_wyrm:'undead wyrm',
  paladin:'human paladin', archmage:'human archmage', mountain_king:'human mountainking', blood_mage:'human bloodmage', blademaster:'orc blademaster', far_seer:'orc farseer', tauren_chief:'orc taurenchief', shadow_hunter:'orc shadowhunter', demon_hunter:'nightelf demonhunter', keeper:'nightelf keeper', priestess:'nightelf priestess', warden:'nightelf warden', death_knight:'undead deathknight', dreadlord:'undead dreadlord', lich:'undead lich', crypt_lord:'undead cryptlord', naga:'neutral naga', panda:'neutral panda', beastmaster:'neutral beastmaster', dark_ranger:'neutral darkranger'
};
const NODE_GLYPHS = {battle:'sword', elite:'skull', tavern:'mug', altar:'altar', special:'star', training:'helm', item:'chest', fountain:'rune', boss:'crown', tower:'tower'};
const NODE_ASSETS = {
  // Route nodes must describe the action/site, not preview a specific unit.
  // Combat/recruit rewards still show concrete units inside choice/battle screens.
  battle:{src:'sprites/battle-crossed-swords.png', kind:'symbol', validatedAs:'Crossed swords battle marker'},
  elite:{src:'sprites/elite-crossed-swords-crown.png', kind:'symbol', validatedAs:'Crossed swords with crown elite battle marker'},
  tavern:{src:'hive-assets/nodes-readable/tavern.png', sourceSrc:'hive-assets/nodes/tavern.png', kind:'site', validatedAs:'HiveWorkshop Tavern / recruit site'},
  altar:{src:'hive-assets/nodes-readable/altar.png', sourceSrc:'hive-assets/nodes/altar.png', kind:'site', validatedAs:'HiveWorkshop Altar / hero site'},
  training:{src:'hive-assets/nodes-readable/training.png', sourceSrc:'hive-assets/nodes/training.png', kind:'site', validatedAs:'HiveWorkshop Training / upgrade site'},
  item:{src:'hive-assets/nodes-readable/item.png', sourceSrc:'hive-assets/nodes/item.png', kind:'site', validatedAs:'HiveWorkshop Medium Old Chest / loot site'},
  fountain:{src:'hive-assets/nodes-readable/fountain.png', sourceSrc:'hive-assets/nodes/fountain.png', kind:'site', validatedAs:'HiveWorkshop Fountain / heal site'},
  special:{src:'hive-assets/nodes-readable/special.png', sourceSrc:'hive-assets/nodes/special.png', kind:'site', validatedAs:'HiveWorkshop Mercenary Camp / special site'},
  tower:{src:'hive-assets/nodes-readable/tower.png', sourceSrc:'hive-assets/nodes/tower.png', kind:'site', validatedAs:'HiveWorkshop Tower / gauntlet site'}
};
const FINAL_BOSS_HERO_BY_RACE = {
  human:'paladin',       // Uther-style final champion
  orc:'far_seer',        // Thrall-style final shaman
  nightelf:'demon_hunter', // Illidan-style final demon hunter
  undead:'death_knight'  // Arthas-style final death knight
};
function nodeAssetFor(type, race){
  if(type==='boss'){
    const heroId=FINAL_BOSS_HERO_BY_RACE[race] || 'dark_ranger';
    const hero=HEROES[heroId];
    return {src:`wow-assets/character-faces/${heroId}.png`, kind:'hero', validatedAs:`Final boss: ${hero?.name || heroId}`};
  }
  return NODE_ASSETS[type] || NODE_ASSETS.battle;
}
const WOW_ROUTE_BACKDROPS = {
  human:'wow-map-backgrounds/route-clean-elwynn-forest.jpg',
  orc:'wow-map-backgrounds/route-clean-durotar.jpg',
  nightelf:'wow-map-backgrounds/route-clean-teldrassil.jpg',
  undead:'wow-map-backgrounds/route-clean-tirisfal-glades.jpg',
  cycle:['wow-map-backgrounds/route-clean-barrens.jpg','wow-map-backgrounds/route-clean-ashenvale.jpg','wow-map-backgrounds/route-clean-redridge-mountains.jpg','wow-map-backgrounds/route-clean-hillsbrad-foothills.jpg']
};
function routeBackdrop(game){
  if(!game) return WOW_ROUTE_BACKDROPS.cycle[0];
  if(game.level<=1 && WOW_ROUTE_BACKDROPS[game.race]) return WOW_ROUTE_BACKDROPS[game.race];
  return WOW_ROUTE_BACKDROPS.cycle[(game.level-2+WOW_ROUTE_BACKDROPS.cycle.length)%WOW_ROUTE_BACKDROPS.cycle.length];
}
function artKey(id){ return (PORTRAIT_OVERRIDES[id]||id).replace(/_/g,' '); }
function publicAsset(path){ return `${import.meta.env.BASE_URL || '/'}${path}`.replace(/\/+/g,'/'); }
const FIREBASE_HOSTING_ASSET_ROOT = 'https://altarbound-660da.web.app/';
function hostedAsset(path){ return publicAsset(path); }
const CHARACTER_ASSET_OVERRIDES = {
  grunt:'warcraft3-assets/portraits/grunt.png'
};
const MODEL_ASSET_OVERRIDES = {
  grunt:'generated-assets/units/orc-grunt-pro-pokelike-facing-right.webp',
  grunt_veteran:'generated-assets/units/orc-grunt-pro-pokelike-facing-right.webp',
  archer:'generated-assets/units/elf-archer-facing-right-3d-model.webp',
  sentinel_archer:'generated-assets/units/elf-archer-facing-right-3d-model.webp',
  sharpshooter:'generated-assets/units/elf-archer-facing-right-3d-model.webp',
  huntress:'generated-assets/units/elf-archer-facing-right-3d-model.webp'
};
function characterAsset(id){ return hostedAsset(CHARACTER_ASSET_OVERRIDES[id] || `wow-assets/character-faces/${id}.png`); }
function modelAsset(id){
  if(MODEL_ASSET_OVERRIDES[id]) return hostedAsset(MODEL_ASSET_OVERRIDES[id]);
  const race=UNITS[id]?.race;
  const raceFallback={
    human:'generated-assets/units/human-footman-facing-right-3d-model.webp',
    orc:'generated-assets/units/orc-grunt-pro-pokelike-facing-right.webp',
    nightelf:'generated-assets/units/elf-archer-facing-right-3d-model.webp',
    undead:'generated-assets/units/undead-ghoul-facing-right-3d-model.webp'
  };
  return hostedAsset(raceFallback[race] || `wow-assets/characters/${id}.png`);
}
function Portrait({id, large=false, tiny=false, title}){ const race=(UNITS[id]?.race||HEROES[id]?.race||'neutral'); const label=title||UNITS[id]?.name||HEROES[id]?.name||id; const sources=[characterAsset(id)]; const [srcIndex,setSrcIndex]=useState(0); useEffect(()=>setSrcIndex(0),[id]); const missing=srcIndex>=sources.length; return <span className={`wcPortrait ${race} ${large?'large':''} ${tiny?'tiny':''}`} title={label}>{!missing&&<img className="officialPortrait officialCharacterIcon" src={sources[srcIndex]} alt={label} onError={()=>setSrcIndex(i=>i+1)}/>} {missing&&<em>{initials(label)}</em>}</span>; }
function ModelSprite({id, side='ally', small=false, title}){ const label=title||UNITS[id]?.name||HEROES[id]?.name||id; const sources=[modelAsset(id),characterAsset(id)]; const [srcIndex,setSrcIndex]=useState(0); useEffect(()=>setSrcIndex(0),[id]); const missing=srcIndex>=sources.length; return <span className={`modelSprite ${side} ${small?'small':''} ${missing?'missingModel':''}`} title={label}>{!missing&&<img className="officialCharacterIcon unitModelImage" src={sources[srcIndex]} alt={label} onError={()=>setSrcIndex(i=>i+1)}/>} {missing&&<Portrait id={id} tiny title={label}/>}</span>; }
function itemSlug(name=''){ return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function ItemIcon({item}){
  const src=item?.asset || (item?.name ? `wow-assets/items/${itemSlug(item.name)}.png` : '');
  return <span className={`wcItem ${item?.name?'':'empty'}`} title={item?.name||'Empty'} data-source={item?.wowIcon||''}>{item?.name&&<img className="spriteIcon officialItemIcon" src={hostedAsset(src)} alt={item.name} onError={e=>{e.currentTarget.style.display='none'}}/>}</span>;
}
function NodeGlyph({type, race}){
  const asset=nodeAssetFor(type, race);
  return <img
    className={`nodeGlyph nodeWar3Asset nodeFactionAsset ${type} ${race||'neutral'} ${asset.kind==='unit'||asset.kind==='hero'?'unitNodeAsset':'siteNodeAsset'}`}
    src={hostedAsset(asset.src)}
    alt={asset.validatedAs || nodeLabel[type] || type}
    title={asset.validatedAs || nodeLabel[type] || type}
    data-race={race || 'neutral'}
    data-asset-kind={asset.kind}
  />;
}
function mapPoint(n,len){
  const lane = n.lane ?? n.row;
  const routeTop = 14.5;
  const routeBottom = 77;
  const y = routeBottom - (n.step * ((routeBottom-routeTop)/Math.max(1,len-1)));
  const x = 50 + ((lane-1.5) * 19);
  return {x:clamp(x,15,85), y:clamp(y,14,90)};
} 
function lanesForStep(step,len){
  if(step===0) return [1,2];
  if(step===len-1) return [1.5];
  if(step===1) return [0.5,1.5,2.5];
  if(step===2) return [0,1,2,3];
  if(step===3) return [0.5,1.5,2.5];
  return [1,2];
}
function connected(a,b){ return b.step===a.step+1 && Math.abs((a.lane??a.row)-(b.lane??b.row))<=0.75; }
function allMapEdges(nodes,len){
  const edges=[];
  for(let step=0; step<len-1; step++){
    const a=nodes.filter(n=>n.step===step), b=nodes.filter(n=>n.step===step+1);
    a.forEach(n1=>b.forEach(n2=>{ if(connected(n1,n2)) edges.push([n1,n2]); }));
  }
  return edges;
}
function getSelectedNode(game, step=game.nodeIndex-1){
  const id=game.path?.[step];
  return game.map.flat().find(n=>n.id===id);
}
function activeMapNodes(game){
  const nodes=game.map.flat();
  const stepNodes=nodes.filter(n=>n.step===game.nodeIndex);
  if(game.nodeIndex===0) return stepNodes;
  const prev=getSelectedNode(game, game.nodeIndex-1);
  if(!prev) return [];
  return stepNodes.filter(n=>connected(prev,n));
}
function initials(name='?'){ return name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }

const nodeLabel = {battle:'Battle', elite:'Elite Battle', tavern:'Tavern', altar:'Altar of Heroes', special:'Tavern of Legends', training:'Training Grounds', item:'Item Chest', fountain:'Fountain', boss:'Boss', tower:'Battle Tower'};
const nodeIcon = {battle:'⚔️', elite:'💀', tavern:'🍺', altar:'⛩️', special:'🌌', training:'🏋️', item:'🎁', fountain:'💧', boss:'👑', tower:'🗼'};

function buildMap(level=1){
  const len = 6;
  const columns=[];
  const pools={
    early:['battle','tavern','item'],
    mid: level>4 ? ['battle','elite','tavern','training','item','altar','fountain','special'] : ['battle','elite','tavern','training','item','altar','fountain'],
    late:['elite','training','item','altar','fountain']
  };
  for(let step=0; step<len; step++){
    const lanes=lanesForStep(step,len);
    columns.push(lanes.map((lane,idx)=>{
      let type='battle';
      if(step===0) type=idx===0?'battle':'tavern';
      else if(step===len-1) type=level%5===0?'tower':'boss';
      else if(step===1) type=rand(pools.early);
      else if(step===len-2) type=rand(pools.late);
      else type=rand(pools.mid);
      if(level<3 && type==='special') type='altar';
      return {id:uid(), type, row:idx, lane, step, done:false};
    }));
  }
  return columns;
}

function App(){
  const [screen,setScreen]=useState('menu');
  const [game,setGame]=useState(null);
  const [choice,setChoice]=useState(null);
  const [battle,setBattle]=useState(null);
  const [toast,setToast]=useState(null);
  const [fastMode,setFastModeState]=useState(()=>localStorage.getItem(FAST_MODE_KEY)==='1');
  const setFastMode=(value)=>{ const enabled=!!value; setFastModeState(enabled); localStorage.setItem(FAST_MODE_KEY, enabled?'1':'0'); };

  function startRace(race){
    const starter = makeUnit(RACES[race].starter, 1);
    const g={race, level:1, nodeIndex:0, map:buildMap(1), path:[], units:[starter], heroes:[], bag:[], badges:[], defeated:0, hall:JSON.parse(localStorage.getItem('altarbound_hof')||'[]')};
    setGame(g); setScreen('map');
  }
  function nextLevel(winTower=false){
    setGame(g=>{
      const ng={...g, level:g.level+1, nodeIndex:0, map:buildMap(g.level+1), path:[], units:g.units.map(healFull), heroes:g.heroes.map(healFull), badges: winTower?[...g.badges,`Tower ${g.level}`]:[...g.badges,`Lv ${g.level}`]};
      return ng;
    }); setScreen('map'); setToast('Your army was fully restored. Next level begins!');
  }
  function finishNode(){
    setGame(g=> ({...g, nodeIndex:g.nodeIndex+1})); setScreen('map');
  }
  function openNode(nodeOrType){
    const node = typeof nodeOrType==='string' ? {type:nodeOrType} : nodeOrType;
    const type=node.type;
    if(node.id){
      const allowed=activeMapNodes(game).some(n=>n.id===node.id);
      if(!allowed) return;
      setGame(g=>({...g, path:[...(g.path||[]), node.id]}));
    }
    if(type==='battle'||type==='elite'||type==='boss'||type==='tower') startBattle(type);
    else if(type==='tavern') openTavern();
    else if(type==='altar'||type==='special') openAltar(type==='special');
    else if(type==='training') { setChoice({type:'training'}); setScreen('choice'); }
    else if(type==='item') openItem();
    else if(type==='fountain') { setGame(g=>({...g, units:g.units.map(healFull), heroes:g.heroes.map(healFull)})); setToast('Fountain of Life: healed, resurrected and cleansed all units.'); finishNode(); }
  }
  function openTavern(){
    const tier=tierForLevel(game.level); const raceUnits=UNIT_BY_RACE[game.race].filter(id=>UNITS[id].tier<=tier);
    const offRace=Object.keys(UNITS).filter(id=>!UNITS[id].evolved && UNITS[id].race!==game.race && UNITS[id].tier<=Math.max(1,tier-1));
    const options=sample([...raceUnits,...raceUnits,...offRace],3).map(id=>makeUnit(id, scaledLevel(game.level,0)));
    // chance to directly offer evolved/captain forms at advanced levels, never above player level
    if(game.level>=6 && Math.random()<0.55){ const base=rand(raceUnits.filter(id=>UNITS[id].evo)||raceUnits); options[0]=makeUnit(UNITS[base].evo||base, Math.max(5, scaledLevel(game.level,-1))); }
    setChoice({type:'tavern', title:'🍺 Tavern', subtitle:'Choose one unit. Later paths offer stronger recruits.', options}); setScreen('choice');
  }
  function openAltar(special=false){
    const pool=special?NEUTRAL_HEROES:HERO_BY_RACE[game.race];
    const level=Math.max(1, scaledLevel(game.level, game.level>5?-1:0));
    const options=sample(pool,3).map(id=>makeHero(id, level));
    if(game.level>=7 && Math.random()<0.5) options[0].level=Math.max(4, game.level-1), options[0]=makeHero(options[0].id, options[0].level);
    setChoice({type:'altar', special, title:special?'🌌 Tavern of Legends':'⛩️ Altar of Heroes', subtitle:special?'Unique neutral heroes for any race. Recruit or replace.':'Choose a racial hero. Recruit or replace like Pokelike.', options}); setScreen('choice');
  }
  function openItem(){ const options=sample(ITEMS,3); setChoice({type:'item', title:'🎁 Item Chest', subtitle:'Choose one item and equip it to any unit or hero.', options}); setScreen('choice'); }
  function takeUnit(unit){
    setGame(g=>{
      const owned=g.units.find(u=>u.id===unit.id);
      if(owned) return {...g, units:g.units.map(u=>u.uid===owned.uid?addXp(u,120+game.level*25):u)};
      if(g.units.length<6) return {...g, units:[...g.units, unit]};
      return {...g, pendingReplace:{kind:'unit', value:unit}};
    });
    setChoice(null); setScreen(game.units.length>=6 && !game.units.find(u=>u.id===unit.id)?'replace':'map'); if(!(game.units.length>=6 && !game.units.find(u=>u.id===unit.id))) finishNode();
  }
  function takeHero(hero){
    setGame(g=> g.heroes.length<2 ? {...g, heroes:[...g.heroes, hero]} : {...g, pendingReplace:{kind:'hero', value:hero}});
    setChoice(null); setScreen(game.heroes.length>=2?'replace':'map'); if(game.heroes.length<2) finishNode();
  }
  function replaceEntity(oldUid){
    setGame(g=>{
      const p=g.pendingReplace;
      if(!p) return g;
      if(p.kind==='unit') return {...g, units:g.units.map(u=>u.uid===oldUid?p.value:u), pendingReplace:null};
      return {...g, heroes:g.heroes.map(h=>h.uid===oldUid?p.value:h), pendingReplace:null};
    }); finishNode();
  }
  function equipItem(item, targetUid, slot='item'){
    setGame(g=>({...g, units:g.units.map(u=>u.uid===targetUid?{...u,item}:u), heroes:g.heroes.map(h=>h.uid===targetUid?{...h,[slot]:item}:h)}));
    finishNode();
  }
  function train(uid){
    setGame(g=>({ ...g, units:g.units.map(u=>u.uid===uid ? (canPromote(u)?promote(u):{...u, abilityRank:Math.min(3,u.abilityRank+1)}) : u), heroes:g.heroes.map(h=>{
      if(h.uid!==uid) return h;
      if(!h.ultimateUnlocked && h.level>=4) return {...h, ultimateUnlocked:true, ultimateRank:1, selectedSkill:3};
      const sr=[...h.skillRanks]; const idx=h.selectedSkill<3?h.selectedSkill:sr.findIndex(r=>r<3); if(idx>=0&&idx<3&&sr[idx]<3) sr[idx]++; else if(h.ultimateUnlocked&&h.ultimateRank<2) return {...h, ultimateRank:h.ultimateRank+1};
      return {...h, skillRanks:sr};
    }) }));
    setToast('Training complete.'); finishNode();
  }
  function reorder(kind, from, to){
    setGame(g=>{ const arr=[...(kind==='unit'?g.units:g.heroes)]; const [m]=arr.splice(from,1); arr.splice(to,0,m); return {...g, [kind==='unit'?'units':'heroes']:arr}; });
  }

  function startBattle(type){
    const enemy=makeEnemyTeam(type, game);
    const towerLeft = type==='tower' ? 5 : 0;
    setBattle({type, towerLeft, ally:[...game.units.map(x=>({...x,side:'ally'})),...game.heroes.map(x=>({...x,side:'ally'}))], enemy, log:[`${nodeLabel[type]} begins!`], running:true, won:false, lost:false, tick:0}); setScreen('battle');
  }
  function applyBattleResult(win, b){
    if(!win){ setToast('Defeat. The run restarts.'); setScreen('menu'); setGame(null); setBattle(null); return; }
    if(b.type==='tower' && b.towerLeft>1){
      const nextEnemy = makeEnemyTeam('tower', game);
      const carried = b.ally.map(x=>({...x, speed:0, power:x.kind==='hero'?x.power:0}));
      setBattle({type:'tower', towerLeft:b.towerLeft-1, ally:carried, enemy:nextEnemy, log:[`Tower team defeated. ${b.towerLeft-1} teams remain!`], running:true, won:false, lost:false, tick:0});
      return;
    }
    const xp=b.type==='elite'?150:b.type==='boss'?220:b.type==='tower'?320:100;
    setGame(g=>({...g, units:g.units.map(u=>healFull(addXp(u,xp))), heroes:g.heroes.map(h=>healFull(addXp(h,xp))), defeated:g.defeated+1}));
    if(b.type==='boss'){ setBattle(null); nextLevel(false); }
    else if(b.type==='tower'){ setBattle(null); nextLevel(true); }
    else { setBattle(null); setToast('Victory! Your army gains XP and moves on.'); finishNode(); }
  }

  if(screen==='menu') return <Menu screenKey="menu" onStart={()=>setScreen('race')} onSettings={()=>setScreen('settings')} fastMode={fastMode} hall={JSON.parse(localStorage.getItem('altarbound_hof')||'[]')} />;
  if(screen==='settings') return <SettingsView screenKey="settings" fastMode={fastMode} setFastMode={setFastMode} onBack={()=>setScreen(game?'map':'menu')} />;
  if(screen==='race') return <RaceSelect screenKey="race" onPick={startRace}/>;
  if(!game) return null;
  if(screen==='map') return <Shell screenKey={`map-${game.level}-${game.nodeIndex}`} game={game} reorder={reorder} onSettings={()=>setScreen('settings')} fastMode={fastMode}><MapView game={game} openNode={openNode}/>{toast&&<Toast text={toast} onClose={()=>setToast(null)}/>}</Shell>;
  if(screen==='choice'||screen==='reward') return <Shell screenKey={`choice-${choice?.type||'reward'}-${game.level}-${game.nodeIndex}`} game={game} reorder={reorder} onSettings={()=>setScreen('settings')} fastMode={fastMode}><ChoiceView choice={choice} game={game} onUnit={takeUnit} onHero={takeHero} onItem={openItem=>{}} equipItem={equipItem} train={train} finish={finishNode} /></Shell>;
  if(screen==='replace') return <Shell screenKey={`replace-${game.level}-${game.nodeIndex}`} game={game} reorder={reorder} onSettings={()=>setScreen('settings')} fastMode={fastMode}><ReplaceView game={game} replaceEntity={replaceEntity} cancel={()=>{setGame(g=>({...g,pendingReplace:null})); finishNode();}} /></Shell>;
  if(screen==='battle') return <BattleView battle={battle} setBattle={setBattle} onEnd={applyBattleResult} fastMode={fastMode}/>;
}

function Menu({screenKey,onStart,onSettings,fastMode,hall}){ return <div key={screenKey} className="page menu pokelikeMenu appScreenTransition"><div className="aaaBackdrop"><span/><span/><span/></div><div className="menuHero"><div className="logo">ALTARBOUND</div><div className="subtitle">Warcraft Roguelike</div><div className="versionLine">v0.3.0 · Firebase build · patch notes</div>{fastMode&&<div className="fastBadge">⚡ FAST MODE ON</div>}<div className="eraSelect"><span>Realm:</span><button className="selected">Azeroth I</button><button>Outlands II</button></div><div className="raceButtons modeButtons"><button className="primaryMode" onClick={onStart}>NORMAL MODE</button><button className="dangerMode">HARDCORE</button><button className="disabled lockedMode">🔒 BATTLE TOWER</button></div><div className="menuGrid"><button>📖 Codex</button><button>🏆 Achievements</button><button>🏛 Hall of Fame ({hall.length})</button><button>📋 Patch Notes</button><button onClick={onSettings}>⚙️ Settings</button></div><p className="fine">Choose a race → follow the node path → recruit in taverns/altars → train → auto-battle.</p></div></div> }
function SettingsView({screenKey,fastMode,setFastMode,onBack}){ return <div key={screenKey} className="page settingsPage appScreenTransition"><div className="aaaBackdrop"><span/><span/><span/></div><h1>Settings</h1><div className="settingsPanel"><div><h2>⚡ Fast Mode</h2><p>Speeds up automatic battles and end-of-fight transitions. This setting is saved permanently on this device.</p></div><button className={fastMode?'toggle on':'toggle'} onClick={()=>setFastMode(!fastMode)}>{fastMode?'FAST ON':'FAST OFF'}</button></div><button onClick={onBack}>Back</button></div> }
function RaceSelect({screenKey,onPick}){ return <div key={screenKey} className="page starterPage appScreenTransition"><div className="aaaBackdrop"><span/><span/><span/></div><h1>Choose Your Race!</h1><p className="choiceIntro">Your first unit defines the opening route. More units and heroes appear on Tavern and Altar nodes.</p><div className="cards starterCards">{Object.entries(RACES).map(([id,r])=>{ const u=makeUnit(r.starter,1), s=stats(u), b=UNITS[r.starter]; return <button className="pickCard starterCard" key={id} onClick={()=>onPick(id)}><ModelSprite id={r.starter} small title={b.name}/><h2 style={{color:r.color}}>{r.name}</h2><b>{b.name} · Lv. 1</b><div className="tags"><span>{b.role}</span><span>{b.tags?.[0]||'Starter'}</span></div><div className="statgrid"><span>ATK {s.atk}</span><span>SPE {s.spd}</span><span>HP {u.maxHp}</span><span>ARM {s.armor}</span></div><p>{r.style}</p></button> })}</div></div> }
function Shell({screenKey,game, children, reorder, onSettings, fastMode}){ const equipped=[...game.units.flatMap(u=>[u.item]),...game.heroes.flatMap(h=>[h.item,h.item2])].filter(Boolean); const badgeSlots=Array.from({length:10}); return <div key={screenKey} className="game wcFrame appScreenTransition"><div className="aaaBackdrop shellFX"><span/><span/><span/></div><aside className="sidebar leftPanel"><div className="topBtns"><button>Codex</button><button>Achievements</button><button onClick={onSettings}>Settings</button><button onClick={()=>location.reload()}>↻</button></div>{fastMode&&<div className="fastBadge small">⚡ FAST</div>}<h3>TEAM</h3><div className="miniList">{game.units.map((u,i)=><Mini key={u.uid} c={u} onUp={()=>i>0&&reorder('unit',i,i-1)} onDown={()=>i<game.units.length-1&&reorder('unit',i,i+1)}/>)}</div><div className="panelHelp">Use ↑ ↓ to set battle order. First living unit tanks first.</div><h3>HEROES</h3><div className="miniList heroesMini">{game.heroes.length?game.heroes.map((h,i)=><Mini key={h.uid} c={h} hero onUp={()=>i>0&&reorder('hero',i,i-1)} onDown={()=>i<game.heroes.length-1&&reorder('hero',i,i+1)}/>):<p className="muted panelMuted">Find an Altar.</p>}</div><h3>BADGES</h3><div className="badges badgeSlots">{badgeSlots.map((_,i)=><span key={i} className={game.badges[i]?'earned':''}>{game.badges[i]||''}</span>)}</div></aside><main className="main boardFrame">{children}</main><aside className="rightPanel"><h3>ITEMS</h3><div className="itemRack">{equipped.length?equipped.slice(0,8).map((it,i)=><ItemIcon key={it.name+i} item={it}/>):<p>Bag empty</p>}</div><h3>PATH</h3><p className="runStat">Level {game.level}</p><p className="runStat">Wins {game.defeated}</p><p className="runStat">Node {game.nodeIndex+1}</p></aside></div> }
function Mini({c,onUp,onDown}){ const b=baseOf(c); return <div className={`mini ${c.hp<=0?'dead':''}`}><Portrait id={c.id} tiny title={b.name}/><div><b>{b.name}</b><small>Lv{c.level} {c.kind==='hero'?'Hero':b.role}</small><div className="hp"><i style={{width:`${100*c.hp/c.maxHp}%`}}/></div></div><div className="order"><button onClick={onUp}>↑</button><button onClick={onDown}>↓</button></div></div> }
function MapView({game, openNode}){
  const len=game.map.length||1;
  const nodes=game.map.flat();
  const edges=allMapEdges(nodes,len);
  const activeNodes=activeMapNodes(game);
  const pathIds=new Set(game.path||[]);
  return <div className="mapScreen pokelikeExact">
    <div className="mapHeader"><h1>Level {game.level} Path</h1><p>Real route: choose one reachable node. Only connected next nodes unlock.</p></div>
    <div className="routeLegend">{activeNodes.map(n=><span key={n.id}>{nodeIcon[n.type]} {nodeLabel[n.type]}</span>)}</div>
    <div className="pokelikeBoard wowRouteBoard" style={{'--route-map':`url(${hostedAsset(routeBackdrop(game))})`}}>
      <div className="boardTopRoom"><span className="roomPic"/><span className="roomDoor"/><span className="roomMachine"/><span className="roomVial"/></div>
      <div className="waterLane left"/><div className="waterLane right"/>
      <div className="coral coralA"/><div className="coral coralB"/><div className="dockGap left"/><div className="dockGap right"/>
      <svg className="mapEdges" viewBox="0 0 100 100" preserveAspectRatio="none">{edges.map(([a,b],idx)=>{ const p1=mapPoint(a,len), p2=mapPoint(b,len); const chosen=pathIds.has(a.id)&&pathIds.has(b.id); const reachable=activeNodes.some(n=>n.id===b.id); return <line key={idx} className={`${chosen?'chosen':''} ${reachable?'reachable':''}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;})}</svg>
      {nodes.map(n=>{ const p=mapPoint(n,len); const active=activeNodes.some(a=>a.id===n.id); const chosen=pathIds.has(n.id); return <button key={n.id} disabled={!active} style={{left:`${p.x}%`,top:`${p.y}%`}} className={`node ${n.type} ${chosen||n.step<game.nodeIndex?'done':''} ${active?'active':''}`} data-step={n.step} data-lane={n.lane} onClick={()=>openNode(n)} title={nodeLabel[n.type]}><span className="nodeDisc"><NodeGlyph type={n.type} race={game.race}/></span><small>{active?'NEXT · ':''}{nodeLabel[n.type]}</small></button>})}
      <div className="mapPartySprites">{game.units.slice(0,2).map((u,i)=><ModelSprite key={u.uid} id={u.id} small title={baseOf(u).name} side={i?'enemy':'ally'}/>)}</div>
      <div className="startMarker">?</div>
    </div>
  </div>
}
function ChoiceView({choice,game,onUnit,onHero,equipItem,train,finish}){
  if(choice.type==='training') return <div className="choicePanel"><h1>Training Grounds</h1><p>Select one roster member. Entries with no upgrade are disabled, like Pokelike upgrade nodes.</p><div className="cards compact">{[...game.units,...game.heroes].map(c=><button key={c.uid} disabled={!canTrain(c)} className="pickCard" onClick={()=>train(c.uid)}><ModelSprite id={c.id} small title={baseOf(c).name}/><h2>{fullName(c)} Lv{c.level}</h2><p>{trainingText(c)}</p></button>)}</div><button onClick={finish}>Skip</button></div>;
  if(choice.type==='item') return <div className="choicePanel"><h1>{choice.title}</h1><p>{choice.subtitle}</p><div className="cards compact">{choice.options.map((it,i)=><div className="pickCard itemChoice" key={it.name}><ItemIcon item={it}/><h2>{it.name}</h2><p>{it.desc}</p><div className="equipGrid">{[...game.units,...game.heroes].map(c=><button key={c.uid} onClick={()=>equipItem(it,c.uid,'item')}>{baseOf(c).name}</button>)}{game.heroes.map(h=><button key={h.uid+'2'} onClick={()=>equipItem(it,h.uid,'item2')}>{baseOf(h).name} slot 2</button>)}</div></div>)}</div></div>;
  const opts=choice.options||[]; return <div className="choicePanel"><h1>{choice.title}</h1><p>{choice.subtitle}</p><div className="choiceHint">Choose one. Recruiting duplicates converts into XP. Battle victories no longer draft rewards.</div><div className="cards">{opts.map(o=>o.kind==='hero'?<HeroCard key={o.uid} h={o} onClick={()=>onHero(o)}/>:<UnitCard key={o.uid} u={o} onClick={()=>onUnit(o)} owned={game.units.some(x=>x.id===o.id)}/>)}</div><button onClick={finish}>Skip</button></div>
}
function trainingText(c){ if(c.kind==='unit'){ if(canPromote(c)) return `Promote to ${UNITS[UNITS[c.id].evo].name}`; if(c.abilityRank<1) return `Learn ${UNITS[c.id].ability}`; if(c.abilityRank<3) return `Improve ${UNITS[c.id].ability} ${c.abilityRank+1}`; return 'No upgrades available'; } if(!c.ultimateUnlocked && c.level>=4) return `Unlock ultimate: ${HEROES[c.id].ultimate}`; const sk=HEROES[c.id].skills[c.selectedSkill] || HEROES[c.id].skills[0]; if(c.selectedSkill<3&&c.skillRanks[c.selectedSkill]<3) return `Improve selected: ${sk}`; if(c.ultimateUnlocked&&c.ultimateRank<2) return `Improve ultimate: ${HEROES[c.id].ultimate}`; return 'No upgrades available'; }
function UnitCard({u,onClick,owned}){ const b=UNITS[u.id], s=stats(u); return <button className="pickCard" onClick={onClick}><ModelSprite id={u.id} small title={b.name}/><h2>{b.name}</h2><b>Lv. {u.level}</b><div className="tags"><span>{RACES[b.race]?.name||b.race}</span><span>{b.role}</span>{b.evolved&&<span>EVOLVED</span>}</div><div className="statgrid"><span>ATK {s.atk}</span><span>SPE {s.spd}</span><span>HP {u.maxHp}</span><span>ARM {s.armor}</span></div><p>{owned?'Duplicate: grants XP':b.ability}</p></button> }
function HeroCard({h,onClick}){ const b=HEROES[h.id], s=stats(h); return <button className="pickCard heroCard" onClick={onClick}><ModelSprite id={h.id} small title={b.name}/><h2>{b.name}</h2><b>Lv. {h.level}</b><div className="tags"><span>{b.race}</span><span>Hero</span></div><div className="statgrid"><span>ATK {s.atk}</span><span>SPE {s.spd}</span><span>HP {h.maxHp}</span><span>ARM {s.armor}</span></div><p>{b.skills.join(' · ')}</p><p>Ultimate: {b.ultimate}</p></button> }
function ReplaceView({game,replaceEntity,cancel}){ const p=game.pendingReplace; const arr=p.kind==='unit'?game.units:game.heroes; return <div><h1>Roster full</h1><p>Replace one {p.kind} with <b>{baseOf(p.value).name}</b>, or skip.</p><div className="cards compact">{arr.map(c=><button className="pickCard" key={c.uid} onClick={()=>replaceEntity(c.uid)}><ModelSprite id={c.id} small title={baseOf(c).name}/><h2>{baseOf(c).name}</h2><p>Lv{c.level} - replace this</p></button>)}</div><button onClick={cancel}>Skip recruit</button></div> }
function Toast({text,onClose}){ useEffect(()=>{const t=setTimeout(onClose,2600); return()=>clearTimeout(t)},[]); return <div className="toast" onClick={onClose}>{text}</div> }

function makeEnemyTeam(type, game){
  const count= type==='boss'?Math.min(7,4+Math.floor(game.level/2)):type==='tower'?Math.min(7,4+Math.floor(game.level/2)):type==='elite'?Math.min(6,3+Math.floor(game.level/3)):Math.min(5,1+Math.floor(game.level/2));
  const enemyRace=rand(Object.keys(RACES)); const tier=tierForLevel(game.level);
  const basePool=UNIT_BY_RACE[enemyRace].filter(id=>UNITS[id].tier<=tier);
  const units=sample(basePool, Math.min(count,4)).map(id=>makeUnit(id, scaledLevel(game.level, type==='boss'?0:-1)));
  while(units.length<count-(type==='battle'?0:1)){ units.push(makeUnit(rand(basePool), scaledLevel(game.level,-1))); }
  if(type==='boss'||type==='tower'||type==='elite') units.push(makeHero(rand(HERO_BY_RACE[enemyRace]), scaledLevel(game.level,type==='boss'?0:-1)));
  if(type==='boss'||type==='tower') units.push(makeHero(rand(HERO_BY_RACE[enemyRace]), scaledLevel(game.level,-1)));
  return units.map(x=>{ const e={...x, side:'enemy'}; if(type==='battle'){ e.maxHp=Math.max(10,Math.round(e.maxHp*0.62)); e.hp=e.maxHp; } return e; });
}
function makeRewardOptions(game){
  const tier=tierForLevel(game.level); const units=UNIT_BY_RACE[game.race].filter(id=>UNITS[id].tier<=tier); return [makeUnit(rand(units),scaledLevel(game.level,-1)), makeUnit(rand(units),scaledLevel(game.level,-1)), makeUnit(rand(units),scaledLevel(game.level,-1))];
}

function BattleView({battle,setBattle,onEnd,fastMode}){
  useEffect(()=>{ if(!battle?.running) return; const t=setInterval(()=>setBattle(b=>stepBattle(b)),fastMode?45:160); return()=>clearInterval(t); },[battle?.running,fastMode]);
  useEffect(()=>{ if(battle?.won||battle?.lost){ const t=setTimeout(()=>onEnd(battle.won,battle),fastMode?260:800); return()=>clearTimeout(t); }},[battle?.won,battle?.lost,fastMode]);
  const allies=battle.ally, enemies=battle.enemy;
  return <div className={`battlePage pokelikeBattle appScreenTransition battleType-${battle.type||'battle'} ${battle.won?'battleWon':battle.lost?'battleLost':''} ${battle.fx?`hasCombatFx fx-${battle.fx.kind}`:''}`}><div className="aaaBackdrop battleFX"><span/><span/><span/></div><h1>{nodeLabel[battle.type]}</h1><div className="battleHeader"><button onClick={()=>setBattle(b=>({...b,running:!b.running}))}>{battle.running?'PAUSE':'RESUME'}</button>{fastMode&&<span className="fastBadge small">⚡ FAST MODE</span>}</div><div className="battleGrid"><BattleSide title="YOUR TEAM" units={allies} fx={battle.fx}/><BattleSide title="ENEMY" units={enemies} enemy fx={battle.fx}/><CombatFxOverlay fx={battle.fx}/></div><div className="log">{battle.log.slice(-8).map((l,i)=><p key={i}>{l}</p>)}</div></div>
}
function BattleSide({title,units,enemy=false,fx}){ return <section className={`battlePanel ${enemy?'enemySide':'allySide'}`}><h2>{title}</h2><div className="battleRoster">{units.map((c,i)=><BattleCard key={c.uid} c={c} enemy={enemy} active={c.hp>0 && i===units.findIndex(x=>x.hp>0)} fx={fx}/>)}</div></section>; }
function BattleCard({c,enemy,active,fx}){ const b=baseOf(c); const hp=Math.max(0,100*c.hp/c.maxHp); const s=stats(c); const ready=c.speed>=80&&c.hp>0; const hurt=hp>0&&hp<36; const isActor=fx?.actorUid===c.uid, isTarget=fx?.targetUid===c.uid || fx?.targetUids?.includes(c.uid); const actionKind=fx?.kind||'slash'; return <div className={`battleCard modelBattleCard ${enemy?'enemy':''} ${active?'activeFighter':''} ${ready?'readyFighter':''} ${hurt?'hurtFighter':''} ${isActor?'fxActor':''} ${isTarget?`fxTarget fxTarget-${actionKind}`:''} ${c.hp<=0?'dead':''}`} data-fighter-uid={c.uid}><div className="fighterName"><b>{b.name} Lv{c.level}</b><span>{c.hp}/{c.maxHp}</span></div><div className="hp"><i style={{width:`${hp}%`}}/></div><div className="arenaStage"><ModelSprite id={c.id} side={enemy?'enemy':'ally'} title={b.name}/>{isActor&&<span key={`${fx.id}-action`} className={`combatAction action-${actionKind}`} aria-hidden="true"><i/><i/><i/></span>}{isTarget&&<span key={`${fx.id}-impact`} className={`combatImpact impact-${actionKind}`} aria-hidden="true"><i/><i/><i/></span>}<span className="spriteShadow"/></div><div className="speed"><i style={{width:`${Math.min(100,c.speed)}%`}}/></div>{c.kind==='hero'&&<div className="power"><i style={{width:`${Math.min(100,100*c.power/powerMax(c))}%`}}/><small>{selectedSkillName(c)}</small></div>}<small>ATK {s.atk} ARM {s.armor} SPE {s.spd} {c.item&&` · ${c.item.name}`}</small></div> }
function CombatFxOverlay({fx}){
  const ref=useRef(null);
  const [style,setStyle]=useState(null);
  useLayoutEffect(()=>{
    if(!fx||!ref.current) return;
    const grid=ref.current.closest('.battleGrid');
    const actor=grid?.querySelector(`[data-fighter-uid="${fx.actorUid}"] .arenaStage`);
    const target=grid?.querySelector(`[data-fighter-uid="${fx.targetUid||fx.targetUids?.[0]}"] .arenaStage`);
    if(!grid||!actor||!target) return;
    const g=grid.getBoundingClientRect(), a=actor.getBoundingClientRect(), t=target.getBoundingClientRect();
    const fromEnemy=(fx.fromSide||'ally')==='enemy';
    const startX=(fromEnemy?a.left+18:a.right-18)-g.left;
    const startY=(a.top+a.height*.52)-g.top;
    const endX=(fromEnemy?t.right-18:t.left+18)-g.left;
    const endY=(t.top+t.height*.5)-g.top;
    setStyle({'--start-x':`${startX}px`,'--start-y':`${startY}px`,'--end-x':`${endX}px`,'--end-y':`${endY}px`,'--travel-dir':fromEnemy?-1:1});
  },[fx?.id,fx?.actorUid,fx?.targetUid]);
  if(!fx) return null;
  return <div ref={ref} key={fx.id} style={style||undefined} className={`combatFxOverlay fx-${fx.kind} fx-from-${fx.fromSide||'ally'} fx-to-${fx.toSide||'enemy'} ${fx.area?'fx-area':''} ${style?'fxMeasured':''}`} aria-hidden="true"><span className="fxPath"><i/><i/><i/></span><span className="fxProjectile"><i/><i/><i/></span></div>;
}
function powerMax(h){ return h.selectedSkill===3?160:100; }
function selectedSkillName(h){ const b=HEROES[h.id]; return h.selectedSkill===3?b.ultimate:b.skills[h.selectedSkill]; }
function stepBattle(b){
  if(!b||b.won||b.lost) return b;
  let ally=b.ally.map(x=>({...x})), enemy=b.enemy.map(x=>({...x})); let log=[...b.log];
  const aliveA=ally.filter(x=>x.hp>0), aliveE=enemy.filter(x=>x.hp>0);
  if(!aliveE.length) return {...b, ally, enemy, running:false, won:true, log:[...log,'Victory!']};
  if(!aliveA.length) return {...b, ally, enemy, running:false, lost:true, log:[...log,'Defeat...']};
  const all=[...ally,...enemy];
  for(const c of all.filter(x=>x.hp>0)){ c.speed += stats(c).spd/8; }
  let actor=all.filter(x=>x.hp>0 && x.speed>=100).sort((a,b)=>b.speed-a.speed)[0];
  if(!actor) return {...b, ally, enemy, tick:b.tick+1};
  actor.speed-=100;
  const isAlly=actor.side==='ally'; const own=isAlly?ally:enemy; const opp=isAlly?enemy:ally;
  let realActor=own.find(x=>x.uid===actor.uid); realActor.speed=actor.speed;
  const item=realActor.item||{};
  if(item.regen) realActor.hp=clamp(realActor.hp+item.regen,0,realActor.maxHp);
  if(realActor.kind==='hero'){
    realActor.power += Math.round(22*((realActor.item?.power)||1));
    if(realActor.power>=powerMax(realActor)){ const fx=castHero(realActor, own, opp, log, b.tick+1); realActor.power=0; return {...b, ally, enemy, fx, log:log.slice(-12), tick:b.tick+1}; }
  }
  const fx=actUnit(realActor, own, opp, log, b.tick+1);
  return {...b, ally, enemy, fx, log:log.slice(-12), tick:b.tick+1};
}
function firstAlive(arr){ return arr.find(x=>x.hp>0); }
function lastAlive(arr){ return [...arr].reverse().find(x=>x.hp>0); }
function actUnit(actor, own, opp, log, fxSeed=0){
  const b=baseOf(actor); const target=(actor.item?.targetLast||b.targetLast)?lastAlive(opp):firstAlive(opp); if(!target) return null;
  let dmg=Math.max(1, stats(actor).atk - Math.floor(stats(target).armor*1.2));
  if(actor.kind==='unit' && actor.abilityRank>0) dmg+=actor.abilityRank*2;
  if(b.ability?.includes('Heal')||b.role==='Healer') { const wounded=own.filter(x=>x.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]; if(wounded && wounded.hp<wounded.maxHp){ const heal=12+actor.level*3+(actor.abilityRank*5); wounded.hp=clamp(wounded.hp+heal,0,wounded.maxHp); log.push(`${b.name} heals ${baseOf(wounded).name} for ${heal}.`); return makeCombatFx(actor, wounded, 'holy', b.ability||'Heal', fxSeed); }}
  target.hp=clamp(target.hp-dmg,0,target.maxHp); log.push(`${b.name} hits ${baseOf(target).name} for ${dmg}.`);
  const fxKind=actor.item?.burn?'fireball':unitFxKind(actor,b);
  if(actor.item?.burn && target.hp>0){ target.hp=clamp(target.hp-4,0,target.maxHp); log.push(`${baseOf(target).name} burns.`); }
  return makeCombatFx(actor, target, fxKind, b.ability||b.role, fxSeed);
}
function castHero(h, own, opp, log, fxSeed=0){
  const name=selectedSkillName(h), hb=HEROES[h.id];
  if(/Light|Heal|Wave|Tranquility/.test(name)){ const wounded=own.filter(x=>x.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]; const heal=30+h.level*5+(h.ultimateRank*20); if(wounded){ wounded.hp=clamp(wounded.hp+heal,0,wounded.maxHp); log.push(`${hb.name} casts ${name}: ${baseOf(wounded).name} heals ${heal}.`); return makeCombatFx(h,wounded,spellFxKind(name),'Heal',fxSeed);} return null; }
  if(/Resurrection|Animate/.test(name)){ const dead=own.find(x=>x.hp<=0); if(dead){ dead.hp=Math.round(dead.maxHp*(0.35+0.15*h.ultimateRank)); log.push(`${hb.name} casts ${name}: ${baseOf(dead).name} returns!`); return makeCombatFx(h,dead,'resurrect',name,fxSeed);} return castDamage(h,opp,log,name,fxSeed); }
  if(/Shield|Aura|Voodoo|Avatar|Metamorphosis|Evasion|Armor/.test(name)){ h.hp=clamp(h.hp+25+h.level*4,0,h.maxHp); h.speed+=25; log.push(`${hb.name} uses ${name} and fortifies.`); return makeCombatFx(h,h,spellFxKind(name),name,fxSeed); }
  return castDamage(h,opp,log,name,fxSeed);
}
function castDamage(h, opp, log, name, fxSeed=0){ const hb=HEROES[h.id]; const targets=opp.filter(x=>x.hp>0); const n=/Storm|Blizzard|Starfall|Bladestorm|Earthquake|Decay|Volcano|Swarm|Knives/.test(name)?Math.min(4,targets.length):1; const hit=sample(targets,n); hit.forEach(t=>{ const dmg=24+h.level*4+(h.selectedSkill===3?18:0); t.hp=clamp(t.hp-dmg,0,t.maxHp); log.push(`${hb.name} casts ${name} on ${baseOf(t).name} for ${dmg}.`); }); return makeCombatFx(h,hit[0],spellFxKind(name),name,fxSeed,hit.map(t=>t.uid),n>1); }
function unitFxKind(actor,b){
  const text=`${b.name} ${b.role} ${b.ability||''} ${(b.tags||[]).join(' ')}`;
  if(/Rifle|Sharpshooter|Headshot|Long Rifles/.test(text)) return 'bullet';
  if(/Archer|Arrow|Marksmanship|Spear|Headhunter|Troll|Ranged/.test(text)) return 'arrow';
  if(/Shaman|Storm|Lightning|Bloodlust/.test(text)) return 'lightning';
  if(/Dryad|Poison|Nature|Chimaera|Corrosive/.test(text)) return 'nature';
  if(/Ghoul|Cannibalize|Frenzy/.test(text)) return 'claw';
  if(/Necromancer|Cripple|Disease|Plague|Abomination|Undead/.test(text)) return 'shadow';
  if(/Frost|Freezing|Wyrm/.test(text)) return 'frost';
  if(/Priest|Holy|Heal/.test(text)) return 'holy';
  if(/Tauren|Pulverize|Stomp|Charge|Knight|Raider|Ensnare/.test(text)) return 'earth';
  return 'slash';
}
function spellFxKind(name=''){
  if(/Fire|Flame|Phoenix|Inferno|Volcano|Breath/.test(name)) return 'fireball';
  if(/Blizzard|Frost/.test(name)) return 'frost';
  if(/Water|Tornado|Wave/.test(name)) return 'waterfall';
  if(/Lightning|Thunder|Storm|Shockwave|Earthquake/.test(name)) return 'lightning';
  if(/Starfall|Searing|Moon|Trueshot/.test(name)) return 'starfall';
  if(/Knife|Knives|Blade|Bash|Critical|Avatar|Wind Walk/.test(name)) return 'slash';
  if(/Death|Decay|Coil|Swarm|Locust|Shadow|Silence|Black|Life Drain|Animate|Vengeance/.test(name)) return 'shadow';
  if(/Light|Heal|Tranquility|Resurrection|Shield|Aura|Armor/.test(name)) return 'holy';
  if(/Entangling|Nature|Thorns|Force|Bear|Stampede/.test(name)) return 'nature';
  if(/Voodoo|Hex|Serpent|Banish|Mana|Arcane|Metamorphosis/.test(name)) return 'arcane';
  return 'impact';
}
function makeCombatFx(actor,target,kind,label,seed=0,targetUids=null,area=false){
  return {id:`fx-${seed}-${actor.uid}-${target?.uid||'self'}-${kind}`, kind, label, area, actorUid:actor.uid, targetUid:target?.uid, targetUids, fromSide:actor.side||'ally', toSide:target?.side||((actor.side==='ally')?'enemy':'ally')};
}

createRoot(document.getElementById('root')).render(<App/>);
