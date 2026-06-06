/* =========================================================
   ファンタジーライフ風ゲーム
   採集 → 装備作成 → 強化 → 戦闘 のループを楽しむブラウザゲーム

   戦闘の特徴:
   - 武器タイプ(剣/斧/槍/弓/杖/短剣)で戦い方が変わる
   - MP を使うスキル、防御コマンド
   - 会心(クリティカル) と 状態異常(毒/火傷/スタン)
   - 属性(炎/氷/雷) と モンスターの弱点
   ========================================================= */

/* ---------- 素材 ---------- */
const MATERIALS = {
  wood:      { name: "木材",          icon: "🪵" },
  hardwood:  { name: "硬い木材",      icon: "🌳" },
  stone:     { name: "石",            icon: "🪨" },
  iron:      { name: "鉄鉱石",        icon: "⛏️" },
  mithril:   { name: "ミスリル鉱石",  icon: "🔷" },
  gel:       { name: "スライムゼリー",icon: "🟢" },
  fang:      { name: "鋭い牙",        icon: "🦷" },
  pelt:      { name: "毛皮",          icon: "🟫" },
  shard:     { name: "魔石のかけら",  icon: "🟣" },
  crystal:   { name: "クリスタル",    icon: "💎" },
};

/* ---------- 属性 ---------- */
const ELEMENTS = {
  fire:      { name: "炎", icon: "🔥" },
  ice:       { name: "氷", icon: "❄️" },
  lightning: { name: "雷", icon: "⚡" },
};
function elemLabel(e) { return e && ELEMENTS[e] ? ELEMENTS[e].icon + ELEMENTS[e].name : ""; }

/* ---------- 武器タイプ（戦い方の違い） ----------
   crit: 会心率 / mult: 攻撃倍率 / hits: 攻撃回数 / pierce: 防御貫通率
   ignoreDef: 防御無視 / skills: 使えるスキルID / onCritStatus: 会心時に付与する状態 */
const WTYPES = {
  fist:   { name: "素手",   crit: 0.03, mult: 1.0,  hits: 1, pierce: 0,   ignoreDef: false, skills: [],                  note: "武器なし" },
  sword:  { name: "剣",     crit: 0.12, mult: 1.0,  hits: 1, pierce: 0,   ignoreDef: false, skills: ["power_strike"],     note: "バランス型・そこそこ会心" },
  axe:    { name: "斧",     crit: 0.0,  mult: 1.35, hits: 1, pierce: 0,   ignoreDef: false, skills: ["cleave"],           note: "高火力だが会心しない" },
  spear:  { name: "槍",     crit: 0.06, mult: 1.0,  hits: 1, pierce: 0.5, ignoreDef: false, skills: ["triple"],           note: "敵の防御を半分貫通" },
  bow:    { name: "弓",     crit: 0.12, mult: 0.62, hits: 2, pierce: 0,   ignoreDef: false, skills: ["snipe"],            note: "1ターンに2回攻撃" },
  staff:  { name: "杖",     crit: 0.05, mult: 1.0,  hits: 1, pierce: 0,   ignoreDef: true,  skills: ["bolt", "heal"],     isMagic: true, note: "防御無視の魔法・回復も可" },
  dagger: { name: "短剣",   crit: 0.35, mult: 0.85, hits: 1, pierce: 0,   ignoreDef: false, skills: ["venom"], onCritStatus: "poison", note: "高会心・会心で毒" },
};

/* ---------- スキル ---------- */
const SKILLS = {
  power_strike: { name: "強斬り",   icon: "💢", mp: 8,  desc: "会心しやすい強烈な一撃 (1.8倍)",
    run: (c) => c.hit({ mult: 1.8, critBonus: 0.25 }) },
  cleave:       { name: "兜割り",   icon: "🪓", mp: 12, desc: "防御無視の渾身の一撃 (2.3倍)",
    run: (c) => c.hit({ mult: 2.3, ignoreDef: true }) },
  triple:       { name: "三連突き", icon: "🔱", mp: 12, desc: "防御を貫く3連撃 (0.85倍×3)",
    run: (c) => { for (let i = 0; i < 3; i++) c.hit({ mult: 0.85, pierce: 0.75 }); } },
  snipe:        { name: "狙撃",     icon: "🎯", mp: 10, desc: "急所を狙う2連射 (1.4倍×2)",
    run: (c) => { c.hit({ mult: 1.4 }); c.hit({ mult: 1.4 }); } },
  bolt:         { name: "魔法弾",   icon: "🔮", mp: 10, desc: "属性の防御無視魔法 (2.0倍)＋状態異常",
    run: (c) => c.hit({ mult: 2.0, ignoreDef: true, forceStatus: true }) },
  heal:         { name: "ヒール",   icon: "💚", mp: 10, desc: "最大HPの40%を回復",
    run: (c) => c.heal(0.4) },
  venom:        { name: "毒刃",     icon: "🟢", mp: 6,  desc: "猛毒を与える刃 (1.3倍)",
    run: (c) => c.hit({ mult: 1.3, inflict: "poison" }) },
};

/* ---------- エリア ---------- */
const AREAS = [
  {
    id: "grassland", name: "はじまりの草原", icon: "🌿", reqLevel: 1,
    desc: "弱いモンスターと基本素材の宝庫。",
    nodes: [
      { id: "g-tree", name: "若木", icon: "🌲", tool: "axe", tier: 0, yields: [{ mat: "wood", min: 1, max: 3, chance: 1 }] },
      { id: "g-rock", name: "石ころ", icon: "🪨", tool: "pickaxe", tier: 0, yields: [{ mat: "stone", min: 1, max: 2, chance: 1 }] },
    ],
    monsters: [
      { name: "スライム", sprite: "🟢", hp: 18, atk: 4, def: 0, exp: 6, gold: 5, weak: "fire",
        drops: [{ mat: "gel", min: 1, max: 2, chance: .9 }] },
      { name: "ホーンラビット", sprite: "🐰", hp: 24, atk: 6, def: 1, exp: 9, gold: 8, weak: "lightning",
        drops: [{ mat: "pelt", min: 1, max: 1, chance: .7 }, { mat: "fang", min: 1, max: 1, chance: .3 }] },
    ],
  },
  {
    id: "forest", name: "ささやきの森", icon: "🌳", reqLevel: 4,
    desc: "硬い木材と手強い獣たち。斧があると効率的。",
    nodes: [
      { id: "f-tree", name: "大樹", icon: "🌳", tool: "axe", tier: 1, yields: [{ mat: "wood", min: 2, max: 4, chance: 1 }, { mat: "hardwood", min: 1, max: 2, chance: .8 }] },
      { id: "f-rock", name: "苔むした岩", icon: "🪨", tool: "pickaxe", tier: 1, yields: [{ mat: "stone", min: 2, max: 3, chance: 1 }, { mat: "shard", min: 1, max: 1, chance: .25 }] },
    ],
    monsters: [
      { name: "ゴブリン", sprite: "👺", hp: 40, atk: 10, def: 3, exp: 18, gold: 14, weak: "fire",
        drops: [{ mat: "fang", min: 1, max: 2, chance: .7 }, { mat: "shard", min: 1, max: 1, chance: .3 }] },
      { name: "森オオカミ", sprite: "🐺", hp: 55, atk: 14, def: 4, exp: 26, gold: 20, weak: "ice",
        drops: [{ mat: "pelt", min: 1, max: 3, chance: .9 }, { mat: "fang", min: 1, max: 2, chance: .6 }] },
    ],
  },
  {
    id: "mountain", name: "嶮しい岩山", icon: "⛰️", reqLevel: 9,
    desc: "鉄やクリスタルが眠る危険地帯。強いピッケルが必要。",
    nodes: [
      { id: "m-rock", name: "鉄鉱脈", icon: "⛏️", tool: "pickaxe", tier: 2, yields: [{ mat: "iron", min: 1, max: 3, chance: 1 }, { mat: "stone", min: 1, max: 2, chance: .8 }] },
      { id: "m-crystal", name: "輝く晶洞", icon: "💎", tool: "pickaxe", tier: 2, yields: [{ mat: "crystal", min: 1, max: 1, chance: .5 }, { mat: "shard", min: 1, max: 2, chance: .7 }] },
      { id: "m-tree", name: "古木", icon: "🌲", tool: "axe", tier: 2, yields: [{ mat: "hardwood", min: 2, max: 3, chance: 1 }] },
    ],
    monsters: [
      { name: "オーク", sprite: "👹", hp: 90, atk: 20, def: 8, exp: 45, gold: 35, weak: "ice",
        drops: [{ mat: "fang", min: 2, max: 3, chance: .8 }, { mat: "iron", min: 1, max: 2, chance: .4 }] },
      { name: "ロックゴーレム", sprite: "🗿", hp: 140, atk: 26, def: 14, exp: 70, gold: 55, weak: "lightning",
        drops: [{ mat: "stone", min: 3, max: 5, chance: 1 }, { mat: "iron", min: 1, max: 3, chance: .6 }, { mat: "crystal", min: 1, max: 1, chance: .25 }] },
    ],
  },
  {
    id: "volcano", name: "竜の棲む火口", icon: "🌋", reqLevel: 16,
    desc: "最強の素材ミスリルと、伝説の竜が待つ。",
    nodes: [
      { id: "v-rock", name: "ミスリル鉱脈", icon: "🔷", tool: "pickaxe", tier: 3, yields: [{ mat: "mithril", min: 1, max: 2, chance: .8 }, { mat: "iron", min: 1, max: 3, chance: 1 }] },
      { id: "v-crystal", name: "竜晶", icon: "💎", tool: "pickaxe", tier: 3, yields: [{ mat: "crystal", min: 1, max: 2, chance: .8 }] },
    ],
    monsters: [
      { name: "ヘルハウンド", sprite: "🐕", hp: 200, atk: 34, def: 16, exp: 110, gold: 90, weak: "ice",
        drops: [{ mat: "fang", min: 3, max: 5, chance: 1 }, { mat: "crystal", min: 1, max: 2, chance: .4 }] },
      { name: "炎竜ヴァルガ", sprite: "🐉", hp: 380, atk: 48, def: 24, exp: 260, gold: 220, weak: "ice",
        drops: [{ mat: "mithril", min: 2, max: 4, chance: 1 }, { mat: "crystal", min: 2, max: 3, chance: .8 }] },
    ],
  },
];

/* ---------- レシピ ---------- */
const TOOL_TIER = { bare: 0, copper: 1, iron: 2, mithril: 3 };

const RECIPES = [
  // --- 道具：斧 ---
  { id: "axe_copper", name: "銅の斧", icon: "🪓", type: "axe", tier: 1, cost: { wood: 3, stone: 2 }, desc: "森の大樹を伐れる。" },
  { id: "axe_iron", name: "鉄の斧", icon: "🪓", type: "axe", tier: 2, cost: { hardwood: 2, iron: 3 }, desc: "古木すら伐り倒す。" },
  { id: "axe_mithril", name: "ミスリルの斧", icon: "🪓", type: "axe", tier: 3, cost: { hardwood: 4, mithril: 2 }, desc: "あらゆる木を伐採可能。" },
  // --- 道具：ピッケル ---
  { id: "pick_copper", name: "銅のピッケル", icon: "⛏️", type: "pickaxe", tier: 1, cost: { wood: 2, stone: 3 }, desc: "森の岩を掘れる。" },
  { id: "pick_iron", name: "鉄のピッケル", icon: "⛏️", type: "pickaxe", tier: 2, cost: { hardwood: 2, iron: 4 }, desc: "鉄鉱脈や晶洞を掘れる。" },
  { id: "pick_mithril", name: "ミスリルのピッケル", icon: "⛏️", type: "pickaxe", tier: 3, cost: { iron: 5, mithril: 2 }, desc: "ミスリル鉱脈を掘れる。" },

  // --- 武器（wtype と element で個性が出る） ---
  { id: "w_wood_sword",  name: "木の剣",        icon: "🗡️", type: "weapon", wtype: "sword",  stats: { atk: 6 },          cost: { wood: 4 } },
  { id: "w_stone_axe",   name: "石の戦斧",      icon: "🪓",  type: "weapon", wtype: "axe",    stats: { atk: 9 },          cost: { wood: 3, stone: 5 } },
  { id: "w_oak_spear",   name: "樫の槍",        icon: "🔱",  type: "weapon", wtype: "spear",  stats: { atk: 8 },          cost: { hardwood: 2, stone: 3 } },
  { id: "w_hunt_bow",    name: "狩人の弓",      icon: "🏹",  type: "weapon", wtype: "bow",    stats: { atk: 7 },          cost: { wood: 3, fang: 2 } },
  { id: "w_guard_dagger",name: "守人の短剣",    icon: "🔪",  type: "weapon", wtype: "dagger", stats: { atk: 7 },          cost: { stone: 3, fang: 2 } },
  { id: "w_ember_staff", name: "灯火の杖",      icon: "🪄",  type: "weapon", wtype: "staff",  element: "fire", stats: { atk: 7, mp: 6 }, cost: { wood: 2, shard: 3 } },

  { id: "w_iron_sword",  name: "鉄の剣",        icon: "⚔️", type: "weapon", wtype: "sword",  stats: { atk: 16 },         cost: { iron: 4, hardwood: 2, fang: 2 } },
  { id: "w_war_axe",     name: "戦鬼の大斧",    icon: "🪓",  type: "weapon", wtype: "axe",    stats: { atk: 22 },         cost: { iron: 5, hardwood: 3 } },
  { id: "w_assassin",    name: "暗殺者の短剣",  icon: "🔪",  type: "weapon", wtype: "dagger", stats: { atk: 16 },         cost: { iron: 3, shard: 4 } },
  { id: "w_flame_sword", name: "紅蓮の剣",      icon: "🗡️", type: "weapon", wtype: "sword",  element: "fire", stats: { atk: 20 }, cost: { iron: 3, crystal: 1, shard: 3 } },
  { id: "w_frost_spear", name: "氷牙の槍",      icon: "🔱",  type: "weapon", wtype: "spear",  element: "ice",  stats: { atk: 20 }, cost: { iron: 3, crystal: 2 } },
  { id: "w_thunder_bow", name: "雷鳴の弓",      icon: "🏹",  type: "weapon", wtype: "bow",    element: "lightning", stats: { atk: 18 }, cost: { hardwood: 3, crystal: 2, fang: 3 } },
  { id: "w_sage_staff",  name: "賢者の杖",      icon: "🪄",  type: "weapon", wtype: "staff",  element: "ice",  stats: { atk: 24, mp: 14 }, cost: { crystal: 2, shard: 4, hardwood: 2 } },

  { id: "w_dragon_sword",name: "竜殺しの大剣",  icon: "⚔️", type: "weapon", wtype: "sword",  element: "fire", stats: { atk: 46 }, cost: { mithril: 3, crystal: 3, fang: 5 } },
  { id: "w_storm_spear", name: "雷帝の槍",      icon: "🔱",  type: "weapon", wtype: "spear",  element: "lightning", stats: { atk: 40 }, cost: { mithril: 3, crystal: 2, iron: 4 } },

  // --- 防具 ---
  { id: "a_leather", name: "革の鎧",       icon: "🦺", type: "armor", stats: { def: 4, hp: 10 },        cost: { pelt: 4 }, desc: "DEF +4 / 最大HP +10" },
  { id: "a_novice_robe", name: "見習いのローブ", icon: "🥋", type: "armor", stats: { def: 2, hp: 5, mp: 8 }, cost: { gel: 3, wood: 2 }, desc: "DEF +2 / HP +5 / MP +8" },
  { id: "a_stone", name: "石板の鎧",       icon: "🛡️", type: "armor", stats: { def: 9, hp: 20 },       cost: { stone: 6, pelt: 3 }, desc: "DEF +9 / 最大HP +20" },
  { id: "a_iron", name: "鉄の鎧",          icon: "🛡️", type: "armor", stats: { def: 16, hp: 35 },      cost: { iron: 6, pelt: 4 }, desc: "DEF +16 / 最大HP +35" },
  { id: "a_mage_robe", name: "魔導のローブ", icon: "🥻", type: "armor", stats: { def: 10, hp: 25, mp: 20 }, cost: { shard: 6, pelt: 3, crystal: 1 }, desc: "DEF +10 / HP +25 / MP +20" },
  { id: "a_crystal", name: "クリスタルメイル", icon: "🛡️", type: "armor", stats: { def: 26, hp: 60 },  cost: { iron: 4, crystal: 2, shard: 4 }, desc: "DEF +26 / 最大HP +60" },
  { id: "a_dragon", name: "竜鱗の鎧",      icon: "🛡️", type: "armor", stats: { def: 40, hp: 100 },     cost: { mithril: 4, crystal: 2, pelt: 6 }, desc: "DEF +40 / 最大HP +100" },
];

// 武器・防具の効果説明を自動生成
function gearEffectText(r) {
  if (r.type === "weapon") {
    const w = WTYPES[r.wtype] || WTYPES.fist;
    const parts = [`ATK +${r.stats.atk}`];
    if (r.stats.mp) parts.push(`MP +${r.stats.mp}`);
    let line = `${w.name}${r.element ? " / " + elemLabel(r.element) : ""} ・ ${parts.join(" / ")}`;
    return line + `（${w.note}）`;
  }
  return r.desc || "";
}

const RECIPE_BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));

/* ---------- セーブ＆ステート ---------- */
const SAVE_KEY = "fantasy-life-save-v2";
const BASE_STATS = { atk: 5, def: 2, maxHp: 30, maxMp: 10 };

function newGame() {
  return {
    level: 1, exp: 0, hp: BASE_STATS.maxHp, mp: BASE_STATS.maxMp, gold: 0,
    materials: {}, owned: [],
    equipped: { weapon: null, armor: null, axe: null, pickaxe: null },
    currentGatherArea: "grassland",
  };
}

let state = loadGame();
let battle = null;

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return Object.assign(newGame(), JSON.parse(raw));
  } catch (e) {}
  return newGame();
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }

/* ---------- 計算ヘルパー ---------- */
function expToNext(level) { return Math.floor(10 * Math.pow(level, 1.5)); }

function derivedStats() {
  let atk = BASE_STATS.atk + (state.level - 1) * 2;
  let def = BASE_STATS.def + (state.level - 1) * 1;
  let maxHp = BASE_STATS.maxHp + (state.level - 1) * 8;
  let maxMp = BASE_STATS.maxMp + (state.level - 1) * 2;
  for (const slot of ["weapon", "armor"]) {
    const id = state.equipped[slot];
    if (id && RECIPE_BY_ID[id]) {
      const s = RECIPE_BY_ID[id].stats || {};
      atk += s.atk || 0; def += s.def || 0; maxHp += s.hp || 0; maxMp += s.mp || 0;
    }
  }
  return { atk, def, maxHp, maxMp };
}

function equippedWeapon() {
  const id = state.equipped.weapon;
  return id ? RECIPE_BY_ID[id] : null;
}
function weaponType() {
  const w = equippedWeapon();
  return (w && WTYPES[w.wtype]) ? WTYPES[w.wtype] : WTYPES.fist;
}
function weaponElement() {
  const w = equippedWeapon();
  return w ? (w.element || null) : null;
}
function toolTier(kind) {
  const id = state.equipped[kind];
  return (id && RECIPE_BY_ID[id]) ? RECIPE_BY_ID[id].tier : 0;
}

function matQty(id) { return state.materials[id] || 0; }
function addMat(id, n) { state.materials[id] = matQty(id) + n; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clampVitals() {
  const s = derivedStats();
  if (state.hp == null) state.hp = s.maxHp;
  if (state.mp == null) state.mp = s.maxMp;
  state.hp = Math.min(state.hp, s.maxHp);
  state.mp = Math.min(state.mp, s.maxMp);
}

/* ---------- ログ＆トースト ---------- */
function log(msg, cls = "") {
  const el = document.getElementById("log");
  const line = document.createElement("div");
  if (cls) line.className = cls;
  line.textContent = msg;
  el.prepend(line);
  while (el.children.length > 60) el.removeChild(el.lastChild);
}
let toastTimer = null;
function toast(msg) {
  let t = document.querySelector(".toast");
  if (t) t.remove();
  t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 1600);
}

/* ---------- 経験値・レベルアップ ---------- */
function gainExp(amount) {
  state.exp += amount;
  let leveled = false;
  while (state.exp >= expToNext(state.level)) { state.exp -= expToNext(state.level); state.level++; leveled = true; }
  if (leveled) {
    const s = derivedStats();
    state.hp = s.maxHp; state.mp = s.maxMp;
    log(`🎉 レベルアップ！ Lv.${state.level} になった（HP/MP全回復）`, "l-good");
    toast(`Lv.${state.level} に上がった！`);
  }
}

/* ---------- 採集 ---------- */
function gather(areaId, nodeId) {
  const area = AREAS.find(a => a.id === areaId);
  const node = area.nodes.find(n => n.id === nodeId);
  const have = toolTier(node.tool);
  const toolName = node.tool === "axe" ? "斧" : "ピッケル";
  if (have < node.tier) {
    toast(`もっと良い${toolName}が必要だ`);
    log(`${node.name} には ランク${node.tier} 以上の${toolName}が必要。`, "l-bad");
    return;
  }
  const bonus = have - node.tier;
  let got = [];
  for (const y of node.yields) {
    if (Math.random() <= y.chance) {
      const amount = rand(y.min, y.max) + Math.floor(bonus * 0.7);
      addMat(y.mat, amount);
      got.push(`${MATERIALS[y.mat].icon}${MATERIALS[y.mat].name} ×${amount}`);
    }
  }
  if (got.length) { log(`⛏ ${node.name}から ${got.join(" / ")} を採集した。`, "l-good"); gainExp(2); }
  else log(`${node.name}からは何も採れなかった…`, "l-sys");
  save(); renderAll();
}

/* =========================================================
   戦闘
   ========================================================= */

function startBattle(areaId) {
  const area = AREAS.find(a => a.id === areaId);
  const m = area.monsters[rand(0, area.monsters.length - 1)];
  const s = derivedStats();
  // 戦闘開始時は HP/MP 全回復（1戦ごとに仕切り直し）
  state.hp = s.maxHp; state.mp = s.maxMp;
  battle = {
    areaId,
    enemy: { ...m, maxHp: m.hp, hp: m.hp, statuses: [] },
    defending: false, over: false, showSkills: false, busy: false,
  };
  log(`⚔ ${m.name}（弱点: ${elemLabel(m.weak)}）が現れた！`, "l-sys");
  document.getElementById("area-list").classList.add("hidden");
  renderBattle();
  renderStatus();
}

// 1ヒットを敵に与える
function dealHit(opts) {
  const e = battle.enemy;
  if (e.hp <= 0) return;
  const ps = derivedStats();
  const wt = weaponType();
  const mult = opts.mult != null ? opts.mult : 1;
  let def = e.def;
  if (opts.ignoreDef || wt.ignoreDef) def = 0;
  else def = def * (1 - (opts.pierce || 0) - (wt.pierce || 0));
  def = Math.max(0, def);

  let dmg = ps.atk * mult - def;

  // 属性の弱点
  const elem = weaponElement();
  let weak = false;
  if (elem && e.weak === elem) { dmg *= 1.5; weak = true; }

  // 会心
  const critChance = (wt.crit || 0) + (opts.critBonus || 0);
  const crit = Math.random() < critChance;
  if (crit) dmg *= 1.8;

  dmg = Math.max(1, Math.round(dmg + rand(-2, 2)));
  e.hp = Math.max(0, e.hp - dmg);

  let tag = "";
  if (crit) tag += " ✨会心！";
  if (weak) tag += ` ${elemLabel(elem)}弱点！`;
  log(`${e.name} に ${dmg} ダメージ！${tag}`, crit || weak ? "l-good" : "");

  // 状態異常付与
  if (opts.inflict) applyStatus(e, opts.inflict);
  if (wt.onCritStatus && crit) applyStatus(e, wt.onCritStatus);
  if (elem) {
    const chance = opts.forceStatus ? 1 : 0.25;
    if (Math.random() < chance) applyStatus(e, elementStatus(elem), ps.atk);
  }
}

function elementStatus(elem) {
  if (elem === "fire") return "burn";
  return "stun"; // ice / lightning
}

// 状態異常を付与
function applyStatus(enemy, kind, atkRef) {
  const ps = derivedStats();
  const atk = atkRef || ps.atk;
  if (kind === "poison" || kind === "burn") {
    const dmg = Math.max(2, Math.round(atk * (kind === "poison" ? 0.25 : 0.2)));
    const turns = 3;
    const ex = enemy.statuses.find(s => s.kind === kind);
    if (ex) { ex.turns = Math.max(ex.turns, turns); ex.dmg = Math.max(ex.dmg, dmg); }
    else enemy.statuses.push({ kind, dmg, turns });
    log(`${enemy.name} は${kind === "poison" ? "毒" : "火傷"}を負った！`, "l-good");
  } else if (kind === "stun") {
    const ex = enemy.statuses.find(s => s.kind === "stun");
    if (ex) ex.turns = Math.max(ex.turns, 1);
    else enemy.statuses.push({ kind: "stun", turns: 1 });
    log(`${enemy.name} は痺れて動けなくなった！`, "l-good");
  }
}

function playerHeal(frac) {
  const s = derivedStats();
  const amt = Math.round(s.maxHp * frac);
  state.hp = Math.min(s.maxHp, state.hp + amt);
  log(`💚 ${amt} 回復した。`, "l-good");
}

// 戦闘コンテキスト（スキルから呼ぶ）
const combatCtx = {
  hit: (opts) => dealHit(opts || {}),
  heal: (frac) => playerHeal(frac),
};

// 通常攻撃
function actAttack() {
  if (!battle || battle.over || battle.busy) return;
  const wt = weaponType();
  const hits = wt.hits || 1;
  for (let i = 0; i < hits; i++) dealHit({});
  finishPlayerAction();
}

// スキル使用
function actSkill(skillId) {
  if (!battle || battle.over || battle.busy) return;
  const sk = SKILLS[skillId];
  if (!sk) return;
  if (state.mp < sk.mp) { toast("MPが足りない"); return; }
  state.mp -= sk.mp;
  log(`${sk.icon} ${sk.name} を放った！`, "l-sys");
  sk.run(combatCtx);
  battle.showSkills = false;
  finishPlayerAction();
}

// 防御
function actDefend() {
  if (!battle || battle.over || battle.busy) return;
  battle.defending = true;
  const s = derivedStats();
  state.mp = Math.min(s.maxMp, state.mp + 5);
  log(`🛡 身を守る体勢をとった（被ダメ減＆MP回復）。`, "l-sys");
  finishPlayerAction();
}

// プレイヤー行動後 → 勝敗判定 → 敵ターン
function finishPlayerAction() {
  if (battle.enemy.hp <= 0) { winBattle(); return; }
  enemyTurn();
}

function enemyTurn() {
  const e = battle.enemy;
  // 状態異常（毒/火傷）のダメージ
  for (const st of [...e.statuses]) {
    if (st.kind === "poison" || st.kind === "burn") {
      e.hp = Math.max(0, e.hp - st.dmg);
      log(`${e.name} は${st.kind === "poison" ? "毒" : "火傷"}で ${st.dmg} ダメージ。`, "l-good");
      st.turns--;
    }
  }
  e.statuses = e.statuses.filter(s => !((s.kind === "poison" || s.kind === "burn") && s.turns <= 0));
  if (e.hp <= 0) { winBattle(); return; }

  // スタン判定
  const stun = e.statuses.find(s => s.kind === "stun");
  if (stun) {
    log(`${e.name} は痺れて動けない！`, "l-good");
    stun.turns--;
    e.statuses = e.statuses.filter(s => !(s.kind === "stun" && s.turns <= 0));
  } else {
    // 敵の攻撃
    const ps = derivedStats();
    let edmg = Math.max(1, e.atk - ps.def + rand(-2, 2));
    if (battle.defending) edmg = Math.max(1, Math.round(edmg * 0.4));
    state.hp = Math.max(0, state.hp - edmg);
    log(`${e.name} の攻撃！ ${edmg} ダメージを受けた。`, "l-bad");
    if (state.hp <= 0) { loseBattle(); return; }
  }

  // MP自然回復＆防御解除
  const s = derivedStats();
  state.mp = Math.min(s.maxMp, state.mp + 2);
  battle.defending = false;

  renderBattle(); renderStatus(); save();
}

function winBattle() {
  const e = battle.enemy;
  battle.over = true;
  log(`✨ ${e.name} を倒した！`, "l-good");
  let drops = [];
  for (const d of e.drops || []) {
    if (Math.random() <= d.chance) {
      const amt = rand(d.min, d.max);
      addMat(d.mat, amt);
      drops.push(`${MATERIALS[d.mat].icon}${MATERIALS[d.mat].name} ×${amt}`);
    }
  }
  state.gold += e.gold;
  if (drops.length) log(`ドロップ: ${drops.join(" / ")}`, "l-good");
  log(`💰 ${e.gold}G を手に入れた。`, "l-gold");
  gainExp(e.exp);
  toast(`${e.name} 撃破！ +${e.exp}EXP`);
  save();
  endBattleUI();
}

function loseBattle() {
  battle.over = true;
  log(`💀 倒れてしまった…拠点に戻った。`, "l-bad");
  const lost = Math.floor(state.gold * 0.2);
  state.gold -= lost;
  if (lost > 0) log(`動揺して ${lost}G を落とした。`, "l-gold");
  const s = derivedStats();
  state.hp = s.maxHp; state.mp = s.maxMp;
  toast("やられてしまった…");
  save();
  endBattleUI();
}

function fleeBattle() {
  if (!battle) return;
  log(`🏃 ${battle.enemy.name} から逃げ出した。`, "l-sys");
  endBattleUI();
}

function endBattleUI() {
  battle = null;
  document.getElementById("battle").classList.add("hidden");
  document.getElementById("area-list").classList.remove("hidden");
  renderAll();
}

/* ---------- 作成 ---------- */
function canCraft(recipe) { return Object.entries(recipe.cost).every(([m, q]) => matQty(m) >= q); }

function craft(recipeId) {
  const r = RECIPE_BY_ID[recipeId];
  if (!canCraft(r)) { toast("素材が足りない"); return; }
  for (const [m, q] of Object.entries(r.cost)) addMat(m, -q);
  if (!state.owned.includes(recipeId)) state.owned.push(recipeId);
  log(`🔨 ${r.name} を作成した！`, "l-good");
  toast(`${r.name} を作った！`);
  autoEquipIfBetter(r);
  gainExp(5);
  save(); renderAll();
}

function gearScore(r) {
  const s = r.stats || {};
  return (r.tier || 0) * 100 + (s.atk || 0) + (s.def || 0) + (s.hp || 0) * 0.3 + (s.mp || 0) * 0.3;
}
function autoEquipIfBetter(r) {
  const slot = r.type === "weapon" ? "weapon" : r.type === "armor" ? "armor" : r.type;
  const cur = state.equipped[slot];
  if (!cur) { state.equipped[slot] = r.id; clampVitals(); return; }
  if (gearScore(r) > gearScore(RECIPE_BY_ID[cur])) { state.equipped[slot] = r.id; clampVitals(); }
}
function equipItem(recipeId) {
  const r = RECIPE_BY_ID[recipeId];
  const slot = r.type === "weapon" ? "weapon" : r.type === "armor" ? "armor" : r.type;
  state.equipped[slot] = recipeId;
  clampVitals();
  log(`${r.name} を装備した。`, "l-sys");
  save(); renderAll();
}

/* =========================================================
   レンダリング
   ========================================================= */

function renderStatus() {
  clampVitals();
  const s = derivedStats();
  document.getElementById("stat-level").textContent = state.level;
  document.getElementById("stat-hp").textContent = `${state.hp}/${s.maxHp}`;
  document.getElementById("hp-fill").style.width = (state.hp / s.maxHp * 100) + "%";
  document.getElementById("stat-mp").textContent = `${state.mp}/${s.maxMp}`;
  document.getElementById("mp-fill").style.width = (state.mp / s.maxMp * 100) + "%";
  const need = expToNext(state.level);
  document.getElementById("stat-exp").textContent = `${state.exp}/${need}`;
  document.getElementById("exp-fill").style.width = (state.exp / need * 100) + "%";
  document.getElementById("stat-atk").textContent = s.atk;
  document.getElementById("stat-def").textContent = s.def;
  document.getElementById("stat-gold").textContent = state.gold;
}

function renderAreas() {
  const wrap = document.getElementById("area-list");
  wrap.innerHTML = "";
  for (const a of AREAS) {
    const locked = state.level < a.reqLevel;
    const card = document.createElement("div");
    card.className = "area-card" + (locked ? " locked" : "");
    card.innerHTML = `
      <div class="area-info">
        <h4>${a.icon} ${a.name}</h4>
        <div class="sub">${locked ? `🔒 Lv.${a.reqLevel} で解放` : a.desc}</div>
      </div>`;
    const btn = document.createElement("button");
    btn.className = "action";
    btn.textContent = locked ? "未開放" : "戦いに行く";
    btn.disabled = locked;
    btn.onclick = () => startBattle(a.id);
    card.appendChild(btn);
    wrap.appendChild(card);
  }
}

function statusIcons(enemy) {
  return enemy.statuses.map(s => {
    if (s.kind === "poison") return `🟢×${s.turns}`;
    if (s.kind === "burn") return `🔥×${s.turns}`;
    if (s.kind === "stun") return `💫`;
    return "";
  }).join(" ");
}

function renderBattle() {
  const wrap = document.getElementById("battle");
  if (!battle) { wrap.classList.add("hidden"); return; }
  wrap.classList.remove("hidden");
  const s = derivedStats();
  const e = battle.enemy;
  const wt = weaponType();
  const elem = weaponElement();

  wrap.innerHTML = `
    <div class="combatants">
      <div class="fighter player">
        <div class="sprite">🧑‍🌾</div>
        <div class="fname">あなた</div>
        <div class="fbar"><div style="width:${state.hp / s.maxHp * 100}%"></div></div>
        <div class="sub">HP ${state.hp}/${s.maxHp}　MP ${state.mp}/${s.maxMp}</div>
        <div class="sub wmeta">${wt.name}${elem ? " " + elemLabel(elem) : ""}</div>
      </div>
      <div class="vs">VS</div>
      <div class="fighter enemy">
        <div class="sprite">${e.sprite}</div>
        <div class="fname">${e.name}</div>
        <div class="fbar"><div style="width:${e.hp / e.maxHp * 100}%"></div></div>
        <div class="sub">HP ${e.hp}/${e.maxHp}</div>
        <div class="sub">弱点 ${elemLabel(e.weak)} ${statusIcons(e)}</div>
      </div>
    </div>
    <div class="battle-actions" id="battle-actions"></div>`;

  const actions = document.getElementById("battle-actions");

  if (battle.showSkills) {
    const skills = wt.skills || [];
    if (skills.length === 0) {
      const note = document.createElement("div");
      note.className = "empty-note";
      note.textContent = "この武器で使えるスキルはない。";
      actions.appendChild(note);
    }
    for (const sid of skills) {
      const sk = SKILLS[sid];
      const b = document.createElement("button");
      b.className = "action skill-btn";
      b.disabled = state.mp < sk.mp;
      b.innerHTML = `${sk.icon} ${sk.name} <span class="mpcost">MP${sk.mp}</span><span class="skdesc">${sk.desc}</span>`;
      b.onclick = () => actSkill(sid);
      actions.appendChild(b);
    }
    const back = document.createElement("button");
    back.className = "action secondary";
    back.textContent = "↩ 戻る";
    back.onclick = () => { battle.showSkills = false; renderBattle(); };
    actions.appendChild(back);
  } else {
    const mk = (label, fn, cls = "action") => {
      const b = document.createElement("button");
      b.className = cls;
      b.textContent = label;
      b.onclick = fn;
      return b;
    };
    actions.appendChild(mk("⚔ 攻撃", actAttack));
    const hasSkill = (wt.skills || []).length > 0;
    const sb = mk("✨ スキル", () => { battle.showSkills = true; renderBattle(); });
    sb.disabled = !hasSkill;
    actions.appendChild(sb);
    actions.appendChild(mk("🛡 防御", actDefend, "action secondary"));
    actions.appendChild(mk("🏃 逃げる", fleeBattle, "action secondary"));
  }
}

function renderGather() {
  const chipRow = document.getElementById("gather-area-list");
  chipRow.innerHTML = "";
  for (const a of AREAS) {
    const locked = state.level < a.reqLevel;
    const chip = document.createElement("div");
    chip.className = "chip" + (a.id === state.currentGatherArea ? " active" : "") + (locked ? " locked" : "");
    chip.textContent = `${a.icon} ${a.name}` + (locked ? ` 🔒Lv${a.reqLevel}` : "");
    if (!locked) chip.onclick = () => { state.currentGatherArea = a.id; save(); renderGather(); };
    chipRow.appendChild(chip);
  }
  const grid = document.getElementById("gather-nodes");
  grid.innerHTML = "";
  const area = AREAS.find(a => a.id === state.currentGatherArea);
  if (state.level < area.reqLevel) { state.currentGatherArea = "grassland"; return renderGather(); }
  for (const n of area.nodes) {
    const have = toolTier(n.tool);
    const ok = have >= n.tier;
    const toolName = n.tool === "axe" ? "斧" : "ピッケル";
    const yieldStr = n.yields.map(y => MATERIALS[y.mat].icon).join(" ");
    const card = document.createElement("div");
    card.className = "node-card";
    card.innerHTML = `
      <div class="icon">${n.icon}</div>
      <h4>${n.name}</h4>
      <div class="sub">採れる: ${yieldStr}<br>必要: ${toolName} ランク${n.tier}</div>`;
    const btn = document.createElement("button");
    btn.className = "action";
    btn.textContent = ok ? "採集する" : `${toolName}が足りない`;
    btn.disabled = !ok;
    btn.onclick = () => gather(area.id, n.id);
    card.appendChild(btn);
    grid.appendChild(card);
  }
}

function renderCraft() {
  const wrap = document.getElementById("recipe-list");
  wrap.innerHTML = "";
  const order = ["axe", "pickaxe", "weapon", "armor"];
  const sorted = [...RECIPES].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  for (const r of sorted) {
    const ok = canCraft(r);
    const owned = state.owned.includes(r.id);
    const costStr = Object.entries(r.cost).map(([m, q]) => {
      const lack = matQty(m) < q;
      return `<span class="${lack ? "lack" : ""}">${MATERIALS[m].icon}${MATERIALS[m].name} ${matQty(m)}/${q}</span>`;
    }).join("　");
    const typeLabel = { axe: "斧", pickaxe: "ピッケル", weapon: "武器", armor: "防具" }[r.type];
    const card = document.createElement("div");
    card.className = "recipe-card" + (owned ? " owned" : "");
    card.innerHTML = `
      <div class="gicon">${r.icon}</div>
      <div class="rinfo">
        <h4>${r.name} <span class="ttag">[${typeLabel}]</span></h4>
        <div class="effect">${gearEffectText(r)}${owned ? "　✔作成済み" : ""}</div>
        <div class="cost">${costStr}</div>
      </div>`;
    const btn = document.createElement("button");
    btn.className = "action";
    btn.textContent = "作成";
    btn.disabled = !ok;
    btn.onclick = () => craft(r.id);
    card.appendChild(btn);
    wrap.appendChild(card);
  }
}

function renderEquip() {
  const slots = [
    { key: "weapon", label: "武器" }, { key: "armor", label: "防具" },
    { key: "axe", label: "斧" }, { key: "pickaxe", label: "ピッケル" },
  ];
  const wrap = document.getElementById("equip-slots");
  wrap.innerHTML = "";
  for (const sl of slots) {
    const id = state.equipped[sl.key];
    const r = id ? RECIPE_BY_ID[id] : null;
    const div = document.createElement("div");
    div.className = "slot";
    div.innerHTML = `
      <div class="slot-name">${sl.label}</div>
      <div class="slot-item ${r ? "" : "empty"}">${r ? r.icon + " " + r.name : "なし"}</div>`;
    wrap.appendChild(div);
  }
  const gearWrap = document.getElementById("owned-gear");
  gearWrap.innerHTML = "";
  if (state.owned.length === 0) {
    gearWrap.innerHTML = `<div class="empty-note">まだ何も作っていない。「作成」タブで装備や道具を作ろう。</div>`;
    return;
  }
  for (const id of state.owned) {
    const r = RECIPE_BY_ID[id];
    const slot = r.type === "weapon" ? "weapon" : r.type === "armor" ? "armor" : r.type;
    const equipped = state.equipped[slot] === id;
    const card = document.createElement("div");
    card.className = "gear-card";
    card.innerHTML = `
      <div class="gicon">${r.icon}</div>
      <div class="ginfo">
        <h4>${r.name}</h4>
        <div class="effect">${gearEffectText(r)}</div>
      </div>`;
    if (equipped) {
      const tag = document.createElement("span");
      tag.className = "equipped-tag";
      tag.textContent = "装備中";
      card.appendChild(tag);
    } else {
      const btn = document.createElement("button");
      btn.className = "action secondary";
      btn.textContent = "装備する";
      btn.onclick = () => equipItem(id);
      card.appendChild(btn);
    }
    gearWrap.appendChild(card);
  }
}

function renderBag() {
  const wrap = document.getElementById("material-list");
  wrap.innerHTML = "";
  const entries = Object.entries(state.materials).filter(([, q]) => q > 0);
  if (entries.length === 0) {
    wrap.innerHTML = `<div class="empty-note">素材を持っていない。「採集」や「探索」で集めよう。</div>`;
    return;
  }
  for (const mid of Object.keys(MATERIALS)) {
    const q = matQty(mid);
    if (q <= 0) continue;
    const card = document.createElement("div");
    card.className = "mat-card";
    card.innerHTML = `
      <div class="icon">${MATERIALS[mid].icon}</div>
      <div class="mname">${MATERIALS[mid].name}</div>
      <div class="mqty">×${q}</div>`;
    wrap.appendChild(card);
  }
}

function renderAll() {
  renderStatus(); renderAreas(); renderBattle();
  renderGather(); renderCraft(); renderEquip(); renderBag();
}

/* ---------- タブ切替 ---------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  };
});

/* ---------- リセット ---------- */
document.getElementById("reset-btn").onclick = () => {
  if (confirm("本当に最初からやり直しますか？セーブデータは消えます。")) {
    state = newGame(); battle = null; save();
    log("ゲームをリセットした。", "l-sys");
    renderAll();
  }
};

/* ---------- 起動 ---------- */
clampVitals();
renderAll();
log("ようこそ！まず『採集』で素材を集め、『作成』で武器や道具を作ろう。武器の種類で戦い方が変わるぞ。", "l-sys");
