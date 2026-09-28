// 再生エンジン（Web Audio）
//  - 素通しが既定：加工が必要な設定がオンのときだけ処理ノードを経路に入れる
//  - ギャップレス：次の曲を AudioContext の時刻でサンプル単位で連結して予約
//  - スマートクロスフェード：無音とフェードアウトを解析し、等パワーカーブで重ねる
(function (MP) {
  'use strict';

  const DEFAULTS = {
    mode: 'gapless',        // 'gapless' | 'crossfade'
    crossfadeSec: 6,        // クロスフェードの基準の長さ
    levelMatch: true,       // クロスフェード時に 2 曲の音量差をなめらかにする
    albumGapless: true,     // 同じアルバムの連続トラックはギャップレスにする
    followRate: true,       // 出力サンプルレートを音源に合わせる
    volume: 1,              // デジタル音量（1 = 素通し）
    eqEnabled: false,
    eqBands: null,
    hearingEnabled: false,
    hearingProfile: null,   // { name, L: [{freq, gain}], R: [...] }
    replayGain: 'off',      // 'off' | 'track' | 'album'
    rgPreventClip: true,    // ReplayGain で持ち上げてもピークが 0dBFS を超えないようにする
  };

  const LOOKAHEAD = 0.08; // 再生開始までの余裕（秒）

  class Engine extends EventTarget {
    constructor(settings) {
      super();
      this.s = { ...DEFAULTS, ...settings };
      if (!this.s.eqBands) this.s.eqBands = MP.eq.flatBands();
      this.ctx = null;
      this.queue = [];
      this.index = -1;
      this.players = [];      // 再生中・予約済みのソース
      this.state = 'stopped'; // 'stopped' | 'playing' | 'paused' | 'loading'
      this.token = 0;         // 再生操作ごとに更新し、古い非同期処理を無効化する
      this.buffers = new Map();
      this.analyses = new Map();
      this.preampDb = 0;
      this.transition = null; // 次の曲への切り替え情報
      this.timer = null;
      // アプリから渡す関数：ReplayGain の値 { db, peak, source } を返す（無ければ null）
      this.gainInfo = () => null;
      // アプリから渡す関数：ReplayGain がオンのとき、再生前に解析を済ませる
      this.prepare = async () => {};
    }

    // ---------- コンテキストと信号経路 ----------
    async ensureContext(rate) {
      const want = this.s.followRate && rate ? rate : null;
      if (this.ctx && (!want || this.ctx.sampleRate === want)) {
        if (this.ctx.state === 'suspended' && this.state !== 'paused') await this.ctx.resume();
        return;
      }
      if (this.ctx) { try { await this.ctx.close(); } catch (e) { /* 無視 */ } }
      let ctx;
      try {
        ctx = new AudioContext(want ? { sampleRate: want, latencyHint: 'playback' } : { latencyHint: 'playback' });
      } catch (e) {
        ctx = new AudioContext({ latencyHint: 'playback' });
      }
      this.ctx = ctx;
      this.buffers.clear(); // デコード結果はコンテキストのレートに依存する
      this.input = ctx.createGain(); // 常に 1.0（浮動小数点で 1.0 倍は無変換）
      // VU メーター用の取り出し口（信号をのぞくだけで、音には手を加えない）
      this.tapSplit = ctx.createChannelSplitter(2);
      this.meters = [ctx.createAnalyser(), ctx.createAnalyser()];
      this.meters.forEach((a, ch) => { a.fftSize = 2048; this.tapSplit.connect(a, ch); });
      this.chain = [];
      this.rebuildChain();
      if (ctx.state === 'suspended') await ctx.resume();
    }

    // 加工が必要な処理だけを経路に入れる
    rebuildChain() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      this.input.disconnect();
      for (const n of this.chain) { try { n.disconnect(); } catch (e) { /* 無視 */ } }
      this.chain = [];
      this.eqNodes = [];
      this.hearingNodes = { L: [], R: [] };

      const eqActive = this.eqActive();
      const hearingActive = this.hearingActive();
      this.preampDb = this.computePreamp();
      const preGain = this.s.volume * 10 ** (this.preampDb / 20);

      let last = this.input;
      const link = (node) => { last.connect(node); this.chain.push(node); last = node; };

      if (Math.abs(preGain - 1) > 1e-6) {
        this.pre = ctx.createGain();
        this.pre.gain.value = preGain;
        link(this.pre);
      } else {
        this.pre = null;
      }
      if (eqActive) {
        for (const b of this.s.eqBands) {
          if (!b.enabled || Math.abs(b.gain) < 0.01) continue;
          const f = ctx.createBiquadFilter();
          f.type = b.type; f.frequency.value = b.freq; f.gain.value = b.gain; f.Q.value = b.q;
          this.eqNodes.push({ node: f, band: b });
          link(f);
        }
      }
      if (hearingActive) {
        const split = ctx.createChannelSplitter(2);
        const merge = ctx.createChannelMerger(2);
        link(split);
        ['L', 'R'].forEach((ear, ch) => {
          let prev = null;
          for (const p of this.s.hearingProfile[ear]) {
            if (p.gain < 0.05) continue;
            const f = ctx.createBiquadFilter();
            f.type = 'peaking'; f.frequency.value = p.freq; f.gain.value = p.gain; f.Q.value = 1.4;
            if (prev) prev.connect(f); else split.connect(f, ch);
            this.chain.push(f);
            this.hearingNodes[ear].push(f);
            prev = f;
          }
          if (prev) prev.connect(merge, 0, ch); else split.connect(merge, ch, ch);
        });
        this.chain.push(merge);
        last = merge;
      }
      last.connect(ctx.destination);
      last.connect(this.tapSplit);
      this.emit('signalpath');
    }

    eqActive() { return this.s.eqEnabled && this.s.eqBands.some((b) => b.enabled && Math.abs(b.gain) >= 0.01); }
    hearingActive() {
      const p = this.s.hearingProfile;
      return this.s.hearingEnabled && !!p && [...p.L, ...p.R].some((x) => x.gain >= 0.05);
    }
    hearingBands(ear) {
      return this.s.hearingProfile[ear].map((p) => ({ type: 'peaking', freq: p.freq, gain: p.gain, q: 1.4, enabled: true }));
    }

    computePreamp() {
      const freqs = MP.eq.logFreqs(200);
      const eqBands = this.eqActive() ? this.s.eqBands : [];
      const curves = [];
      if (this.hearingActive()) {
        for (const ear of ['L', 'R']) {
          const c = MP.eq.responseDb([...eqBands, ...this.hearingBands(ear)], freqs);
          curves.push(c);
        }
      } else if (eqBands.length) {
        curves.push(MP.eq.responseDb(eqBands, freqs));
      }
      return curves.length ? MP.eq.autoPreamp(curves) : 0;
    }

    // 設定変更。EQ のゲインだけの変更は、経路を組み直さずに値だけ更新する
    update(patch) {
      const prevStructure = this.structureKey();
      Object.assign(this.s, patch);
      if (!this.ctx) { this.emit('signalpath'); return; }
      if (this.structureKey() !== prevStructure) {
        this.rebuildChain();
      } else {
        for (const { node, band } of this.eqNodes) {
          node.type = band.type; node.frequency.value = band.freq; node.gain.value = band.gain; node.Q.value = band.q;
        }
        this.preampDb = this.computePreamp();
        const preGain = this.s.volume * 10 ** (this.preampDb / 20);
        if (this.pre) this.pre.gain.setTargetAtTime(preGain, this.ctx.currentTime, 0.01);
        this.emit('signalpath');
      }
      if ('replayGain' in patch || 'rgPreventClip' in patch) this.applyRg();
      if ('mode' in patch || 'crossfadeSec' in patch || 'levelMatch' in patch || 'albumGapless' in patch) this.reschedule();
    }

    structureKey() {
      const eq = this.eqActive() ? this.s.eqBands.filter((b) => b.enabled && Math.abs(b.gain) >= 0.01).map((b) => b.type).join(',') : '';
      const h = this.hearingActive() ? JSON.stringify(this.s.hearingProfile) : '';
      const preOn = Math.abs(this.s.volume * 10 ** (this.computePreamp() / 20) - 1) > 1e-6;
      return [eq, h, preOn].join('|');
    }

    // ---------- 読み込みと解析 ----------
    async load(track) {
      const key = track.id;
      if (!this.buffers.has(key)) {
        const p = (async () => {
          if (track.makeBuffer) return track.makeBuffer();
          const data = await track.file.arrayBuffer();
          return await this.ctx.decodeAudioData(data);
        })();
        this.buffers.set(key, p);
        p.catch(() => this.buffers.delete(key));
      }
      return this.buffers.get(key);
    }

    analysisOf(track, buffer) {
      if (!this.analyses.has(track.id)) this.analyses.set(track.id, MP.analysis.analyze(buffer));
      return this.analyses.get(track.id);
    }

    // 現在と次の曲以外のバッファを解放
    trimCache() {
      const keep = new Set(this.players.map((p) => p.track.id));
      const next = this.queue[this.nextIndex()];
      if (next) keep.add(next.id);
      for (const k of this.buffers.keys()) if (!keep.has(k)) this.buffers.delete(k);
    }

    // ---------- 再生操作 ----------
    async play(queue, index, offset = 0, opts = {}) {
      const token = ++this.token;
      this.queue = queue;
      this.index = index;
      const track = queue[index];
      if (!track) return this.stop();
      this.stopPlayers();
      this.transition = null;
      this.state = 'loading';
      this.emit('state');
      this.emit('trackchange');
      try {
        await this.ensureContext(track.sampleRate);
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        const buffer = await this.load(track);
        if (token !== this.token) return;
        if (this.s.replayGain !== 'off') await this.prepare(track, buffer);
        if (token !== this.token) return;
        offset = Math.max(0, Math.min(offset, buffer.duration - 0.05));
        const at = this.ctx.currentTime + LOOKAHEAD;
        const player = this.startPlayer(track, index, buffer, at, offset);
        if (offset > 0) { // シーク時のみ 10ms のデクリック
          player.gain.gain.setValueAtTime(0, at);
          player.gain.gain.linearRampToValueAtTime(1, at + 0.01);
        }
        this.state = 'playing';
        if (opts.paused) { this.state = 'paused'; await this.ctx.suspend(); }
        this.startClock();
        this.emit('state');
        this.emit('signalpath');
        this.scheduleNext(token);
      } catch (e) {
        if (token !== this.token) return;
        console.error(e);
        this.state = 'stopped';
        this.emit('state');
        this.emit('error', { track, message: `${track.title} を再生できませんでした（${track.codec} はこのブラウザで非対応の可能性があります）` });
      }
    }

    startPlayer(track, index, buffer, at, offset) {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      const rg = this.ctx.createGain(); // ReplayGain（オフのときは 1.0 倍＝無変換）
      const gain = this.ctx.createGain(); // クロスフェード用
      const rgDb = this.rgDb(track);
      rg.gain.value = 10 ** (rgDb / 20);
      source.connect(rg).connect(gain).connect(this.input);
      source.start(at, offset);
      const player = { track, index, buffer, source, rg, rgDb, gain, startCtx: at - offset, stopAt: null };
      source.onended = () => {
        const i = this.players.indexOf(player);
        if (i >= 0) this.players.splice(i, 1);
        try { gain.disconnect(); } catch (e) { /* 無視 */ }
      };
      this.players.push(player);
      return player;
    }

    // ReplayGain で実際にかける量（dB）。オフ・情報なしは 0
    rgDb(track) {
      if (this.s.replayGain === 'off') return 0;
      const info = this.gainInfo(track, this.s.replayGain);
      if (!info || !Number.isFinite(info.db)) return 0;
      let db = info.db;
      if (this.s.rgPreventClip && info.peak > 0) db = Math.min(db, -20 * Math.log10(info.peak));
      return Math.round(db * 100) / 100;
    }

    // 再生中・予約済みの曲に ReplayGain をかけ直す
    applyRg() {
      if (!this.ctx) return;
      for (const p of this.players) {
        p.rgDb = this.rgDb(p.track);
        p.rg.gain.setTargetAtTime(10 ** (p.rgDb / 20), this.ctx.currentTime, 0.05);
      }
      this.emit('signalpath');
    }

    stopPlayers() {
      for (const p of this.players) {
        p.source.onended = null;
        try { p.source.stop(); } catch (e) { /* 無視 */ }
        try { p.gain.disconnect(); } catch (e) { /* 無視 */ }
      }
      this.players = [];
    }

    nextIndex() {
      if (this.index + 1 < this.queue.length) return this.index + 1;
      return this.repeat ? 0 : -1;
    }

    isAlbumContinuation(a, b) {
      return this.s.albumGapless && !a.mix && !b.mix && a.album === b.album && (a.albumArtist || a.artist) === (b.albumArtist || b.artist) &&
        a.track != null && b.track != null && ((b.disc || 1) === (a.disc || 1) ? b.track === a.track + 1 : (b.disc || 1) === (a.disc || 1) + 1 && b.track === 1);
    }

    async scheduleNext(token) {
      const cur = this.currentPlayer;
      if (!cur) return;
      const ni = this.nextIndex();
      if (ni < 0) { this.transition = { type: 'end', at: cur.startCtx + cur.buffer.duration }; this.emit('transition'); return; }
      const next = this.queue[ni];
      let buffer;
      try {
        buffer = await this.load(next);
      } catch (e) {
        this.emit('error', { track: next, message: `${next.title} を読み込めませんでした` });
        this.transition = { type: 'end', at: cur.startCtx + cur.buffer.duration };
        return;
      }
      if (token !== this.token || this.currentPlayer !== cur) return;
      if (this.s.replayGain !== 'off') await this.prepare(next, buffer);
      if (token !== this.token || this.currentPlayer !== cur) return;

      const now = this.ctx.currentTime;
      const curEndCtx = cur.startCtx + cur.buffer.duration;
      const useCrossfade = this.s.mode === 'crossfade' && !this.isAlbumContinuation(cur.track, next);

      if (!useCrossfade) {
        // ギャップレス：前の曲の最後のサンプルの直後から開始
        const at = Math.max(curEndCtx, now + LOOKAHEAD);
        const p = this.startPlayer(next, ni, buffer, at, 0);
        this.transition = { type: 'gapless', at, next: p, reason: this.s.mode === 'crossfade' ? 'album' : 'mode' };
        this.emit('transition');
        return;
      }

      // スマートクロスフェード
      const A = this.analysisOf(cur.track, cur.buffer);
      const B = this.analysisOf(next, buffer);
      let dur = this.s.crossfadeSec;
      if (A.fadeStart != null) dur = Math.min(12, Math.max(1.5, A.end - A.fadeStart)); // 曲自身のフェードアウトに合わせる
      dur = Math.min(dur, (A.end - A.head) * 0.3, (B.end - B.head) * 0.3);
      let xfStart = cur.startCtx + A.end - dur;
      if (xfStart < now + LOOKAHEAD) {
        xfStart = now + LOOKAHEAD;
        dur = Math.max(0, cur.startCtx + A.end - xfStart);
      }
      if (dur < 0.3) { // 余裕が無い（終わり間際にシークした等）：無音を飛ばしてつなぐ
        const at = Math.max(Math.min(curEndCtx, cur.startCtx + A.end), now + LOOKAHEAD);
        cur.source.stop(at);
        const p = this.startPlayer(next, ni, buffer, at, B.head);
        this.transition = { type: 'cut', at, next: p };
        this.emit('transition');
        return;
      }

      const ratio = this.s.levelMatch ? Math.min(2, Math.max(0.5, 10 ** ((A.loudness - B.loudness) / 20))) : 1;
      const p = this.startPlayer(next, ni, buffer, xfStart, B.head);
      const steps = 64;
      const out = new Float32Array(steps), inn = new Float32Array(steps);
      for (let i = 0; i < steps; i++) {
        const x = i / (steps - 1);
        out[i] = Math.cos(x * Math.PI / 2);
        inn[i] = Math.sin(x * Math.PI / 2) * ratio;
      }
      cur.gain.gain.cancelScheduledValues(0);
      cur.gain.gain.setValueAtTime(1, now);
      cur.gain.gain.setValueCurveAtTime(out, xfStart, dur);
      cur.source.stop(xfStart + dur + 0.02);
      p.gain.gain.setValueAtTime(0, now);
      p.gain.gain.setValueCurveAtTime(inn, xfStart, dur);
      const settle = ratio !== 1 ? 6 : 0; // 音量差を 6 秒かけて元に戻す
      if (settle) p.gain.gain.linearRampToValueAtTime(1, xfStart + dur + settle);
      this.transition = { type: 'crossfade', at: xfStart, dur, settle, next: p, fadeDetected: A.fadeStart != null, ratioDb: 20 * Math.log10(ratio), skipHead: B.head };
      this.emit('transition');
    }

    // 未開始の予約を取り消して、次の曲を予約し直す
    reschedule() {
      const cur = this.currentPlayer;
      if (!cur || !this.ctx || this.state === 'stopped') return;
      const t = this.transition;
      if (t && t.at <= this.ctx.currentTime + 0.05 && t.type !== 'end') return; // すでに切り替え中
      if (t && t.next) {
        const i = this.players.indexOf(t.next);
        t.next.source.onended = null;
        try { t.next.source.stop(); } catch (e) { /* 無視 */ }
        try { t.next.gain.disconnect(); } catch (e) { /* 無視 */ }
        if (i >= 0) this.players.splice(i, 1);
      }
      cur.gain.gain.cancelScheduledValues(0);
      cur.gain.gain.setValueAtTime(1, this.ctx.currentTime);
      try { cur.source.stop(cur.startCtx + cur.buffer.duration + 1); } catch (e) { /* 無視 */ }
      this.transition = null;
      this.scheduleNext(this.token);
    }

    setQueue(queue, index) {
      this.queue = queue;
      this.index = index;
      this.reschedule();
      this.emit('queue');
    }

    get currentPlayer() { return this._cur && this.players.includes(this._cur) ? this._cur : this.players.find((p) => p.index === this.index) || null; }

    // ---------- 時計：曲の切り替わりと終了を検出 ----------
    startClock() {
      clearInterval(this.timer);
      this._cur = this.players.find((p) => p.index === this.index) || null;
      this.timer = setInterval(() => this.tick(), 100);
    }

    tick() {
      if (!this.ctx || this.state !== 'playing') return;
      const now = this.ctx.currentTime;
      const t = this.transition;
      if (t && t.type !== 'end' && t.next && now >= t.at) {
        this.index = t.next.index;
        this._cur = t.next;
        const done = t;
        this.transition = null;
        this.lastTransition = { ...done, finishedAt: now };
        this.emit('trackchange');
        this.emit('signalpath');
        this.trimCache();
        this.scheduleNext(this.token);
      } else if (t && t.type === 'end' && now >= t.at) {
        this.stop();
        return;
      }
      this.emit('time');
    }

    // クロスフェード中など、ゲインが 1.0 以外の区間か
    inCrossfade() {
      const lt = this.lastTransition;
      if (!lt || lt.type !== 'crossfade' || !this.ctx) return false;
      return this.ctx.currentTime < lt.at + lt.dur + lt.settle;
    }

    position() {
      const p = this.currentPlayer;
      if (!p || !this.ctx) return 0;
      return Math.max(0, Math.min(p.buffer.duration, this.ctx.currentTime - p.startCtx));
    }

    duration() {
      const p = this.currentPlayer;
      if (p) return p.buffer.duration;
      const t = this.queue[this.index];
      return t ? t.duration || 0 : 0;
    }

    async pause() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      await this.ctx.suspend();
      this.emit('state');
    }

    async resume() {
      if (this.state === 'paused') {
        this.state = 'playing';
        await this.ctx.resume();
        this.emit('state');
      } else if (this.state === 'stopped' && this.queue[this.index]) {
        this.play(this.queue, this.index, 0);
      }
    }

    toggle() { return this.state === 'playing' ? this.pause() : this.resume(); }

    seek(sec) {
      if (this.index < 0) return;
      this.play(this.queue, this.index, sec, { paused: this.state === 'paused' });
    }

    next() {
      const ni = this.nextIndex();
      if (ni >= 0) this.play(this.queue, ni, 0);
    }

    prev() {
      if (this.position() > 3 || this.index === 0) this.play(this.queue, this.index, 0);
      else this.play(this.queue, this.index - 1, 0);
    }

    stop() {
      this.token++;
      this.stopPlayers();
      this._cur = null;
      this.transition = null;
      clearInterval(this.timer);
      this.state = 'stopped';
      this.emit('state');
      this.emit('time');
    }

    // ---------- 信号経路の表示用 ----------
    signalPath() {
      const track = this.queue[this.index];
      const stages = [];
      let pure = true;
      const rate = (r) => (r ? (r % 1000 === 0 ? r / 1000 : (r / 1000).toFixed(1)) + 'kHz' : '?');
      if (track) {
        stages.push({ label: '音源', value: `${track.codec} ${rate(track.sampleRate)}${track.bitDepth ? ' / ' + track.bitDepth + 'bit' : ''}`, status: 'info' });
      }
      if (this.ctx && track && track.sampleRate) {
        const same = this.ctx.sampleRate === track.sampleRate;
        if (!same) pure = false;
        stages.push({ label: 'サンプルレート', value: same ? `${rate(this.ctx.sampleRate)} 一致` : `${rate(track.sampleRate)} → ${rate(this.ctx.sampleRate)} 変換`, status: same ? 'ok' : 'warn' });
      }
      const volPure = Math.abs(this.s.volume - 1) < 1e-6;
      if (!volPure) pure = false;
      stages.push({ label: '音量', value: volPure ? '100%（処理なし）' : `${Math.round(this.s.volume * 100)}%（デジタル音量）`, status: volPure ? 'ok' : 'warn' });
      const cp = this.currentPlayer;
      const rgOn = this.s.replayGain !== 'off';
      const rgNow = cp ? cp.rgDb : 0;
      if (rgOn && Math.abs(rgNow) >= 0.01) pure = false;
      stages.push({
        label: 'ReplayGain',
        value: !rgOn ? 'オフ' : cp && Math.abs(rgNow) >= 0.01 ? `${this.s.replayGain === 'album' ? 'アルバム' : 'トラック'} ${rgNow > 0 ? '+' : ''}${rgNow.toFixed(1)}dB` : `${this.s.replayGain === 'album' ? 'アルバム' : 'トラック'}（調整なし）`,
        status: rgOn && Math.abs(rgNow) >= 0.01 ? 'warn' : 'ok',
      });
      const eqOn = this.eqActive();
      if (eqOn) pure = false;
      stages.push({ label: 'EQ', value: eqOn ? `オン（${this.s.eqBands.filter((b) => b.enabled && Math.abs(b.gain) >= 0.01).length} バンド）` : 'オフ', status: eqOn ? 'warn' : 'ok' });
      const hOn = this.hearingActive();
      if (hOn) pure = false;
      stages.push({ label: '聴力補正', value: hOn ? `オン（${this.s.hearingProfile.name}）` : 'オフ', status: hOn ? 'warn' : 'ok' });
      if (this.preampDb < 0) stages.push({ label: 'プリアンプ', value: `${this.preampDb.toFixed(1)}dB（音割れ防止）`, status: 'warn' });
      const xf = this.inCrossfade();
      if (xf) pure = false;
      stages.push({ label: 'つなぎ', value: xf ? 'クロスフェード中' : this.s.mode === 'crossfade' ? 'スマートクロスフェード（待機中）' : 'ギャップレス', status: xf ? 'warn' : 'ok' });
      stages.push({ label: '出力', value: 'ブラウザ → OS ミキサー（Web 版の限界）', status: 'info' });
      return { stages, pure };
    }

    emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
  }

  MP.Engine = Engine;
})(window.MP = window.MP || {});
