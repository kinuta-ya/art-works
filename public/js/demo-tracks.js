// 音源ファイルが無くても試せる合成音のデモアルバム
//  1) ギャップレス・テスト：1 本のつながった音を 3 曲に分割。隙間があるとプツッと聞こえる
//  2) クロスフェード・テスト：頭に無音、終わりにフェードアウトと無音がある 3 曲
(function (MP) {
  'use strict';

  const SR = 44100;
  const NOTE = (m) => 440 * 2 ** ((m - 69) / 12);

  // 位相が連続した和音パッド（コード切り替えはグライド）
  function renderPad(seconds) {
    const len = Math.round(seconds * SR);
    const L = new Float32Array(len), R = new Float32Array(len);
    const chords = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 55, 59, 64]];
    const chordLen = 5;
    const phases = [0, 0, 0, 0];
    const glide = 0.4;
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const ci = Math.floor(t / chordLen);
      const into = t - ci * chordLen;
      const cur = chords[ci % chords.length];
      const prev = chords[(ci + chords.length - 1) % chords.length];
      const k = ci === 0 ? 1 : Math.min(1, into / glide);
      let l = 0, r = 0;
      for (let v = 0; v < 4; v++) {
        const f = NOTE(prev[v]) + (NOTE(cur[v]) - NOTE(prev[v])) * k;
        phases[v] += 2 * Math.PI * f / SR;
        const s = Math.sin(phases[v]) + 0.25 * Math.sin(2 * phases[v]);
        const pan = 0.3 + 0.4 * (v / 3);
        l += s * (1 - pan); r += s * pan;
      }
      // 2Hz のゆらぎ（リズムの連続性がわかる）
      const amp = 0.09 * (0.75 + 0.25 * Math.sin(2 * Math.PI * 2 * t));
      L[i] = l * amp; R[i] = r * amp;
    }
    return [L, R];
  }

  // 減衰する音のアルペジオ。頭に無音、終わりにフェードアウト＋無音
  function renderArp(seconds, bpm, root, pattern, seed) {
    const lead = 1.2, tailSilence = 2.0, fade = 6.0;
    const len = Math.round(seconds * SR);
    const L = new Float32Array(len), R = new Float32Array(len);
    const beat = 60 / bpm / 2;
    const musicEnd = seconds - tailSilence;
    let n = 0;
    for (let t0 = lead; t0 < musicEnd; t0 += beat, n++) {
      const note = root + pattern[n % pattern.length];
      const f = NOTE(note);
      const start = Math.round(t0 * SR);
      const dur = Math.round(Math.min(1.2, musicEnd - t0) * SR);
      const pan = 0.5 + 0.35 * Math.sin(n * 0.9 + seed);
      for (let i = 0; i < dur && start + i < len; i++) {
        const t = i / SR;
        const env = Math.exp(-t * 4.5) * Math.min(1, t * 400);
        const s = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) + 0.12 * Math.sin(6 * Math.PI * f * t)) * env;
        L[start + i] += s * (1 - pan) * 0.22;
        R[start + i] += s * pan * 0.22;
      }
    }
    // ベースのドローン
    const bf = NOTE(root - 12);
    for (let i = Math.round(lead * SR); i < Math.round(musicEnd * SR); i++) {
      const t = i / SR;
      const s = Math.sin(2 * Math.PI * bf * t) * 0.07 * Math.min(1, (t - lead) * 2);
      L[i] += s; R[i] += s;
    }
    // フェードアウト
    const fs = Math.round((musicEnd - fade) * SR), fe = Math.round(musicEnd * SR);
    for (let i = fs; i < len; i++) {
      const g = i >= fe ? 0 : (1 - (i - fs) / (fe - fs)) ** 2;
      L[i] *= g; R[i] *= g;
    }
    return [L, R];
  }

  function toBuffer([L, R], from = 0, to = L.length) {
    const b = new AudioBuffer({ length: to - from, numberOfChannels: 2, sampleRate: SR });
    b.copyToChannel(L.subarray(from, to), 0);
    b.copyToChannel(R.subarray(from, to), 1);
    return b;
  }

  function create() {
    const albums = [];

    // --- ギャップレス・テスト ---
    {
      const total = 45, parts = 3;
      let pad = null;
      const getPad = () => (pad = pad || renderPad(total));
      const tracks = [];
      for (let p = 0; p < parts; p++) {
        const from = Math.round((total / parts) * p * SR);
        const to = Math.round((total / parts) * (p + 1) * SR);
        tracks.push({
          title: ['Part I — つながり', 'Part II — 継ぎ目', 'Part III — 余韻'][p],
          track: p + 1, duration: (to - from) / SR,
          makeBuffer: () => toBuffer(getPad(), from, to),
        });
      }
      albums.push({ album: 'ギャップレス・テスト', artist: 'デモ音源', year: '2026', genre: 'Classical', tracks });
    }

    // --- クロスフェード・テスト ---
    {
      const defs = [
        { title: 'Amber Tube', bpm: 96, root: 57, pattern: [0, 7, 12, 16, 12, 7], seed: 1 },
        { title: 'Night Walk', bpm: 120, root: 62, pattern: [0, 3, 7, 10, 15, 10, 7, 3], seed: 2 },
        { title: 'Morning Glass', bpm: 84, root: 60, pattern: [0, 4, 7, 11, 14, 11], seed: 3 },
      ];
      const tracks = defs.map((d, i) => ({
        title: d.title, track: i + 1, duration: 24,
        makeBuffer: () => toBuffer(renderArp(24, d.bpm, d.root, d.pattern, d.seed)),
      }));
      // 別々の曲を集めたミックス扱い（同じアルバムでもクロスフェードする）
      albums.push({ album: 'クロスフェード・テスト', artist: 'デモ音源', year: '2026', tracks, mix: true, genre: 'Jazz' });
    }

    const out = [];
    for (const a of albums) {
      for (const t of a.tracks) {
        out.push({
          title: t.title, artist: a.artist, album: a.album, albumArtist: a.artist,
          track: t.track, disc: 1, year: a.year, genre: a.genre,
          sampleRate: SR, bitDepth: 32, channels: 2, duration: t.duration,
          codec: '合成音', lossless: true, demo: true,
          makeBuffer: t.makeBuffer,
          path: `demo/${a.album}/${t.track}`, mix: !!a.mix,
        });
      }
    }
    return out;
  }

  MP.demoTracks = { create };
})(window.MP = window.MP || {});
