/* =========================================================
   効果音 & BGM（Web Audioで合成。音声ファイル不要）
   - 初回タップ時に AudioContext を起こす
   - state.settings.sound / state.settings.bgm で ON/OFF
   ========================================================= */

let _actx = null;
let _master = null;

function audioCtx() {
  if (_actx) return _actx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    _actx = new AC();
    _master = _actx.createGain();
    _master.gain.value = 0.5;
    _master.connect(_actx.destination);
  } catch (e) { _actx = null; }
  return _actx;
}

function sfxEnabled() {
  return !(typeof state !== "undefined" && state.settings && state.settings.sound === false);
}
function bgmEnabled() {
  return (typeof state !== "undefined" && state.settings && state.settings.bgm === true);
}

// 単音
function tone(freq, start, dur, type = "square", vol = 0.2, slideTo = null) {
  const ac = audioCtx(); if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(_master);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}
function noise(start, dur, vol = 0.18, freq = 1200) {
  const ac = audioCtx(); if (!ac) return;
  const t0 = ac.currentTime + start;
  const n = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ac.createBufferSource(); src.buffer = buf;
  const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq;
  const g = ac.createGain(); g.gain.value = vol;
  src.connect(bp); bp.connect(g); g.connect(_master);
  src.start(t0);
}

function sfx(name) {
  if (!sfxEnabled()) return;
  const ac = audioCtx(); if (!ac) return;
  if (ac.state === "suspended") ac.resume();
  switch (name) {
    case "hit":     noise(0, 0.12, 0.16, 900); tone(180, 0, 0.1, "square", 0.12, 90); break;
    case "crit":    noise(0, 0.16, 0.2, 1400); tone(880, 0, 0.08, "square", 0.18); tone(1320, 0.06, 0.1, "square", 0.16); break;
    case "enemyhit":noise(0, 0.14, 0.16, 500); tone(120, 0, 0.12, "sawtooth", 0.12, 70); break;
    case "heal":    tone(523, 0, 0.12, "sine", 0.18); tone(784, 0.1, 0.16, "sine", 0.18); break;
    case "gather":  tone(660, 0, 0.06, "square", 0.1); tone(990, 0.05, 0.06, "square", 0.08); break;
    case "buy":     tone(784, 0, 0.07, "square", 0.14); tone(1175, 0.07, 0.1, "square", 0.14); break;
    case "craft":   noise(0, 0.08, 0.12, 600); tone(440, 0.04, 0.1, "triangle", 0.14, 660); break;
    case "enhance": tone(880, 0, 0.06, "triangle", 0.16); tone(1320, 0.06, 0.08, "triangle", 0.16); tone(1760, 0.13, 0.12, "sine", 0.14); break;
    case "level":   [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.16, "square", 0.16)); break;
    case "win":     [659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.16, "square", 0.16)); break;
    case "lose":    [392, 330, 262].forEach((f, i) => tone(f, i * 0.12, 0.22, "sawtooth", 0.16)); break;
    case "boss":    tone(70, 0, 0.6, "sawtooth", 0.22, 50); tone(105, 0, 0.6, "sawtooth", 0.16); noise(0, 0.5, 0.12, 300); break;
    case "quest":   [784, 988, 1319].forEach((f, i) => tone(f, i * 0.1, 0.18, "triangle", 0.16)); break;
    case "cast":    tone(440, 0, 0.1, "sine", 0.14, 880); tone(660, 0.08, 0.14, "sine", 0.12, 1100); break;
    case "guard":   tone(330, 0, 0.14, "sine", 0.16); noise(0.02, 0.08, 0.08, 400); break;
    case "equip":   tone(587, 0, 0.05, "square", 0.12); tone(880, 0.05, 0.07, "square", 0.12); break;
    case "flee":    noise(0, 0.22, 0.14, 700); tone(500, 0, 0.2, "sine", 0.1, 200); break;
    case "deny":    tone(200, 0, 0.12, "square", 0.14, 140); break;
    case "transform": tone(60, 0, 0.8, "sawtooth", 0.24, 120); tone(90, 0, 0.8, "sawtooth", 0.18, 160); noise(0, 0.7, 0.16, 350); [330,392,494].forEach((f,i)=>tone(f,0.3+i*0.1,0.25,"square",0.12)); break;
  }
}

/* --- BGM：ゆるいループ --- */
let _bgmTimer = null;
let _bgmStep = 0;
const BGM_NOTES = [
  // ゆったりした和音進行のアルペジオ（Aマイナー系）
  220, 262, 330, 262, 196, 247, 294, 247,
  175, 220, 262, 220, 196, 247, 330, 294,
];
function startBgm() {
  if (_bgmTimer || !bgmEnabled()) return;
  const ac = audioCtx(); if (!ac) return;
  if (ac.state === "suspended") ac.resume();
  _bgmStep = 0;
  _bgmTimer = setInterval(() => {
    if (!bgmEnabled()) { stopBgm(); return; }
    const f = BGM_NOTES[_bgmStep % BGM_NOTES.length];
    tone(f, 0, 0.45, "triangle", 0.06);
    if (_bgmStep % 4 === 0) tone(f / 2, 0, 0.5, "sine", 0.05);
    _bgmStep++;
  }, 320);
}
function stopBgm() {
  if (_bgmTimer) { clearInterval(_bgmTimer); _bgmTimer = null; }
}
function toggleBgm() {
  if (bgmEnabled()) startBgm(); else stopBgm();
}
