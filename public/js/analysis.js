// スマートクロスフェード用の解析：頭と終わりの無音、フェードアウト区間、平均音量
(function (MP) {
  'use strict';

  const WIN = 0.05; // 50ms 窓

  function toDb(p) { return p > 0 ? 10 * Math.log10(p) : -120; }

  function analyze(buffer) {
    const sr = buffer.sampleRate;
    const win = Math.max(1, Math.round(sr * WIN));
    const n = Math.floor(buffer.length / win);
    const chans = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) chans.push(buffer.getChannelData(c));

    // 窓ごとの平均パワー（dB）
    const level = new Float32Array(n);
    let peak = -120;
    for (let w = 0; w < n; w++) {
      let sum = 0;
      const s0 = w * win;
      for (const d of chans) for (let i = s0; i < s0 + win; i++) sum += d[i] * d[i];
      level[w] = toDb(sum / (win * chans.length));
      if (level[w] > peak) peak = level[w];
    }

    // 無音のしきい値：ピークから 45dB 下（ただし -60dBFS より上）
    const silence = Math.max(-60, peak - 45);
    let first = 0, last = n - 1;
    while (first < n && level[first] < silence) first++;
    while (last > first && level[last] < silence) last--;
    const head = first * WIN;
    const end = Math.min(buffer.duration, (last + 1) * WIN);

    // ゲートをかけた平均音量（無音部分を除く）
    let pow = 0, cnt = 0;
    for (let w = first; w <= last; w++) {
      if (level[w] > silence) { pow += 10 ** (level[w] / 10); cnt++; }
    }
    const loudness = cnt ? toDb(pow / cnt) : -120;

    // 1 秒単位の音量で本体の代表レベル（中央値）を求める
    const per = Math.round(1 / WIN);
    const secLevels = [];
    for (let w = first; w + per <= last + 1; w += per) {
      let p = 0;
      for (let k = 0; k < per; k++) p += 10 ** (level[w + k] / 10);
      secLevels.push(toDb(p / per));
    }
    const sorted = [...secLevels].sort((a, b) => a - b);
    const body = sorted.length ? sorted[Math.floor(sorted.length / 2)] : loudness;

    // フェードアウト検出：終わりから遡って、本体レベル近くに戻る最後の地点を探す。
    // その地点以降は徐々に下がり、最後は本体より 15dB 以上小さくなっていること。
    let fadeStart = null;
    const tailSecs = secLevels.length;
    if (tailSecs >= 8 && secLevels[tailSecs - 1] < body - 12) {
      let i = tailSecs - 1;
      while (i > 0 && secLevels[i] < body - 3) i--;
      const start = head + i * 1;
      const len = end - start;
      // 減衰が単調に近いか（上昇が 3dB を超えない）
      let monotone = true;
      for (let k = i + 1; k < tailSecs; k++) if (secLevels[k] > secLevels[k - 1] + 3) monotone = false;
      if (monotone && len >= 2 && len <= 20) fadeStart = start;
    }

    return { head, end, loudness, body, fadeStart, duration: buffer.duration };
  }

  MP.analysis = { analyze };
})(window.MP = window.MP || {});
