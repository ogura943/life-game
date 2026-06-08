/* =========================================================
   icons.js — インラインSVGアイコンライブラリ
   - すべてのSVGは 24×24 viewBox、currentColor で塗り
   - stroke-linecap/linejoin: round、stroke-width: 2
   ========================================================= */

const ICONS = {
  /* --- ナビ --- */
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
  hammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h2.47l2.26 1.91"/></svg>',
  shirt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',

  /* --- ヘッダーチップ --- */
  sword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M9.5 9.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2 1.5c0 2-4 1.5-4 4 0 1.1.9 2 2 2s2.5-.5 2.5-1.5"/><line x1="12" y1="6.5" x2="12" y2="8"/><line x1="12" y1="17" x2="12" y2="18.5"/></svg>',

  /* --- バッグタブのアクション --- */
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  install: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="10" x2="12" y2="16"/><polyline points="9 13 12 16 15 13"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',

  /* --- 戦闘アクション --- */
  attack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="15 5 19 5 19 9"/><polyline points="5 15 5 19 9 19"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.88 5.76a1 1 0 00.95.69H21l-4.94 3.58a1 1 0 00-.36 1.12L17.59 20 12 16.42 6.41 20l1.89-5.85a1 1 0 00-.36-1.12L3 9.45h6.17a1 1 0 00.95-.69L12 3z"/></svg>',
  potion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v3.6L6.5 12C5 14.4 5 17 6.5 18.8A5 5 0 0012 21a5 5 0 005.5-2.2C19 17 19 14.4 17.5 12L14 6.6V3"/><line x1="6.2" y1="14" x2="17.8" y2="14"/></svg>',
  flee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4l7 8-7 8"/><path d="M4 4l7 8-7 8"/></svg>',
  retry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>',

  /* --- エリア / UI要素 --- */
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 6-8 8-8 14a8 8 0 0016 0c0-6-8-8-8-14z"/><path d="M12 12c0 3-3 4-3 6a3 3 0 006 0c0-2-3-3-3-6z"/></svg>',
  infinity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-2-2.5-4-4-6-4a4 4 0 000 8c2 0 4-1.5 6-4z"/><path d="M12 12c2 2.5 4 4 6 4a4 4 0 000-8c-2 0-4 1.5-6 4z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M5 20l2-8 5 4 5-4 2 8"/><path d="M12 4l-2.5 5-3.5-2L5 20"/><path d="M12 4l2.5 5 3.5-2L19 20"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 18 3 22 9 12 22 2 9"/><polyline points="2 9 6 3"/><polyline points="22 9 18 3"/><line x1="6" y1="9" x2="18" y2="9"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 21 12 17 16 21"/><path d="M5 3H19"/><path d="M5 3v4a7 7 0 007 7 7 7 0 007-7V3"/><path d="M5 7H2l1.5 2L2 11h3"/><path d="M19 7h3l-1.5 2L22 11h-3"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  quest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="12" y1="12" x2="12" y2="18"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  ring: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="7"/><path d="M9 3l1.5 4h3L15 3"/><path d="M9 3h6"/></svg>',
  skull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a9 9 0 00-9 9c0 3.5 2 6.5 5 8v3h8v-3c3-1.5 5-4.5 5-8a9 9 0 00-9-9z"/><line x1="9" y1="19" x2="9" y2="22"/><line x1="15" y1="19" x2="15" y2="22"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  ice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5L7 19"/><path d="M7 5l10 14"/><path d="M2 12h20"/><path d="M5 7l2 2-2 2"/><path d="M19 7l-2 2 2 2"/><path d="M5 17l2-2-2-2"/><path d="M19 17l-2-2 2-2"/></svg>',
  lightning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  poison: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5C12 2.5 5 11 5 15a7 7 0 0014 0c0-4-7-12.5-7-12.5z"/><circle cx="10" cy="15" r="1" fill="currentColor"/><circle cx="13.5" cy="13" r="1" fill="currentColor"/></svg>',
  stun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 11-6 2.3"/><polyline points="5 2 5 6 9 6"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  axe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="14" y2="10"/><path d="M14 10c1.5-1.5 4.5-1.5 6 0s1.5 4.5 0 6l-4-4z"/><path d="M14 10l-4-4"/></svg>',
  spear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="18" y2="6"/><path d="M18 6l-4 0 0-4z"/></svg>',
  bow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3c-5 0-9 4-9 9"/><path d="M17 21c-5 0-9-4-9-9"/><line x1="3" y1="12" x2="15" y2="12"/><polyline points="11 8 15 12 11 16"/></svg>',
  staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><circle cx="19" cy="5" r="3"/></svg>',
  dagger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 9.5l-5 10-2-2 10-5z"/><path d="M12 7l5-5"/><path d="M3 21l4-4"/></svg>',
  orb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/><path d="M12 3a15 15 0 010 18"/><path d="M12 3a15 15 0 000 18"/></svg>',

  /* --- エリア系 --- */
  grassland: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18c2-4 4-6 4-6s0 4 4 6c0 0-2-8 2-12 0 0 0 5 4 8 0 0-1-6 2-9"/><line x1="2" y1="21" x2="22" y2="21"/></svg>',
  forest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 8H5l7 7-2 3h4l-2-3 7-7h-3L12 2z"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="18" x2="12" y2="21"/></svg>',
  mountain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 20 9 8 12 14 15 10 21 20"/><polyline points="11 8 12 5 13 8"/></svg>',
  volcano: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 20L4 20 9 8l2 4 2-4 2 4 2-4 5 12h-4"/><path d="M10 8c0-2 4-6 4-6s-1 4 1 6"/></svg>',
  sky: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>',
  castle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8h4V4h2v4h8V4h2v4h4v12H2z"/><rect x="9" y="12" width="6" height="8"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="6" y1="4" x2="6" y2="8"/><line x1="18" y1="4" x2="18" y2="8"/><line x1="12" y1="4" x2="12" y2="8"/></svg>',

  /* --- その他 --- */
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="15" x2="4" y2="22"/><path d="M4 15s4-3 8 0 8 0 8 0V3s-4 3-8 0-8 0-8 0z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
};

/* === EMOJI_MAP: UIのemoji → アイコン名 のマッピング === */
const EMOJI_MAP = {
  /* ナビ */
  "🗺":  "map",
  "🔨": "hammer",
  "🎽": "shirt",
  "🛒": "cart",
  "📖": "book",
  "🎒": "bag",

  /* ヘッダーチップ */
  "⚔":  "sword",
  "⚔️": "sword",
  "🛡":  "shield",
  "🛡️": "shield",
  "🪙": "coin",

  /* バッグ/セーブ */
  "📤": "upload",
  "📥": "download",
  "✕":  "close",
  "📲": "install",
  "🗑":  "trash",
  "🔧": "wrench",
  "✔":  "check",
  "✔️": "check",

  /* 戦闘 */
  "🔁": "repeat",
  "↩":  "back",
  "🏳": "flag",
  "🏃": "flee",

  /* 要素/スキル */
  "🔥": "fire",
  "♾":  "infinity",
  "🔒": "lock",
  "👑": "crown",
  "★":  "star",
  "✨": "sparkle",
  "💎": "gem",
  "❄️": "ice",
  "⚡": "lightning",

  /* 武器種 */
  "🗡️": "sword",
  "🪓": "axe",
  "🔱": "spear",
  "🏹": "bow",
  "🪄": "staff",
  "🔪": "dagger",

  /* アイテム */
  "🧪": "potion",
  "🔵": "orb",
  "💊": "potion",
  "💍": "ring",

  /* エリア */
  "🌿": "grassland",
  "🌳": "forest",
  "⛰️": "mountain",
  "🌋": "volcano",
  "🌥️": "sky",
  "🏰": "castle",

  /* 装備 */
  "🦺": "shirt",
  "🥋": "shirt",
  "🥻": "shirt",

  /* 記録 */
  "📋": "quest",
  "🎁": "gift",
  "🏆": "trophy",
  "🏅": "trophy",
  "🎖️": "trophy",

  /* 設定 */
  "🔊": "sound",
  "🎵": "music",
};

/**
 * icon(name, cls) → <span class="ico [cls]"><svg...></svg></span>
 * アイコン名からHTMLスパン文字列を返す。未知の名前は空のスパン。
 */
function icon(name, cls) {
  const svg = ICONS[name] || "";
  return `<span class="ico${cls ? " " + cls : ""}" aria-hidden="true">${svg}</span>`;
}

/**
 * iconify(emojiOrName, cls) →
 *   1. 既知のemoji → icon(マップされた名前, cls)
 *   2. 既知のiconName → icon(name, cls)
 *   3. それ以外 → そのまま文字列を返す（ログ内のflavorテキスト用フォールバック）
 */
function iconify(emojiOrName, cls) {
  if (!emojiOrName) return "";
  const mapped = EMOJI_MAP[emojiOrName];
  if (mapped) return icon(mapped, cls);
  if (ICONS[emojiOrName]) return icon(emojiOrName, cls);
  return emojiOrName; // 未マップ → 元の文字列をそのまま返す
}
