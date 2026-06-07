/* =========================================================
   2Dフィールド（探索・採取・戦闘）
   - タップで移動／木・石・敵をタップして近づき自動攻撃
   - 敵は自動でプレイヤーに接近し、接触で攻撃してくる
   - HP/MP・装備・会心・属性・スキル・道具は既存システムを流用
   ========================================================= */

let field = null;
let fieldCanvas = null, fieldCtx = null, fieldRAF = null;
const _imgCache = {};

const PLAYER_SPEED = 96;     // px/秒
const PLAYER_ATK_CD = 0.55;  // 攻撃間隔（秒）
const NODE_RESPAWN = 6;      // 採取ノード復活（秒）
const MOB_RESPAWN = 4500;    // 敵の再湧き（ms）

function _clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function _dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function spriteImg(key) {
  if (!key || typeof SPRITES === "undefined" || !SPRITES[key]) return null;
  if (!_imgCache[key]) { const im = new Image(); im.src = SPRITES[key]; _imgCache[key] = im; }
  return _imgCache[key];
}

/* ---------- 起動時の初期化（1回） ---------- */
function initField() {
  fieldCanvas = document.getElementById("field-canvas");
  if (!fieldCanvas) return;
  fieldCtx = fieldCanvas.getContext("2d");

  const hud = document.getElementById("field-hud");
  hud.innerHTML = `
    <div class="fh-top"><span id="fh-area"></span><span id="fh-lvgold"></span></div>
    <div class="fh-bar"><span class="fh-label">HP</span><div class="bar"><div id="fh-hp" class="bar-fill"></div></div><span id="fh-hptxt" class="fh-txt"></span></div>
    <div class="fh-bar"><span class="fh-label">MP</span><div class="bar"><div id="fh-mp" class="bar-fill mp"></div></div><span id="fh-mptxt" class="fh-txt"></span></div>`;

  const ctrl = document.getElementById("field-controls");
  ctrl.innerHTML = "";
  const mk = (label, fn, cls) => { const b = document.createElement("button"); b.className = "action" + (cls ? " " + cls : ""); b.textContent = label; b.onclick = fn; ctrl.appendChild(b); return b; };
  mk("🗺 もどる", exitField, "secondary");
  mk("✨ スキル", castFieldSkill);
  mk("🎒 道具", toggleFieldItems, "secondary");

  const itemBar = document.createElement("div");
  itemBar.id = "field-items"; itemBar.className = "field-items hidden";
  ctrl.parentNode.insertBefore(itemBar, ctrl.nextSibling);

  fieldCanvas.addEventListener("pointerdown", onFieldPointer);
  window.addEventListener("resize", () => { if (field) resizeField(); });
}

function resizeField() {
  if (!fieldCanvas) return;
  const cssW = fieldCanvas.clientWidth || 340;
  const cssH = Math.max(300, Math.min(window.innerHeight * 0.52, 460));
  const dpr = window.devicePixelRatio || 1;
  fieldCanvas.style.height = cssH + "px";
  fieldCanvas.width = Math.round(cssW * dpr);
  fieldCanvas.height = Math.round(cssH * dpr);
  fieldCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fieldCtx.imageSmoothingEnabled = false;
  if (field) {
    // 論理サイズが変わったら収める
    field.w = cssW; field.h = cssH;
    field.player.x = _clamp(field.player.x, 16, cssW - 16);
    field.player.y = _clamp(field.player.y, 16, cssH - 16);
  }
}

/* ---------- フィールドに入る ---------- */
function enterField(areaId, kind = "normal") {
  const area = AREAS.find(a => a.id === areaId);
  if (!area) return;
  if (state.level < area.reqLevel) { toast("まだ入れない"); return; }
  state.lastBattle = { areaId, kind };

  // 画面切替
  document.getElementById("area-list").classList.add("hidden");
  const title = document.getElementById("explore-title");
  if (title) title.classList.add("hidden");
  document.getElementById("field-wrap").classList.remove("hidden");

  resizeField();
  const W = field ? field.w : (fieldCanvas.clientWidth || 340);
  const H = parseInt(fieldCanvas.style.height) || 420;

  const s = derivedStats();
  state.hp = s.maxHp; state.mp = s.maxMp; state.statuses = [];

  field = {
    areaId, kind, area, w: W, h: H,
    player: { x: W / 2, y: H - 44, r: 14, atkCd: 0, hitFlash: 0, facing: 1 },
    target: null, nodes: [], mobs: [], pops: [],
    running: true, lastT: 0, dead: false, showItems: false,
  };
  spawnNodes();
  spawnMobs();
  if (kind === "boss") { log(`👑 ボス『${area.boss.name}』のフィールドに入った！`, "l-bad"); sfx("boss"); }
  else { log(`🗺 ${area.name} を探索開始。木や石・敵をタップ！`, "l-sys"); }
  renderFieldItems();
  startFieldLoop();
}

function exitField() {
  field = null;
  if (fieldRAF != null) { cancelAnimationFrame(fieldRAF); fieldRAF = null; }
  const fw = document.getElementById("field-wrap");
  if (fw) fw.classList.add("hidden");
  const title = document.getElementById("explore-title");
  if (title) title.classList.remove("hidden");
  document.getElementById("area-list").classList.remove("hidden");
  renderAll();
}

/* タブ切替時：探索以外に行ったら一時停止、戻ったら再開 */
function fieldOnTabChange(tab) {
  if (!field) return;
  if (tab === "explore") { field.running = true; startFieldLoop(); }
  else { field.running = false; }
}

/* ---------- 生成 ---------- */
function spawnNodes() {
  field.nodes = [];
  const defs = field.kind === "boss" ? [] : field.area.nodes;
  for (const nd of defs) {
    const count = 2; // 各種2個ずつ
    for (let i = 0; i < count; i++) {
      field.nodes.push({
        kind: "node", def: nd, tool: nd.tool, tier: nd.tier, icon: nd.icon, yields: nd.yields,
        x: 30 + Math.random() * (field.w - 60), y: 30 + Math.random() * (field.h * 0.6),
        r: 18, hp: 3, maxHp: 3, depleted: false, respawn: 0,
      });
    }
  }
}
function makeMob(template, x, y) {
  const isBoss = field.kind === "boss";
  return {
    kind: "mob", name: template.name, baseName: template.name, art: ART_BY_NAME[template.name],
    x, y, r: isBoss ? 26 : 16,
    hp: template.hp, maxHp: template.hp, atk: template.atk, def: template.def,
    exp: template.exp, gold: template.gold, drops: template.drops || [],
    weak: template.weak, resist: template.resist, atkElement: template.atkElement,
    isBoss, phase2: template.phase2, phase2done: false,
    speed: isBoss ? 30 : 40, atkCd: 0.8, atkCdMax: isBoss ? 1.4 : 1.15,
    hitFlash: 0, dead: false, stun: 0,
  };
}
function spawnMobs() {
  field.mobs = [];
  if (field.kind === "boss") {
    field.mobs.push(makeMob(field.area.boss, field.w / 2, 70));
    return;
  }
  for (let i = 0; i < 4; i++) {
    const t = field.area.monsters[rand(0, field.area.monsters.length - 1)];
    field.mobs.push(makeMob(t, 30 + Math.random() * (field.w - 60), 30 + Math.random() * (field.h * 0.45)));
  }
}
function scheduleRespawn(deadMob) {
  setTimeout(() => {
    if (!field || field.kind === "boss") return;
    const t = field.area.monsters[rand(0, field.area.monsters.length - 1)];
    const nm = makeMob(t, 20 + Math.random() * (field.w - 40), 20 + Math.random() * (field.h * 0.4));
    field.mobs.push(nm);
    // 死亡個体を掃除
    field.mobs = field.mobs.filter(m => !m.dead);
  }, MOB_RESPAWN);
}

/* ---------- 入力 ---------- */
function onFieldPointer(e) {
  if (!field || field.dead) return;
  const rect = fieldCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  // 敵優先 → ノード
  let best = null, bestD = 1e9;
  for (const m of field.mobs) {
    if (m.dead) continue;
    const d = Math.hypot(m.x - x, m.y - y);
    if (d < m.r + 14 && d < bestD) { best = { type: "mob", ref: m }; bestD = d; }
  }
  if (!best) {
    for (const n of field.nodes) {
      if (n.depleted) continue;
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < n.r + 14 && d < bestD) { best = { type: "node", ref: n }; bestD = d; }
    }
  }
  field.target = best || { type: "point", x: _clamp(x, 14, field.w - 14), y: _clamp(y, 14, field.h - 14) };
}

/* ---------- ループ ---------- */
function startFieldLoop() {
  if (field && field.running && fieldRAF == null) {
    field.lastT = (typeof performance !== "undefined" ? performance.now() : Date.now());
    fieldRAF = requestAnimationFrame(fieldLoop);
  }
}
function fieldLoop(ts) {
  fieldRAF = null;
  if (!field || !field.running) return;
  const dt = Math.min(0.05, (ts - field.lastT) / 1000 || 0);
  field.lastT = ts;
  fieldUpdate(dt);
  fieldRender();
  if (field && field.running) fieldRAF = requestAnimationFrame(fieldLoop);
}

function fieldUpdate(dt) {
  const p = field.player;
  let dest = null, atkTarget = null;
  if (field.target) {
    if (field.target.type === "point") dest = { x: field.target.x, y: field.target.y };
    else {
      const ref = field.target.ref;
      const gone = !ref || ref.dead || ref.depleted;
      if (gone) field.target = null;
      else { dest = { x: ref.x, y: ref.y }; atkTarget = ref; }
    }
  }
  if (dest) {
    const dx = dest.x - p.x, dy = dest.y - p.y, d = Math.hypot(dx, dy) || 0;
    const stop = atkTarget ? (p.r + atkTarget.r + 4) : 4;
    if (d > stop) {
      const v = Math.min(PLAYER_SPEED * dt, d);
      p.x += dx / d * v; p.y += dy / d * v;
      if (Math.abs(dx) > 1) p.facing = dx < 0 ? -1 : 1;
    } else if (atkTarget) {
      if (p.atkCd <= 0) { doPlayerAttack(atkTarget); p.atkCd = PLAYER_ATK_CD; }
    } else field.target = null;
  }
  if (p.atkCd > 0) p.atkCd -= dt;
  if (p.hitFlash > 0) p.hitFlash -= dt;
  p.x = _clamp(p.x, 14, field.w - 14); p.y = _clamp(p.y, 14, field.h - 14);

  for (const m of field.mobs) {
    if (m.dead) continue;
    if (m.hitFlash > 0) m.hitFlash -= dt;
    if (m.stun > 0) { m.stun -= dt; continue; }
    const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
    const range = m.r + p.r + 4;
    if (d > range) { const v = Math.min(m.speed * dt, d); m.x += dx / d * v; m.y += dy / d * v; }
    else if (m.atkCd <= 0) { doMobAttack(m); m.atkCd = m.atkCdMax; }
    if (m.atkCd > 0) m.atkCd -= dt;
  }

  for (const n of field.nodes) {
    if (n.depleted) { n.respawn -= dt; if (n.respawn <= 0) { n.depleted = false; n.hp = n.maxHp; } }
  }
  for (const pop of field.pops) { pop.y -= 26 * dt; pop.life -= dt; }
  field.pops = field.pops.filter(pp => pp.life > 0);

  if (state.hp <= 0) playerDie();
}

/* ---------- 攻撃処理 ---------- */
function addPop(x, y, text, color) { field.pops.push({ x, y, text: String(text), color: color || "#fff", life: 0.8 }); }

function rollPlayerDamage(mob) {
  const ps = derivedStats(), wt = weaponType(), elem = weaponElement();
  const hits = wt.hits || 1;
  let total = 0, anyCrit = false, weak = false, resist = false;
  for (let i = 0; i < hits; i++) {
    let def = (wt.ignoreDef) ? 0 : Math.max(0, mob.def * (1 - (wt.pierce || 0)));
    let dmg = ps.atk * (wt.mult || 1) - def;
    if (elem && mob.weak === elem) { dmg *= 1.5; weak = true; }
    else if (elem && mob.resist === elem) { dmg *= 0.5; resist = true; }
    const crit = Math.random() < ((wt.crit || 0) + (ps.crit || 0));
    if (crit) { dmg *= 1.8; anyCrit = true; }
    total += Math.max(1, Math.round(dmg + rand(-2, 2)));
  }
  return { total, crit: anyCrit, weak, resist };
}

function doPlayerAttack(t) {
  if (t.kind === "node") hitNode(t);
  else hitMob(t);
}

function hitNode(n) {
  const have = toolTier(n.tool);
  if (have < n.tier) {
    const toolName = n.tool === "axe" ? "斧" : "ピッケル";
    addPop(n.x, n.y - n.r - 6, `${toolName}が必要`, "#e06c75");
    toast(`もっと良い${toolName}が必要`);
    field.target = null;
    return;
  }
  sfx("gather");
  n.hp -= 1;
  addPop(n.x, n.y - n.r - 6, "🪓", "#fff");
  if (n.hp <= 0) {
    const bonus = have - n.tier;
    let got = [];
    for (const y of n.yields) {
      if (Math.random() <= y.chance) {
        const amt = rand(y.min, y.max) + Math.floor(bonus * 0.7);
        addMat(y.mat, amt); questTrack("gather", y.mat, amt);
        got.push(MATERIALS[y.mat].icon + amt);
      }
    }
    if (got.length) addPop(n.x, n.y - n.r - 10, got.join(" "), "#6ad6a8");
    gainExp(2);
    n.depleted = true; n.respawn = NODE_RESPAWN;
    if (field.target && field.target.ref === n) field.target = null;
    save();
  }
}

function hitMob(m) {
  const r = rollPlayerDamage(m);
  m.hp -= r.total; m.hitFlash = 0.15;
  sfx(r.crit ? "crit" : "hit");
  addPop(m.x, m.y - m.r - 6, (r.crit ? "会心 " : "") + r.total + (r.weak ? " 弱点!" : r.resist ? " 耐性" : ""),
    r.crit ? "#ffe14d" : (r.weak ? "#8af0ff" : "#fff"));
  if (m.hp <= 0) onMobDown(m);
}

function doMobAttack(m) {
  const ps = derivedStats();
  let edmg = Math.max(1, m.atk - ps.def + rand(-2, 2));
  if (m.atkElement && ps.resist && ps.resist[m.atkElement] > 0) edmg = Math.max(1, Math.round(edmg * (1 - ps.resist[m.atkElement])));
  state.hp = Math.max(0, state.hp - edmg);
  field.player.hitFlash = 0.18;
  addPop(field.player.x, field.player.y - field.player.r - 8, edmg, "#e06c75");
  sfx("enemyhit");
  if (state.hp <= 0) playerDie();
}

function onMobDown(m) {
  if (m.dead) return;
  // ボス第2形態
  if (m.isBoss && m.phase2 && !m.phase2done) {
    m.phase2done = true;
    const p = m.phase2;
    m.name = p.name; m.maxHp = p.hp; m.hp = p.hp; m.atk = p.atk; m.def = p.def;
    if (p.atkElement) m.atkElement = p.atkElement;
    if (p.weak) m.weak = p.weak; if (p.resist) m.resist = p.resist;
    addPop(m.x, m.y - m.r - 10, "第2形態!", "#e06c75");
    toast("ボスが変身した！"); sfx("transform");
    return;
  }
  m.dead = true;
  mobDefeated(m);
  if (m.isBoss) {
    addPop(m.x, m.y - m.r - 10, "撃破!", "#ffe14d");
    setTimeout(() => { if (field) exitField(); }, 1000);
  } else {
    if (field.target && field.target.ref === m) field.target = null;
    scheduleRespawn(m);
  }
}

function mobDefeated(m) {
  const ps = derivedStats();
  let drops = [];
  for (const d of m.drops || []) {
    if (Math.random() <= d.chance + (ps.dropBonus || 0)) {
      const amt = rand(d.min, d.max); addMat(d.mat, amt);
      drops.push(MATERIALS[d.mat].icon + amt);
    }
  }
  const gold = Math.round(m.gold * (1 + (ps.dropBonus || 0)));
  state.gold += gold;
  const recName = m.baseName || m.name;
  state.dex[recName] = (state.dex[recName] || 0) + 1;
  questTrack("kill", recName);
  if (m.isBoss) { questTrack("boss", recName); state.bossCleared[field.areaId] = true; }
  if (typeof checkDexRewards === "function") checkDexRewards();
  let txt = `+${m.exp}EXP 💰${gold}` + (drops.length ? " " + drops.join(" ") : "");
  addPop(m.x, m.y - m.r - 6, txt, "#6ad6a8");
  log(`✨ ${recName} を倒した！ ${txt}`, "l-good");
  sfx("win");
  gainExp(m.exp);
  save();
}

function playerDie() {
  if (field.dead) return;
  field.dead = true;
  const lost = Math.floor(state.gold * 0.15);
  state.gold -= lost;
  log(`💀 力尽きた…拠点で回復した。${lost > 0 ? "（" + lost + "G消失）" : ""}`, "l-bad");
  toast("やられた…"); sfx("lose");
  const s = derivedStats();
  state.hp = s.maxHp; state.mp = s.maxMp; state.statuses = [];
  field.player.x = field.w / 2; field.player.y = field.h - 44;
  field.target = null;
  for (const m of field.mobs) { if (!m.dead) { m.x = 20 + Math.random() * (field.w - 40); m.y = 20 + Math.random() * (field.h * 0.35); m.atkCd = 1.2; } }
  save();
  field.dead = false;
}

/* ---------- スキル・道具 ---------- */
function nearestMob() {
  let best = null, bd = 1e9;
  for (const m of field.mobs) { if (m.dead) continue; const d = _dist(m, field.player); if (d < bd) { best = m; bd = d; } }
  return best;
}
function castFieldSkill() {
  if (!field || field.dead) return;
  const wt = weaponType();
  if (!wt.skills || !wt.skills.length) { toast("この武器にスキルはない"); return; }
  const id = wt.skills[0], sk = SKILLS[id];
  if (state.mp < sk.mp) { toast("MPが足りない"); sfx("deny"); return; }
  state.mp -= sk.mp; sfx("cast");
  if (id === "heal") {
    const s = derivedStats(); const amt = Math.round(s.maxHp * 0.4);
    state.hp = Math.min(s.maxHp, state.hp + amt);
    addPop(field.player.x, field.player.y - 24, "+" + amt, "#7fe199"); sfx("heal");
    return;
  }
  const target = (field.target && field.target.type === "mob" && !field.target.ref.dead) ? field.target.ref : nearestMob();
  if (!target) { toast("対象がいない"); state.mp += sk.mp; return; }
  const r = rollPlayerDamage(target);
  const dmg = Math.round(r.total * 1.8);
  target.hp -= dmg; target.hitFlash = 0.2;
  addPop(target.x, target.y - target.r - 8, "✨" + dmg, "#ffe14d");
  // 周囲に余波
  for (const m of field.mobs) {
    if (m === target || m.dead) continue;
    if (_dist(m, target) < 64) { const sp = Math.round(dmg * 0.5); m.hp -= sp; m.hitFlash = 0.2; addPop(m.x, m.y - m.r - 6, sp, "#fff"); if (m.hp <= 0) onMobDown(m); }
  }
  if (target.hp <= 0) onMobDown(target);
}

function toggleFieldItems() {
  if (!field) return;
  field.showItems = !field.showItems;
  renderFieldItems();
}
function renderFieldItems() {
  const bar = document.getElementById("field-items");
  if (!bar) return;
  if (!field || !field.showItems) { bar.classList.add("hidden"); bar.innerHTML = ""; return; }
  bar.classList.remove("hidden");
  bar.innerHTML = "";
  const consumables = SHOP.filter(x => x.kind === "consumable" && itemQty(x.id) > 0);
  if (consumables.length === 0) { bar.innerHTML = `<span class="empty-note">使える道具がない。店で買おう。</span>`; return; }
  for (const it of consumables) {
    const b = document.createElement("button");
    b.className = "action secondary";
    b.textContent = `${it.icon}×${itemQty(it.id)}`;
    b.title = it.name;
    b.onclick = () => useFieldItem(it.id);
    bar.appendChild(b);
  }
}
function useFieldItem(id) {
  if (itemQty(id) <= 0) return;
  const s = derivedStats();
  if (id === "potion_hp") { const a = Math.round(s.maxHp * .5); state.hp = Math.min(s.maxHp, state.hp + a); addPop(field.player.x, field.player.y - 24, "+" + a, "#7fe199"); }
  else if (id === "potion_mp") { const a = Math.round(s.maxMp * .5); state.mp = Math.min(s.maxMp, state.mp + a); addPop(field.player.x, field.player.y - 24, "MP+" + a, "#8ab6ff"); }
  else if (id === "elixir") { state.hp = s.maxHp; state.mp = s.maxMp; addPop(field.player.x, field.player.y - 24, "全回復", "#7fe199"); }
  else if (id === "antidote") { state.statuses = []; addPop(field.player.x, field.player.y - 24, "治癒", "#7fe199"); }
  state.items[id] = itemQty(id) - 1;
  sfx("heal"); save();
  field.showItems = false; renderFieldItems();
}

/* ---------- 描画 ---------- */
function fieldRender() {
  const ctx = fieldCtx, W = field.w, H = field.h;
  ctx.clearRect(0, 0, W, H);
  // 背景
  const bg = (typeof BG !== "undefined" && BG[field.areaId]) ? spriteImgRaw("bg_" + field.areaId, BG[field.areaId]) : null;
  if (bg && bg.complete && bg.naturalWidth) ctx.drawImage(bg, 0, 0, W, H);
  else { ctx.fillStyle = "#2a3045"; ctx.fillRect(0, 0, W, H); }
  // 地面の影帯
  ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(0, H - 26, W, 26);

  // ノード
  for (const n of field.nodes) {
    if (n.depleted) continue;
    drawTarget(n);
    ctx.font = "26px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(n.icon, n.x, n.y);
    if (n.hp < n.maxHp) drawBar(n.x, n.y - n.r - 6, 26, n.hp / n.maxHp, "#6ad6a8");
  }
  // 敵
  for (const m of field.mobs) {
    if (m.dead) continue;
    drawTarget(m);
    drawSprite(m.art, m.x, m.y, m.isBoss ? 50 : 32, 1, m.hitFlash > 0, m.isBoss);
    drawBar(m.x, m.y - m.r - 10, m.isBoss ? 48 : 30, m.hp / m.maxHp, m.isBoss ? "#c678dd" : "#e06c75");
  }
  // プレイヤー
  const p = field.player;
  drawSprite("hero", p.x, p.y, 32, p.facing, p.hitFlash > 0, false);

  // ポップ
  ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
  for (const pop of field.pops) {
    ctx.globalAlpha = Math.max(0, Math.min(1, pop.life / 0.6));
    ctx.fillStyle = "#000"; ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
    ctx.fillStyle = pop.color; ctx.fillText(pop.text, pop.x, pop.y);
  }
  ctx.globalAlpha = 1;

  updateFieldHud();
}
function spriteImgRaw(key, src) {
  if (!_imgCache[key]) { const im = new Image(); im.src = src; _imgCache[key] = im; }
  return _imgCache[key];
}
function drawSprite(artKey, x, y, size, facing, flash, boss) {
  const ctx = fieldCtx;
  const img = spriteImg(artKey);
  ctx.save();
  ctx.translate(x, y);
  if (facing < 0) ctx.scale(-1, 1);
  if (img && img.complete && img.naturalWidth) {
    if (boss) { ctx.shadowColor = "rgba(255,90,90,.9)"; ctx.shadowBlur = 10; }
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = "#888"; ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, 7); ctx.fill();
  }
  if (flash) { ctx.globalAlpha = .5; ctx.fillStyle = "#fff"; ctx.fillRect(-size / 2, -size / 2, size, size); ctx.globalAlpha = 1; }
  ctx.restore();
}
function drawBar(cx, y, w, ratio, color) {
  const ctx = fieldCtx, h = 4, x = cx - w / 2;
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, ratio), h);
}
function drawTarget(e) {
  if (!field.target || field.target.ref !== e) return;
  const ctx = fieldCtx;
  ctx.strokeStyle = "#f2c14e"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.7, e.r + 4, (e.r + 4) * 0.5, 0, 0, 7); ctx.stroke();
}
function updateFieldHud() {
  const s = derivedStats();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const setw = (id, r) => { const el = document.getElementById(id); if (el) el.style.width = (Math.max(0, Math.min(1, r)) * 100) + "%"; };
  set("fh-area", `${field.area.icon} ${field.kind === "boss" ? "ボス戦" : field.area.name}`);
  set("fh-lvgold", `Lv.${state.level}　💰${fmt(state.gold)}`);
  setw("fh-hp", state.hp / s.maxHp); set("fh-hptxt", `${state.hp}/${s.maxHp}`);
  setw("fh-mp", state.mp / s.maxMp); set("fh-mptxt", `${state.mp}/${s.maxMp}`);
}

// 起動時に初期化
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initField);
  else initField();
}
