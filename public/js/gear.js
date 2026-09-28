// 機材（M8T の端子・出力モード・ゲインとイヤホン）から、耳に届く音の大きさを推定する計算。
// ゲインの目安、聴覚保護メーター、絶対値の聴力テストが共通で使う。
// 数値は M8T の公表値（e☆イヤホン掲載）。真空管モードの低・中ゲインは公表値が無いため、
// トランジスタモードと同じ比率で推定する。
(function (MP) {
  'use strict';

  const PORTS = { '4.4': '4.4mm バランス', '3.5': '3.5mm シングルエンド' };
  const MODES = { transistor: 'トランジスタ', triode: '三極管', ultralinear: 'ウルトラリニア' };
  const GAINS = { low: '低', mid: '中', high: '高' };

  // フルスケールの正弦波を出したときの出力電圧（Vrms、32Ω 負荷）
  const TRANSISTOR_V = { '3.5': { low: 1, mid: 2, high: 4 }, '4.4': { low: 2, mid: 4, high: 6 } };
  const TUBE_HIGH_V = { '3.5': 3.7, '4.4': 5.5 };
  // S/N（dB）
  const SNR = { transistor: { '3.5': 124, '4.4': 127 }, tube: { '3.5': 123, '4.4': 123 } };

  function volts(port, mode, gain) {
    const tr = TRANSISTOR_V[port];
    if (mode === 'transistor') return { v: tr[gain], estimated: false };
    const v = TUBE_HIGH_V[port] * tr[gain] / tr.high;
    return { v, estimated: gain !== 'high' };
  }

  function snr(port, mode) {
    return SNR[mode === 'transistor' ? 'transistor' : 'tube'][port];
  }

  // イヤホンの感度から、ある電圧で出る音圧（dB SPL）
  // sensUnit: 'mW'（dB/mW、インピーダンスが必要）または 'V'（dB/V）
  function splAt(phone, v) {
    if (!phone || !Number.isFinite(phone.sens) || !(v > 0)) return null;
    if (phone.sensUnit === 'V') return phone.sens + 20 * Math.log10(v);
    if (!(phone.imp > 0)) return null;
    const mW = (v * v / phone.imp) * 1000;
    return phone.sens + 10 * Math.log10(mW);
  }

  // ゲインごとの最大音圧と、ノイズの推定音圧
  function gainTable(g) {
    return ['low', 'mid', 'high'].map((gain) => {
      const { v, estimated } = volts(g.port, g.mode, gain);
      const maxSpl = splAt(g.phone, v);
      // ノイズの電圧 = 最大出力電圧 × 10^(-S/N/20)（S/N はゲインによらず一定と仮定）
      const noiseSpl = maxSpl == null ? null : maxSpl - snr(g.port, g.mode);
      return { gain, v, estimated, maxSpl, noiseSpl };
    });
  }

  // 必要な最大音圧 = 聴く音量 + 曲のピークの余裕 20dB + 音量つまみの余裕 6dB
  function recommend(g, listenDb = 80) {
    const rows = gainTable(g);
    if (rows.some((r) => r.maxSpl == null)) return { rows, pick: null, need: null };
    const need = listenDb + 20 + 6;
    const ok = rows.find((r) => r.maxSpl >= need);
    return { rows, need, pick: ok ? ok.gain : 'high', short: !ok };
  }

  function hissLevel(noiseSpl) {
    if (noiseSpl == null) return null;
    if (noiseSpl < 0) return { level: 'ok', text: '聞こえない' };
    if (noiseSpl < 10) return { level: 'mid', text: 'ごく静かなら' };
    return { level: 'bad', text: '聞こえやすい' };
  }

  // 今のゲインで、デジタルの信号レベル（dBFS、正弦波換算）が耳に届く音圧に換算するための基準
  // hwAtten: 本体の音量で下げている量（dB）
  function offsetDb(g, hwAtten) {
    const { v } = volts(g.port, g.mode, g.gain);
    const max = splAt(g.phone, v);
    return max == null ? null : max - (hwAtten || 0);
  }

  // ---------- 聴覚保護：WHO の基準（80dB で週 40 時間）に対する割合 ----------
  const DOSE_KEY = 'tp.dose';
  let dose = {};
  try { dose = JSON.parse(localStorage.getItem(DOSE_KEY) || '{}') || {}; } catch (e) { dose = {}; }
  const today = () => new Date().toISOString().slice(0, 10);
  let dirty = 0;
  function addDose(seconds, spl) {
    if (!Number.isFinite(spl) || spl < 40) return;
    const d = today();
    dose[d] = (dose[d] || 0) + seconds * 10 ** ((spl - 80) / 10); // 80dB 換算の秒数
    if (++dirty >= 20) saveDose();
  }
  function saveDose() {
    dirty = 0;
    const keep = {};
    for (let i = 0; i < 8; i++) {
      const k = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      if (dose[k]) keep[k] = dose[k];
    }
    dose = keep;
    try { localStorage.setItem(DOSE_KEY, JSON.stringify(dose)); } catch (e) { /* 保存できなくても続ける */ }
  }
  function weekPercent() {
    let s = 0;
    for (let i = 0; i < 7; i++) s += dose[new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)] || 0;
    return s / (40 * 3600) * 100;
  }
  function todayPercent() { return (dose[today()] || 0) / (40 * 3600) * 100; }
  window.addEventListener('pagehide', saveDose);

  function describe(g) {
    if (!g) return '';
    return `${PORTS[g.port]}・${MODES[g.mode]}・${GAINS[g.gain]}ゲイン`;
  }

  MP.gear = { PORTS, MODES, GAINS, volts, snr, splAt, gainTable, recommend, hissLevel, offsetDb, addDose, saveDose, weekPercent, todayPercent, describe };
})(window.MP = window.MP || {});
