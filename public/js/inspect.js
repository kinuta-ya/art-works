// 音源の解析：DR（ダイナミックレンジ）、ラウドネス（EBU R128）、ピーク、波形、
// スペクトログラム、高域の上限（ハイレゾ真偽・ロッシー由来の判定）、24bit の中身の確認。
// 重い処理は小分けにして、途中で画面の処理を挟む（操作が固まらないように）。
(function (MP) {
  'use strict';

  const now = () => performance.now();
  let lastYield = now();
  async function breathe() {
    if (now() - lastYield > 12) {
      await new Promise((r) => setTimeout(r, 0));
      lastYield = now();
    }
  }

  const dbOf = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);

  // ---------- DR（foobar2000 の DR Meter と同じ方式） ----------
  // 3 秒ごとのブロックで RMS とピークを取り、RMS 上位 20% の平均と 2 番目に大きいピークの比
  async function dynamicRange(buffer) {
    const blk = Math.round(buffer.sampleRate * 3);
    const len = buffer.length;
    const nb = Math.max(1, Math.ceil(len / blk));
    const perCh = [];
    let samplePeak = 0;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const d = buffer.getChannelData(c);
      const rms = [], peaks = [];
      for (let b = 0; b < nb; b++) {
        const s0 = b * blk, s1 = Math.min(len, s0 + blk);
        let sum = 0, pk = 0;
        for (let i = s0; i < s1; i++) {
          const v = d[i];
          sum += v * v;
          const a = v < 0 ? -v : v;
          if (a > pk) pk = a;
        }
        rms.push(Math.sqrt(2 * sum / Math.max(1, s1 - s0)));
        peaks.push(pk);
        if (pk > samplePeak) samplePeak = pk;
        await breathe();
      }
      rms.sort((a, b) => b - a);
      peaks.sort((a, b) => b - a);
      const top = Math.max(1, Math.floor(nb * 0.2));
      let p = 0;
      for (let i = 0; i < top; i++) p += rms[i] * rms[i];
      const rms20 = Math.sqrt(p / top);
      const p2 = peaks.length > 1 ? peaks[1] : peaks[0];
      perCh.push(rms20 > 0 && p2 > 0 ? dbOf(p2 / rms20) : 0);
    }
    return { dr: Math.max(0, Math.round(perCh.reduce((a, b) => a + b, 0) / perCh.length)), samplePeak };
  }

  // ---------- ラウドネス（EBU R128 / ITU-R BS.1770 の積分ラウドネス） ----------
  function kWeighting(fs) {
    // libebur128 と同じ係数の求め方（任意のサンプルレートに対応）
    let f0 = 1681.974450955533, Q = 0.7071752369554196;
    let K = Math.tan(Math.PI * f0 / fs);
    const Vh = 10 ** (3.999843853973347 / 20), Vb = Vh ** 0.4996667741545416;
    let a0 = 1 + K / Q + K * K;
    const pre = {
      b0: (Vh + Vb * K / Q + K * K) / a0, b1: 2 * (K * K - Vh) / a0, b2: (Vh - Vb * K / Q + K * K) / a0,
      a1: 2 * (K * K - 1) / a0, a2: (1 - K / Q + K * K) / a0,
    };
    f0 = 38.13547087602444; Q = 0.5003270373238773;
    K = Math.tan(Math.PI * f0 / fs);
    a0 = 1 + K / Q + K * K;
    const rlb = { a1: 2 * (K * K - 1) / a0, a2: (1 - K / Q + K * K) / a0 };
    return [pre, rlb];
  }

  async function loudness(buffer) {
    const fs = buffer.sampleRate;
    const step = Math.round(fs * 0.1); // 100ms 単位で二乗和を貯める
    const steps = Math.floor(buffer.length / step);
    const energy = new Float64Array(steps);
    const [p, r] = kWeighting(fs);
    for (let c = 0; c < Math.min(2, buffer.numberOfChannels); c++) {
      const d = buffer.getChannelData(c);
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0, z1 = 0, z2 = 0;
      for (let s = 0; s < steps; s++) {
        let sum = 0;
        for (let i = s * step, e = i + step; i < e; i++) {
          const x = d[i];
          const y = p.b0 * x + p.b1 * x1 + p.b2 * x2 - p.a1 * y1 - p.a2 * y2;
          const z = y - 2 * y1 + y2 - r.a1 * z1 - r.a2 * z2;
          x2 = x1; x1 = x; y2 = y1; y1 = y; z2 = z1; z1 = z;
          sum += z * z;
        }
        energy[s] += sum;
        if ((s & 15) === 0) await breathe();
      }
    }
    // 400ms のブロック（75% 重ね）でゲート処理
    const blocks = [];
    for (let j = 0; j + 4 <= steps; j++) {
      blocks.push((energy[j] + energy[j + 1] + energy[j + 2] + energy[j + 3]) / (4 * step));
    }
    const L = (z) => -0.691 + 10 * Math.log10(z);
    const abs = blocks.filter((z) => z > 0 && L(z) > -70);
    if (!abs.length) return { lufs: -Infinity, gatedZ: 0, gatedN: 0 };
    const rel = L(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
    const gated = abs.filter((z) => L(z) > rel);
    const meanZ = gated.reduce((a, b) => a + b, 0) / gated.length;
    return { lufs: L(meanZ), gatedZ: meanZ, gatedN: gated.length };
  }

  // 複数の曲をまとめたラウドネス（アルバム単位の ReplayGain 用。ゲート後の平均パワーを曲の長さで重み付け）
  function combineLoudness(list) {
    let z = 0, n = 0;
    for (const x of list) { z += x.gatedZ * x.gatedN; n += x.gatedN; }
    return n ? -0.691 + 10 * Math.log10(z / n) : null;
  }

  // ---------- 波形（シークバー用） ----------
  async function waveform(buffer, bins = 600) {
    const out = new Float32Array(bins);
    const per = buffer.length / bins;
    const chans = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) chans.push(buffer.getChannelData(c));
    for (let b = 0; b < bins; b++) {
      const s0 = Math.floor(b * per), s1 = Math.floor((b + 1) * per);
      let pk = 0;
      for (const d of chans) {
        for (let i = s0; i < s1; i += 4) { const a = d[i] < 0 ? -d[i] : d[i]; if (a > pk) pk = a; }
      }
      out[b] = pk;
      if ((b & 31) === 0) await breathe();
    }
    return out;
  }

  // ---------- FFT（基数 2、4096 点） ----------
  const N = 4096;
  const rev = new Uint16Array(N);
  for (let i = 0, bits = Math.log2(N); i < N; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
    rev[i] = r;
  }
  const cosT = new Float64Array(N / 2), sinT = new Float64Array(N / 2), hann = new Float64Array(N);
  for (let i = 0; i < N / 2; i++) { cosT[i] = Math.cos(2 * Math.PI * i / N); sinT[i] = Math.sin(2 * Math.PI * i / N); }
  for (let i = 0; i < N; i++) hann[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));

  function fft(re, im) {
    for (let i = 0; i < N; i++) {
      const j = rev[i];
      if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1, stepT = N / size;
      for (let i = 0; i < N; i += size) {
        for (let j = 0, k = 0; j < half; j++, k += stepT) {
          const a = i + j, b = a + half;
          const tr = re[b] * cosT[k] + im[b] * sinT[k];
          const ti = im[b] * cosT[k] - re[b] * sinT[k];
          re[b] = re[a] - tr; im[b] = im[a] - ti;
          re[a] += tr; im[a] += ti;
        }
      }
    }
  }

  // ---------- スペクトログラムと高域の上限 ----------
  const ROWS = 256;
  async function spectrum(buffer) {
    const len = buffer.length;
    const frames = Math.max(1, Math.min(360, Math.floor(len / N)));
    const hop = frames > 1 ? Math.floor((len - N) / (frames - 1)) : 0;
    const chans = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) chans.push(buffer.getChannelData(c));
    const re = new Float64Array(N), im = new Float64Array(N);
    const bins = N / 2;
    const ltas = new Float64Array(bins);            // 長時間平均スペクトル（パワー）
    const img = new Float32Array(frames * ROWS);     // スペクトログラム（dB）
    const perRow = bins / ROWS;
    let maxDb = -Infinity;
    for (let f = 0; f < frames; f++) {
      const s0 = f * hop;
      for (let i = 0; i < N; i++) {
        let v = 0;
        for (const d of chans) v += d[s0 + i] || 0;
        re[i] = (v / chans.length) * hann[i];
        im[i] = 0;
      }
      fft(re, im);
      for (let r = 0; r < ROWS; r++) {
        let pk = 0;
        for (let k = r * perRow; k < (r + 1) * perRow; k++) {
          const pw = re[k] * re[k] + im[k] * im[k];
          ltas[k] += pw;
          if (pw > pk) pk = pw;
        }
        const db = 10 * Math.log10(pk + 1e-20);
        img[f * ROWS + r] = db;
        if (db > maxDb) maxDb = db;
      }
      await breathe();
    }
    // 250Hz ごとの帯域の平均レベル
    const nyq = buffer.sampleRate / 2;
    const hzPerBin = nyq / bins;
    const bandHz = 250;
    const B = Math.floor(nyq / bandHz);
    const bands = new Float64Array(B);
    for (let b = 0; b < B; b++) {
      const k0 = Math.floor(b * bandHz / hzPerBin), k1 = Math.max(k0 + 1, Math.floor((b + 1) * bandHz / hzPerBin));
      let s = 0;
      for (let k = k0; k < k1 && k < bins; k++) s += ltas[k];
      bands[b] = 10 * Math.log10(s / (k1 - k0) / frames + 1e-20);
    }
    // 崖の検出：その下 1kHz の中央値より、上の全帯域が 20dB 以上小さい、最も高い周波数
    let cutoff = nyq;
    for (let k = B - 1; k >= 20; k--) {
      const below = [bands[k - 4], bands[k - 3], bands[k - 2], bands[k - 1]].sort((a, b) => a - b);
      const med = (below[1] + below[2]) / 2;
      let aboveMax = -Infinity;
      for (let j = k; j < B; j++) if (bands[j] > aboveMax) aboveMax = bands[j];
      if (med - aboveMax >= 20) { cutoff = Math.max(0, k - 2) * bandHz; break; } // 窓関数の漏れの分だけ下げる
    }
    return { frames, rows: ROWS, img, maxDb, nyq, cutoff };
  }

  // 24bit のファイルなのに下位 8bit が空（16bit を 24bit に拡張した）か
  function paddedTo24(buffer) {
    const d = buffer.getChannelData(0);
    const stride = Math.max(1, Math.floor(d.length / 200000));
    let nonzero = 0, fine = 0;
    for (let i = 0; i < d.length; i += stride) {
      const v = d[i];
      if (v === 0) continue;
      nonzero++;
      const x = v * 32768;
      if (Math.abs(x - Math.round(x)) > 1e-3) fine++;
    }
    return nonzero > 1000 && fine / nonzero < 0.001;
  }

  // ---------- 判定 ----------
  const LOSSLESS = new Set(['FLAC', 'WAV', 'ALAC', 'AIFF', 'AIF', 'WAVE']);
  function verdict(track, spec, padded) {
    const kHz = (spec.cutoff / 1000).toFixed(1);
    const full = spec.cutoff >= spec.nyq - 500;
    const notes = [];
    if (track.demo) return { level: 'info', text: '合成音のため判定しません', notes };
    const lossless = LOSSLESS.has(String(track.codec).toUpperCase());
    const rate = track.sampleRate || spec.nyq * 2;
    let level = 'ok', text;
    if (!lossless) {
      level = 'info';
      text = `圧縮音源（${full ? '記録できる上限' : kHz + 'kHz'}まで記録）`;
    } else if (rate >= 88200) {
      if (spec.cutoff <= 24500) { level = 'warn'; text = `高域が ${kHz}kHz 付近で切れています。44.1/48kHz の音源をアップサンプリングした可能性があります`; }
      else text = `${full ? 'サンプルレートの上限' : kHz + 'kHz'}まで記録されています。ハイレゾとしての帯域があります`;
    } else if (spec.cutoff < 17000) {
      level = 'warn'; text = `高域が ${kHz}kHz 付近で切れています。MP3 などの圧縮音源から変換した可能性があります`;
    } else if (spec.cutoff < 19800) {
      level = 'warn'; text = `高域が ${kHz}kHz 付近で切れています。高ビットレートの圧縮音源から変換した可能性があります`;
    } else {
      text = `${full ? 'サンプルレートの上限' : kHz + 'kHz'}まで記録されています`;
    }
    if (padded) { level = 'warn'; notes.push('24bit ですが下位 8bit が空です。16bit の音源を 24bit に変換した可能性があります'); }
    if (level === 'warn') notes.push('古い録音や、もともと高域の少ない曲では、正規の音源でも同じ結果になることがあります');
    return { level, text, notes };
  }

  // ---------- まとめて解析 ----------
  // native: バッファが音源と同じサンプルレートか（違うと高域と 24bit の判定ができない）
  async function analyze(track, buffer, native) {
    const t0 = now();
    const { dr, samplePeak } = await dynamicRange(buffer);
    const loud = await loudness(buffer);
    const wave = await waveform(buffer);
    const spec = await spectrum(buffer);
    const padded = native && track.bitDepth === 24 && paddedTo24(buffer);
    const v = native ? verdict(track, spec, padded) : { level: 'info', text: '出力レートが音源と違うため、高域の判定はアルバム画面の「解析」で行います', notes: [] };
    return {
      dr, peakDb: dbOf(samplePeak), samplePeak,
      lufs: loud.lufs, gatedZ: loud.gatedZ, gatedN: loud.gatedN,
      cutoff: spec.cutoff, nyq: spec.nyq, verdict: v, padded,
      wave, spec, ms: Math.round(now() - t0),
    };
  }

  // 解析用に、音源本来のサンプルレートでデコードする
  async function decodeNative(track) {
    if (track.makeBuffer) return track.makeBuffer();
    const rate = Math.min(768000, Math.max(8000, track.sampleRate || 44100));
    const ctx = new OfflineAudioContext(2, 1, rate);
    return ctx.decodeAudioData(await track.file.arrayBuffer());
  }

  // DR の色分け（慣習：14 以上は豊か、8〜13 は普通、7 以下は圧縮が強い）
  function drLevel(dr) { return dr >= 14 ? 'ok' : dr >= 8 ? 'mid' : 'bad'; }

  MP.inspect = { analyze, decodeNative, combineLoudness, drLevel };
})(window.MP = window.MP || {});
