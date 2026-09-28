// 解析結果の保存と表示：DR・ラウドネス・高域の判定の保存、ReplayGain の値、
// 波形シークバー、スペクトログラム、VU メーターの描画。
(function (MP) {
  'use strict';

  // ---------- 解析結果の保存 ----------
  // 数値の結果は端末に保存し、波形とスペクトログラムは直近の曲だけメモリに置く
  const STORE_KEY = 'tp.analysis';
  const SCALARS = ['dr', 'peakDb', 'samplePeak', 'lufs', 'gatedZ', 'gatedN', 'cutoff', 'nyq', 'verdict', 'padded', 'native'];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { saved = {}; }
  const full = new Map(); // track.id → 波形・スペクトログラムを含む結果
  const events = new EventTarget();

  const keyOf = (t) => `${t.path}|${t.file ? t.file.size : Math.round((t.duration || 0) * 1000)}`;

  function persist() {
    try {
      const keys = Object.keys(saved);
      if (keys.length > 5000) for (const k of keys.slice(0, keys.length - 5000)) delete saved[k];
      localStorage.setItem(STORE_KEY, JSON.stringify(saved));
    } catch (e) { /* 保存できなくても動作は続ける */ }
  }

  function get(track) { return full.get(track.id) || saved[keyOf(track)] || null; }
  function getFull(track) { return full.get(track.id) || null; }

  // 1 曲ずつ順番に解析する
  let chain = Promise.resolve();
  const pending = new Map();
  function ensure(track, opts = {}) {
    const want = opts.full ? 'full' : 'scalar';
    const have = want === 'full' ? full.get(track.id) : get(track);
    if (have && (have.native || !opts.needNative)) return Promise.resolve(have);
    const pk = track.id + want;
    if (pending.has(pk)) return pending.get(pk);
    const job = chain.then(async () => {
      let buffer = opts.buffer;
      if (!buffer || (opts.needNative && buffer.sampleRate !== track.sampleRate && !track.demo)) buffer = await MP.inspect.decodeNative(track);
      // CUE の曲は、ファイルの中の自分の区間だけを解析する
      if (track.segStart != null || track.segEnd != null) {
        const { s: a, e } = MP.engineUtil.segOf(track, buffer);
        buffer = MP.engineUtil.slice(buffer, a, e);
      }
      const native = track.demo || !track.sampleRate || buffer.sampleRate === track.sampleRate;
      const r = await MP.inspect.analyze(track, buffer, native);
      r.native = native;
      const s = {};
      for (const k of SCALARS) s[k] = r[k];
      // 解析したレートが音源と違う場合、以前に正しいレートで解析した高域の判定は残す
      const prev = saved[keyOf(track)];
      if (!native && prev && prev.native) { s.cutoff = prev.cutoff; s.nyq = prev.nyq; s.verdict = prev.verdict; s.padded = prev.padded; s.native = true; }
      saved[keyOf(track)] = s;
      persist();
      full.set(track.id, { ...r, ...s });
      if (full.size > 12) full.delete(full.keys().next().value);
      events.dispatchEvent(new CustomEvent('analyzed', { detail: { track } }));
      return full.get(track.id);
    });
    chain = job.catch(() => {});
    pending.set(pk, job);
    job.finally(() => pending.delete(pk));
    return job;
  }

  // ---------- ReplayGain ----------
  // 基準は -18 LUFS（ReplayGain 2.0）。タグがあればタグを優先し、無ければ解析した値を使う
  const REF = -18;
  let albumTracksOf = () => [];
  function gainInfo(track, mode) {
    const s = get(track);
    if (mode === 'album') {
      if (Number.isFinite(track.rgAlbum)) return { db: track.rgAlbum, peak: track.rgAlbumPeak || (s && s.samplePeak), source: 'タグ（アルバム）' };
      const list = albumTracksOf(track).map(get);
      if (list.length && list.every((x) => x && Number.isFinite(x.lufs))) {
        const L = MP.inspect.combineLoudness(list);
        if (L != null) return { db: REF - L, peak: Math.max(...list.map((x) => x.samplePeak || 0)), source: '解析（アルバム）' };
      }
    }
    if (Number.isFinite(track.rgTrack)) return { db: track.rgTrack, peak: track.rgTrackPeak || (s && s.samplePeak), source: 'タグ（トラック）' };
    if (s && Number.isFinite(s.lufs)) return { db: REF - s.lufs, peak: s.samplePeak, source: mode === 'album' ? '解析（アルバム未解析のためトラック）' : '解析（トラック）' };
    return null;
  }
  const hasTag = (t) => Number.isFinite(t.rgTrack);

  // ---------- 描画の共通 ----------
  function token(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  function fitCanvas(c) {
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return null;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, w, h };
  }

  // ---------- 波形シークバー ----------
  function drawWave(canvas, wave, progress) {
    const f = fitCanvas(canvas);
    if (!f) return;
    const { g, w, h } = f;
    g.clearRect(0, 0, w, h);
    const played = token('--c-main', '#d45f2a');
    const rest = token('--muted', '#888');
    const bar = 3, gap = 1.5;
    const n = Math.floor(w / (bar + gap));
    if (!wave) {
      g.fillStyle = rest; g.globalAlpha = 0.35;
      g.fillRect(0, h / 2 - 1, w, 2);
      g.globalAlpha = 1; g.fillStyle = played;
      g.fillRect(0, h / 2 - 1, w * progress, 2);
      return;
    }
    let max = 0;
    for (const v of wave) if (v > max) max = v;
    max = max || 1;
    for (let i = 0; i < n; i++) {
      const a = Math.floor(i * wave.length / n), b = Math.max(a + 1, Math.floor((i + 1) * wave.length / n));
      let pk = 0;
      for (let k = a; k < b; k++) if (wave[k] > pk) pk = wave[k];
      const bh = Math.max(2, (pk / max) * (h - 2));
      const x = i * (bar + gap);
      const on = (i + 0.5) / n <= progress;
      g.fillStyle = on ? played : rest;
      g.globalAlpha = on ? 1 : 0.4;
      g.fillRect(x, (h - bh) / 2, bar, bh);
    }
    g.globalAlpha = 1;
  }

  // ---------- スペクトログラム ----------
  // 色は音の強さを表す中身なので、テーマに関係なく同じ配色（暗い→紫→橙→黄）
  const STOPS = [[0, [8, 6, 20]], [0.25, [70, 16, 105]], [0.5, [168, 45, 92]], [0.72, [238, 110, 40]], [0.9, [250, 200, 60]], [1, [255, 250, 190]]];
  function colorAt(v) {
    for (let i = 1; i < STOPS.length; i++) {
      if (v <= STOPS[i][0]) {
        const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i];
        const t = (v - a) / (b - a);
        return [0, 1, 2].map((k) => ca[k] + (cb[k] - ca[k]) * t);
      }
    }
    return STOPS[STOPS.length - 1][1];
  }
  function drawSpectrogram(canvas, spec, cutoff) {
    const { frames, rows, img, maxDb, nyq } = spec;
    canvas.width = frames; canvas.height = rows;
    const g = canvas.getContext('2d');
    const data = g.createImageData(frames, rows);
    const range = 100;
    for (let f = 0; f < frames; f++) {
      for (let r = 0; r < rows; r++) {
        const v = Math.max(0, Math.min(1, (img[f * rows + r] - maxDb + range) / range));
        const [R, G, B] = colorAt(v);
        const o = ((rows - 1 - r) * frames + f) * 4;
        data.data[o] = R; data.data[o + 1] = G; data.data[o + 2] = B; data.data[o + 3] = 255;
      }
    }
    g.putImageData(data, 0, 0);
    if (cutoff && cutoff < nyq - 500) {
      const y = rows - (cutoff / nyq) * rows;
      g.strokeStyle = 'rgba(255,255,255,.85)';
      g.setLineDash([4, 3]);
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y); g.lineTo(frames, y); g.stroke();
    }
  }

  // ---------- VU メーター ----------
  // 0VU = -18dBFS（正弦波換算）。目盛りは本物の VU 計と同じく電圧に比例
  const VU_MIN = -20, VU_MAX = 3;
  const lin = (db) => 10 ** (db / 20);
  const posOf = (db) => (lin(db) - lin(VU_MIN)) / (lin(VU_MAX) - lin(VU_MIN));
  class VUMeter {
    constructor(canvas) {
      this.canvas = canvas;
      this.level = [VU_MIN - 2, VU_MIN - 2];
      this.buf = new Float32Array(2048);
      this.raf = 0;
      this.last = 0;
    }
    start(getMeters, isPlaying) {
      this.getMeters = getMeters; this.isPlaying = isPlaying;
      if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame((t) => this.frame(t)); }
    }
    stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
    frame(t) {
      const dt = Math.min(0.1, (t - this.last) / 1000);
      this.last = t;
      const meters = this.getMeters();
      const playing = this.isPlaying();
      let settled = true;
      for (let ch = 0; ch < 2; ch++) {
        let target = VU_MIN - 2;
        if (meters && playing) {
          meters[ch].getFloatTimeDomainData(this.buf);
          let s = 0;
          for (let i = 0; i < this.buf.length; i++) s += this.buf[i] * this.buf[i];
          const rms = Math.sqrt(s / this.buf.length) * Math.SQRT2;
          target = rms > 0 ? 20 * Math.log10(rms) + 18 : VU_MIN - 2;
        }
        // 針の動き（約 300ms で目標に近づく）
        this.level[ch] += (target - this.level[ch]) * (1 - Math.exp(-dt / 0.1));
        if (Math.abs(target - this.level[ch]) > 0.05) settled = false;
      }
      this.draw();
      if (playing || !settled) this.raf = requestAnimationFrame((tt) => this.frame(tt));
      else this.raf = 0;
    }
    draw() {
      const f = fitCanvas(this.canvas);
      if (!f) return;
      const { g, w, h } = f;
      g.clearRect(0, 0, w, h);
      const gap = 12;
      const mw = (w - gap) / 2;
      for (let ch = 0; ch < 2; ch++) this.drawOne(g, ch * (mw + gap), 0, mw, h, ch ? 'R' : 'L', this.level[ch]);
    }
    drawOne(g, x, y, w, h, label, level) {
      const face = '#f3e4b9', ink = '#2b2118', red = '#c8321e';
      g.save();
      g.translate(x, y);
      // 盤面（背面から照らされた淡い黄色）
      const grd = g.createRadialGradient(w / 2, h * 0.2, 4, w / 2, h * 0.6, w * 0.7);
      grd.addColorStop(0, '#fbf0cf'); grd.addColorStop(1, face);
      g.fillStyle = grd;
      g.beginPath(); g.roundRect(0, 0, w, h, 8); g.fill();
      // 弧と目盛りの文字が盤面に収まる大きさにする（振れ幅は左右 45°）
      const SPAN = 45;
      const cx = w / 2, cy = h * 1.08;
      const R = Math.max(10, Math.min((w / 2 - 20) / Math.sin(SPAN * Math.PI / 180), cy - 26));
      const ang = (p) => (-SPAN + p * 2 * SPAN) * Math.PI / 180;
      // 赤い区間（0〜+3）
      g.strokeStyle = red; g.lineWidth = 5;
      g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2 + ang(posOf(0)), -Math.PI / 2 + ang(1)); g.stroke();
      g.strokeStyle = ink; g.lineWidth = 1.2;
      g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2 + ang(0), -Math.PI / 2 + ang(posOf(0))); g.stroke();
      // 目盛り
      g.font = `${Math.max(8, h * 0.1)}px "DM Mono", ui-monospace, monospace`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const db of [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3]) {
        const a = -Math.PI / 2 + ang(posOf(db));
        const r0 = R - 2, r1 = R + (db % 5 === 0 || db === -7 || db === 3 ? 9 : 6);
        g.strokeStyle = db > 0 ? red : ink; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke();
        if ([-20, -10, -5, -3, 0, 3].includes(db)) {
          g.fillStyle = db > 0 ? red : ink;
          g.fillText(db > 0 ? '+' + db : String(db), cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16));
        }
      }
      g.fillStyle = ink;
      g.font = `600 ${Math.max(10, h * 0.16)}px "Jost", system-ui, sans-serif`;
      g.fillText('VU', cx, cy - R * 0.45);
      g.font = `${Math.max(8, h * 0.09)}px "DM Mono", ui-monospace, monospace`;
      g.fillText(label, w - 12, h - 10);
      // 針
      const p = Math.max(-0.03, Math.min(1.05, posOf(level)));
      const a = -Math.PI / 2 + ang(p);
      g.strokeStyle = ink; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (R + 4), cy + Math.sin(a) * (R + 4)); g.stroke();
      g.restore();
    }
  }

  MP.insights = {
    events, get, getFull, ensure, gainInfo, hasTag, keyOf,
    setAlbumTracks: (fn) => { albumTracksOf = fn; },
    drawWave, drawSpectrogram, VUMeter,
  };
})(window.MP = window.MP || {});
