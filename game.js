/* =========================================================
   ファンタジーライフ風ゲーム
   採集 → 装備作成 → 強化 → 戦闘 のループを楽しむブラウザゲーム

   戦闘の特徴:
   - 武器タイプ(剣/斧/槍/弓/杖/短剣)で戦い方が変わる
   - MP を使うスキル、防御コマンド、道具(アイテム)コマンド
   - 会心(クリティカル) と 状態異常(毒/火傷/スタン)…敵にも自分にも起こる
   - 属性(炎/氷/雷) と モンスターの弱点(1.5倍)/耐性(0.5倍)
   - 各エリアのボス戦
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
  soul:      { name: "ボスの魂",      icon: "🔆" },
};

/* ---------- 属性 ---------- */
const ELEMENTS = {
  fire:      { name: "炎", icon: "🔥" },
  ice:       { name: "氷", icon: "❄️" },
  lightning: { name: "雷", icon: "⚡" },
};
function elemLabel(e) { return e && ELEMENTS[e] ? ELEMENTS[e].icon + ELEMENTS[e].name : "—"; }

/* ---------- 武器タイプ（戦い方の違い） ---------- */
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

/* ---------- お店の品 ---------- */
const SHOP = [
  { id: "potion_hp", name: "回復ポーション", icon: "🧪", price: 80,  kind: "consumable", desc: "戦闘中：HPを50%回復" },
  { id: "potion_mp", name: "マナポーション", icon: "🔵", price: 70,  kind: "consumable", desc: "戦闘中：MPを50%回復" },
  { id: "antidote",  name: "万能薬",         icon: "💊", price: 50,  kind: "consumable", desc: "戦闘中：自分の状態異常を治す" },
  { id: "elixir",    name: "エリクサー",     icon: "✨", price: 220, kind: "consumable", desc: "戦闘中：HP/MPを全回復" },
  { id: "seed_atk",  name: "ちからの種",     icon: "🌰", price: 150, kind: "perm", stat: "atk", val: 2,  desc: "恒久的に ATK +2" },
  { id: "seed_def",  name: "まもりの種",     icon: "🌱", price: 150, kind: "perm", stat: "def", val: 2,  desc: "恒久的に DEF +2" },
  { id: "seed_hp",   name: "いのちの種",     icon: "🫘", price: 180, kind: "perm", stat: "hp",  val: 15, desc: "恒久的に 最大HP +15" },
];
const SHOP_BY_ID = Object.fromEntries(SHOP.map(s => [s.id, s]));

/* ---------- エリア（通常モンスター＋ボス） ---------- */
const AREAS = [
  {
    id: "grassland", name: "はじまりの草原", icon: "🌿", reqLevel: 1,
    desc: "弱いモンスターと基本素材の宝庫。",
    nodes: [
      { id: "g-tree", name: "若木", icon: "🌲", tool: "axe", tier: 0, yields: [{ mat: "wood", min: 1, max: 3, chance: 1 }] },
      { id: "g-rock", name: "石ころ", icon: "🪨", tool: "pickaxe", tier: 0, yields: [{ mat: "stone", min: 1, max: 2, chance: 1 }] },
    ],
    monsters: [
      { name: "スライム", sprite: "🟢", hp: 18, atk: 4, def: 0, exp: 8, gold: 6, weak: "fire", resist: "ice",
        drops: [{ mat: "gel", min: 1, max: 2, chance: .9 }] },
      { name: "ホーンラビット", sprite: "🐰", hp: 24, atk: 6, def: 1, exp: 12, gold: 10, weak: "lightning",
        drops: [{ mat: "pelt", min: 1, max: 1, chance: .7 }, { mat: "fang", min: 1, max: 1, chance: .3 }] },
    ],
    boss: { name: "キングスライム", sprite: "👑🟢", hp: 130, atk: 12, def: 4, exp: 90, gold: 70,
      phase2: { name: "キングスライム・覚醒", hp: 210, atk: 18, def: 6, inflict: "poison", inflictChance: .4 },
      weak: "fire", resist: "ice", inflict: "poison", inflictChance: .35,
      drops: [{ mat: "gel", min: 4, max: 6, chance: 1 }, { mat: "shard", min: 1, max: 2, chance: .8 }, { mat: "soul", min: 1, max: 1, chance: 1 }] },
  },
  {
    id: "forest", name: "ささやきの森", icon: "🌳", reqLevel: 4,
    desc: "硬い木材と手強い獣たち。斧があると効率的。",
    nodes: [
      { id: "f-tree", name: "大樹", icon: "🌳", tool: "axe", tier: 1, yields: [{ mat: "wood", min: 2, max: 4, chance: 1 }, { mat: "hardwood", min: 1, max: 2, chance: .8 }] },
      { id: "f-rock", name: "苔むした岩", icon: "🪨", tool: "pickaxe", tier: 1, yields: [{ mat: "stone", min: 2, max: 3, chance: 1 }, { mat: "shard", min: 1, max: 1, chance: .25 }] },
    ],
    monsters: [
      { name: "ゴブリン", sprite: "👺", hp: 40, atk: 10, def: 3, exp: 22, gold: 16, weak: "fire", resist: "lightning",
        drops: [{ mat: "fang", min: 1, max: 2, chance: .7 }, { mat: "shard", min: 1, max: 1, chance: .3 }] },
      { name: "森オオカミ", sprite: "🐺", hp: 55, atk: 14, def: 4, exp: 30, gold: 22, weak: "ice",
        drops: [{ mat: "pelt", min: 1, max: 3, chance: .9 }, { mat: "fang", min: 1, max: 2, chance: .6 }] },
    ],
    boss: { name: "ゴブリンキング", sprite: "👑👺", hp: 280, atk: 24, def: 9, exp: 200, gold: 160,
      phase2: { name: "ゴブリンロード", hp: 400, atk: 33, def: 13, inflict: "stun", inflictChance: .35 },
      weak: "fire", resist: "lightning", inflict: "stun", inflictChance: .3,
      drops: [{ mat: "iron", min: 2, max: 4, chance: 1 }, { mat: "shard", min: 2, max: 3, chance: 1 }, { mat: "soul", min: 1, max: 2, chance: 1 }] },
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
      { name: "オーク", sprite: "👹", hp: 90, atk: 20, def: 8, exp: 45, gold: 35, weak: "ice", resist: "fire",
        drops: [{ mat: "fang", min: 2, max: 3, chance: .8 }, { mat: "iron", min: 1, max: 2, chance: .4 }] },
      { name: "ロックゴーレム", sprite: "🗿", hp: 140, atk: 26, def: 14, exp: 70, gold: 55, weak: "lightning", resist: "ice",
        drops: [{ mat: "stone", min: 3, max: 5, chance: 1 }, { mat: "iron", min: 1, max: 3, chance: .6 }, { mat: "crystal", min: 1, max: 1, chance: .25 }] },
    ],
    boss: { name: "ゴーレムロード", sprite: "👑🗿", hp: 560, atk: 36, def: 20, exp: 460, gold: 360,
      phase2: { name: "ゴーレムロード・超硬", hp: 820, atk: 50, def: 30, inflict: "stun", inflictChance: .4 },
      weak: "lightning", resist: "fire", inflict: "stun", inflictChance: .35,
      drops: [{ mat: "crystal", min: 2, max: 4, chance: 1 }, { mat: "iron", min: 3, max: 5, chance: 1 }, { mat: "soul", min: 2, max: 3, chance: 1 }] },
  },
  {
    id: "volcano", name: "竜の棲む火口", icon: "🌋", reqLevel: 16,
    desc: "最強の素材ミスリルと、伝説の竜が待つ。",
    nodes: [
      { id: "v-rock", name: "ミスリル鉱脈", icon: "🔷", tool: "pickaxe", tier: 3, yields: [{ mat: "mithril", min: 1, max: 2, chance: .8 }, { mat: "iron", min: 1, max: 3, chance: 1 }] },
      { id: "v-crystal", name: "竜晶", icon: "💎", tool: "pickaxe", tier: 3, yields: [{ mat: "crystal", min: 1, max: 2, chance: .8 }] },
    ],
    monsters: [
      { name: "ヘルハウンド", sprite: "🐕", hp: 200, atk: 34, def: 16, exp: 110, gold: 90, weak: "ice", resist: "fire", atkElement: "fire",
        drops: [{ mat: "fang", min: 3, max: 5, chance: 1 }, { mat: "crystal", min: 1, max: 2, chance: .4 }] },
      { name: "炎竜ヴァルガ", sprite: "🐉", hp: 380, atk: 48, def: 24, exp: 260, gold: 220, weak: "ice", resist: "fire", inflict: "burn", inflictChance: .3, atkElement: "fire",
        drops: [{ mat: "mithril", min: 2, max: 4, chance: 1 }, { mat: "crystal", min: 2, max: 3, chance: .8 }] },
    ],
    boss: { name: "古龍ヴァルガ＝レクス", sprite: "👑🐲", hp: 1100, atk: 62, def: 30, exp: 1200, gold: 900,
      weak: "ice", resist: "fire", inflict: "burn", inflictChance: .45, atkElement: "fire",
      phase2: { name: "古龍ヴァルガ＝レクス【真】", hp: 1600, atk: 82, def: 36, atkElement: "fire", inflict: "burn", inflictChance: .55 },
      drops: [{ mat: "mithril", min: 5, max: 8, chance: 1 }, { mat: "crystal", min: 3, max: 5, chance: 1 }, { mat: "soul", min: 3, max: 5, chance: 1 }] },
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

  // --- 武器 ---
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
  // --- 武器：ボス素材(魂)で作る最強クラス ---
  { id: "w_soul_blade",  name: "英雄の聖剣",    icon: "⚔️", type: "weapon", wtype: "sword",  element: "lightning", stats: { atk: 60 }, cost: { mithril: 4, soul: 5, crystal: 3 } },
  { id: "w_soul_staff",  name: "破滅の魔杖",    icon: "🪄",  type: "weapon", wtype: "staff",  element: "ice",  stats: { atk: 55, mp: 24 }, cost: { soul: 5, crystal: 4, shard: 6 } },

  // --- 防具 ---
  { id: "a_leather", name: "革の鎧",       icon: "🦺", type: "armor", stats: { def: 4, hp: 10 },        cost: { pelt: 4 }, desc: "DEF +4 / 最大HP +10" },
  { id: "a_novice_robe", name: "見習いのローブ", icon: "🥋", type: "armor", stats: { def: 2, hp: 5, mp: 8 }, cost: { gel: 3, wood: 2 }, desc: "DEF +2 / HP +5 / MP +8" },
  { id: "a_stone", name: "石板の鎧",       icon: "🛡️", type: "armor", stats: { def: 9, hp: 20 },       cost: { stone: 6, pelt: 3 }, desc: "DEF +9 / 最大HP +20" },
  { id: "a_iron", name: "鉄の鎧",          icon: "🛡️", type: "armor", stats: { def: 16, hp: 35 },      cost: { iron: 6, pelt: 4 }, desc: "DEF +16 / 最大HP +35" },
  { id: "a_mage_robe", name: "魔導のローブ", icon: "🥻", type: "armor", stats: { def: 10, hp: 25, mp: 20 }, cost: { shard: 6, pelt: 3, crystal: 1 }, desc: "DEF +10 / HP +25 / MP +20" },
  { id: "a_crystal", name: "クリスタルメイル", icon: "🛡️", type: "armor", stats: { def: 26, hp: 60 },  cost: { iron: 4, crystal: 2, shard: 4 }, desc: "DEF +26 / 最大HP +60" },
  { id: "a_dragon", name: "竜鱗の鎧",      icon: "🛡️", type: "armor", stats: { def: 40, hp: 100 },     cost: { mithril: 4, crystal: 2, pelt: 6 }, desc: "DEF +40 / 最大HP +100" },
  { id: "a_soul", name: "守護神の鎧",      icon: "🛡️", type: "armor", stats: { def: 55, hp: 160, mp: 20 }, cost: { soul: 5, mithril: 3, crystal: 3 }, desc: "DEF +55 / HP +160 / MP +20" },

  // --- アクセサリ（accessory枠） ---
  { id: "acc_power",  name: "力の指輪",     icon: "💍", type: "accessory", stats: { atk: 6 },              cost: { iron: 3, shard: 2 } },
  { id: "acc_guard",  name: "守りのお守り", icon: "🧿", type: "accessory", stats: { def: 6, hp: 20 },      cost: { stone: 5, pelt: 4 } },
  { id: "acc_crit",   name: "会心の指輪",   icon: "💍", type: "accessory", stats: { crit: 0.12 },          cost: { fang: 4, shard: 3 } },
  { id: "acc_mana",   name: "知恵の指輪",   icon: "💍", type: "accessory", stats: { mp: 22 },              cost: { shard: 5, crystal: 1 } },
  { id: "acc_lucky",  name: "幸運のお守り", icon: "🍀", type: "accessory", stats: { dropBonus: 0.25 },     cost: { gel: 5, crystal: 1 } },
  { id: "acc_ward",   name: "抵抗のお守り", icon: "🧿", type: "accessory", stats: { guard: 0.6 },          cost: { gel: 6, shard: 4 } },
  { id: "acc_fireward", name: "炎耐性の護符", icon: "🟥", type: "accessory", stats: { resist: { fire: 0.4 } },      cost: { fang: 5, crystal: 1 } },
  { id: "acc_allward",  name: "万象の護符",   icon: "🔰", type: "accessory", stats: { resist: { fire: 0.25, ice: 0.25, lightning: 0.25 } }, cost: { crystal: 3, soul: 1 } },
  { id: "acc_hero",   name: "英雄の証",     icon: "🏅", type: "accessory", stats: { atk: 12, def: 12, crit: 0.08 }, cost: { soul: 3, crystal: 2 } },
  { id: "acc_collector", name: "コレクターの勲章", icon: "🎖️", type: "accessory", stats: { atk: 15, def: 15, crit: 0.1, dropBonus: 0.2 }, cost: { soul: 30 }, rewardOnly: true },
];

/* ---------- 図鑑コンプ報酬 ---------- */
const DEX_TOTAL = 12; // 通常8＋ボス4
const DEX_MILESTONES = [
  { n: 4,  reward: { gold: 200, items: { elixir: 1 } } },
  { n: 8,  reward: { gold: 600, mats: { soul: 2 } } },
  { n: 12, reward: { gold: 2000, owned: "acc_collector" } },
];
function dexCount() { return Object.keys(state.dex).length; }
function checkDexRewards() {
  for (let i = 0; i < DEX_MILESTONES.length; i++) {
    const m = DEX_MILESTONES[i];
    if (dexCount() >= m.n && !state.dexClaimed[i]) log(`📚 図鑑 ${m.n}種達成！「記録」タブで報酬を受け取れる。`, "l-good");
  }
}
function claimDexReward(i) {
  const m = DEX_MILESTONES[i];
  if (!m || dexCount() < m.n || state.dexClaimed[i]) return;
  state.dexClaimed[i] = true;
  const r = m.reward; let parts = [];
  if (r.gold) { state.gold += r.gold; parts.push(`💰${r.gold}G`); }
  for (const [mat, n] of Object.entries(r.mats || {})) { addMat(mat, n); parts.push(`${MATERIALS[mat].icon}×${n}`); }
  for (const [it, n] of Object.entries(r.items || {})) { state.items[it] = itemQty(it) + n; parts.push(`${SHOP_BY_ID[it].icon}×${n}`); }
  if (r.owned && !state.owned.includes(r.owned)) { state.owned.push(r.owned); parts.push(`${RECIPE_BY_ID[r.owned].icon}${RECIPE_BY_ID[r.owned].name}`); }
  log(`🎁 図鑑報酬を受け取った: ${parts.join(" / ")}`, "l-gold");
  toast("図鑑報酬ゲット！");
  sfx("quest");
  save(); renderAll();
}

/* ---------- セット装備の効果 ---------- */
const SETS = [
  { name: "鉄装備", pieces: ["w_iron_sword", "a_iron"], bonus: { atk: 5, def: 5 } },
  { name: "魔導士", pieces: ["w_sage_staff", "a_mage_robe"], bonus: { mp: 20, crit: 0.05 } },
  { name: "竜の力", pieces: ["w_dragon_sword", "a_dragon"], bonus: { atk: 15, def: 15, resist: { fire: 0.5 } } },
  { name: "英雄", pieces: ["w_soul_blade", "a_soul", "acc_hero"], bonus: { atk: 25, def: 25, hp: 80, crit: 0.1, resist: { fire: 0.3, ice: 0.3, lightning: 0.3 } } },
];
function activeSets() {
  const eq = [state.equipped.weapon, state.equipped.armor, state.equipped.accessory].filter(Boolean);
  return SETS.filter(s => s.pieces.every(p => eq.includes(p)));
}

function statBadges(s) {
  const p = [];
  if (s.atk) p.push(`ATK +${s.atk}`);
  if (s.def) p.push(`DEF +${s.def}`);
  if (s.hp) p.push(`HP +${s.hp}`);
  if (s.mp) p.push(`MP +${s.mp}`);
  if (s.crit) p.push(`会心率 +${Math.round(s.crit * 100)}%`);
  if (s.guard) p.push(`状態異常耐性 ${Math.round(s.guard * 100)}%`);
  if (s.dropBonus) p.push(`ドロップ/G +${Math.round(s.dropBonus * 100)}%`);
  if (s.resist) for (const [el, v] of Object.entries(s.resist)) p.push(`${ELEMENTS[el].icon}耐性 +${Math.round(v * 100)}%`);
  return p.join(" / ");
}
function gearEffectText(r) {
  if (r.type === "weapon") {
    const w = WTYPES[r.wtype] || WTYPES.fist;
    const parts = [`ATK +${r.stats.atk}`];
    if (r.stats.mp) parts.push(`MP +${r.stats.mp}`);
    return `${w.name}${r.element ? " / " + elemLabel(r.element) : ""} ・ ${parts.join(" / ")}（${w.note}）`;
  }
  if (r.type === "accessory") return "装飾品 ・ " + statBadges(r.stats);
  return r.desc || "";
}

// 強化コスト
function enhanceCost(id) {
  const r = RECIPE_BY_ID[id];
  const lv = enhanceLv(id);
  const tier = Math.max(1, Math.round(gearScore(r) / 18));
  return { gold: 40 * (lv + 1) + tier * 12 * (lv + 1), mat: "shard", matN: lv + 1 };
}

/* ---------- 素材の売値 ---------- */
const SELL_PRICE = {
  wood: 2, hardwood: 6, stone: 2, iron: 9, mithril: 45,
  gel: 3, fang: 5, pelt: 4, shard: 12, crystal: 35, soul: 90,
};

/* ---------- クエスト ---------- */
const QUESTS = [
  { id: "q_slime",  name: "スライム退治",       type: "kill",   target: "スライム",       count: 5,  reward: { gold: 60, items: { potion_hp: 1 } } },
  { id: "q_wood",   name: "木こりの仕事",       type: "gather", mat: "wood",             count: 15, reward: { gold: 70 } },
  { id: "q_rabbit", name: "野ウサギ狩り",       type: "kill",   target: "ホーンラビット", count: 6,  reward: { gold: 80, mats: { pelt: 3 } } },
  { id: "q_wolf",   name: "森の脅威",           type: "kill",   target: "森オオカミ",     count: 6,  reward: { gold: 140, items: { potion_mp: 1 } } },
  { id: "q_iron",   name: "鉱石ハンター",       type: "gather", mat: "iron",             count: 20, reward: { gold: 220, mats: { shard: 3 } } },
  { id: "q_boss1",  name: "討伐：キングスライム", type: "boss", target: "キングスライム",  count: 1,  reward: { gold: 180, items: { elixir: 1 } } },
  { id: "q_golem",  name: "岩を砕く者",         type: "kill",   target: "ロックゴーレム", count: 8,  reward: { gold: 320, mats: { crystal: 2 } } },
  { id: "q_boss3",  name: "討伐：ゴーレムロード", type: "boss", target: "ゴーレムロード",  count: 1,  reward: { gold: 500, mats: { soul: 2 } } },
  { id: "q_dragon", name: "竜殺し",             type: "boss",   target: "古龍ヴァルガ＝レクス", count: 1, reward: { gold: 1500, mats: { soul: 4, crystal: 3 } } },
];
function questProgress(q) { return state.questProg[q.id] || 0; }
function questDone(q) { return questProgress(q) >= q.count; }
function questTrack(type, key, n = 1) {
  let changed = false;
  for (const q of QUESTS) {
    if (q.type !== type) continue;
    if (type === "gather" && q.mat !== key) continue;
    if ((type === "kill" || type === "boss") && q.target !== key) continue;
    if (state.questClaimed[q.id]) continue;
    if (questDone(q)) continue;
    state.questProg[q.id] = Math.min(q.count, questProgress(q) + n);
    if (questDone(q)) { log(`📋 クエスト「${q.name}」達成！受け取れるよ。`, "l-good"); toast(`クエスト達成: ${q.name}`); }
    changed = true;
  }
  return changed;
}
function claimQuest(id) {
  const q = QUESTS.find(x => x.id === id);
  if (!q || !questDone(q) || state.questClaimed[id]) return;
  state.questClaimed[id] = true;
  const r = q.reward;
  let parts = [];
  if (r.gold) { state.gold += r.gold; parts.push(`💰${r.gold}G`); }
  for (const [m, n] of Object.entries(r.mats || {})) { addMat(m, n); parts.push(`${MATERIALS[m].icon}×${n}`); }
  for (const [it, n] of Object.entries(r.items || {})) { state.items[it] = itemQty(it) + n; parts.push(`${SHOP_BY_ID[it].icon}×${n}`); }
  log(`🎁 報酬を受け取った: ${parts.join(" / ")}`, "l-gold");
  toast("報酬ゲット！");
  sfx("quest");
  save(); renderAll();
}

const RECIPE_BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));

/* ---------- セーブ＆ステート（複数スロット対応） ---------- */
const SAVE_PREFIX = "fantasy-life-save-v2";
const META_KEY = SAVE_PREFIX + ".meta";
const NUM_SLOTS = 3;
let currentSlot = 0;
const BASE_STATS = { atk: 5, def: 2, maxHp: 30, maxMp: 10 };

function newGame() {
  return {
    level: 1, exp: 0, hp: BASE_STATS.maxHp, mp: BASE_STATS.maxMp, gold: 0,
    materials: {}, owned: [], items: {}, enhance: {},
    perm: { atk: 0, def: 0, hp: 0 }, permBought: { atk: 0, def: 0, hp: 0 },
    equipped: { weapon: null, armor: null, accessory: null, axe: null, pickaxe: null },
    bossCleared: {}, dex: {}, dexClaimed: {}, questProg: {}, questClaimed: {},
    settings: { sound: true, bgm: false, craftableOnly: false },
    lastBattle: null,
    currentGatherArea: "grassland",
  };
}

let state = loadGame();
let battle = null;

function slotKey(i) { return SAVE_PREFIX + ".s" + i; }
// 欠けている入れ子を補完
function migrateSave(s) {
  s.items = s.items || {};
  s.enhance = s.enhance || {};
  s.perm = Object.assign({ atk: 0, def: 0, hp: 0 }, s.perm);
  s.permBought = Object.assign({ atk: 0, def: 0, hp: 0 }, s.permBought);
  s.equipped = Object.assign({ weapon: null, armor: null, accessory: null, axe: null, pickaxe: null }, s.equipped);
  s.bossCleared = s.bossCleared || {};
  s.dex = s.dex || {};
  s.dexClaimed = s.dexClaimed || {};
  s.questProg = s.questProg || {};
  s.questClaimed = s.questClaimed || {};
  s.settings = Object.assign({ sound: true, bgm: false, craftableOnly: false }, s.settings);
  return s;
}
function readSlot(i) {
  try {
    const raw = localStorage.getItem(slotKey(i));
    if (raw) return migrateSave(Object.assign(newGame(), JSON.parse(raw)));
  } catch (e) {}
  return null;
}
function loadGame() {
  // 現在のスロットをメタから取得
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY));
    if (meta && typeof meta.current === "number") currentSlot = meta.current;
  } catch (e) {}
  // 旧セーブ（プレフィックス直下）をスロット0へ移行
  try {
    const legacy = localStorage.getItem(SAVE_PREFIX);
    if (legacy && !localStorage.getItem(slotKey(0))) localStorage.setItem(slotKey(0), legacy);
  } catch (e) {}
  return readSlot(currentSlot) || newGame();
}
function save() {
  try {
    localStorage.setItem(slotKey(currentSlot), JSON.stringify(state));
    localStorage.setItem(META_KEY, JSON.stringify({ current: currentSlot }));
  } catch (e) {}
}
function slotSummary(i) {
  try {
    const raw = localStorage.getItem(slotKey(i));
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { level: d.level || 1, gold: d.gold || 0, area: d.lastBattle ? d.lastBattle.areaId : null };
  } catch (e) { return null; }
}
function switchSlot(i) {
  if (i === currentSlot) return;
  save();
  currentSlot = i;
  state = readSlot(i) || newGame();
  battle = null;
  clampVitals();
  save();
  log(`スロット${i + 1} に切り替えた。`, "l-sys");
  toast(`スロット${i + 1}`);
  renderAll();
}
function deleteSlot(i) {
  if (!confirm(`スロット${i + 1} のデータを消しますか？`)) return;
  try { localStorage.removeItem(slotKey(i)); } catch (e) {}
  if (i === currentSlot) { state = newGame(); battle = null; save(); }
  log(`スロット${i + 1} を削除した。`, "l-sys");
  renderAll();
}
function exportSave() {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(state)))); } catch (e) { return ""; }
}
function importSave(code) {
  try {
    const obj = JSON.parse(decodeURIComponent(escape(atob((code || "").trim()))));
    if (!obj || typeof obj.level !== "number") return false;
    state = migrateSave(Object.assign(newGame(), obj));
    battle = null;
    clampVitals();
    save();
    log("セーブデータを読み込んだ。", "l-good");
    toast("インポート成功！");
    renderAll();
    return true;
  } catch (e) { return false; }
}

/* ---------- 計算ヘルパー ---------- */
function expToNext(level) { return Math.floor(10 * Math.pow(level, 1.5)); }

// 強化(+N)を反映した装備のステータス
const ENHANCE_MAX = 10;
function enhanceLv(id) { return state.enhance[id] || 0; }
function gearStats(id) {
  const r = RECIPE_BY_ID[id]; if (!r) return {};
  const base = r.stats || {};
  const f = 1 + 0.18 * enhanceLv(id);
  const out = {};
  for (const k of ["atk", "def", "hp", "mp"]) if (base[k]) out[k] = Math.round(base[k] * f);
  for (const k of ["crit", "guard", "dropBonus"]) if (base[k]) out[k] = base[k];
  if (base.resist) out.resist = base.resist;
  return out;
}

function derivedStats() {
  let atk = BASE_STATS.atk + (state.level - 1) * 2 + (state.perm.atk || 0);
  let def = BASE_STATS.def + (state.level - 1) * 1 + (state.perm.def || 0);
  let maxHp = BASE_STATS.maxHp + (state.level - 1) * 8 + (state.perm.hp || 0);
  let maxMp = BASE_STATS.maxMp + (state.level - 1) * 2;
  let crit = 0, guard = 0, dropBonus = 0;
  const resist = { fire: 0, ice: 0, lightning: 0 };
  for (const slot of ["weapon", "armor", "accessory"]) {
    const id = state.equipped[slot];
    if (id && RECIPE_BY_ID[id]) {
      const s = gearStats(id);
      atk += s.atk || 0; def += s.def || 0; maxHp += s.hp || 0; maxMp += s.mp || 0;
      crit += s.crit || 0; guard += s.guard || 0; dropBonus += s.dropBonus || 0;
      if (s.resist) for (const k in s.resist) resist[k] += s.resist[k];
    }
  }
  // セット効果
  for (const set of activeSets()) {
    const b = set.bonus;
    atk += b.atk || 0; def += b.def || 0; maxHp += b.hp || 0; maxMp += b.mp || 0; crit += b.crit || 0;
    if (b.resist) for (const k in b.resist) resist[k] += b.resist[k];
  }
  for (const k in resist) resist[k] = Math.min(0.8, resist[k]);
  return { atk, def, maxHp, maxMp, crit, guard, dropBonus, resist };
}

function equippedWeapon() { const id = state.equipped.weapon; return id ? RECIPE_BY_ID[id] : null; }
function weaponType() { const w = equippedWeapon(); return (w && WTYPES[w.wtype]) ? WTYPES[w.wtype] : WTYPES.fist; }
function weaponElement() { const w = equippedWeapon(); return w ? (w.element || null) : null; }
function toolTier(kind) { const id = state.equipped[kind]; return (id && RECIPE_BY_ID[id]) ? RECIPE_BY_ID[id].tier : 0; }

function matQty(id) { return state.materials[id] || 0; }
function addMat(id, n) { state.materials[id] = matQty(id) + n; }
function itemQty(id) { return state.items[id] || 0; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function fmt(n) { return (n || 0).toLocaleString("en-US"); }
function clampVitals() {
  const s = derivedStats();
  if (state.hp == null) state.hp = s.maxHp;
  if (state.mp == null) state.mp = s.maxMp;
  state.hp = Math.min(state.hp, s.maxHp);
  state.mp = Math.min(state.mp, s.maxMp);
}
function seedPrice(item) { return Math.round(item.price * Math.pow(1.5, state.permBought[item.stat] || 0)); }

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
    sfx("level");
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
      questTrack("gather", y.mat, amount);
      got.push(`${MATERIALS[y.mat].icon}${MATERIALS[y.mat].name} ×${amount}`);
    }
  }
  if (got.length) { log(`⛏ ${node.name}から ${got.join(" / ")} を採集した。`, "l-good"); sfx("gather"); gainExp(2); }
  else log(`${node.name}からは何も採れなかった…`, "l-sys");
  save(); renderAll();
}

/* =========================================================
   戦闘
   ========================================================= */

/* --- 演出（ダメージポップ・シェイク・フラッシュ） --- */
let fxQueue = [];
function pushFx(ev) { fxQueue.push(ev); }
function flushFx() {
  if (typeof document === "undefined") { fxQueue = []; return; }
  const evs = fxQueue; fxQueue = [];
  evs.forEach((ev, i) => setTimeout(() => spawnPop(ev), i * 170));
}
function spawnPop(ev) {
  const sel = ev.who === "enemy" ? ".fighter.enemy" : ".fighter.player";
  const host = document.querySelector("#battle " + sel);
  if (!host) return;
  const pop = document.createElement("div");
  let cls = "dmg-pop", txt;
  if (ev.heal != null) { cls += " heal"; txt = "+" + ev.heal; }
  else { txt = String(ev.dmg); if (ev.crit) { cls += " crit"; txt = "会心 " + txt; } else if (ev.weak) cls += " weak"; }
  pop.className = cls; pop.textContent = txt;
  host.appendChild(pop);
  setTimeout(() => pop.remove(), 700);
  const sprite = host.querySelector(".sprite-inner");
  if (sprite && ev.heal == null) { sprite.classList.remove("shake"); void sprite.offsetWidth; sprite.classList.add("shake"); }
  // 攻撃側を踏み込ませる（被弾側の逆）
  if (ev.dmg != null) {
    const attackerSel = ev.who === "enemy" ? ".fighter.player" : ".fighter.enemy";
    const atk = document.querySelector("#battle " + attackerSel + " .sprite-inner");
    if (atk) {
      const cls2 = ev.who === "enemy" ? "lunge-right" : "lunge-left";
      atk.classList.remove("lunge-right", "lunge-left"); void atk.offsetWidth; atk.classList.add(cls2);
      setTimeout(() => atk.classList.remove(cls2), 320);
    }
  }
  if (ev.who === "player" && ev.dmg != null) {
    const b = document.getElementById("battle");
    if (b) { b.classList.remove("flash"); void b.offsetWidth; b.classList.add("flash"); setTimeout(() => b.classList.remove("flash"), 260); }
  }
}

function startBattle(areaId, kind = "normal") {
  const area = AREAS.find(a => a.id === areaId);
  let m;
  if (kind === "boss") m = area.boss;
  else m = area.monsters[rand(0, area.monsters.length - 1)];
  const s = derivedStats();
  state.hp = s.maxHp; state.mp = s.maxMp; state.statuses = [];
  battle = {
    areaId, kind,
    enemy: { ...m, baseName: m.name, art: enemyArtKey(m), maxHp: m.hp, hp: m.hp, statuses: [], enraged: false, isBoss: kind === "boss" },
    defending: false, over: false, showSkills: false, showItems: false,
  };
  state.lastBattle = { areaId, kind };
  if (kind === "boss") { log(`👑 ボス『${m.name}』が立ちはだかる！（弱点:${elemLabel(m.weak)} / 耐性:${elemLabel(m.resist)}）`, "l-bad"); sfx("boss"); }
  else { log(`⚔ ${m.name}（弱点:${elemLabel(m.weak)}${m.resist ? " / 耐性:" + elemLabel(m.resist) : ""}）が現れた！`, "l-sys"); }
  document.getElementById("area-list").classList.add("hidden");
  renderBattle(); renderStatus();
}

// 状態異常の付与（敵にも自分にも使える）
function inflict(target, name, kind, sourceAtk) {
  if (!target.statuses) target.statuses = [];
  const toPlayer = (target === state);
  if (kind === "poison" || kind === "burn") {
    const dmg = Math.max(2, Math.round(sourceAtk * (kind === "poison" ? 0.25 : 0.2)));
    const ex = target.statuses.find(s => s.kind === kind);
    if (ex) { ex.turns = Math.max(ex.turns, 3); ex.dmg = Math.max(ex.dmg, dmg); }
    else target.statuses.push({ kind, dmg, turns: 3 });
    log(`${name} は${kind === "poison" ? "毒" : "火傷"}状態になった！`, toPlayer ? "l-bad" : "l-good");
  } else if (kind === "stun") {
    const ex = target.statuses.find(s => s.kind === "stun");
    if (ex) ex.turns = Math.max(ex.turns, 1);
    else target.statuses.push({ kind: "stun", turns: 1 });
    log(`${name} は痺れて動けなくなった！`, toPlayer ? "l-bad" : "l-good");
  }
}

// 継続ダメージ処理（死亡したら true）
function tickDoT(target, name) {
  const toPlayer = (target === state);
  for (const st of [...(target.statuses || [])]) {
    if (st.kind === "poison" || st.kind === "burn") {
      target.hp = Math.max(0, target.hp - st.dmg);
      log(`${name} は${st.kind === "poison" ? "毒" : "火傷"}で ${st.dmg} ダメージ。`, toPlayer ? "l-bad" : "l-good");
      st.turns--;
    }
  }
  target.statuses = (target.statuses || []).filter(s => !((s.kind === "poison" || s.kind === "burn") && s.turns <= 0));
  return target.hp <= 0;
}

// スタン消費（このターン動けないなら true）
function consumeStun(target) {
  const st = (target.statuses || []).find(s => s.kind === "stun");
  if (st) { st.turns--; target.statuses = target.statuses.filter(s => !(s.kind === "stun" && s.turns <= 0)); return true; }
  return false;
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
  else def = Math.max(0, def * (1 - (opts.pierce || 0) - (wt.pierce || 0)));

  let dmg = ps.atk * mult - def;

  // 属性：弱点1.5倍 / 耐性0.5倍
  const elem = weaponElement();
  let mark = "";
  if (elem && e.weak === elem) { dmg *= 1.5; mark += ` ${elemLabel(elem)}弱点!`; }
  else if (elem && e.resist === elem) { dmg *= 0.5; mark += ` ${elemLabel(elem)}耐性…`; }

  // 会心
  const critChance = (wt.crit || 0) + (opts.critBonus || 0);
  const crit = Math.random() < critChance;
  if (crit) { dmg *= 1.8; mark = " ✨会心!" + mark; }

  dmg = Math.max(1, Math.round(dmg + rand(-2, 2)));
  e.hp = Math.max(0, e.hp - dmg);
  log(`${e.name} に ${dmg} ダメージ！${mark}`, (crit || mark.includes("弱点")) ? "l-good" : "");
  pushFx({ who: "enemy", dmg, crit, weak: mark.includes("弱点") });
  sfx(crit ? "crit" : "hit");

  // 状態異常付与
  if (opts.inflict) inflict(e, e.name, opts.inflict, ps.atk);
  if (wt.onCritStatus && crit) inflict(e, e.name, wt.onCritStatus, ps.atk);
  if (elem && e.resist !== elem) {
    const chance = opts.forceStatus ? 1 : 0.25;
    if (Math.random() < chance) inflict(e, e.name, elem === "fire" ? "burn" : "stun", ps.atk);
  }
}

function playerHeal(frac) {
  const s = derivedStats();
  const amt = Math.round(s.maxHp * frac);
  state.hp = Math.min(s.maxHp, state.hp + amt);
  log(`💚 ${amt} 回復した。`, "l-good");
  pushFx({ who: "player", heal: amt });
  sfx("heal");
}

const combatCtx = { hit: (opts) => dealHit(opts || {}), heal: (frac) => playerHeal(frac) };

/* --- プレイヤーの行動 --- */
function actAttack() {
  if (!battle || battle.over) return;
  fxQueue = [];
  const wt = weaponType();
  for (let i = 0; i < (wt.hits || 1); i++) dealHit({});
  finishPlayerAction();
}
function actSkill(skillId) {
  if (!battle || battle.over) return;
  const sk = SKILLS[skillId];
  if (!sk) return;
  if (state.mp < sk.mp) { toast("MPが足りない"); sfx("deny"); return; }
  fxQueue = [];
  state.mp -= sk.mp;
  log(`${sk.icon} ${sk.name} を放った！`, "l-sys");
  sfx("cast");
  sk.run(combatCtx);
  battle.showSkills = false;
  finishPlayerAction();
}
function actDefend() {
  if (!battle || battle.over) return;
  fxQueue = [];
  battle.defending = true;
  const s = derivedStats();
  state.mp = Math.min(s.maxMp, state.mp + 5);
  log(`🛡 身を守る体勢をとった（被ダメ減＆MP回復）。`, "l-sys");
  sfx("guard");
  finishPlayerAction();
}
function actItem(itemId) {
  if (!battle || battle.over) return;
  if (itemQty(itemId) <= 0) return;
  fxQueue = [];
  const it = SHOP_BY_ID[itemId];
  const s = derivedStats();
  if (itemId === "potion_hp") { const a = Math.round(s.maxHp * .5); state.hp = Math.min(s.maxHp, state.hp + a); log(`🧪 ${a} 回復した。`, "l-good"); }
  else if (itemId === "potion_mp") { const a = Math.round(s.maxMp * .5); state.mp = Math.min(s.maxMp, state.mp + a); log(`🔵 MPを ${a} 回復した。`, "l-good"); }
  else if (itemId === "elixir") { state.hp = s.maxHp; state.mp = s.maxMp; log(`✨ HP/MPが全回復した。`, "l-good"); }
  else if (itemId === "antidote") { state.statuses = []; log(`💊 状態異常を治した。`, "l-good"); }
  state.items[itemId] = itemQty(itemId) - 1;
  battle.showItems = false;
  toast(`${it.name} を使った`);
  finishPlayerAction();
}

// プレイヤー行動後 → 勝敗判定 → 敵フェーズ
function finishPlayerAction() {
  if (battle.enemy.hp <= 0) { winBattle(); return; }
  enemyPhase();
}

function enemyPhase() {
  const e = battle.enemy;
  // 敵の継続ダメージ
  if (tickDoT(e, e.name)) { winBattle(); return; }

  // ボスの怒り（HP30%以下で攻撃力UP）
  if (e.isBoss && !e.enraged && e.hp <= e.maxHp * 0.3) {
    e.enraged = true; e.atk = Math.round(e.atk * 1.3);
    log(`👑 ${e.name} は怒り狂った！攻撃力が上がった！`, "l-bad");
  }

  // 敵のスタン判定
  if (consumeStun(e)) {
    log(`${e.name} は痺れて動けない！`, "l-good");
  } else {
    const ps = derivedStats();
    let edmg = Math.max(1, e.atk - ps.def + rand(-2, 2));
    if (battle.defending) edmg = Math.max(1, Math.round(edmg * 0.4));
    // 属性攻撃はプレイヤーの耐性で軽減
    let elemNote = "";
    if (e.atkElement && ps.resist && ps.resist[e.atkElement] > 0) {
      edmg = Math.max(1, Math.round(edmg * (1 - ps.resist[e.atkElement])));
      elemNote = ` ${elemLabel(e.atkElement)}を軽減!`;
    } else if (e.atkElement) {
      elemNote = ` ${elemLabel(e.atkElement)}属性`;
    }
    state.hp = Math.max(0, state.hp - edmg);
    log(`${e.name} の攻撃！ ${edmg} ダメージを受けた。${elemNote}`, "l-bad");
    pushFx({ who: "player", dmg: edmg });
    sfx("enemyhit");
    if (state.hp <= 0) { loseBattle(); return; }
    // 敵の状態異常付与（抵抗で確率減）
    if (e.inflict && Math.random() < (e.inflictChance || 0.3) * (1 - (ps.guard || 0))) {
      inflict(state, "あなた", e.inflict, e.atk);
    }
  }

  const s = derivedStats();
  state.mp = Math.min(s.maxMp, state.mp + 3);
  battle.defending = false;
  startPlayerTurn();
}

// プレイヤーのターン開始（継続ダメージ・スタン処理）
function startPlayerTurn() {
  if (!battle || battle.over) return;
  if (tickDoT(state, "あなた")) { loseBattle(); return; }
  if (consumeStun(state)) {
    log(`あなたは痺れて動けない！`, "l-bad");
    renderBattle(); renderStatus(); save();
    // 行動できないので敵のターンへ
    enemyPhase();
    return;
  }
  renderBattle(); renderStatus(); flushFx(); save();
  if (battle.auto && !battle.over) setTimeout(() => { if (battle && !battle.over && battle.auto) actAttack(); }, 650);
}

function transformBoss() {
  const e = battle.enemy;
  const p = e.phase2;
  battle.phase2done = true;
  e.name = p.name;
  e.maxHp = p.hp; e.hp = p.hp;
  e.atk = p.atk; e.def = p.def;
  if (p.weak) e.weak = p.weak;
  if (p.resist) e.resist = p.resist;
  if (p.atkElement) e.atkElement = p.atkElement;
  if (p.inflict) { e.inflict = p.inflict; e.inflictChance = p.inflictChance || 0.35; }
  e.enraged = false; e.statuses = [];
  log(`💥 ${e.name} ——まだ終わらない！第2形態だ！`, "l-bad");
  toast("ボスが変身した！");
  sfx("transform");
  // 変身のターンは敵の攻撃なし。プレイヤーのターンへ
  startPlayerTurn();
}

function winBattle() {
  const e = battle.enemy;
  const isBoss = battle.kind === "boss";
  // ボス第2形態：HP0になっても変身して戦闘続行
  if (isBoss && e.phase2 && !battle.phase2done) { transformBoss(); return; }
  battle.over = true;
  renderBattle(); flushFx();
  log(`✨ ${e.name} を倒した！`, "l-good");
  const ps = derivedStats();
  let drops = [];
  for (const d of e.drops || []) {
    if (Math.random() <= d.chance + (ps.dropBonus || 0)) {
      const amt = rand(d.min, d.max);
      addMat(d.mat, amt);
      drops.push(`${MATERIALS[d.mat].icon}${MATERIALS[d.mat].name} ×${amt}`);
    }
  }
  const gold = Math.round(e.gold * (1 + (ps.dropBonus || 0)));
  state.gold += gold;
  if (drops.length) log(`ドロップ: ${drops.join(" / ")}`, "l-good");
  log(`💰 ${gold}G を手に入れた。`, "l-gold");
  // 図鑑＆クエスト（変身後も基本名で記録）
  const recName = e.baseName || e.name;
  state.dex[recName] = (state.dex[recName] || 0) + 1;
  questTrack("kill", recName);
  if (isBoss) {
    questTrack("boss", recName);
    const first = !state.bossCleared[battle.areaId];
    state.bossCleared[battle.areaId] = true;
    if (first) log(`👑 ボス初撃破！`, "l-good");
    toast(`ボス『${recName}』を撃破！`);
  } else {
    toast(`${recName} 撃破！ +${e.exp}EXP`);
  }
  checkDexRewards();
  sfx("win");
  gainExp(e.exp);
  save();
  setTimeout(endBattleUI, 700);
}

function loseBattle() {
  battle.over = true;
  renderBattle(); flushFx();
  log(`💀 倒れてしまった…拠点に戻った。`, "l-bad");
  const lost = Math.floor(state.gold * 0.15);
  state.gold -= lost;
  if (lost > 0) log(`動揺して ${lost}G を落とした。`, "l-gold");
  const s = derivedStats();
  state.hp = s.maxHp; state.mp = s.maxMp; state.statuses = [];
  toast("やられてしまった…");
  sfx("lose");
  save();
  setTimeout(endBattleUI, 700);
}

function fleeBattle() {
  if (!battle) return;
  if (battle.kind === "boss") { toast("ボス戦からは逃げられない！"); log("ボスからは逃げられない！", "l-bad"); sfx("deny"); return; }
  log(`🏃 ${battle.enemy.name} から逃げ出した。`, "l-sys");
  sfx("flee");
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
  sfx("craft");
  autoEquipIfBetter(r);
  gainExp(5);
  save(); renderAll();
}

/* ---------- 装備の強化(+N) ---------- */
function enhance(id) {
  const r = RECIPE_BY_ID[id];
  if (!r || !["weapon", "armor", "accessory"].includes(r.type)) return;
  const lv = enhanceLv(id);
  if (lv >= ENHANCE_MAX) { toast("これ以上強化できない"); return; }
  const c = enhanceCost(id);
  if (state.gold < c.gold || matQty(c.mat) < c.matN) { toast("強化の素材かゴールドが足りない"); return; }
  state.gold -= c.gold; addMat(c.mat, -c.matN);
  state.enhance[id] = lv + 1;
  clampVitals();
  log(`⚒ ${r.name} を +${lv + 1} に強化した！`, "l-good");
  toast(`${r.name} +${lv + 1}！`);
  sfx("enhance");
  save(); renderAll();
}

/* ---------- 素材の売却 ---------- */
function sellMat(id, all) {
  const price = SELL_PRICE[id] || 1;
  const n = all ? matQty(id) : 1;
  if (n <= 0) return;
  addMat(id, -n);
  const g = price * n;
  state.gold += g;
  log(`🪙 ${MATERIALS[id].name} ×${n} を ${g}G で売却した。`, "l-gold");
  sfx("buy");
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
  sfx("equip");
  save(); renderAll();
}

/* ---------- お店 ---------- */
function buyItem(id) {
  const it = SHOP_BY_ID[id];
  if (!it) return;
  const price = it.kind === "perm" ? seedPrice(it) : it.price;
  if (state.gold < price) { toast("ゴールドが足りない"); return; }
  state.gold -= price;
  if (it.kind === "consumable") {
    state.items[id] = itemQty(id) + 1;
    log(`🛒 ${it.name} を買った（-${price}G）`, "l-gold");
  } else {
    if (it.stat === "hp") state.perm.hp += it.val; else state.perm[it.stat] += it.val;
    state.permBought[it.stat] = (state.permBought[it.stat] || 0) + 1;
    clampVitals();
    log(`🌱 ${it.name} を使った！ ${it.desc}（-${price}G）`, "l-good");
  }
  toast(`${it.name} を購入`);
  sfx("buy");
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
  document.getElementById("stat-gold").textContent = fmt(state.gold);
}

let selectedArea = null;
function renderAreas() {
  const wrap = document.getElementById("area-list");
  wrap.innerHTML = "";
  // 直前と再戦
  if (state.lastBattle) {
    const lb = state.lastBattle;
    const area = AREAS.find(a => a.id === lb.areaId);
    if (area) {
      const rep = document.createElement("button");
      rep.className = "action repeat-btn";
      rep.textContent = `🔁 直前のエリアへ（${area.icon}${area.name}${lb.kind === "boss" ? " ボス" : ""}）`;
      rep.onclick = () => enterField(lb.areaId, lb.kind);
      wrap.appendChild(rep);
    }
  }
  // 選択中エリアの決定（未選択や未開放なら、解放済みの最奥へ）
  const unlocked = AREAS.filter(a => state.level >= a.reqLevel);
  if (!selectedArea || state.level < (AREAS.find(a => a.id === selectedArea) || {}).reqLevel) {
    selectedArea = unlocked.length ? unlocked[unlocked.length - 1].id : AREAS[0].id;
  }
  // ワールドマップ
  const map = document.createElement("div");
  map.className = "world-map";
  AREAS.forEach((a, idx) => {
    const locked = state.level < a.reqLevel;
    if (idx > 0) {
      const conn = document.createElement("div");
      conn.className = "map-conn" + (locked ? " locked" : "");
      map.appendChild(conn);
    }
    const node = document.createElement("button");
    node.className = "map-node" + (locked ? " locked" : "") + (a.id === selectedArea ? " sel" : "");
    if (!locked && typeof BG !== "undefined" && BG[a.id]) node.style.backgroundImage = `url(${BG[a.id]})`;
    node.innerHTML = `
      <span class="map-name">${a.name}</span>
      ${locked ? `<span class="map-lock">🔒Lv${a.reqLevel}</span>` : ""}
      ${state.bossCleared[a.id] ? `<span class="map-crown">👑</span>` : ""}`;
    if (!locked) node.onclick = () => { selectedArea = a.id; renderAreas(); };
    map.appendChild(node);
  });
  wrap.appendChild(map);
  // 選択エリアの詳細＆出撃ボタン
  const a = AREAS.find(x => x.id === selectedArea);
  const det = document.createElement("div");
  det.className = "area-detail";
  const locked = state.level < a.reqLevel;
  det.innerHTML = `
    <h4>${a.icon} ${a.name} ${state.bossCleared[a.id] ? "👑✔" : ""}</h4>
    <div class="sub">${locked ? `🔒 Lv.${a.reqLevel} で解放` : a.desc}</div>`;
  if (!locked) {
    const btns = document.createElement("div");
    btns.className = "area-btns";
    const b1 = document.createElement("button");
    b1.className = "action"; b1.textContent = "🗺 入る";
    b1.onclick = () => enterField(a.id, "normal");
    btns.appendChild(b1);
    if (a.boss) {
      const b2 = document.createElement("button");
      b2.className = "action boss-btn"; b2.textContent = "👑 ボス";
      b2.onclick = () => enterField(a.id, "boss");
      btns.appendChild(b2);
    }
    det.appendChild(btns);
  }
  wrap.appendChild(det);
}

function statusIcons(holder) {
  return (holder.statuses || []).map(s => {
    if (s.kind === "poison") return `🟢${s.turns}`;
    if (s.kind === "burn") return `🔥${s.turns}`;
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
  const pStatus = statusIcons(state);

  wrap.innerHTML = `
    <div class="battle-scene" style="background-image:url(${(typeof BG !== "undefined" && BG[battle.areaId]) || ""})">
    <div class="combatants">
      <div class="fighter player">
        <div class="sprite">${spriteMarkup("hero", false)}</div>
        <div class="fname">あなた ${pStatus}</div>
        <div class="fbar"><div style="width:${state.hp / s.maxHp * 100}%"></div></div>
        <div class="sub">HP ${state.hp}/${s.maxHp}　MP ${state.mp}/${s.maxMp}</div>
        <div class="sub wmeta">${wt.name}${elem ? " " + elemLabel(elem) : ""}</div>
      </div>
      <div class="vs">VS</div>
      <div class="fighter enemy">
        <div class="sprite">${spriteMarkup(e.art || enemyArtKey(e), e.isBoss)}</div>
        <div class="fname">${e.isBoss ? "👑" : ""}${e.name} ${statusIcons(e)}</div>
        <div class="fbar"><div style="width:${e.hp / e.maxHp * 100}%"></div></div>
        <div class="sub">HP ${e.hp}/${e.maxHp}</div>
        <div class="sub">弱点 ${elemLabel(e.weak)}${e.resist ? "・耐性 " + elemLabel(e.resist) : ""}</div>
      </div>
    </div>
    </div>
    <div class="battle-actions" id="battle-actions"></div>`;

  const actions = document.getElementById("battle-actions");
  const mk = (label, fn, cls = "action", disabled = false) => {
    const b = document.createElement("button");
    b.className = cls; b.textContent = label; b.onclick = fn; b.disabled = disabled;
    return b;
  };

  if (battle.showSkills) {
    const skills = wt.skills || [];
    if (skills.length === 0) {
      const note = document.createElement("div");
      note.className = "empty-note"; note.textContent = "この武器で使えるスキルはない。";
      actions.appendChild(note);
    }
    for (const sid of skills) {
      const sk = SKILLS[sid];
      const b = document.createElement("button");
      b.className = "action skill-btn"; b.disabled = state.mp < sk.mp;
      b.innerHTML = `${sk.icon} ${sk.name} <span class="mpcost">MP${sk.mp}</span><span class="skdesc">${sk.desc}</span>`;
      b.onclick = () => actSkill(sid);
      actions.appendChild(b);
    }
    actions.appendChild(mk("↩ 戻る", () => { battle.showSkills = false; renderBattle(); }, "action secondary"));
  } else if (battle.showItems) {
    const consumables = SHOP.filter(x => x.kind === "consumable" && itemQty(x.id) > 0);
    if (consumables.length === 0) {
      const note = document.createElement("div");
      note.className = "empty-note"; note.textContent = "使える道具がない。お店で買おう。";
      actions.appendChild(note);
    }
    for (const it of consumables) {
      const b = document.createElement("button");
      b.className = "action skill-btn";
      b.innerHTML = `${it.icon} ${it.name} <span class="mpcost">×${itemQty(it.id)}</span><span class="skdesc">${it.desc}</span>`;
      b.onclick = () => actItem(it.id);
      actions.appendChild(b);
    }
    actions.appendChild(mk("↩ 戻る", () => { battle.showItems = false; renderBattle(); }, "action secondary"));
  } else {
    actions.appendChild(mk("⚔ 攻撃", actAttack));
    actions.appendChild(mk("✨ スキル", () => { battle.showSkills = true; renderBattle(); }, "action", (wt.skills || []).length === 0));
    actions.appendChild(mk("🎒 道具", () => { battle.showItems = true; renderBattle(); }, "action"));
    actions.appendChild(mk("🛡 防御", actDefend, "action secondary"));
    actions.appendChild(mk("🏃 逃げる", fleeBattle, "action secondary", battle.kind === "boss"));
    const autoBtn = mk(battle.auto ? "🔁 オート:ON" : "🔁 オート", () => {
      battle.auto = !battle.auto; renderBattle();
      if (battle.auto && !battle.over) setTimeout(() => { if (battle && !battle.over && battle.auto) actAttack(); }, 300);
    }, battle.auto ? "action" : "action secondary");
    actions.appendChild(autoBtn);
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
    btn.className = "action"; btn.textContent = ok ? "採集する" : `${toolName}が足りない`; btn.disabled = !ok;
    btn.onclick = () => gather(area.id, n.id);
    card.appendChild(btn);
    grid.appendChild(card);
  }
}

function renderCraft() {
  const wrap = document.getElementById("recipe-list");
  wrap.innerHTML = "";
  // フィルタ：作れるものだけ
  const filter = document.createElement("label");
  filter.className = "filter-row";
  filter.innerHTML = `<input type="checkbox" id="craftable-only" ${state.settings.craftableOnly ? "checked" : ""}> 作れるものだけ表示`;
  wrap.appendChild(filter);
  filter.querySelector("input").onchange = (e) => { state.settings.craftableOnly = e.target.checked; save(); renderCraft(); };

  const order = ["axe", "pickaxe", "weapon", "armor", "accessory"];
  const sorted = [...RECIPES].filter(r => !r.rewardOnly).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  let shown = 0;
  for (const r of sorted) {
    const ok = canCraft(r);
    if (state.settings.craftableOnly && !ok) continue;
    shown++;
    const owned = state.owned.includes(r.id);
    const costStr = Object.entries(r.cost).map(([m, q]) => {
      const lack = matQty(m) < q;
      return `<span class="${lack ? "lack" : ""}">${MATERIALS[m].icon}${MATERIALS[m].name} ${matQty(m)}/${q}</span>`;
    }).join("　");
    const typeLabel = { axe: "斧", pickaxe: "ピッケル", weapon: "武器", armor: "防具", accessory: "装飾" }[r.type];
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
    btn.className = "action"; btn.textContent = "作成"; btn.disabled = !ok;
    btn.onclick = () => craft(r.id);
    card.appendChild(btn);
    wrap.appendChild(card);
  }
  if (shown === 0) {
    const note = document.createElement("div");
    note.className = "empty-note"; note.textContent = "今すぐ作れるレシピがない。素材を集めよう。";
    wrap.appendChild(note);
  }
}

function renderShop() {
  const cWrap = document.getElementById("shop-consumable");
  cWrap.innerHTML = "";
  for (const it of SHOP.filter(x => x.kind === "consumable")) {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <div class="gicon">${it.icon}</div>
      <div class="rinfo">
        <h4>${it.name} <span class="ttag">所持 ×${itemQty(it.id)}</span></h4>
        <div class="effect">${it.desc}</div>
        <div class="cost">💰 ${it.price}G</div>
      </div>`;
    const btn = document.createElement("button");
    btn.className = "action"; btn.textContent = "買う"; btn.disabled = state.gold < it.price;
    btn.onclick = () => buyItem(it.id);
    card.appendChild(btn);
    cWrap.appendChild(card);
  }
  const pWrap = document.getElementById("shop-perm");
  pWrap.innerHTML = "";
  for (const it of SHOP.filter(x => x.kind === "perm")) {
    const price = seedPrice(it);
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <div class="gicon">${it.icon}</div>
      <div class="rinfo">
        <h4>${it.name} <span class="ttag">購入 ${state.permBought[it.stat] || 0} 回</span></h4>
        <div class="effect">${it.desc}（買うほど高くなる）</div>
        <div class="cost">💰 ${price}G</div>
      </div>`;
    const btn = document.createElement("button");
    btn.className = "action"; btn.textContent = "買う"; btn.disabled = state.gold < price;
    btn.onclick = () => buyItem(it.id);
    card.appendChild(btn);
    pWrap.appendChild(card);
  }
  // 素材売却
  const sWrap = document.getElementById("shop-sell");
  if (sWrap) {
    sWrap.innerHTML = "";
    const owned = Object.keys(MATERIALS).filter(mid => matQty(mid) > 0);
    if (owned.length === 0) {
      sWrap.innerHTML = `<div class="empty-note">売れる素材がない。</div>`;
    } else {
      for (const mid of owned) {
        const price = SELL_PRICE[mid] || 1;
        const card = document.createElement("div");
        card.className = "recipe-card";
        card.innerHTML = `
          <div class="gicon">${MATERIALS[mid].icon}</div>
          <div class="rinfo">
            <h4>${MATERIALS[mid].name} <span class="ttag">所持 ×${matQty(mid)}</span></h4>
            <div class="cost">💰 ${price}G / 個</div>
          </div>`;
        const b1 = document.createElement("button");
        b1.className = "action secondary"; b1.textContent = "1個売る";
        b1.onclick = () => sellMat(mid, false);
        const b2 = document.createElement("button");
        b2.className = "action"; b2.textContent = "全部売る";
        b2.onclick = () => sellMat(mid, true);
        const box = document.createElement("div"); box.className = "sell-btns";
        box.appendChild(b1); box.appendChild(b2);
        card.appendChild(box);
        sWrap.appendChild(card);
      }
    }
  }
}

function enhTag(id) { const lv = enhanceLv(id); return lv > 0 ? ` <span class="enh">+${lv}</span>` : ""; }

function renderEquip() {
  const slots = [
    { key: "weapon", label: "武器" }, { key: "armor", label: "防具" }, { key: "accessory", label: "装飾品" },
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
      <div class="slot-item ${r ? "" : "empty"}">${r ? r.icon + " " + r.name + enhTag(id) : "なし"}</div>`;
    wrap.appendChild(div);
  }
  // セット効果＆属性耐性の表示
  const setBox = document.getElementById("set-info");
  if (setBox) {
    const sets = activeSets();
    const ps = derivedStats();
    const resParts = Object.entries(ps.resist).filter(([, v]) => v > 0).map(([el, v]) => `${ELEMENTS[el].icon}${Math.round(v * 100)}%`);
    let html = "";
    if (sets.length) html += sets.map(s => `<div class="set-active">✨ セット効果【${s.name}】発動中：${statBadges(s.bonus)}</div>`).join("");
    if (resParts.length) html += `<div class="resist-line">属性耐性：${resParts.join(" / ")}</div>`;
    setBox.innerHTML = html;
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
    const canEnhance = ["weapon", "armor", "accessory"].includes(r.type);
    const card = document.createElement("div");
    card.className = "gear-card";
    let effText = gearEffectText(r);
    if (canEnhance && enhanceLv(id) > 0) {
      const s = gearStats(id);
      effText = `現在: ${statBadges(s)}`;
    }
    card.innerHTML = `
      <div class="gicon">${r.icon}</div>
      <div class="ginfo">
        <h4>${r.name}${enhTag(id)}</h4>
        <div class="effect">${effText}</div>
      </div>`;
    const btns = document.createElement("div");
    btns.className = "gear-btns";
    if (equipped) {
      const tag = document.createElement("span");
      tag.className = "equipped-tag"; tag.textContent = "装備中";
      btns.appendChild(tag);
    } else {
      const btn = document.createElement("button");
      btn.className = "action secondary"; btn.textContent = "装備";
      btn.onclick = () => equipItem(id);
      btns.appendChild(btn);
    }
    if (canEnhance) {
      const lv = enhanceLv(id);
      if (lv >= ENHANCE_MAX) {
        const m = document.createElement("span");
        m.className = "enh-max"; m.textContent = "MAX";
        btns.appendChild(m);
      } else {
        const c = enhanceCost(id);
        const eb = document.createElement("button");
        eb.className = "action enh-btn";
        eb.innerHTML = `⚒ 強化+${lv + 1}<span class="enh-cost">💰${c.gold} ${MATERIALS[c.mat].icon}${c.matN}</span>`;
        eb.disabled = state.gold < c.gold || matQty(c.mat) < c.matN;
        eb.onclick = () => enhance(id);
        btns.appendChild(eb);
      }
    }
    card.appendChild(btns);
    gearWrap.appendChild(card);
  }
}

function renderBag() {
  const wrap = document.getElementById("material-list");
  wrap.innerHTML = "";
  const entries = Object.keys(MATERIALS).filter(mid => matQty(mid) > 0);
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

// 全モンスター（通常＋ボス）の一覧
function allMonsters() {
  const list = [];
  for (const a of AREAS) {
    for (const m of a.monsters) list.push({ ...m, area: a.name });
    if (a.boss) list.push({ ...a.boss, area: a.name, isBoss: true });
  }
  return list;
}

function renderRecord() {
  // クエスト
  const qWrap = document.getElementById("quest-list");
  if (qWrap) {
    qWrap.innerHTML = "";
    for (const q of QUESTS) {
      const prog = questProgress(q);
      const done = questDone(q);
      const claimed = state.questClaimed[q.id];
      const r = q.reward;
      const rewardStr = [r.gold ? `💰${r.gold}` : "",
        ...Object.entries(r.mats || {}).map(([m, n]) => `${MATERIALS[m].icon}×${n}`),
        ...Object.entries(r.items || {}).map(([it, n]) => `${SHOP_BY_ID[it].icon}×${n}`)].filter(Boolean).join(" ");
      const card = document.createElement("div");
      card.className = "recipe-card" + (claimed ? " owned" : "");
      card.innerHTML = `
        <div class="rinfo">
          <h4>${q.name} ${claimed ? "✔" : ""}</h4>
          <div class="effect">進捗 ${Math.min(prog, q.count)}/${q.count} ・ 報酬 ${rewardStr}</div>
          <div class="bar quest-bar"><div class="bar-fill exp" style="width:${Math.min(100, prog / q.count * 100)}%"></div></div>
        </div>`;
      if (!claimed) {
        const b = document.createElement("button");
        b.className = "action"; b.textContent = done ? "受取" : "未達成"; b.disabled = !done;
        b.onclick = () => claimQuest(q.id);
        card.appendChild(b);
      }
      qWrap.appendChild(card);
    }
  }
  // 図鑑の進捗＆コンプ報酬
  const dProg = document.getElementById("dex-progress");
  if (dProg) {
    const cnt = dexCount();
    dProg.innerHTML = `発見 ${cnt}/${DEX_TOTAL} 種
      <div class="bar quest-bar"><div class="bar-fill exp" style="width:${Math.min(100, cnt / DEX_TOTAL * 100)}%"></div></div>`;
  }
  const dRew = document.getElementById("dex-reward");
  if (dRew) {
    dRew.innerHTML = "";
    for (let i = 0; i < DEX_MILESTONES.length; i++) {
      const m = DEX_MILESTONES[i];
      const r = m.reward;
      const claimed = state.dexClaimed[i];
      const ok = dexCount() >= m.n;
      const rewardStr = [r.gold ? `💰${r.gold}` : "",
        ...Object.entries(r.mats || {}).map(([mat, n]) => `${MATERIALS[mat].icon}×${n}`),
        ...Object.entries(r.items || {}).map(([it, n]) => `${SHOP_BY_ID[it].icon}×${n}`),
        r.owned ? `${RECIPE_BY_ID[r.owned].icon}${RECIPE_BY_ID[r.owned].name}` : ""].filter(Boolean).join(" ");
      const card = document.createElement("div");
      card.className = "recipe-card" + (claimed ? " owned" : "");
      card.innerHTML = `<div class="rinfo"><h4>図鑑 ${m.n}種 ${claimed ? "✔" : ""}</h4><div class="effect">報酬 ${rewardStr}</div></div>`;
      const b = document.createElement("button");
      b.className = "action"; b.textContent = claimed ? "受取済" : (ok ? "受取" : `${m.n}種で解放`);
      b.disabled = claimed || !ok;
      b.onclick = () => claimDexReward(i);
      card.appendChild(b);
      dRew.appendChild(card);
    }
  }
  // 図鑑
  const dWrap = document.getElementById("dex-list");
  if (dWrap) {
    dWrap.innerHTML = "";
    for (const m of allMonsters()) {
      const cnt = state.dex[m.name] || 0;
      const found = cnt > 0;
      const card = document.createElement("div");
      card.className = "dex-card" + (found ? "" : " unknown");
      const art = found ? `<div class="dex-sprite">${spriteMarkup(ART_BY_NAME[m.name], m.isBoss)}</div>` : `<div class="dex-sprite dex-q">？</div>`;
      card.innerHTML = `
        ${art}
        <div class="dex-info">
          <h4>${found ? (m.isBoss ? "👑" : "") + m.name : "？？？"}</h4>
          <div class="sub">${found ? `${m.area} ・ 撃破 ${cnt}` : "未発見"}</div>
          ${found ? `<div class="sub">弱点 ${elemLabel(m.weak)}${m.resist ? "・耐性 " + elemLabel(m.resist) : ""}</div>
          <div class="sub">ドロップ: ${(m.drops || []).map(d => MATERIALS[d.mat].icon).join(" ")}</div>` : ""}
        </div>`;
      dWrap.appendChild(card);
    }
  }
}

function renderSettings() {
  const wrap = document.getElementById("settings-box");
  if (!wrap) return;
  wrap.innerHTML = "";
  const mk = (label, key, onChange) => {
    const row = document.createElement("label");
    row.className = "filter-row";
    row.innerHTML = `<input type="checkbox" ${state.settings[key] ? "checked" : ""}> ${label}`;
    row.querySelector("input").onchange = (e) => { state.settings[key] = e.target.checked; save(); if (onChange) onChange(); };
    return row;
  };
  wrap.appendChild(mk("🔊 効果音", "sound"));
  wrap.appendChild(mk("🎵 BGM", "bgm", () => { if (typeof toggleBgm === "function") toggleBgm(); }));
}

function renderSaveUI() {
  const box = document.getElementById("slot-box");
  if (!box) return;
  box.innerHTML = "";
  for (let i = 0; i < NUM_SLOTS; i++) {
    const sum = slotSummary(i);
    const card = document.createElement("div");
    card.className = "slot-card" + (i === currentSlot ? " current" : "");
    card.innerHTML = `
      <div class="slot-sum">
        <b>スロット${i + 1}${i === currentSlot ? "（使用中）" : ""}</b>
        <span class="sub">${sum ? `Lv.${sum.level} ・ 💰${fmt(sum.gold)}` : "（空き）"}</span>
      </div>`;
    const btns = document.createElement("div");
    btns.className = "slot-card-btns";
    if (i !== currentSlot) {
      const sel = document.createElement("button");
      sel.className = "action secondary"; sel.textContent = sum ? "切替" : "新規";
      sel.onclick = () => switchSlot(i);
      btns.appendChild(sel);
    }
    if (sum) {
      const del = document.createElement("button");
      del.className = "action secondary slot-del"; del.textContent = "🗑";
      del.onclick = () => deleteSlot(i);
      btns.appendChild(del);
    }
    card.appendChild(btns);
    box.appendChild(card);
  }
}

function renderAll() {
  renderStatus(); renderAreas(); renderBattle();
  renderGather(); renderCraft(); renderShop(); renderEquip();
  renderRecord(); renderBag(); renderSettings(); renderSaveUI();
}

/* ---------- タブ切替 ---------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if (typeof fieldOnTabChange === "function") fieldOnTabChange(btn.dataset.tab);
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

/* ---------- エクスポート／インポート ---------- */
{
  const exp = document.getElementById("export-btn");
  const imp = document.getElementById("import-btn");
  const ta = document.getElementById("save-code");
  if (exp) exp.onclick = () => {
    ta.value = exportSave();
    ta.select();
    try { document.execCommand && document.execCommand("copy"); } catch (e) {}
    toast("セーブコードをコピーした");
  };
  if (imp) imp.onclick = () => {
    if (!ta.value.trim()) { toast("コードを貼り付けてね"); return; }
    if (!confirm("現在のスロットに上書きします。よろしいですか？")) return;
    if (!importSave(ta.value)) toast("コードが正しくありません");
  };
}

/* ---------- 起動 ---------- */
clampVitals();
renderAll();
log("ようこそ！まず『採集』で素材を集め、『作成』で武器や道具を作ろう。武器の種類で戦い方が変わるぞ。", "l-sys");
