/* =========================================================
   2D横スクロール・フィールド（マリオ風の横視点）
   - 地面を左右に移動＋ジャンプ。カメラが追従
   - 目の前の木・石・敵をタップ／⚔ボタンで攻撃
   - 敵は追いかけてこない。隣接して殴ったとき反撃（ジャンプ中は当たらない）
   ========================================================= */

let field = null;
let fieldCanvas = null, fieldCtx = null, fieldRAF = null;
const _imgCache = {};

const MOVE_SPEED = 122;   // px/秒
const GRAVITY = 1200;     // px/秒^2
const JUMP_V = 400;       // ジャンプ初速
const PLAYER_ATK_CD = 0.5;
const NODE_RESPAWN = 6;
const MOB_RESPAWN = 4500;

function _clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function spriteImg(key) {
  if (!key || typeof SPRITES === "undefined" || !SPRITES[key]) return null;
  if (!_imgCache[key]) { const im = new Image(); im.src = SPRITES[key]; _imgCache[key] = im; }
  return _imgCache[key];
}
function bgImg(areaId) {
  if (typeof BG === "undefined" || !BG[areaId]) return null;
  const k = "bg_" + areaId;
  if (!_imgCache[k]) { const im = new Image(); im.src = BG[areaId]; _imgCache[k] = im; }
  return _imgCache[k];
}

const GROUND_COLOR = { grassland: "#6aa84f", forest: "#4e6b46", mountain: "#6b6256", volcano: "#5a2f30" };

/* ---------- 初期化（1回） ---------- */
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
  ctrl.innerHTML = `
    <div class="fc-dpad">
      <button id="fc-left" class="fc-btn">◀</button>
      <button id="fc-right" class="fc-btn">▶</button>
    </div>
    <div class="fc-actions">
      <button id="fc-jump" class="fc-btn">⤴</button>
      <button id="fc-atk" class="fc-btn atk">⚔</button>
      <button id="fc-skill" class="fc-btn">✨</button>
      <button id="fc-item" class="fc-btn">🎒</button>
      <button id="fc-back" class="fc-btn">🗺</button>
    </div>`;

  const itemBar = document.createElement("div");
  itemBar.id = "field-items"; itemBar.className = "field-items hidden";
  ctrl.parentNode.insertBefore(itemBar, ctrl.nextSibling);

  // 移動（押している間だけ）
  const holdL = (v) => { if (field) { field.moveDir = v; if (v) field.target = null; } };
  const L = document.getElementById("fc-left"), R = document.getElementById("fc-right");
  const bindHold = (el, dir) => {
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); holdL(dir); });
    el.addEventListener("pointerup", () => { if (field && field.moveDir === dir) field.moveDir = 0; });
    el.addEventListener("pointerleave", () => { if (field && field.moveDir === dir) field.moveDir = 0; });
    el.addEventListener("pointercancel", () => { if (field && field.moveDir === dir) field.moveDir = 0; });
  };
  bindHold(L, -1); bindHold(R, 1);
  document.getElementById("fc-jump").onclick = fieldJump;
  document.getElementById("fc-atk").onclick = fieldManualAttack;
  document.getElementById("fc-skill").onclick = castFieldSkill;
  document.getElementById("fc-item").onclick = toggleFieldItems;
  document.getElementById("fc-back").onclick = exitField;

  fieldCanvas.addEventListener("pointerdown", onFieldPointer);
  window.addEventListener("resize", () => { if (field) resizeField(); });
}

function resizeField() {
  if (!fieldCanvas) return;
  const cssW = fieldCanvas.clientWidth || 340;
  const cssH = Math.max(260, Math.min(window.innerHeight * 0.5, 420));
  const dpr = window.devicePixelRatio || 1;
  fieldCanvas.style.height = cssH + "px";
  fieldCanvas.width = Math.round(cssW * dpr);
  fieldCanvas.height = Math.round(cssH * dpr);
  fieldCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fieldCtx.imageSmoothingEnabled = false;
  if (field) { field.w = cssW; field.h = cssH; field.groundY = cssH - 44; }
}

/* ---------- 入場 ---------- */
function enterField(areaId, kind = "normal") {
  const area = AREAS.find(a => a.id === areaId);
  if (!area) return;
  if (state.level < area.reqLevel) { toast("まだ入れない"); return; }
  state.lastBattle = { areaId, kind };

  document.getElementById("area-list").classList.add("hidden");
  const title = document.getElementById("explore-title");
  if (title) title.classList.add("hidden");
  document.getElementById("field-wrap").classList.remove("hidden");

  resizeField();
  const W = fieldCanvas.clientWidth || 340;
  const H = parseInt(fieldCanvas.style.height) || 360;
  const groundY = H - 44;

  const s = derivedStats();
  state.hp = s.maxHp; state.mp = s.maxMp; state.statuses = [];

  field = {
    areaId, kind, area, w: W, h: H, groundY,
    worldW: 0, camX: 0,
    player: { x: 60, y: groundY, vx: 0, vy: 0, onGround: true, r: 14, facing: 1, atkCd: 0, hitFlash: 0 },
    target: null, moveDir: 0, nodes: [], mobs: [], pops: [],
    running: true, lastT: 0, dead: false, showItems: false,
  };
  spawnEntities();
  if (kind === "boss") { log(`👑 ボス『${area.boss.name}』のフィールドに入った！`, "l-bad"); sfx("boss"); }
  else { log(`🗺 ${area.name} を探索。◀▶で歩いて、敵や木をタップ／⚔で攻撃！`, "l-sys"); }
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

function fieldOnTabChange(tab) {
  if (!field) return;
  if (tab === "explore") { field.running = true; startFieldLoop(); }
  else { field.running = false; field.moveDir = 0; }
}

/* ---------- 生成（地面に横並び） ---------- */
function makeMob(template, x, gy) {
  const isBoss = field.kind === "boss";
  return {
    kind: "mob", name: template.name, baseName: template.name, art: ART_BY_NAME[template.name],
    x, y: gy, r: isBoss ? 26 : 16,
    hp: template.hp, maxHp: template.hp, atk: template.atk, def: template.def,
    exp: template.exp, gold: template.gold, drops: template.drops || [],
    weak: template.weak, resist: template.resist, atkElement: template.atkElement,
    isBoss, phase2: template.phase2, phase2done: false,
    atkCd: 0.8, atkCdMax: isBoss ? 1.4 : 1.15, hitFlash: 0, dead: false, stun: 0,
  };
}
function spawnEntities() {
  field.nodes = []; field.mobs = [];
  const gy = field.groundY;
  if (field.kind === "boss") {
    field.worldW = Math.max(field.w * 1.4, 520);
    field.mobs.push(makeMob(field.area.boss, field.worldW - 90, gy));
    return;
  }
  // 並べる対象を作る
  const slots = [];
  for (const nd of field.area.nodes) { slots.push({ t: "node", nd }); slots.push({ t: "node", nd }); }
  for (let i = 0; i < 4; i++) slots.push({ t: "mob" });
  // 軽くシャッフル
  for (let i = slots.length - 1; i > 0; i--) { const j = rand(0, i); const tmp = slots[i]; slots[i] = slots[j]; slots[j] = tmp; }
  const spacing = 120;
  field.worldW = Math.max(field.w * 1.5, 160 + slots.length * spacing);
  slots.forEach((sl, i) => {
    const x = 140 + i * spacing + rand(-20, 20);
    if (sl.t === "node") {
      const nd = sl.nd;
      field.nodes.push({ kind: "node", def: nd, tool: nd.tool, tier: nd.tier, icon: nd.icon, yields: nd.yields, x, y: gy, r: 18, hp: 3, maxHp: 3, depleted: false, respawn: 0 });
    } else {
      const tmpl = field.area.monsters[rand(0, field.area.monsters.length - 1)];
      field.mobs.push(makeMob(tmpl, x, gy));
    }
  });
}
function scheduleRespawn() {
  setTimeout(() => {
    if (!field || field.kind === "boss") return;
    const tmpl = field.area.monsters[rand(0, field.area.monsters.length - 1)];
    field.mobs = field.mobs.filter(m => !m.dead);
    const x = _clamp(field.player.x + (Math.random() < .5 ? -1 : 1) * (200 + rand(0, 200)), 80, field.worldW - 60);
    field.mobs.push(makeMob(tmpl, x, field.groundY));
  }, MOB_RESPAWN);
}

/* ---------- 入力 ---------- */
function onFieldPointer(e) {
  if (!field || field.dead) return;
  const rect = fieldCanvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const worldX = sx + field.camX;
  let best = null, bd = 1e9;
  for (const m of field.mobs) { if (m.dead) continue; const d = Math.abs(m.x - worldX); if (d < m.r + 26 && d < bd) { best = { type: "mob", ref: m }; bd = d; } }
  if (!best) for (const n of field.nodes) { if (n.depleted) continue; const d = Math.abs(n.x - worldX); if (d < n.r + 26 && d < bd) { best = { type: "node", ref: n }; bd = d; } }
  field.target = best || { type: "point", x: _clamp(worldX, 14, field.worldW - 14) };
  field.moveDir = 0;
}
function fieldJump() {
  if (!field || field.dead) return;
  const p = field.player;
  if (p.onGround) { p.vy = -JUMP_V; p.onGround = false; sfx("gather"); }
}
function targetInRange() {
  // 攻撃対象が射程内にいれば返す
  const p = field.player;
  let best = null, bd = 1e9;
  const all = [...field.mobs.filter(m => !m.dead), ...field.nodes.filter(n => !n.depleted)];
  for (const e of all) { const d = Math.abs(e.x - p.x); const range = p.r + e.r + 10; if (d <= range && d < bd) { best = e; bd = d; } }
  return best;
}
function fieldManualAttack() {
  if (!field || field.dead) return;
  if (field.player.atkCd > 0) return;
  const t = targetInRange();
  if (!t) { return; }
  doPlayerAttack(t); field.player.atkCd = PLAYER_ATK_CD;
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
  // 横移動：手動 or ターゲット追従
  let atkTarget = null;
  if (field.moveDir !== 0) {
    p.vx = field.moveDir * MOVE_SPEED; p.facing = field.moveDir;
  } else if (field.target) {
    if (field.target.type === "point") {
      const dx = field.target.x - p.x;
      if (Math.abs(dx) > 6) { p.vx = Math.sign(dx) * MOVE_SPEED; p.facing = Math.sign(dx); }
      else { p.vx = 0; field.target = null; }
    } else {
      const ref = field.target.ref;
      if (!ref || ref.dead || ref.depleted) { field.target = null; p.vx = 0; }
      else {
        const dx = ref.x - p.x, range = p.r + ref.r + 8;
        if (Math.abs(dx) > range) { p.vx = Math.sign(dx) * MOVE_SPEED; p.facing = Math.sign(dx); }
        else { p.vx = 0; atkTarget = ref; }
      }
    }
  } else p.vx = 0;

  p.x = _clamp(p.x + p.vx * dt, 14, field.worldW - 14);

  // 重力・ジャンプ
  p.vy += GRAVITY * dt;
  p.y += p.vy * dt;
  if (p.y >= field.groundY) { p.y = field.groundY; p.vy = 0; p.onGround = true; } else p.onGround = false;

  if (p.atkCd > 0) p.atkCd -= dt;
  if (p.hitFlash > 0) p.hitFlash -= dt;

  // 射程内のターゲットへ自動攻撃
  if (atkTarget && p.atkCd <= 0 && p.onGround) { doPlayerAttack(atkTarget); p.atkCd = PLAYER_ATK_CD; }

  // 敵：追尾しない。隣接かつプレイヤーが地上付近なら反撃（ジャンプ中は当たらない）
  for (const m of field.mobs) {
    if (m.dead) continue;
    if (m.hitFlash > 0) m.hitFlash -= dt;
    if (m.stun > 0) { m.stun -= dt; continue; }
    const near = Math.abs(m.x - p.x) <= (m.r + p.r + 8);
    const grounded = p.y >= field.groundY - 8;
    if (near && grounded && m.atkCd <= 0) { doMobAttack(m); m.atkCd = m.atkCdMax; }
    if (m.atkCd > 0) m.atkCd -= dt;
  }

  for (const n of field.nodes) { if (n.depleted) { n.respawn -= dt; if (n.respawn <= 0) { n.depleted = false; n.hp = n.maxHp; } } }
  for (const pop of field.pops) { pop.y -= 26 * dt; pop.life -= dt; }
  field.pops = field.pops.filter(pp => pp.life > 0);

  // カメラ追従
  field.camX = _clamp(p.x - field.w / 2, 0, Math.max(0, field.worldW - field.w));

  if (state.hp <= 0) playerDie();
}

/* ---------- 攻撃・報酬（共通） ---------- */
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
function doPlayerAttack(t) { if (t.kind === "node") hitNode(t); else hitMob(t); }

function hitNode(n) {
  const have = toolTier(n.tool);
  if (have < n.tier) {
    const toolName = n.tool === "axe" ? "斧" : "ピッケル";
    addPop(n.x, n.y - 44, `${toolName}が必要`, "#e06c75");
    toast(`もっと良い${toolName}が必要`);
    field.target = null;
    return;
  }
  sfx("gather"); n.hp -= 1; addPop(n.x, n.y - 44, "🪓", "#fff");
  if (n.hp <= 0) {
    const bonus = have - n.tier; let got = [];
    for (const y of n.yields) { if (Math.random() <= y.chance) { const amt = rand(y.min, y.max) + Math.floor(bonus * 0.7); addMat(y.mat, amt); questTrack("gather", y.mat, amt); got.push(MATERIALS[y.mat].icon + amt); } }
    if (got.length) addPop(n.x, n.y - 50, got.join(" "), "#6ad6a8");
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
  addPop(m.x, m.y - m.r * 2 - 6, (r.crit ? "会心 " : "") + r.total + (r.weak ? " 弱点!" : r.resist ? " 耐性" : ""), r.crit ? "#ffe14d" : (r.weak ? "#8af0ff" : "#fff"));
  if (m.hp <= 0) onMobDown(m);
}
function doMobAttack(m) {
  const ps = derivedStats();
  let edmg = Math.max(1, m.atk - ps.def + rand(-2, 2));
  if (m.atkElement && ps.resist && ps.resist[m.atkElement] > 0) edmg = Math.max(1, Math.round(edmg * (1 - ps.resist[m.atkElement])));
  state.hp = Math.max(0, state.hp - edmg);
  field.player.hitFlash = 0.18;
  addPop(field.player.x, field.player.y - 40, edmg, "#e06c75");
  sfx("enemyhit");
  if (state.hp <= 0) playerDie();
}
function onMobDown(m) {
  if (m.dead) return;
  if (m.isBoss && m.phase2 && !m.phase2done) {
    m.phase2done = true; const p = m.phase2;
    m.name = p.name; m.maxHp = p.hp; m.hp = p.hp; m.atk = p.atk; m.def = p.def;
    if (p.atkElement) m.atkElement = p.atkElement; if (p.weak) m.weak = p.weak; if (p.resist) m.resist = p.resist;
    addPop(m.x, m.y - m.r * 2 - 10, "第2形態!", "#e06c75"); toast("ボスが変身した！"); sfx("transform");
    return;
  }
  m.dead = true; mobDefeated(m);
  if (m.isBoss) { addPop(m.x, m.y - m.r * 2 - 10, "撃破!", "#ffe14d"); setTimeout(() => { if (field) exitField(); }, 1000); }
  else { if (field.target && field.target.ref === m) field.target = null; scheduleRespawn(); }
}
function mobDefeated(m) {
  const ps = derivedStats();
  let drops = [];
  for (const d of m.drops || []) { if (Math.random() <= d.chance + (ps.dropBonus || 0)) { const amt = rand(d.min, d.max); addMat(d.mat, amt); drops.push(MATERIALS[d.mat].icon + amt); } }
  const gold = Math.round(m.gold * (1 + (ps.dropBonus || 0)));
  state.gold += gold;
  const recName = m.baseName || m.name;
  state.dex[recName] = (state.dex[recName] || 0) + 1;
  questTrack("kill", recName);
  if (m.isBoss) { questTrack("boss", recName); state.bossCleared[field.areaId] = true; }
  if (typeof checkDexRewards === "function") checkDexRewards();
  const txt = `+${m.exp}EXP 💰${gold}` + (drops.length ? " " + drops.join(" ") : "");
  addPop(m.x, m.y - m.r * 2 - 6, txt, "#6ad6a8");
  log(`✨ ${recName} を倒した！ ${txt}`, "l-good");
  sfx("win"); gainExp(m.exp); save();
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
  field.player.x = 60; field.player.y = field.groundY; field.player.vy = 0; field.target = null; field.moveDir = 0;
  save();
  field.dead = false;
}

/* ---------- スキル・道具 ---------- */
function nearestMob() {
  let best = null, bd = 1e9;
  for (const m of field.mobs) { if (m.dead) continue; const d = Math.abs(m.x - field.player.x); if (d < bd) { best = m; bd = d; } }
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
    addPop(field.player.x, field.player.y - 40, "+" + amt, "#7fe199"); sfx("heal"); return;
  }
  const target = (field.target && field.target.type === "mob" && !field.target.ref.dead) ? field.target.ref : nearestMob();
  if (!target) { toast("対象がいない"); state.mp += sk.mp; return; }
  const r = rollPlayerDamage(target); const dmg = Math.round(r.total * 1.8);
  target.hp -= dmg; target.hitFlash = 0.2;
  addPop(target.x, target.y - target.r * 2 - 8, "✨" + dmg, "#ffe14d");
  for (const m of field.mobs) { if (m === target || m.dead) continue; if (Math.abs(m.x - target.x) < 70) { const sp = Math.round(dmg * 0.5); m.hp -= sp; m.hitFlash = 0.2; addPop(m.x, m.y - m.r * 2 - 6, sp, "#fff"); if (m.hp <= 0) onMobDown(m); } }
  if (target.hp <= 0) onMobDown(target);
}
function toggleFieldItems() { if (!field) return; field.showItems = !field.showItems; renderFieldItems(); }
function renderFieldItems() {
  const bar = document.getElementById("field-items");
  if (!bar) return;
  if (!field || !field.showItems) { bar.classList.add("hidden"); bar.innerHTML = ""; return; }
  bar.classList.remove("hidden"); bar.innerHTML = "";
  const cons = SHOP.filter(x => x.kind === "consumable" && itemQty(x.id) > 0);
  if (cons.length === 0) { bar.innerHTML = `<span class="empty-note">使える道具がない。店で買おう。</span>`; return; }
  for (const it of cons) { const b = document.createElement("button"); b.className = "action secondary"; b.textContent = `${it.icon}×${itemQty(it.id)}`; b.title = it.name; b.onclick = () => useFieldItem(it.id); bar.appendChild(b); }
}
function useFieldItem(id) {
  if (itemQty(id) <= 0) return;
  const s = derivedStats();
  if (id === "potion_hp") { const a = Math.round(s.maxHp * .5); state.hp = Math.min(s.maxHp, state.hp + a); addPop(field.player.x, field.player.y - 40, "+" + a, "#7fe199"); }
  else if (id === "potion_mp") { const a = Math.round(s.maxMp * .5); state.mp = Math.min(s.maxMp, state.mp + a); addPop(field.player.x, field.player.y - 40, "MP+" + a, "#8ab6ff"); }
  else if (id === "elixir") { state.hp = s.maxHp; state.mp = s.maxMp; addPop(field.player.x, field.player.y - 40, "全回復", "#7fe199"); }
  else if (id === "antidote") { state.statuses = []; addPop(field.player.x, field.player.y - 40, "治癒", "#7fe199"); }
  state.items[id] = itemQty(id) - 1; sfx("heal"); save();
  field.showItems = false; renderFieldItems();
}

/* ---------- 描画（横視点＋カメラ） ---------- */
function fieldRender() {
  const ctx = fieldCtx, W = field.w, H = field.h, gy = field.groundY, cam = field.camX;
  ctx.clearRect(0, 0, W, H);
  // 空・背景（軽くパララックス）
  const bg = bgImg(field.areaId);
  if (bg && bg.complete && bg.naturalWidth) ctx.drawImage(bg, -cam * 0.15, 0, W * 1.2, gy + 10);
  else { ctx.fillStyle = "#2a3045"; ctx.fillRect(0, 0, W, gy); }
  // 地面
  ctx.fillStyle = GROUND_COLOR[field.areaId] || "#5b5b52";
  ctx.fillRect(0, gy, W, H - gy);
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(0, gy, W, 3);

  // ノード
  for (const n of field.nodes) {
    if (n.depleted) continue;
    const sx = n.x - cam;
    if (sx < -40 || sx > W + 40) continue;
    drawTargetRing(n, sx);
    ctx.font = "30px serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(n.icon, sx, n.y - 2);
    if (n.hp < n.maxHp) drawBar(sx, n.y - 40, 26, n.hp / n.maxHp, "#6ad6a8");
  }
  // 敵
  for (const m of field.mobs) {
    if (m.dead) continue;
    const sx = m.x - cam;
    if (sx < -60 || sx > W + 60) continue;
    drawTargetRing(m, sx);
    const sz = m.isBoss ? 52 : 34;
    drawSpriteFeet(m.art, sx, m.y, sz, 1, m.hitFlash > 0, m.isBoss);
    drawBar(sx, m.y - sz - 8, m.isBoss ? 50 : 32, m.hp / m.maxHp, m.isBoss ? "#c678dd" : "#e06c75");
  }
  // プレイヤー
  const p = field.player;
  drawSpriteFeet("hero", p.x - cam, p.y, 34, p.facing, p.hitFlash > 0, false);

  // ポップ
  ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  for (const pop of field.pops) {
    const sx = pop.x - cam;
    ctx.globalAlpha = Math.max(0, Math.min(1, pop.life / 0.6));
    ctx.fillStyle = "#000"; ctx.fillText(pop.text, sx + 1, pop.y + 1);
    ctx.fillStyle = pop.color; ctx.fillText(pop.text, sx, pop.y);
  }
  ctx.globalAlpha = 1;
  updateFieldHud();
}
function drawSpriteFeet(artKey, x, feetY, size, facing, flash, boss) {
  const ctx = fieldCtx, img = spriteImg(artKey);
  ctx.save();
  ctx.translate(x, feetY - size / 2);
  if (facing < 0) ctx.scale(-1, 1);
  if (img && img.complete && img.naturalWidth) {
    if (boss) { ctx.shadowColor = "rgba(255,90,90,.9)"; ctx.shadowBlur = 10; }
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.shadowBlur = 0;
  } else { ctx.fillStyle = "#888"; ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, 7); ctx.fill(); }
  if (flash) { ctx.globalAlpha = .5; ctx.fillStyle = "#fff"; ctx.fillRect(-size / 2, -size / 2, size, size); ctx.globalAlpha = 1; }
  ctx.restore();
}
function drawBar(cx, y, w, ratio, color) {
  const ctx = fieldCtx, h = 4, x = cx - w / 2;
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, ratio), h);
}
function drawTargetRing(e, sx) {
  if (!field.target || field.target.ref !== e) return;
  const ctx = fieldCtx;
  ctx.strokeStyle = "#f2c14e"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(sx, e.y, e.r + 6, 6, 0, 0, 7); ctx.stroke();
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

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initField);
  else initField();
}
