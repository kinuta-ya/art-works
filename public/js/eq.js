// パラメトリック EQ のモデル・プリセット・AutoEQ 読み込み・周波数特性の計算と描画
(function (MP) {
  'use strict';

  const TYPES = {
    peaking: 'ピーキング',
    lowshelf: 'ローシェルフ',
    highshelf: 'ハイシェルフ',
  };

  function band(freq, gain = 0, q = 1.0, type = 'peaking') {
    return { type, freq, gain, q, enabled: true };
  }

  function flatBands() {
    return [
      band(32, 0, 0.7, 'lowshelf'),
      band(64), band(125), band(250), band(500),
      band(1000), band(2000), band(4000), band(8000),
      band(16000, 0, 0.7, 'highshelf'),
    ];
  }

  function withGains(gains) {
    return flatBands().map((b, i) => ({ ...b, gain: gains[i] || 0 }));
  }

  const PRESETS = [
    { id: 'flat', name: 'フラット', bands: () => flatBands() },
    { id: 'warm', name: 'あたたかく', bands: () => withGains([2, 1.5, 1, 0.5, 0, 0, -0.5, -1, -1.5, -2]) },
    { id: 'bass', name: '低域を少し足す', bands: () => withGains([4, 3, 1.5, 0, 0, 0, 0, 0, 0, 0]) },
    { id: 'vocal', name: 'ボーカルを前に', bands: () => withGains([-1, -1, 0, 0.5, 1.5, 2, 1.5, 0.5, 0, 0]) },
    { id: 'soft-treble', name: '高域をやわらかく', bands: () => withGains([0, 0, 0, 0, 0, 0, -0.5, -1.5, -2.5, -3]) },
    { id: 'air', name: '空気感', bands: () => withGains([0, 0, 0, 0, 0, 0, 0, 0.5, 1.5, 3]) },
  ];

  // AutoEQ の ParametricEQ.txt 形式
  //   Preamp: -6.2 dB
  //   Filter 1: ON PK Fc 105 Hz Gain -2.1 dB Q 0.70
  function parseAutoEq(text) {
    const bands = [];
    let preamp = null;
    const typeMap = { PK: 'peaking', PEQ: 'peaking', LS: 'lowshelf', LSC: 'lowshelf', HS: 'highshelf', HSC: 'highshelf' };
    for (const line of text.split(/\r?\n/)) {
      const pre = line.match(/^\s*Preamp:\s*(-?[\d.]+)\s*dB/i);
      if (pre) { preamp = parseFloat(pre[1]); continue; }
      const m = line.match(/Filter\s*\d*:\s*(ON|OFF)\s+([A-Z]+)\s+Fc\s+([\d.]+)\s*Hz\s+Gain\s+(-?[\d.]+)\s*dB(?:\s+Q\s+([\d.]+))?/i);
      if (!m) continue;
      const type = typeMap[m[2].toUpperCase()];
      if (!type) continue;
      bands.push({
        type,
        freq: parseFloat(m[3]),
        gain: parseFloat(m[4]),
        q: m[5] ? parseFloat(m[5]) : 0.707,
        enabled: m[1].toUpperCase() === 'ON',
      });
    }
    if (!bands.length) throw new Error('フィルターが見つかりませんでした（AutoEQ の ParametricEQ.txt 形式を貼り付けてください）');
    return { bands, preamp };
  }

  // 20Hz〜20kHz の対数スケールの周波数点
  function logFreqs(n = 256) {
    const f = new Float32Array(n);
    const lo = Math.log10(20), hi = Math.log10(20000);
    for (let i = 0; i < n; i++) f[i] = 10 ** (lo + (hi - lo) * i / (n - 1));
    return f;
  }

  let offline = null;
  function responseCtx() {
    if (!offline) offline = new OfflineAudioContext(1, 1, 96000);
    return offline;
  }

  // バンド群の合成振幅特性（dB）
  function responseDb(bands, freqs) {
    const out = new Float32Array(freqs.length);
    const mag = new Float32Array(freqs.length);
    const phase = new Float32Array(freqs.length);
    const ctx = responseCtx();
    for (const b of bands) {
      if (!b.enabled || Math.abs(b.gain) < 0.01) continue;
      const f = ctx.createBiquadFilter();
      f.type = b.type;
      f.frequency.value = b.freq;
      f.gain.value = b.gain;
      f.Q.value = b.q;
      f.getFrequencyResponse(freqs, mag, phase);
      for (let i = 0; i < freqs.length; i++) out[i] += 20 * Math.log10(mag[i]);
    }
    return out;
  }

  function maxOf(arr) { let m = -Infinity; for (const v of arr) if (v > m) m = v; return m; }

  // 音割れしないために必要なプリアンプ（dB、0 以下）
  function autoPreamp(curves) {
    let peak = 0;
    for (const c of curves) peak = Math.max(peak, maxOf(c));
    return peak > 0.05 ? -(Math.ceil(peak * 10) / 10 + 0.3) : 0;
  }

  // 周波数特性グラフの描画
  function draw(canvas, curves, opts = {}) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const g = canvas.getContext('2d');
    g.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const grid = css.getPropertyValue('--grid').trim() || '#333';
    const muted = css.getPropertyValue('--muted').trim() || '#888';
    const range = opts.range || 15;
    const pad = { l: 30, r: 8, t: 8, b: 18 };
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    const xOf = (f) => pad.l + pw * (Math.log10(f) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20));
    const yOf = (db) => pad.t + ph * (1 - (db + range) / (2 * range));

    g.clearRect(0, 0, w, h);
    g.font = '10px system-ui, sans-serif';
    g.lineWidth = 1;
    g.fillStyle = muted;
    for (const db of [-range, -range / 2, 0, range / 2, range]) {
      g.strokeStyle = grid;
      g.globalAlpha = db === 0 ? 1 : 0.5;
      g.beginPath(); g.moveTo(pad.l, yOf(db)); g.lineTo(w - pad.r, yOf(db)); g.stroke();
      g.globalAlpha = 1;
      g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillText((db > 0 ? '+' : '') + db, pad.l - 4, yOf(db));
    }
    for (const [f, label] of [[50, '50'], [100, '100'], [200, '200'], [500, '500'], [1000, '1k'], [2000, '2k'], [5000, '5k'], [10000, '10k']]) {
      g.strokeStyle = grid; g.globalAlpha = 0.5;
      g.beginPath(); g.moveTo(xOf(f), pad.t); g.lineTo(xOf(f), h - pad.b); g.stroke();
      g.globalAlpha = 1;
      g.textAlign = 'center'; g.textBaseline = 'top';
      g.fillText(label, xOf(f), h - pad.b + 4);
    }

    const freqs = opts.freqs;
    for (const c of curves) {
      g.strokeStyle = c.color;
      g.lineWidth = c.width || 2;
      g.setLineDash(c.dash || []);
      g.beginPath();
      for (let i = 0; i < freqs.length; i++) {
        const y = yOf(Math.max(-range, Math.min(range, c.data[i])));
        if (i === 0) g.moveTo(xOf(freqs[i]), y); else g.lineTo(xOf(freqs[i]), y);
      }
      g.stroke();
    }
    g.setLineDash([]);
    if (opts.points) {
      for (const p of opts.points) {
        g.fillStyle = p.color;
        g.beginPath(); g.arc(xOf(p.freq), yOf(Math.max(-range, Math.min(range, p.gain))), p.r || 3.5, 0, Math.PI * 2); g.fill();
      }
    }
  }

  MP.eq = { TYPES, PRESETS, flatBands, parseAutoEq, logFreqs, responseDb, autoPreamp, draw };
})(window.MP = window.MP || {});
