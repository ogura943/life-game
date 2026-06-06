/* =========================================================
   ファンタジーライフ風ゲーム
   採集 → 装備作成 → 強化 → 戦闘 のループを楽しむブラウザゲーム
   ========================================================= */

/* ---------- データ定義 ---------- */

// 素材マスター
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

// 道具のランク（採集力）。bare=素手
const TOOL_TIER = { bare: 0, copper: 1, iron: 2, mithril: 3 };

// 採集ノード： tool=必要な道具種別(axe/pickaxe), tier=必要ランク, yields=[{mat, min, max, chance}]
// エリア定義
const AREAS = [
  {
    id: "grassland",
    name: "はじまりの草原",
    icon: "🌿",
    reqLevel: 1,
    desc: "弱いモンスターと基本素材の宝庫。",
    nodes: [
      { id: "g-tree", name: "若木", icon: "🌲", tool: "axe", tier: 0,
        yields: [{ mat: "wood", min: 1, max: 3, chance: 1 }] },
      { id: "g-rock", name: "石ころ", icon: "🪨", tool: "pickaxe", tier: 0,
        yields: [{ mat: "stone", min: 1, max: 2, chance: 1 }] },
    ],
    monsters: [
      { name: "スライム", sprite: "🟢", hp: 18, atk: 4, def: 0, exp: 6, gold: 5,
        drops: [{ mat: "gel", min: 1, max: 2, chance: .9 }] },
      { name: "ホーンラビット", sprite: "🐰", hp: 24, atk: 6, def: 1, exp: 9, gold: 8,
        drops: [{ mat: "pelt", min: 1, max: 1, chance: .7 }, { mat: "fang", min: 1, max: 1, chance: .3 }] },
    ],
  },
  {
    id: "forest",
    name: "ささやきの森",
    icon: "🌳",
    reqLevel: 4,
    desc: "硬い木材と手強い獣たち。斧があると効率的。",
    nodes: [
      { id: "f-tree", name: "大樹", icon: "🌳", tool: "axe", tier: 1,
        yields: [{ mat: "wood", min: 2, max: 4, chance: 1 }, { mat: "hardwood", min: 1, max: 2, chance: .8 }] },
      { id: "f-rock", name: "苔むした岩", icon: "🪨", tool: "pickaxe", tier: 1,
        yields: [{ mat: "stone", min: 2, max: 3, chance: 1 }, { mat: "shard", min: 1, max: 1, chance: .25 }] },
    ],
    monsters: [
      { name: "ゴブリン", sprite: "👺", hp: 40, atk: 10, def: 3, exp: 18, gold: 14,
        drops: [{ mat: "fang", min: 1, max: 2, chance: .7 }, { mat: "shard", min: 1, max: 1, chance: .3 }] },
      { name: "森オオカミ", sprite: "🐺", hp: 55, atk: 14, def: 4, exp: 26, gold: 20,
        drops: [{ mat: "pelt", min: 1, max: 3, chance: .9 }, { mat: "fang", min: 1, max: 2, chance: .6 }] },
    ],
  },
  {
    id: "mountain",
    name: "嶮しい岩山",
    icon: "⛰️",
    reqLevel: 9,
    desc: "鉄やクリスタルが眠る危険地帯。強いピッケルが必要。",
    nodes: [
      { id: "m-rock", name: "鉄鉱脈", icon: "⛏️", tool: "pickaxe", tier: 2,
        yields: [{ mat: "iron", min: 1, max: 3, chance: 1 }, { mat: "stone", min: 1, max: 2, chance: .8 }] },
      { id: "m-crystal", name: "輝く晶洞", icon: "💎", tool: "pickaxe", tier: 2,
        yields: [{ mat: "crystal", min: 1, max: 1, chance: .5 }, { mat: "shard", min: 1, max: 2, chance: .7 }] },
      { id: "m-tree", name: "古木", icon: "🌲", tool: "axe", tier: 2,
        yields: [{ mat: "hardwood", min: 2, max: 3, chance: 1 }] },
    ],
    monsters: [
      { name: "オーク", sprite: "👹", hp: 90, atk: 20, def: 8, exp: 45, gold: 35,
        drops: [{ mat: "fang", min: 2, max: 3, chance: .8 }, { mat: "iron", min: 1, max: 2, chance: .4 }] },
      { name: "ロックゴーレム", sprite: "🗿", hp: 140, atk: 26, def: 14, exp: 70, gold: 55,
        drops: [{ mat: "stone", min: 3, max: 5, chance: 1 }, { mat: "iron", min: 1, max: 3, chance: .6 }, { mat: "crystal", min: 1, max: 1, chance: .25 }] },
    ],
  },
  {
    id: "volcano",
    name: "竜の棲む火口",
    icon: "🌋",
    reqLevel: 16,
    desc: "最強の素材ミスリルと、伝説の竜が待つ。",
    nodes: [
      { id: "v-rock", name: "ミスリル鉱脈", icon: "🔷", tool: "pickaxe", tier: 3,
        yields: [{ mat: "mithril", min: 1, max: 2, chance: .8 }, { mat: "iron", min: 1, max: 3, chance: 1 }] },
      { id: "v-crystal", name: "竜晶", icon: "💎", tool: "pickaxe", tier: 3,
        yields: [{ mat: "crystal", min: 1, max: 2, chance: .8 }] },
    ],
    monsters: [
      { name: "ヘルハウンド", sprite: "🐕", hp: 200, atk: 34, def: 16, exp: 110, gold: 90,
        drops: [{ mat: "fang", min: 3, max: 5, chance: 1 }, { mat: "crystal", min: 1, max: 2, chance: .4 }] },
      { name: "炎竜ヴァルガ", sprite: "🐉", hp: 380, atk: 48, def: 24, exp: 260, gold: 220,
        drops: [{ mat: "mithril", min: 2, max: 4, chance: 1 }, { mat: "crystal", min: 2, max: 3, chance: .8 }] },
    ],
  },
];

// レシピ： type=weapon/armor/axe/pickaxe, stats={atk,def}, tier(道具用), cost={mat:qty}
const RECIPES = [
  // --- 道具：斧 ---
  { id: "axe_copper", name: "銅の斧", icon: "🪓", type: "axe", tier: 1,
    cost: { wood: 3, stone: 2 }, desc: "森の大樹を伐れる。" },
  { id: "axe_iron", name: "鉄の斧", icon: "🪓", type: "axe", tier: 2,
    cost: { hardwood: 2, iron: 3 }, desc: "古木すら伐り倒す。" },
  { id: "axe_mithril", name: "ミスリルの斧", icon: "🪓", type: "axe", tier: 3,
    cost: { hardwood: 4, mithril: 2 }, desc: "あらゆる木を伐採可能。" },
  // --- 道具：ピッケル ---
  { id: "pick_copper", name: "銅のピッケル", icon: "⛏️", type: "pickaxe", tier: 1,
    cost: { wood: 2, stone: 3 }, desc: "森の岩を掘れる。" },
  { id: "pick_iron", name: "鉄のピッケル", icon: "⛏️", type: "pickaxe", tier: 2,
    cost: { hardwood: 2, iron: 4 }, desc: "鉄鉱脈や晶洞を掘れる。" },
  { id: "pick_mithril", name: "ミスリルのピッケル", icon: "⛏️", type: "pickaxe", tier: 3,
    cost: { iron: 5, mithril: 2 }, desc: "ミスリル鉱脈を掘れる。" },
  // --- 武器 ---
  { id: "w_wood", name: "木の剣", icon: "🗡️", type: "weapon", stats: { atk: 4 },
    cost: { wood: 4 }, desc: "ATK +4" },
  { id: "w_stone", name: "石の戦斧", icon: "🪓", type: "weapon", stats: { atk: 8 },
    cost: { wood: 3, stone: 5 }, desc: "ATK +8" },
  { id: "w_iron", name: "鉄の剣", icon: "⚔️", type: "weapon", stats: { atk: 16 },
    cost: { iron: 4, hardwood: 2, fang: 2 }, desc: "ATK +16" },
  { id: "w_crystal", name: "クリスタルブレード", icon: "🗡️", type: "weapon", stats: { atk: 28 },
    cost: { iron: 3, crystal: 2, shard: 3 }, desc: "ATK +28" },
  { id: "w_dragon", name: "竜殺しの大剣", icon: "⚔️", type: "weapon", stats: { atk: 46 },
    cost: { mithril: 3, crystal: 3, fang: 5 }, desc: "ATK +46" },
  // --- 防具 ---
  { id: "a_leather", name: "革の鎧", icon: "🦺", type: "armor", stats: { def: 4, hp: 10 },
    cost: { pelt: 4 }, desc: "DEF +4 / 最大HP +10" },
  { id: "a_stone", name: "石板の鎧", icon: "🛡️", type: "armor", stats: { def: 9, hp: 20 },
    cost: { stone: 6, pelt: 3 }, desc: "DEF +9 / 最大HP +20" },
  { id: "a_iron", name: "鉄の鎧", icon: "🛡️", type: "armor", stats: { def: 16, hp: 35 },
    cost: { iron: 6, pelt: 4 }, desc: "DEF +16 / 最大HP +35" },
  { id: "a_crystal", name: "クリスタルメイル", icon: "🛡️", type: "armor", stats: { def: 26, hp: 60 },
    cost: { iron: 4, crystal: 2, shard: 4 }, desc: "DEF +26 / 最大HP +60" },
  { id: "a_dragon", name: "竜鱗の鎧", icon: "🛡️", type: "armor", stats: { def: 40, hp: 100 },
    cost: { mithril: 4, crystal: 2, pelt: 6 }, desc: "DEF +40 / 最大HP +100" },
];

const RECIPE_BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));

/* ---------- セーブ＆ステート ---------- */

const SAVE_KEY = "fantasy-life-save-v1";

const BASE_STATS = { atk: 5, def: 2, maxHp: 30 };

function newGame() {
  return {
    level: 1,
    exp: 0,
    hp: BASE_STATS.maxHp,
    gold: 0,
    materials: {},          // {matId: qty}
    owned: [],              // 作成済み装備・道具のレシピid配列
    equipped: { weapon: null, armor: null, axe: null, pickaxe: null },
    currentGatherArea: "grassland",
  };
}

let state = loadGame();
let battle = null; // 戦闘中の一時状態

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return Object.assign(newGame(), JSON.parse(raw));
  } catch (e) { /* ignore */ }
  return newGame();
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* ---------- 計算系ヘルパー ---------- */

function expToNext(level) { return Math.floor(10 * Math.pow(level, 1.5)); }

function derivedStats() {
  let atk = BASE_STATS.atk;
  let def = BASE_STATS.def;
  let maxHp = BASE_STATS.maxHp;
  // レベルボーナス
  atk += (state.level - 1) * 2;
  def += (state.level - 1) * 1;
  maxHp += (state.level - 1) * 8;
  // 装備ボーナス
  for (const slot of ["weapon", "armor"]) {
    const id = state.equipped[slot];
    if (id && RECIPE_BY_ID[id]) {
      const s = RECIPE_BY_ID[id].stats || {};
      atk += s.atk || 0;
      def += s.def || 0;
      maxHp += s.hp || 0;
    }
  }
  return { atk, def, maxHp };
}

function toolTier(kind) { // kind = axe/pickaxe
  const id = state.equipped[kind];
  if (id && RECIPE_BY_ID[id]) return RECIPE_BY_ID[id].tier;
  return 0; // 素手
}

function matQty(id) { return state.materials[id] || 0; }
function addMat(id, n) { state.materials[id] = matQty(id) + n; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

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
  while (state.exp >= expToNext(state.level)) {
    state.exp -= expToNext(state.level);
    state.level++;
    leveled = true;
  }
  if (leveled) {
    state.hp = derivedStats().maxHp; // レベルアップで全回復
    log(`🎉 レベルアップ！ Lv.${state.level} になった（HP全回復）`, "l-good");
    toast(`Lv.${state.level} に上がった！`);
    checkAreaUnlocks();
  }
}

let unlockedSnapshot = new Set();
function checkAreaUnlocks() {
  for (const a of AREAS) {
    if (state.level >= a.reqLevel && !unlockedSnapshot.has(a.id)) {
      unlockedSnapshot.add(a.id);
    }
  }
}

/* ---------- 採集 ---------- */

function gather(areaId, nodeId) {
  const area = AREAS.find(a => a.id === areaId);
  const node = area.nodes.find(n => n.id === nodeId);
  const have = toolTier(node.tool);
  if (have < node.tier) {
    const toolName = node.tool === "axe" ? "斧" : "ピッケル";
    toast(`もっと良い${toolName}が必要だ`);
    log(`${node.name} には ランク${node.tier} 以上の${node.tool === "axe" ? "斧" : "ピッケル"}が必要。`, "l-bad");
    return;
  }
  // 道具ランクが高いほどボーナス
  const bonus = have - node.tier; // 0以上
  let got = [];
  for (const y of node.yields) {
    if (Math.random() <= y.chance) {
      let amount = rand(y.min, y.max) + Math.floor(bonus * 0.7);
      addMat(y.mat, amount);
      got.push(`${MATERIALS[y.mat].icon}${MATERIALS[y.mat].name} ×${amount}`);
    }
  }
  if (got.length) {
    log(`⛏ ${node.name}から ${got.join(" / ")} を採集した。`, "l-good");
    gainExp(2);
  } else {
    log(`${node.name}からは何も採れなかった…`, "l-sys");
  }
  save();
  renderAll();
}

/* ---------- 戦闘 ---------- */

function startBattle(areaId) {
  const area = AREAS.find(a => a.id === areaId);
  const m = area.monsters[rand(0, area.monsters.length - 1)];
  battle = {
    areaId,
    enemy: { ...m, maxHp: m.hp, hp: m.hp },
    over: false,
  };
  log(`⚔ ${m.name} が現れた！`, "l-sys");
  renderBattle();
  document.getElementById("area-list").classList.add("hidden");
}

function playerAttack() {
  if (!battle || battle.over) return;
  const ps = derivedStats();
  const e = battle.enemy;
  // プレイヤーの攻撃
  let dmg = Math.max(1, ps.atk - e.def + rand(-2, 2));
  e.hp = Math.max(0, e.hp - dmg);
  log(`${e.name} に ${dmg} ダメージ！`, "l-good");
  if (e.hp <= 0) { winBattle(); return; }
  // 敵の反撃
  let edmg = Math.max(1, e.atk - ps.def + rand(-2, 2));
  state.hp = Math.max(0, state.hp - edmg);
  log(`${e.name} の反撃！ ${edmg} ダメージを受けた。`, "l-bad");
  if (state.hp <= 0) { loseBattle(); return; }
  renderBattle();
  renderStatus();
  save();
}

function winBattle() {
  const e = battle.enemy;
  battle.over = true;
  log(`✨ ${e.name} を倒した！`, "l-good");
  // ドロップ
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
  log(`💀 倒れてしまった…拠点に戻り、HPが回復した。`, "l-bad");
  state.hp = derivedStats().maxHp;
  // ペナルティ：所持ゴールドの一部
  const lost = Math.floor(state.gold * 0.2);
  state.gold -= lost;
  if (lost > 0) log(`動揺して ${lost}G を落とした。`, "l-gold");
  toast("やられてしまった…");
  save();
  endBattleUI();
}

function fleeBattle() {
  if (!battle) return;
  log(`🏃 ${battle.enemy.name} から逃げ出した。`, "l-sys");
  battle = null;
  endBattleUI();
}

function endBattleUI() {
  battle = null;
  document.getElementById("battle").classList.add("hidden");
  document.getElementById("area-list").classList.remove("hidden");
  renderAll();
}

/* ---------- 作成 ---------- */

function canCraft(recipe) {
  return Object.entries(recipe.cost).every(([m, q]) => matQty(m) >= q);
}

function craft(recipeId) {
  const r = RECIPE_BY_ID[recipeId];
  if (!canCraft(r)) { toast("素材が足りない"); return; }
  for (const [m, q] of Object.entries(r.cost)) addMat(m, -q);
  if (!state.owned.includes(recipeId)) state.owned.push(recipeId);
  log(`🔨 ${r.name} を作成した！`, "l-good");
  toast(`${r.name} を作った！`);
  // 道具・装備は作ったら自動装備（より強ければ）
  autoEquipIfBetter(r);
  gainExp(5);
  save();
  renderAll();
}

function autoEquipIfBetter(r) {
  const slot = r.type === "weapon" ? "weapon"
            : r.type === "armor" ? "armor"
            : r.type; // axe / pickaxe
  const cur = state.equipped[slot];
  if (!cur) { state.equipped[slot] = r.id; return; }
  const curR = RECIPE_BY_ID[cur];
  const score = x => (x.tier || 0) * 100 + (x.stats?.atk || 0) + (x.stats?.def || 0) + (x.stats?.hp || 0);
  if (score(r) > score(curR)) state.equipped[slot] = r.id;
}

function equipItem(recipeId) {
  const r = RECIPE_BY_ID[recipeId];
  const slot = r.type === "weapon" ? "weapon" : r.type === "armor" ? "armor" : r.type;
  state.equipped[slot] = recipeId;
  // HPが最大を超えないよう調整
  state.hp = Math.min(state.hp, derivedStats().maxHp);
  log(`${r.name} を装備した。`, "l-sys");
  save();
  renderAll();
}

/* ---------- レンダリング ---------- */

function renderStatus() {
  const s = derivedStats();
  state.hp = Math.min(state.hp, s.maxHp);
  document.getElementById("stat-level").textContent = state.level;
  document.getElementById("stat-hp").textContent = `${state.hp}/${s.maxHp}`;
  document.getElementById("hp-fill").style.width = (state.hp / s.maxHp * 100) + "%";
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

function renderBattle() {
  const wrap = document.getElementById("battle");
  if (!battle) { wrap.classList.add("hidden"); return; }
  wrap.classList.remove("hidden");
  const s = derivedStats();
  const e = battle.enemy;
  wrap.innerHTML = `
    <div class="combatants">
      <div class="fighter player">
        <div class="sprite">🧑‍🌾</div>
        <div class="fname">あなた</div>
        <div class="fbar"><div style="width:${state.hp / s.maxHp * 100}%"></div></div>
        <div class="sub">HP ${state.hp}/${s.maxHp}</div>
      </div>
      <div class="vs">VS</div>
      <div class="fighter enemy">
        <div class="sprite">${e.sprite}</div>
        <div class="fname">${e.name}</div>
        <div class="fbar"><div style="width:${e.hp / e.maxHp * 100}%"></div></div>
        <div class="sub">HP ${e.hp}/${e.maxHp}</div>
      </div>
    </div>
    <div class="battle-actions">
      <button class="action" id="btn-attack">⚔ 攻撃する</button>
      <button class="action secondary" id="btn-flee">🏃 逃げる</button>
    </div>`;
  document.getElementById("btn-attack").onclick = playerAttack;
  document.getElementById("btn-flee").onclick = fleeBattle;
}

function renderGather() {
  // エリアチップ
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
  // ノード
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
        <h4>${r.name} <span style="color:var(--muted);font-size:11px;font-weight:400">[${typeLabel}]</span></h4>
        <div class="effect">${r.desc}${owned ? "　✔作成済み" : ""}</div>
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
    { key: "weapon", label: "武器" },
    { key: "armor", label: "防具" },
    { key: "axe", label: "斧" },
    { key: "pickaxe", label: "ピッケル" },
  ];
  const wrap = document.getElementById("equip-slots");
  wrap.innerHTML = "";
  for (const s of slots) {
    const id = state.equipped[s.key];
    const r = id ? RECIPE_BY_ID[id] : null;
    const div = document.createElement("div");
    div.className = "slot";
    div.innerHTML = `
      <div class="slot-name">${s.label}</div>
      <div class="slot-item ${r ? "" : "empty"}">${r ? r.icon + " " + r.name : "なし"}</div>`;
    wrap.appendChild(div);
  }
  // 所持装備
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
        <div class="effect">${r.desc}</div>
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
  // MATERIALS定義順で表示
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
  renderStatus();
  renderAreas();
  renderBattle();
  renderGather();
  renderCraft();
  renderEquip();
  renderBag();
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
    state = newGame();
    battle = null;
    save();
    log("ゲームをリセットした。", "l-sys");
    renderAll();
  }
};

/* ---------- 起動 ---------- */

checkAreaUnlocks();
renderAll();
log("ようこそ！まずは『採集』で木と石を集め、『作成』で道具と武器を作ろう。", "l-sys");
