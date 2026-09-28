// ライブラリの付加機能：CUE シート、同期歌詞（LRC）、再生回数、スマートプレイリスト
(function (MP) {
  'use strict';

  // テキストファイルの読み込み（UTF-8 で読めなければ Shift_JIS）
  async function readText(file) {
    const buf = await file.arrayBuffer();
    try { return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^﻿/, ''); }
    catch (e) {
      try { return new TextDecoder('shift_jis').decode(buf); } catch (e2) { return new TextDecoder('latin1').decode(buf); }
    }
  }

  // ---------- CUE シート ----------
  // INDEX 01 の時刻は mm:ss:ff（1 秒 = 75 フレーム）
  function parseCue(text) {
    const unq = (s) => s.trim().replace(/^"(.*)"$/, '$1');
    const cue = { title: null, performer: null, genre: null, date: null, files: [] };
    let file = null, track = null;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      let m;
      if ((m = line.match(/^REM\s+GENRE\s+(.+)$/i))) cue.genre = unq(m[1]);
      else if ((m = line.match(/^REM\s+DATE\s+(.+)$/i))) cue.date = unq(m[1]);
      else if ((m = line.match(/^FILE\s+(.+?)\s+(WAVE|MP3|AIFF|BINARY|FLAC)?\s*$/i))) { file = { name: unq(m[1]), tracks: [] }; cue.files.push(file); track = null; }
      else if ((m = line.match(/^TRACK\s+(\d+)\s+(\w+)/i))) { track = { num: parseInt(m[1], 10), title: null, performer: null, start: null }; if (file) file.tracks.push(track); }
      else if ((m = line.match(/^TITLE\s+(.+)$/i))) { if (track) track.title = unq(m[1]); else cue.title = unq(m[1]); }
      else if ((m = line.match(/^PERFORMER\s+(.+)$/i))) { if (track) track.performer = unq(m[1]); else cue.performer = unq(m[1]); }
      else if ((m = line.match(/^INDEX\s+01\s+(\d+):(\d+):(\d+)/i)) && track) track.start = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + parseInt(m[3], 10) / 75;
    }
    return cue;
  }

  // 音声ファイルの情報（meta）と CUE から、曲ごとの仮想トラックを作る
  function cueTracks(cue, cueFile, meta) {
    const f = cue.files.find((x) => x.name.split(/[\\/]/).pop().toLowerCase() === meta.path.split('/').pop().toLowerCase()) ||
      (cue.files.length === 1 ? cue.files[0] : null);
    if (!f) return null;
    const list = f.tracks.filter((t) => t.start != null).sort((a, b) => a.start - b.start);
    if (list.length < 2) return null;
    return list.map((t, i) => {
      const end = i + 1 < list.length ? list[i + 1].start : null;
      return {
        ...meta,
        title: t.title || `Track ${t.num}`,
        artist: t.performer || cue.performer || meta.artist,
        albumArtist: cue.performer || meta.albumArtist || meta.artist,
        album: cue.title || meta.album,
        genre: cue.genre || meta.genre,
        year: (cue.date || meta.year || '').slice(0, 4) || null,
        track: t.num, disc: 1,
        segStart: t.start, segEnd: end,
        duration: end != null ? end - t.start : meta.duration ? meta.duration - t.start : null,
        fileKey: 'f:' + meta.path,
        path: `${meta.path}#${t.num}`,
        cue: cueFile.name,
      };
    });
  }

  // ---------- 同期歌詞（LRC） ----------
  function parseLrc(text) {
    let offset = 0;
    const lines = [];
    for (const raw of String(text).split(/\r?\n/)) {
      const off = raw.match(/^\[offset:\s*([+-]?\d+)\]/i);
      if (off) { offset = parseInt(off[1], 10) / 1000; continue; }
      const stamps = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
      if (!stamps.length) continue;
      const body = raw.replace(/\[[^\]]*\]/g, '').trim();
      for (const s of stamps) lines.push({ t: parseInt(s[1], 10) * 60 + parseFloat(s[2]), text: body });
    }
    lines.sort((a, b) => a.t - b.t);
    for (const l of lines) l.t = Math.max(0, l.t + offset);
    return lines.length ? { synced: true, lines } : { synced: false, lines: String(text).split(/\r?\n/).map((t) => ({ t: null, text: t })) };
  }

  function lineAt(lyr, pos) {
    if (!lyr || !lyr.synced) return -1;
    let i = -1;
    for (let k = 0; k < lyr.lines.length; k++) { if (lyr.lines[k].t <= pos + 0.15) i = k; else break; }
    return i;
  }

  // ---------- 再生回数 ----------
  const STATS_KEY = 'tp.stats';
  let stats = {};
  try { stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{}') || {}; } catch (e) { stats = {}; }
  const statKey = (t) => (MP.insights ? MP.insights.keyOf(t) : t.path);
  function statOf(t) { return stats[statKey(t)] || { plays: 0, last: 0 }; }
  function bump(t) {
    const k = statKey(t);
    const s = stats[k] || { plays: 0, last: 0 };
    s.plays++; s.last = Date.now();
    stats[k] = s;
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) { /* 保存できなくても続ける */ }
  }

  // ---------- スマートプレイリスト ----------
  const PRESETS = [
    { id: 'sp-unplayed', name: 'まだ聴いていない曲', plays: 'never', sort: 'random', limit: 50 },
    { id: 'sp-dynamic', name: 'ダイナミックな録音（DR14 以上）', minDr: 14, sort: 'dr', limit: 100 },
    { id: 'sp-hires', name: 'ハイレゾ音源', hiresOnly: true, sort: 'random', limit: 100 },
    { id: 'sp-favorites', name: 'よく聴く曲', plays: 'played', sort: 'plays', limit: 50 },
  ];
  const LOSSLESS = new Set(['FLAC', 'WAV', 'ALAC', 'AIFF', 'AIF', 'WAVE']);

  function evaluate(rule, tracks) {
    const g = (rule.genre || '').trim().toLowerCase();
    const a = (rule.artist || '').trim().toLowerCase();
    let list = tracks.filter((t) => {
      if (g && !String(t.genre || '').toLowerCase().includes(g)) return false;
      if (a && !`${t.artist} ${t.albumArtist || ''}`.toLowerCase().includes(a)) return false;
      if (rule.losslessOnly && !LOSSLESS.has(String(t.codec).toUpperCase())) return false;
      if (rule.hiresOnly && !((t.sampleRate || 0) >= 88200 || (t.bitDepth || 0) >= 24) ) return false;
      if (rule.hiresOnly && t.demo) return false;
      const st = statOf(t);
      if (rule.plays === 'never' && st.plays > 0) return false;
      if (rule.plays === 'played' && st.plays === 0) return false;
      if (rule.minDr != null || rule.maxDr != null) {
        const r = MP.insights.get(t);
        if (!r) return false;
        if (rule.minDr != null && r.dr < rule.minDr) return false;
        if (rule.maxDr != null && r.dr > rule.maxDr) return false;
      }
      return true;
    });
    const dr = (t) => (MP.insights.get(t) || { dr: -1 }).dr;
    switch (rule.sort) {
      case 'plays': list.sort((x, y) => statOf(y).plays - statOf(x).plays); break;
      case 'dr': list.sort((x, y) => dr(y) - dr(x)); break;
      case 'stale': list.sort((x, y) => statOf(x).last - statOf(y).last); break;
      case 'random': default:
        for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    }
    return list.slice(0, rule.limit || 100);
  }

  function describeRule(r) {
    const parts = [];
    if (r.genre) parts.push(`ジャンル「${r.genre}」`);
    if (r.artist) parts.push(`アーティスト「${r.artist}」`);
    if (r.minDr != null) parts.push(`DR${r.minDr} 以上`);
    if (r.maxDr != null) parts.push(`DR${r.maxDr} 以下`);
    if (r.hiresOnly) parts.push('ハイレゾ');
    if (r.losslessOnly) parts.push('ロスレス');
    if (r.plays === 'never') parts.push('未再生');
    if (r.plays === 'played') parts.push('再生したことがある');
    const sort = { random: 'ランダム', plays: '再生回数の多い順', dr: 'DR の高い順', stale: 'しばらく聴いていない順' }[r.sort || 'random'];
    return `${parts.join('・') || 'すべての曲'} ／ ${sort} ／ 最大 ${r.limit || 100} 曲`;
  }

  // ブラインドテストの結果：偶然にこれ以上当たる確率（二項分布の片側）
  function pValue(correct, n) {
    let p = 0, c = 1;
    for (let k = 0; k <= n; k++) {
      if (k > 0) c = c * (n - k + 1) / k;
      if (k >= correct) p += c;
    }
    return p / 2 ** n;
  }

  MP.extras = { readText, parseCue, cueTracks, parseLrc, lineAt, statOf, bump, PRESETS, evaluate, describeRule, pValue };
})(window.MP = window.MP || {});
