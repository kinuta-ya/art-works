// 聴力テスト（簡易）と補正プロファイルの計算
// 医療用の検査ではない。左右・周波数ごとの「聞こえる最小の音量」を相対的に測る。
(function (MP) {
  'use strict';

  const FULL = [1000, 2000, 3000, 4000, 6000, 8000, 12000, 500, 250];
  const QUICK = [1000, 2000, 4000, 8000, 500];

  // 標準的な聴覚しきい値の目安（dB SPL、ISO 226 を丸めた値）。
  // 周波数ごとの「人の耳のもともとの感度差」を補正に含めないために差し引く。
  const REF = { 250: 11, 500: 4, 1000: 2, 2000: -1, 3000: -5, 4000: -5, 6000: 4, 8000: 13, 12000: 12 };

  const MIN_DB = -120, MAX_DB = -10, START_DB = -40;

  class Test extends EventTarget {
    constructor(freqs) {
      super();
      this.freqs = freqs;
      this.steps = [];
      for (const ear of ['L', 'R']) for (const f of freqs) this.steps.push({ ear, freq: f });
      this.i = 0;
      this.results = { L: {}, R: {} };
      this.ctx = new AudioContext({ latencyHint: 'interactive' });
      this.resetStep();
    }

    resetStep() {
      this.level = START_DB;
      this.lastHeard = null;
      this.ascendingHits = {};
      this.presentations = 0;
      this.heardLevels = [];
    }

    get step() { return this.steps[this.i]; }
    get progress() { return this.i / this.steps.length; }
    get done() { return this.i >= this.steps.length; }

    // 1 回の提示：250ms のトーンを 3 回
    present() {
      const { ear, freq } = this.step;
      return this.tone(freq, this.level, ear, 3);
    }

    tone(freq, db, ear, pulses = 3, pulseLen = 0.25, gap = 0.15) {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const t0 = ctx.currentTime + 0.05;
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0;
      const amp = 10 ** (db / 20);
      const ramp = 0.02;
      for (let k = 0; k < pulses; k++) {
        const s = t0 + k * (pulseLen + gap);
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(amp, s + ramp);
        g.gain.setValueAtTime(amp, s + pulseLen - ramp);
        g.gain.linearRampToValueAtTime(0, s + pulseLen);
      }
      const merger = ctx.createChannelMerger(2);
      osc.connect(g);
      if (ear === 'L' || ear === 'both') g.connect(merger, 0, 0);
      if (ear === 'R' || ear === 'both') g.connect(merger, 0, 1);
      merger.connect(ctx.destination);
      const end = t0 + pulses * (pulseLen + gap);
      osc.start(t0);
      osc.stop(end);
      return new Promise((res) => { osc.onended = () => { merger.disconnect(); res(); }; });
    }

    // 回答。簡易版ヒューソン・ウェストレイク法：
    //  聞こえた → 10dB 下げる / 聞こえない → 5dB 上げる
    //  上昇中（前回「聞こえない」）に同じレベルで 2 回聞こえたら、そこをしきい値とする
    answer(heard) {
      this.presentations++;
      if (heard) {
        this.heardLevels.push(this.level);
        if (this.lastHeard === false) {
          this.ascendingHits[this.level] = (this.ascendingHits[this.level] || 0) + 1;
          if (this.ascendingHits[this.level] >= 2) return this.finishStep(this.level);
        }
        this.lastHeard = true;
        this.level = Math.max(MIN_DB, this.level - 10);
      } else {
        if (this.level >= MAX_DB) return this.finishStep(MAX_DB); // 最大でも聞こえない
        this.lastHeard = false;
        this.level = Math.min(MAX_DB, this.level + 5);
      }
      if (this.presentations >= 16) {
        return this.finishStep(this.heardLevels.length ? Math.min(...this.heardLevels) : MAX_DB);
      }
      this.dispatchEvent(new Event('update'));
      return false;
    }

    finishStep(threshold) {
      const { ear, freq } = this.step;
      this.results[ear][freq] = threshold;
      this.i++;
      this.resetStep();
      this.dispatchEvent(new Event(this.done ? 'done' : 'update'));
      return true;
    }

    close() { try { this.ctx.close(); } catch (e) { /* 無視 */ } }
  }

  function median(arr) {
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  // しきい値 → 補正カーブ
  //  1) 標準しきい値の目安を差し引き、人の耳のもともとの感度差を除く
  //  2) 両耳の中央値を基準に、聞こえにくい周波数だけを持ち上げる（下げはしない）
  //  3) 補聴器のハーフゲイン則にならい、差の strength 倍だけ補正。maxBoost で上限を設ける
  // 絶対値（dB SPL）で測った場合：標準しきい値との差を「聴力レベル（HL）」の目安とし、
  // 20dB を超えた分だけを補聴器のハーフゲイン則にならって補う
  function computeAbsolute(thresholdsSpl, strength = 0.5, maxBoost = 10) {
    const out = {};
    for (const ear of ['L', 'R']) {
      out[ear] = Object.keys(thresholdsSpl[ear]).map(Number).sort((a, b) => a - b).map((f) => {
        const hl = thresholdsSpl[ear][f] - (REF[f] || 0);
        return { freq: f, gain: Math.round(Math.min(maxBoost, Math.max(0, (hl - 20) * strength)) * 10) / 10 };
      });
    }
    return out;
  }

  // 聴力レベルの目安の区分（医療的な判断ではない）
  function hlCategory(hl) {
    if (hl <= 20) return { level: 'ok', text: '正常範囲の目安' };
    if (hl <= 40) return { level: 'mid', text: '軽度相当の目安' };
    if (hl <= 70) return { level: 'bad', text: '中等度相当の目安' };
    return { level: 'bad', text: '高度相当の目安' };
  }
  const hearingLevel = (spl, f) => spl - (REF[f] || 0);

  function computeCurves(thresholds, strength = 0.5, maxBoost = 10) {
    const norm = { L: {}, R: {} };
    const all = [];
    for (const ear of ['L', 'R']) {
      for (const [f, db] of Object.entries(thresholds[ear])) {
        const v = db - (REF[f] || 0);
        norm[ear][f] = v;
        all.push(v);
      }
    }
    const ref = all.length ? median(all) : 0;
    const out = {};
    for (const ear of ['L', 'R']) {
      out[ear] = Object.keys(norm[ear]).map(Number).sort((a, b) => a - b).map((f) => ({
        freq: f,
        gain: Math.round(Math.min(maxBoost, Math.max(0, (norm[ear][f] - ref) * strength)) * 10) / 10,
      }));
    }
    return out;
  }

  // offset: テスト音の dBFS を dB SPL に換算する値（機材プロファイルから。無ければ相対の測定）
  function makeProfile(name, thresholds, strength = 0.5, maxBoost = 10, offset = null, gearId = null) {
    const absolute = Number.isFinite(offset);
    const spl = absolute ? { L: {}, R: {} } : null;
    if (absolute) for (const ear of ['L', 'R']) for (const [f, db] of Object.entries(thresholds[ear])) spl[ear][f] = db + offset;
    return {
      id: 'h' + Date.now().toString(36),
      name,
      createdAt: new Date().toISOString(),
      thresholds, strength, maxBoost, absolute, thresholdsSpl: spl, gearId,
      ...(absolute ? computeAbsolute(spl, strength, maxBoost) : computeCurves(thresholds, strength, maxBoost)),
    };
  }

  function retune(profile, strength, maxBoost) {
    const curves = profile.absolute ? computeAbsolute(profile.thresholdsSpl, strength, maxBoost) : computeCurves(profile.thresholds, strength, maxBoost);
    return { ...profile, strength, maxBoost, ...curves };
  }

  MP.hearing = { Test, FULL, QUICK, makeProfile, retune, computeCurves, hlCategory, hearingLevel };
})(window.MP = window.MP || {});
