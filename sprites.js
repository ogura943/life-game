/* =========================================================
   キャラクターのドット絵（16-24px相当のPNGをbase64で内蔵）
   - image-rendering: pixelated でカクッと拡大して表示
   - ボスは王冠(crown)を重ね、オーラ(boss-aura)を付ける
   ========================================================= */

const SPRITES = {
  hero: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAnElEQVR42mNgGAX0BifP3fhPlsYoK6X/yJimhmOzhOqGI1tCkeFbq6P+fzw+GysGyVUFGfwnO8JgFigpKWEYDhIDyeGKD6IBIR9QnOyQLQCx0flUSdvYfEE1w0FAO9sK7noYBolR5GKYC0EGxV+owophliCrH1wW4DMc2RKyLQBlImLw4LWAUPDAMMkWEBP2uCKcaAvIwaPVLVkAAL/4rhIIL4U7AAAAAElFTkSuQmCC",
  slime: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAbUlEQVR42mNgGAWjgG5AO9vqPzKmmqHTXqwB4/gLVSiYIstgGnEZjssyog0nZCA+i2hmOFGWDIgFX7///i9jrYbVMGxyOC3A5XqQAbgswCVHsiVDOw6QgwMbm6pJFV98EGU4rnKHWDxaYo9QAAAZkuwciHYDowAAAABJRU5ErkJggg==",
  rabbit: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAeUlEQVR42mNgGPbAxt7rPwgTK06y4V+//wZjZMNwiVPFgh1t3P+HlgVPuxbgtAAkN/gtQA4KkOEwTNU4gCVJdEyxBei+QMc0NZxiS4gxnCJLkC04YKmNYSiy2OC3gOZBBMOgjAXLeDSJaGwWDO58gF65oGOGUTAkAAD9mf/YQP/p0QAAAABJRU5ErkJggg==",
  goblin: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAe0lEQVR42mNgGAWjgG7ALtvkPzKmusE1+1NQMFUswmYwNouo6nKq+QRmOD5LkNWQFZkgzf8vMIAxuuHI4kRFPnqQIFugpKSEYQFIDNkCooMM3QfYwhuXOMlBRYoFNEmiVEmquFISWSmIUJx8/f77P02LDGQLRkvnUQAHAMM+TjpZzf5dAAAAAElFTkSuQmCC",
  wolf: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAkklEQVR42mNgGAWDDtjYe/2nqV66WECOJUTrQ1YIYxPCRFsAUjBrwVowRmYTwuj6Bt4CUgxHtwSnBejhSo4F6PFCVFD9v8AAxugGoouTlPLoagEpQURyxsEXxhQZji3Jnjx3AwUTnTSJsQRmgZKSEhgjW0BJ2YWSfLH5gGLDkcHX77/hhoLYVK8nkA2liQUjFwAAuO3TsiCJRh0AAAAASUVORK5CYII=",
  orc: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAcUlEQVR42mNgGAWjgC7A3s3sPzZMNYNru7KwYootwmc4siU0cT3FvoAZTiiIyPIFMS6nKKiQLThgqQ3G6Aaii5NtAbbwpkpkYzMIlwUURTII//r1GsNQZDGKkiohCyjOaCAMMgy9mEAWG7xl0SgYHgAArBo+BErS0kcAAAAASUVORK5CYII=",
  golem: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAeElEQVR42mNgGAUjF3i5WP4nBZNlQVdTGRgjs7Fhii3AZzDVLMBnIU18gB6EZFuwtcAKbACIhhkIYsMwSRagpwyYYf8vTcOwAFmM6BSFHGnIFiC7FpcPiIpwbBYQg0ctwFk8DE4LsBlAbBCRVPCRasHgK65HAQwAAH9zDBlKNdxlAAAAAElFTkSuQmCC",
  hound: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAu0lEQVR42mNgGCzgQ6v8fxD9/5Dvf6oajMtAmIUUu5iQZRRZBDIQZAA+TLbrYRhkCT5MlmUyojJEGY5sCUgPyRaQgkm2AKYBxsaF0dUTZbiVvhUYI7NxYXT1RFtAjOHolhC0AN37pFiAHmwkBRUxFpCUD5AN//+g6///eF0MQ9HFybYEZAhWC5DESTYcWxDhix+KLQCxg1yCUDDJyZNQkgUZqqSkBMbIFpBtOHrSxeYDig3Hl0cYRsGQAQDXA4GGVBfKMAAAAABJRU5ErkJggg==",
  dragon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAm0lEQVR42mNgGLZgQYPDf1qoHXy+oMj1IM34DCAkT5QFH24s+F8nJYUVg+QotgBk0CUrK6wYJEe2BTBX4jIc2RIQJslQYg1Ht4Roy8i1gOQggmn+f4EBq6EwcZINp6sFxAYRRRbgygdUteB5VhQKptgC9HjAZQHZhmPLG8iGk5U0ic2AVDWcruD/Id//H1rlaedymhqO7ItBFawAS0NTFuHrP6MAAAAASUVORK5CYII=",
  crown: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAWklEQVR42mNgIAE897H5D8IM1AQ72rj/UyJPkgUgNrqBNLUAm4UkG/7/su9/mEEgNoyPLk+W4aRgsiwApRiYq3Fhkxm3ybMEOUgI4cEZRKNgFIyCUTAKBhMAAI6et3W9kvRvAAAAAElFTkSuQmCC",
};

const ART_BY_NAME = {
  "スライム": "slime", "キングスライム": "slime",
  "ホーンラビット": "rabbit",
  "ゴブリン": "goblin", "ゴブリンキング": "goblin",
  "森オオカミ": "wolf",
  "オーク": "orc",
  "ロックゴーレム": "golem", "ゴーレムロード": "golem",
  "ヘルハウンド": "hound",
  "炎竜ヴァルガ": "dragon", "古龍ヴァルガ＝レクス": "dragon",
};

function enemyArtKey(enemy) { return ART_BY_NAME[enemy.name] || null; }

function spriteMarkup(artKey, isBoss) {
  const src = (artKey && SPRITES[artKey]) ? SPRITES[artKey] : "";
  const img = src ? `<img class="pix" src="${src}" alt="">` : "";
  const crown = isBoss ? `<img class="pix crown-svg" src="${SPRITES.crown}" alt="">` : "";
  return `<div class="sprite-inner${isBoss ? " boss-aura" : ""}">${img}${crown}</div>`;
}
