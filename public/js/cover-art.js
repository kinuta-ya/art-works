// ジャケットの無いアルバムに、ジャンルの系統ごとの作風で代わりのジャケットを作る。
// テーマに関係なく同じ見た目（ジャケットは画面の部品ではなく中身として扱う）。
//  - 系統の判定: ジャンル名のキーワード
//  - アルバムごとの違い: アルバム名のハッシュで、ベース画像・左右反転・切り抜き位置・帯の色を決める
//  - アルバム名とアーティスト名を下の帯に描く
(function (MP) {
  'use strict';

  const SIZE = 800;
  const BASE = 'img/genres/';

  // 判定は上から順に行う（例: "Acid Jazz" はジャズ、"Pop/Funk" はソウル）
  const FAMILIES = [
    { id: 'soundtrack', words: ['soundtrack', 'ost', 'score', 'film', 'movie', 'anime', 'game', 'サウンドトラック', 'サントラ', '劇伴', 'アニメ', 'ゲーム'],
      images: [], bg: '#1c1f26', shapes: ['#c9a24a', '#5a6275'], band: ['#0f1115', '#2a2f3a'], text: '#f1e7cf', font: 'serif' },
    { id: 'classical', words: ['classical', 'classic', 'baroque', 'opera', 'symphon', 'orchestra', 'chamber', 'concerto', 'クラシック', '交響', '室内楽'],
      images: ['genre-classical-1.webp'], bg: '#efe6d2', shapes: ['#6b5a45', '#b8a47f'], band: ['#efe6d2', '#e4d7bb'], text: '#3b2f25', font: 'serif' },
    { id: 'jazz', words: ['jazz', 'swing', 'bebop', 'bop', 'bossa', 'ジャズ', 'ボサノバ'],
      images: ['genre-jazz-1.webp'], bg: '#1f4a9c', shapes: ['#efe6d2', '#0e1a33'], band: ['#1f4a9c', '#0e1a33', '#efe6d2'], text: '#ffffff', font: 'sans-serif' },
    { id: 'hiphop', words: ['hip-hop', 'hip hop', 'hiphop', 'rap', 'trap', 'grime', 'ヒップホップ', 'ラップ'],
      images: [], bg: '#6d6d6a', shapes: ['#e8e2d4', '#f25c2a'], band: ['#2a2a28', '#f25c2a'], text: '#ffffff', font: 'sans-serif' },
    { id: 'soul', words: ['soul', 'r&b', 'rnb', 'funk', 'gospel', 'motown', 'ソウル', 'ファンク'],
      images: [], bg: '#6e1e2a', shapes: ['#d8b25a', '#3d0f17'], band: ['#3d0f17', '#6e1e2a'], text: '#f3dfa8', font: 'serif' },
    { id: 'electronic', words: ['electro', 'techno', 'house', 'trance', 'edm', 'dance', 'synth', 'dubstep', 'drum', 'idm', 'rave', 'club', 'テクノ', 'エレクトロ'],
      images: [], bg: '#0d0b1e', shapes: ['#29e6ff', '#ff4fd8'], band: ['#0d0b1e', '#1b1740'], text: '#29e6ff', font: 'monospace' },
    { id: 'ambient', words: ['ambient', 'new age', 'chill', 'lo-fi', 'lofi', 'meditat', 'drone', 'space', 'アンビエント', 'ヒーリング'],
      images: [], bg: '#9fb7c4', shapes: ['#e9dfd0', '#6d8fa3'], band: ['#e9dfd0', '#c7d6de'], text: '#2e3f4a', font: 'sans-serif' },
    { id: 'rock', words: ['rock', 'metal', 'punk', 'grunge', 'hardcore', 'alternative', 'emo', 'shoegaze', 'ロック', 'メタル', 'パンク'],
      images: [], bg: '#c8261d', shapes: ['#111111', '#f2e6d0'], band: ['#111111', '#c8261d'], text: '#f2e6d0', font: 'sans-serif' },
    { id: 'folk', words: ['folk', 'acoustic', 'country', 'singer-songwriter', 'bluegrass', 'フォーク'],
      images: [], bg: '#ece2cc', shapes: ['#2f5a3c', '#a4452b'], band: ['#2f5a3c', '#ece2cc'], text: '#ece2cc', font: 'serif' },
    { id: 'pop', words: ['pop', 'idol', 'kayo', 'ポップ', 'アイドル', '歌謡'],
      images: [], bg: '#ffd23f', shapes: ['#ff4f81', '#2b7bff'], band: ['#ff4f81', '#2b7bff'], text: '#ffffff', font: 'sans-serif' },
  ];
  const OTHER = { id: 'other', images: [], bg: '#d9d2c5', shapes: ['#5b6770', '#b07a4f'], band: ['#3e464c', '#d9d2c5'], text: '#f4efe6', font: 'sans-serif' };

  // 4 文字以下の英単語は単語単位で判定（"post-rock" の "ost"、"demo" の "emo" に反応しないように）
  const matchers = new Map();
  function matches(g, w) {
    if (!/^[a-z&]{1,4}$/.test(w)) return g.includes(w);
    if (!matchers.has(w)) matchers.set(w, new RegExp(`(^|[^a-z])${w.replace('&', '\\&')}([^a-z]|$)`));
    return matchers.get(w).test(g);
  }

  function familyOf(genre) {
    const g = String(genre || '').toLowerCase();
    for (const f of FAMILIES) if (f.words.some((w) => matches(g, w))) return f;
    return OTHER;
  }

  function hash(str) {
    let h = 2166136261;
    for (const c of String(str)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // 背景色に対して読める文字色（帯の色が明るいときは濃い色）
  function inkFor(bg, fallback) {
    const n = parseInt(bg.slice(1), 16);
    const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return l > 0.62 ? '#2a241d' : fallback;
  }

  const imageCache = new Map();
  function loadImage(name) {
    if (!imageCache.has(name)) {
      imageCache.set(name, new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = BASE + name;
      }));
    }
    return imageCache.get(name);
  }

  // 画像がまだ無い系統：系統の色で幾何学的な構図を描く
  function drawAbstract(g, f, h) {
    g.fillStyle = f.bg;
    g.fillRect(0, 0, SIZE, SIZE);
    const [a, b] = f.shapes;
    const r = SIZE * (0.26 + ((h >>> 3) % 10) / 60);
    g.fillStyle = a;
    g.beginPath(); g.arc(SIZE * (0.35 + ((h >>> 7) % 30) / 100), SIZE * (0.34 + ((h >>> 11) % 12) / 100), r, 0, Math.PI * 2); g.fill();
    g.fillStyle = b;
    if (h & 1) {
      g.fillRect(SIZE * (0.55 + ((h >>> 13) % 20) / 100), 0, SIZE * 0.08, SIZE);
    } else {
      g.beginPath(); g.moveTo(0, SIZE * 0.8); g.lineTo(SIZE * 0.2, SIZE * 0.8);
      g.arc(SIZE * 0.35, SIZE * 0.8, SIZE * 0.15, Math.PI, 0); g.lineTo(SIZE, SIZE * 0.8); g.lineTo(SIZE, SIZE); g.lineTo(0, SIZE); g.fill();
    }
  }

  function fitText(g, text, maxWidth) {
    if (g.measureText(text).width <= maxWidth) return text;
    let s = text;
    while (s.length > 1 && g.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
    return s + '…';
  }

  async function make(album) {
    const f = familyOf(album.genre);
    const h = hash(album.title + '\u0000' + album.artist);
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const g = c.getContext('2d');

    let drewImage = false;
    if (f.images.length) {
      try {
        const img = await loadImage(f.images[h % f.images.length]);
        const zoom = 1 + ((h >>> 4) % 13) / 100;            // 1.00〜1.12 倍
        const w = SIZE * zoom;
        const dx = -(w - SIZE) * (((h >>> 9) % 100) / 100);   // 切り抜き位置
        const dy = -(w - SIZE) * (((h >>> 15) % 100) / 100);
        g.save();
        if ((h >>> 2) & 1) { g.translate(SIZE, 0); g.scale(-1, 1); } // 左右反転
        g.drawImage(img, dx, dy, w, w);
        g.restore();
        drewImage = true;
      } catch (e) { /* 画像が無ければ図形で描く */ }
    }
    if (!drewImage) drawAbstract(g, f, h);

    // 下の帯にアルバム名とアーティスト名（円形に切り抜かれても読めるよう中央寄せ・幅 66%）
    const band = f.band[(h >>> 5) % f.band.length];
    const ink = inkFor(band, f.text);
    const top = SIZE * 0.76;
    g.fillStyle = band;
    g.globalAlpha = drewImage ? 0.92 : 1;
    g.fillRect(0, top, SIZE, SIZE - top);
    g.globalAlpha = 1;
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    const serif = f.font === 'serif';
    g.font = `${serif ? '600' : '700'} ${SIZE * 0.07}px ${serif ? '"Shippori Mincho", "Hiragino Mincho ProN", serif' : f.font === 'monospace' ? '"DM Mono", ui-monospace, monospace' : '"Jost", "Zen Kaku Gothic New", system-ui, sans-serif'}`;
    g.fillText(fitText(g, album.title, SIZE * 0.66), SIZE / 2, top + SIZE * 0.1);
    g.font = `500 ${SIZE * 0.042}px ${serif ? 'serif' : 'system-ui, sans-serif'}`;
    g.globalAlpha = 0.8;
    g.fillText(fitText(g, album.artist.toUpperCase(), SIZE * 0.56), SIZE / 2, top + SIZE * 0.17);
    g.globalAlpha = 1;

    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.86));
    return URL.createObjectURL(blob);
  }

  MP.coverArt = { make, familyOf, FAMILIES };
})(window.MP = window.MP || {});
