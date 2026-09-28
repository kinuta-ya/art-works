// 画面（ライブラリ・再生画面・ツール・設定）
(function (MP) {
  'use strict';

  // ---------- アイコン ----------
  const ICONS = {
    albums: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
    genre: '<path d="M3 7h18M3 12h18M3 17h11"/><circle cx="19" cy="17" r="2.5"/>',
    songs: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    eq: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    ear: '<path d="M6 8.5a6 6 0 1 1 12 0c0 3.5-3 4.5-3 7.5a3.5 3.5 0 0 1-6.3 2.1"/><path d="M9 9a3 3 0 1 1 5 2.2c-1 .8-1 1.3-1 2.3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4" width="4.2" height="16" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.8" y="4" width="4.2" height="16" rx="1.2" fill="currentColor" stroke="none"/>',
    next: '<path d="M4 5.5v13a1 1 0 0 0 1.6.8L14 13v5.5a1 1 0 0 0 1.6.8l6-6.5a1 1 0 0 0 0-1.6l-6-6.5a1 1 0 0 0-1.6.8V11L5.6 4.7A1 1 0 0 0 4 5.5z" fill="currentColor" stroke="none"/>',
    prev: '<path d="M20 5.5v13a1 1 0 0 1-1.6.8L10 13v5.5a1 1 0 0 1-1.6.8l-6-6.5a1 1 0 0 1 0-1.6l6-6.5a1 1 0 0 1 1.6.8V11l8.4-6.3A1 1 0 0 1 20 5.5z" fill="currentColor" stroke="none"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    repeat: '<path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    gear: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="12" r="2.5"/><circle cx="15.5" cy="12" r="2.5"/><path d="M8.5 6.5v1M15.5 6.5v1"/>',
    gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-6"/><circle cx="12" cy="17" r="1.2"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="M9 12h6M12 9v6"/>',
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.3"/><circle cx="12" cy="7.5" r="1.3"/><circle cx="16" cy="10" r="1.3"/><path d="M12 21a2.5 2.5 0 0 1 0-5h2a3 3 0 0 0 3-3"/>',
    loop: '<path d="M4 12a6 6 0 0 1 6-6h8M15 3l3 3-3 3M20 12a6 6 0 0 1-6 6H6M9 21l-3-3 3-3"/>',
    knob: '<circle cx="12" cy="13" r="7"/><path d="M12 13V8M5 5l1.5 1.5M19 5l-1.5 1.5M12 3v1"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  const NAV = [
    { id: 'albums', label: 'アルバム', icon: 'albums' },
    { id: 'genres', label: 'ジャンル', icon: 'genre' },
    { id: 'songs', label: '曲', icon: 'songs' },
    { id: 'tools', label: 'ツール', icon: 'tools' },
    { id: 'settings', label: '設定', icon: 'settings' },
  ];

  // ツール：設定で有効にしたものだけがツール画面に並ぶ。
  // audio: 音を変えるツール（有効にすると処理がかかる。ツールの中で一時的にオフにできる）
  // needs: 使うのに必要な別のツール
  const TOOLS = [
    { id: 'nonstop', name: 'ノンストップ', desc: 'ギャップレスとスマートクロスフェードの切り替え', icon: 'loop', def: true },
    { id: 'theme', name: 'テーマ', desc: '10 種類の外観から選ぶ', icon: 'palette', def: true },
    { id: 'eq', name: 'EQ', desc: 'パラメトリック EQ と AutoEQ の読み込み', icon: 'eq', audio: true },
    { id: 'hearing', name: '聴力補正', desc: '聴力テストと、聞こえにくい帯域の補正', icon: 'ear', audio: true },
    { id: 'rg', name: 'ReplayGain', desc: '曲・アルバムごとの音量差をそろえる', icon: 'knob', audio: true },
    { id: 'gear', name: '機材プロファイル', desc: '端子・出力モード・ゲインとイヤホンの組み合わせ', icon: 'gear' },
    { id: 'gaincalc', name: 'ゲインの目安', desc: 'イヤホンに合うゲインと、ノイズの聞こえやすさ', icon: 'gauge', needs: 'gear' },
    { id: 'safety', name: '聴覚保護メーター', desc: '耳に届く音の大きさの推定と、1 週間に聴いた量', icon: 'shield', needs: 'gear' },
  ];

  // ---------- 保存（localStorage は使えないこともある） ----------
  const store = {
    get(key, def) { try { const v = localStorage.getItem('tp.' + key); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(key, val) { try { localStorage.setItem('tp.' + key, JSON.stringify(val)); } catch (e) { /* 保存できなくても動作は続ける */ } },
  };

  // ---------- 状態 ----------
  const S = {
    tracks: [],
    albums: [],
    albumMap: new Map(),
    view: 'albums',
    albumKey: null,
    genres: [],
    genreName: null,
    search: '',
    shuffle: false,
    repeat: false,
    baseQueue: [],
    eqPreset: store.get('eqPreset', 'flat'),
    profiles: store.get('profiles', []),
    activeProfile: store.get('activeProfile', null),
    test: null,
  };

  const saved = store.get('settings', {});
  // ツールの有効／無効（以前の設定から引き継ぐ）
  const toolDefaults = Object.fromEntries(TOOLS.map((t) => [t.id, !!t.def]));
  if (saved.eqEnabled) toolDefaults.eq = true;
  if (saved.hearingEnabled) toolDefaults.hearing = true;
  if (saved.replayGain && saved.replayGain !== 'off') toolDefaults.rg = true;
  S.tools = { ...toolDefaults, ...store.get('tools', {}) };
  S.bypass = { eq: false, hearing: false, rg: false }; // 一時的にオフ（保存しない）
  S.rgMode = store.get('rgMode', saved.replayGain && saved.replayGain !== 'off' ? saved.replayGain : 'track');
  S.nsMode = store.get('nsMode', saved.mode || 'gapless');
  S.gears = store.get('gears', []);
  S.activeGear = store.get('activeGear', null);
  S.gearEdit = null;
  S.hw = { vol: 60, max: 100, step: 0.5, ...store.get('hw', {}) };
  S.listenDb = store.get('listenDb', 80);
  S.safetyNow = null;

  S.skin = MP.skins.apply(S.tools.theme ? store.get('skin', 'midcentury') : 'midcentury');
  S.spin = store.get('spin', true);
  document.documentElement.dataset.spin = S.spin ? 'on' : 'off';

  const engine = new MP.Engine({
    mode: S.tools.nonstop ? S.nsMode : 'gapless',
    crossfadeSec: saved.crossfadeSec || 6,
    levelMatch: saved.levelMatch !== false,
    albumGapless: saved.albumGapless !== false,
    followRate: saved.followRate !== false,
    volume: 1,
    eqEnabled: !!S.tools.eq,
    eqBands: saved.eqBands || null,
    hearingEnabled: !!S.tools.hearing,
    replayGain: S.tools.rg ? S.rgMode : 'off',
    rgPreventClip: saved.rgPreventClip !== false,
    hearingProfile: S.profiles.find((p) => p.id === S.activeProfile) || null,
  });
  if (!engine.s.hearingProfile) engine.s.hearingEnabled = false;
  S.vu = store.get('vu', true);

  // ReplayGain：タグか解析結果から値を出す。オンのときは再生前に解析を済ませる
  engine.gainInfo = (t, mode) => MP.insights.gainInfo(t, mode);
  engine.prepare = (t, buffer) => (MP.insights.hasTag(t) || MP.insights.get(t) ? null : MP.insights.ensure(t, { buffer }));
  MP.insights.setAlbumTracks((t) => { const a = S.albumMap.get(albumKeyOf(t)); return a ? a.tracks : [t]; });

  function saveSettings() {
    const s = engine.s;
    store.set('settings', {
      crossfadeSec: s.crossfadeSec, levelMatch: s.levelMatch, albumGapless: s.albumGapless,
      followRate: s.followRate, eqBands: s.eqBands, rgPreventClip: s.rgPreventClip,
    });
  }

  // ツールの有効／無効と「一時的にオフ」を、再生エンジンとテーマに反映する
  function applyTools() {
    const t = S.tools, b = S.bypass;
    const prof = S.profiles.find((p) => p.id === S.activeProfile) || null;
    const rgBefore = engine.s.replayGain;
    engine.update({
      eqEnabled: !!t.eq && !b.eq,
      hearingProfile: prof,
      hearingEnabled: !!t.hearing && !!prof && !b.hearing,
      replayGain: t.rg && !b.rg ? S.rgMode : 'off',
      mode: t.nonstop ? S.nsMode : 'gapless',
    });
    S.skin = MP.skins.apply(t.theme ? store.get('skin', 'midcentury') : 'midcentury');
    if (engine.s.replayGain !== rgBefore) refreshRg();
    updateNow();
  }

  // ReplayGain をオンにしたら、再生中の曲を解析してからかけ直し、次の曲も予約し直す
  function refreshRg() {
    const t = engine.queue[engine.index];
    if (engine.s.replayGain !== 'off' && t && !MP.insights.hasTag(t) && !MP.insights.get(t)) {
      const p = engine.currentPlayer;
      MP.insights.ensure(t, { buffer: p && p.track === t ? p.buffer : null }).then(() => { engine.applyRg(); engine.reschedule(); });
    } else {
      engine.applyRg();
      engine.reschedule();
    }
  }

  // ---------- 機材 ----------
  const activeGear = () => (S.tools.gear ? S.gears.find((g) => g.id === S.activeGear) || null : null);
  const hwAtten = () => Math.max(0, (S.hw.max - S.hw.vol) * S.hw.step);
  // デジタルの信号レベル（dBFS、正弦波換算）に足すと耳に届く音圧（dB SPL）になる値
  const splOffset = () => { const g = activeGear(); return g ? MP.gear.offsetDb(g, hwAtten()) : null; };

  // ---------- 小物 ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTime = (sec) => {
    if (!Number.isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  const fmtRate = (r) => (r ? (r % 1000 === 0 ? r / 1000 : (r / 1000).toFixed(1)) + 'kHz' : '');
  const fmtFormat = (t) => [t.codec, t.sampleRate ? fmtRate(t.sampleRate) + (t.bitDepth ? '/' + t.bitDepth + 'bit' : '') : ''].filter(Boolean).join(' ');
  const fmtHz = (f) => (f >= 1000 ? (f / 1000).toFixed(f % 1000 ? 1 : 0) + 'kHz' : Math.round(f) + 'Hz');

  let toastTimer;
  function toast(msg, ms = 2600) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    if (ms) toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  // ジャケットが無いときの画像
  const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2a2622"/><text x="50" y="64" font-size="40" text-anchor="middle" fill="#a39a90">♪</text></svg>');

  function artHtml(album, cls = 'art') {
    if (album && album.artUrl) return `<img class="${cls}" src="${esc(album.artUrl)}" alt="" loading="lazy">`;
    const ch = (album && album.title ? album.title.trim()[0] : '♪') || '♪';
    let h = 0;
    for (const c of (album && album.title) || '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return `<span class="${cls} art-ph tone-${h % 4}" aria-hidden="true">${esc(ch)}</span>`;
  }

  // ---------- ライブラリ ----------
  let nextId = 1;
  function albumKeyOf(t) { return JSON.stringify([t.albumArtist || t.artist, t.album]); }

  function addTracks(list) {
    const known = new Set(S.tracks.map((t) => t.path));
    for (const t of list) {
      if (known.has(t.path)) continue;
      t.id = 't' + nextId++;
      S.tracks.push(t);
    }
    rebuildAlbums();
  }

  // ジャケットの無いアルバムに、ジャンルの作風で代わりのジャケットを作る
  const coverCache = new Map(); // アルバムのキー＋ジャンル → Promise<URL>
  let coverRefresh = null;
  function requestCover(a) {
    const key = a.key + '\u0000' + a.genre;
    if (!coverCache.has(key)) coverCache.set(key, MP.coverArt.make(a));
    coverCache.get(key).then((url) => {
      const cur = S.albumMap.get(a.key);
      if (!cur || cur.genre !== a.genre || (cur.artUrl && !cur.artGenerated)) return;
      cur.artUrl = url;
      cur.artGenerated = true;
      for (const t of cur.tracks) if (!t.artUrl || t.artGenerated) { t.artUrl = url; t.artGenerated = true; }
      // 描き直しはまとめて 1 回
      clearTimeout(coverRefresh);
      coverRefresh = setTimeout(() => {
        const v = $('#view'), y = v.scrollTop;
        render();
        v.scrollTop = y;
        updateMini(); updateNow(); updateMediaSession();
      }, 60);
    }).catch((e) => console.warn('ジャケットを作れませんでした', e));
  }

  function rebuildAlbums() {
    const map = new Map();
    for (const t of S.tracks) {
      const key = albumKeyOf(t);
      if (!map.has(key)) map.set(key, { key, title: t.album, artist: t.albumArtist || t.artist, year: t.year, tracks: [], artUrl: null });
      const a = map.get(key);
      a.tracks.push(t);
      if (!a.artUrl && t.artUrl && !t.artGenerated) a.artUrl = t.artUrl;
      if (!a.year && t.year) a.year = t.year;
    }
    for (const a of map.values()) {
      a.tracks.sort((x, y) => (x.disc || 1) - (y.disc || 1) || (x.track ?? 999) - (y.track ?? 999) || x.path.localeCompare(y.path));
      if (a.artUrl) for (const t of a.tracks) if (!t.artUrl || t.artGenerated) { t.artUrl = a.artUrl; t.artGenerated = false; }
    }
    S.albumMap = map;
    S.albums = [...map.values()].sort((a, b) => a.artist.localeCompare(b.artist, 'ja') || a.title.localeCompare(b.title, 'ja'));
    // ジャンル：アルバム単位でまとめる（アルバムの最初の曲のジャンル）
    const gmap = new Map();
    for (const a of S.albums) {
      a.genre = a.tracks[0].genre || '不明なジャンル';
      if (!gmap.has(a.genre)) gmap.set(a.genre, { name: a.genre, albums: [] });
      gmap.get(a.genre).albums.push(a);
    }
    for (const a of S.albums) if (!a.artUrl) requestCover(a);
    S.genres = [...gmap.values()].sort((a, b) => (a.name === '不明なジャンル') - (b.name === '不明なジャンル') || a.name.localeCompare(b.name, 'ja'));
    S.tracks.sort((a, b) => {
      const A = S.albumMap.get(albumKeyOf(a)), B = S.albumMap.get(albumKeyOf(b));
      return S.albums.indexOf(A) - S.albums.indexOf(B) || A.tracks.indexOf(a) - B.tracks.indexOf(b);
    });
  }

  async function importFiles(fileList) {
    const files = [...fileList];
    const audio = files.filter((f) => MP.metadata.isAudio(f.name));
    if (!audio.length) { toast('音楽ファイルが見つかりませんでした'); return; }
    // フォルダー内のジャケット画像（cover.jpg / folder.jpg など）
    const covers = new Map();
    for (const f of files) {
      if (!MP.metadata.isImage(f.name)) continue;
      const path = f.webkitRelativePath || f.name;
      const dir = path.split('/').slice(0, -1).join('/');
      const base = f.name.toLowerCase();
      const score = /^(cover|folder|front)\./.test(base) ? 2 : /cover|front|folder|album/.test(base) ? 1 : 0;
      const cur = covers.get(dir);
      if (!cur || score > cur.score) covers.set(dir, { file: f, score });
    }
    const coverUrls = new Map();
    const coverFor = (dir) => {
      if (!covers.has(dir)) return null;
      if (!coverUrls.has(dir)) coverUrls.set(dir, URL.createObjectURL(covers.get(dir).file));
      return coverUrls.get(dir);
    };

    const out = [];
    let done = 0;
    const queue = [...audio];
    const worker = async () => {
      while (queue.length) {
        const f = queue.shift();
        const meta = await MP.metadata.parse(f);
        meta.file = f;
        meta.artUrl = meta.picture ? URL.createObjectURL(meta.picture) : coverFor(meta.dir);
        delete meta.picture;
        out.push(meta);
        done++;
        if (done % 10 === 0 || done === audio.length) toast(`読み込み中… ${done} / ${audio.length}`, 0);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    addTracks(out);
    toast(`${out.length} 曲を追加しました`);
    render();
  }

  function addDemo() {
    addTracks(MP.demoTracks.create());
    toast('デモアルバムを 5 枚追加しました');
    render();
  }

  // ---------- 再生 ----------
  function playList(list, index) {
    S.baseQueue = list.slice();
    let queue = list.slice();
    if (S.shuffle) {
      const first = queue.splice(index, 1)[0];
      shuffleInPlace(queue);
      queue.unshift(first);
      index = 0;
    }
    engine.play(queue, index, 0);
  }

  function shuffleInPlace(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function toggleShuffle() {
    S.shuffle = !S.shuffle;
    const cur = engine.queue[engine.index];
    if (cur) {
      if (S.shuffle) {
        const rest = engine.queue.filter((t) => t !== cur);
        engine.setQueue([cur, ...shuffleInPlace(rest)], 0);
      } else {
        const base = S.baseQueue.length ? S.baseQueue : engine.queue;
        engine.setQueue(base, Math.max(0, base.indexOf(cur)));
      }
    }
    updateNow();
  }

  function toggleRepeat() {
    S.repeat = !S.repeat;
    engine.repeat = S.repeat;
    engine.reschedule();
    updateNow();
  }

  // ---------- 描画：ナビ ----------
  function renderNav() {
    for (const group of $$('[data-navgroup]')) {
      group.innerHTML = NAV.map((n) => `<button data-nav="${n.id}" ${S.view === n.id || (n.id === 'albums' && S.view === 'album') || (n.id === 'genres' && S.view === 'genre') || (n.id === 'tools' && S.view === 'tool') ? 'aria-current="page"' : ''}>${icon(n.icon)}<span>${n.label}</span></button>`).join('');
    }
  }

  function render() {
    renderNav();
    const v = $('#view');
    const fn = VIEWS[S.view] || VIEWS.albums;
    v.innerHTML = fn();
    if (AFTER[S.view]) AFTER[S.view]();
  }

  function go(view, extra = {}) {
    if (S.test && !(view === 'tool' && (extra.toolId || S.toolId) === 'hearing')) { S.test.close(); S.test = null; }
    Object.assign(S, { view }, extra);
    render();
    $('#view').scrollTop = 0;
  }

  const drBadge = (dr, label = 'DR', size = '') => `<span class="drb dr-${MP.inspect.drLevel(dr)} ${size}" title="${label}">DR${dr}</span>`;
  const pad3 = (n) => String(n).padStart(3, '0');
  const head = (tag, title, extra = '') => `
    <div class="page-head">
      <span><span class="tag">${esc(tag.replace(/ \/ /g, ' · '))}</span></span>
      <div class="row-top"><h1>${esc(title)}</h1>${extra}</div>
    </div>`;
  const albumGrid = (albums) => `
    <div class="albums">
      ${albums.map((a) => `
        <button class="album-card" data-album="${esc(a.key)}">
          <span class="cover">${artHtml(a)}</span>
          <div class="t">${esc(a.title)}</div>
          <div class="a">${esc(a.artist)}</div>
        </button>`).join('')}
    </div>`;

  const libraryActions = () => `
    <div class="actions">
      <button class="btn press primary" data-action="pick-dir">${icon('folder')}フォルダーを読み込む</button>
      <button class="btn press" data-action="pick-files">${icon('plus')}ファイルを追加</button>
      <button class="btn press" data-action="demo">${icon('spark')}デモ音源</button>
    </div>`;

  const emptyLibrary = () => `
    <div class="empty">
      <h2>ライブラリは空です</h2>
      <p>SD カードの音楽フォルダーを選ぶと、タグを読み取ってアルバムごとに並べます。<br>
      音源が手元に無い場合は「デモ音源」で、ギャップレスとスマートクロスフェードを試せます。</p>
      ${libraryActions()}
    </div>`;

  // ---------- 描画：各画面 ----------
  const VIEWS = {
    albums() {
      if (!S.albums.length) return `${head('LIBRARY / EMPTY', 'ライブラリ')}${emptyLibrary()}`;
      return `
        ${head(`LIBRARY / ${pad3(S.albums.length)} ALBUMS / ${pad3(S.tracks.length)} TRACKS`, 'ライブラリ', libraryActions())}
        ${albumGrid(S.albums)}`;
    },

    genres() {
      if (!S.genres.length) return `${head('GENRES / EMPTY', 'ジャンル')}${emptyLibrary()}`;
      return `
        ${head(`GENRES / ${pad3(S.genres.length)}`, 'ジャンル')}
        <div class="genres">
          ${S.genres.map((g) => {
            const arts = [...new Set(g.albums.map((a) => a.artUrl).filter(Boolean))].slice(0, 4);
            const thumb = arts.length >= 4
              ? `<span class="genre-thumb">${arts.map((u) => `<img class="art" src="${esc(u)}" alt="" loading="lazy">`).join('')}</span>`
              : `<span class="genre-thumb single">${arts.length ? `<img class="art" src="${esc(arts[0])}" alt="" loading="lazy">` : `<span class="art art-ph">${esc(g.name.trim()[0] || '♪')}</span>`}</span>`;
            const n = g.albums.reduce((s, a) => s + a.tracks.length, 0);
            return `
              <button class="genre-card press" data-genre="${esc(g.name)}">
                ${thumb}
                <span class="genre-name"><strong>${esc(g.name)}</strong><span>${g.albums.length} ALBUMS / ${n} TRACKS</span></span>
              </button>`;
          }).join('')}
        </div>`;
    },

    genre() {
      const g = S.genres.find((x) => x.name === S.genreName);
      if (!g) return VIEWS.genres();
      const n = g.albums.reduce((s, a) => s + a.tracks.length, 0);
      return `
        <button class="back press" data-nav="genres">${icon('back')}ジャンル</button>
        ${head(`GENRE / ${g.albums.length} ALBUMS / ${n} TRACKS`, g.name, `
          <div class="actions">
            <button class="btn press primary" data-action="play-genre">${icon('play')}すべて再生</button>
            <button class="btn press" data-action="shuffle-genre">${icon('shuffle')}シャッフル</button>
          </div>`)}
        ${albumGrid(g.albums)}`;
    },

    album() {
      const a = S.albumMap.get(S.albumKey);
      if (!a) return VIEWS.albums();
      const total = a.tracks.reduce((s, t) => s + (t.duration || 0), 0);
      const formats = [...new Set(a.tracks.map(fmtFormat))];
      const cur = engine.queue[engine.index];
      const res = a.tracks.map((t) => MP.insights.get(t));
      const done = res.filter(Boolean);
      const albumDr = done.length === a.tracks.length ? Math.round(done.reduce((x, r) => x + r.dr, 0) / done.length) : null;
      const warns = a.tracks.map((t, i) => ({ t, r: res[i] })).filter((x) => x.r && x.r.native && x.r.verdict && x.r.verdict.level === 'warn');
      return `
        <button class="back press" data-nav="albums">${icon('back')}ライブラリ</button>
        <div class="album-hero">
          <span class="cover">${artHtml(a)}</span>
          <div>
            <span class="tag">ALBUM${a.genre ? ' / ' + esc(a.genre) : ''}</span>
            <h1 style="margin-top:10px">${esc(a.title)}</h1>
            <div class="artist">${esc(a.artist)}</div>
            <div class="meta">
              ${a.year ? `<span>${esc(a.year)}</span>・` : ''}<span>${a.tracks.length} 曲</span>・<span>${Math.round(total / 60)} 分</span>
              ${formats.slice(0, 2).map((f) => `<span class="fmt">${esc(f)}</span>`).join('')}
              ${albumDr != null ? drBadge(albumDr, 'アルバムの DR') : ''}
            </div>
            <div class="actions">
              <button class="btn press primary" data-action="play-album">${icon('play')}再生</button>
              <button class="btn press" data-action="shuffle-album">${icon('shuffle')}シャッフル</button>
              ${done.length < a.tracks.length || done.some((r) => !r.native) ? `<button class="btn press" data-action="analyze-album">${icon('spark')}アルバムを解析</button>` : ''}
            </div>
          </div>
        </div>
        <ol class="tracks">
          ${a.tracks.map((t, i) => `
            <li><button class="row ${cur === t ? 'playing' : ''}" data-play-album-index="${i}">
              <span class="num">${t.track ?? i + 1}</span>
              <span class="main">
                <div class="title">${esc(t.title)}</div>
                ${t.artist !== a.artist ? `<div class="sub">${esc(t.artist)}</div>` : ''}
              </span>
              <span class="dur">${res[i] ? drBadge(res[i].dr, 'DR', 'sm') + ' ' : ''}${fmtTime(t.duration)}</span>
            </button></li>`).join('')}
        </ol>
        ${done.length ? `
          <div class="card album-analysis">
            <div class="card-head"><span>解析結果</span>${albumDr != null ? drBadge(albumDr, 'アルバムの DR') : `<span class="note" style="margin:0">${done.length} / ${a.tracks.length} 曲</span>`}</div>
            ${warns.length ? warns.map(({ t, r }) => `
              <div class="verdict warn"><span><strong>${esc(t.title)}</strong>：${esc(r.verdict.text)}</span>${r.verdict.notes.map((n) => `<small>${esc(n)}</small>`).join('')}</div>`).join('')
              : `<div class="verdict ok"><span>高域の判定で気になる曲はありません${done.some((r) => !r.native) ? '（一部の曲は未判定）' : ''}</span></div>`}
            <p class="note">DR はダイナミックレンジ（音の強弱の幅）。14 以上は豊か、8〜13 は普通、7 以下は音圧を上げるために強く圧縮された音源です。</p>
          </div>` : ''}`;
    },

    songs() {
      if (!S.tracks.length) return `${head('TRACKS / EMPTY', '曲')}${emptyLibrary()}`;
      return `
        ${head(`TRACKS / ${pad3(S.tracks.length)}`, '曲')}
        <input class="search" type="search" placeholder="曲名・アーティスト・アルバムで検索" value="${esc(S.search)}" data-search>
        <ol class="tracks" data-songlist>${songRows()}</ol>`;
    },

    settings() {
      const s = engine.s;
      const sw = (id, label, note, checked, attr) => `
        <label class="switch"><span class="label">${label}<small>${note}</small></span>
          <input type="checkbox" role="switch" id="${id}" ${attr} ${checked ? 'checked' : ''}></label>`;
      return `
        ${head('SETTINGS', '設定')}
        <p class="muted">有効にしたツールは「ツール」に並びます。細かい調整は各ツールの中で行います。</p>
        <h2>ツール</h2>
        <div class="card">
          ${TOOLS.map((t) => sw(`tool-${t.id}`, t.name + (t.audio ? ' <span class="fmt">音を変える</span>' : ''), esc(t.desc) + (t.needs ? `（${esc(TOOLS.find((x) => x.id === t.needs).name)}を使います）` : ''), S.tools[t.id], `data-tool-toggle="${t.id}"`)).join('')}
        </div>
        <h2>再生</h2>
        <div class="card">
          ${sw('levelMatch', '音量差をなめらかにする', 'スマートクロスフェード時、次の曲の音量を前の曲に合わせ、6 秒かけて元に戻します（最大 ±6dB）', s.levelMatch, 'data-setting="levelMatch"')}
          ${sw('albumGapless', '同じアルバムの連続トラックはギャップレス', 'スマートクロスフェード中も、アルバムの流れを壊さないようクロスフェードしません', s.albumGapless, 'data-setting="albumGapless"')}
          ${sw('rg-clip', 'ReplayGain の音割れを防ぐ', '持ち上げる場合も、ピークが 0dBFS を超えない量までにします', s.rgPreventClip, 'data-setting="rgPreventClip"')}
        </div>
        <h2>表示</h2>
        <div class="card">
          ${sw('spin', 'レコードを回す', '再生中にジャケットのレコードを回します。端末の「動きを減らす」設定がオンでも回ります', S.spin, 'data-spin-toggle')}
          ${sw('vu', 'VU メーターを表示', '再生画面に左右のアナログ VU メーターを出します（信号をのぞくだけで、音には手を加えません）', S.vu, 'data-vu-toggle')}
        </div>
        <h2>出力</h2>
        <div class="card">
          ${sw('followRate', '出力サンプルレートを音源に合わせる', '再生開始時に、音源と同じレートで出力を開き直します（ブラウザが対応している範囲で）', s.followRate, 'data-setting="followRate"')}
        </div>`;
    },

    tools() {
      const on = TOOLS.filter((t) => S.tools[t.id]);
      return `
        ${head(`TOOLS / ${pad3(on.length)}`, 'ツール')}
        ${on.length ? `
          <div class="tools">
            ${on.map((t) => `
              <button class="tool-card press" data-tool="${t.id}">
                <span class="tool-icon">${icon(t.icon)}</span>
                <strong>${esc(t.name)}</strong>
                <small>${esc(toolStatus(t.id))}</small>
              </button>`).join('')}
          </div>` : `
          <div class="empty">
            <h2>有効なツールがありません</h2>
            <p>設定でツールを有効にすると、ここに並びます。</p>
            <div class="actions"><button class="btn press primary" data-nav="settings">設定を開く</button></div>
          </div>`}
        <h2>Web デモについて</h2>
        <div class="card">
          <p style="margin-top:0">これは M8T 向け Android アプリの画面と機能の試作です。ブラウザでは次の限界があります。</p>
          <ul class="muted" style="margin:0;padding-left:1.2em">
            <li>出力は OS のミキサーを通るため、ビットパーフェクトにはなりません。</li>
            <li>ALAC と DSD の再生はブラウザ次第です（Chrome は非対応）。</li>
            <li>再読み込みするとライブラリが消えます。</li>
          </ul>
        </div>`;
    },

    tool() {
      const fn = TOOL_VIEWS[S.toolId];
      if (!fn || !S.tools[S.toolId]) return VIEWS.tools();
      return fn();
    },
  };

  // ---------- ツールの画面 ----------
  const toolHead = (tag, title) => `
    <button class="back press" data-nav="tools">${icon('back')}ツール</button>
    ${head(tag, title)}`;

  // 音を変えるツールの「一時的にオフ」
  const bypassCard = (id, name, sub = '') => `
    <div class="card">
      <label class="switch"><span class="label">一時的にオフにする<small>${sub ? sub + '。' : ''}元の音と聴き比べるときに使います。${esc(name)}を使わない場合は、設定で無効にしてください</small></span>
        <input type="checkbox" role="switch" id="bypass-${id}" data-bypass="${id}" ${S.bypass[id] ? 'checked' : ''}></label>
    </div>`;

  const needGear = (what) => `
    <div class="empty">
      <h2>機材プロファイルが必要です</h2>
      <p>${what}には、使っている端子・出力モード・ゲインと、イヤホンの感度が必要です。</p>
      <div class="actions">
        ${S.tools.gear ? '<button class="btn press primary" data-tool="gear">機材プロファイルを開く</button>' : '<button class="btn press primary" data-nav="settings">設定で機材プロファイルを有効にする</button>'}
      </div>
    </div>`;

  function toolStatus(id) {
    const g = activeGear();
    switch (id) {
      case 'nonstop': return S.nsMode === 'crossfade' ? 'スマートクロスフェード' : 'ギャップレス';
      case 'theme': return (MP.skins.LIST.find((k) => k.id === S.skin) || {}).name || '';
      case 'eq': return S.bypass.eq ? '一時的にオフ' : `オン ・ プリアンプ ${engine.preampDb.toFixed(1)}dB`;
      case 'hearing': { const p = S.profiles.find((x) => x.id === S.activeProfile); return !p ? 'プロファイルなし' : S.bypass.hearing ? '一時的にオフ' : p.name; }
      case 'rg': return S.bypass.rg ? '一時的にオフ' : S.rgMode === 'album' ? 'アルバム単位' : 'トラック単位';
      case 'gear': return g ? `${g.name}（${MP.gear.describe(g)}）` : '未登録';
      case 'gaincalc': {
        if (!g) return '機材プロファイルが必要です';
        const r = MP.gear.recommend(g, S.listenDb);
        return r.pick ? `おすすめ：${MP.gear.GAINS[r.pick]}ゲイン` : 'イヤホンの感度を入れてください';
      }
      case 'safety': return splOffset() == null ? '機材プロファイルが必要です' : `今週 ${Math.round(MP.gear.weekPercent())}%`;
    }
    return '';
  }

  const TOOL_VIEWS = {
    nonstop() {
      const s = engine.s;
      return `
        ${toolHead('NONSTOP', 'ノンストップ')}
        <div class="mode-cards" role="radiogroup">
          <button class="mode-card press" role="radio" aria-checked="${S.nsMode === 'gapless'}" data-action="mode" data-mode="gapless">
            <strong>ギャップレス</strong>
            <span>曲の継ぎ目に無音をはさまず、そのままつなぎます。音には一切手を加えません。ライブ盤やクラシック、コンセプトアルバム向け。</span>
          </button>
          <button class="mode-card press" role="radio" aria-checked="${S.nsMode === 'crossfade'}" data-action="mode" data-mode="crossfade">
            <strong>スマートクロスフェード</strong>
            <span>曲の頭と終わりの無音を飛ばし、フェードアウトを検出して長さを合わせ、等パワーカーブで重ねます。シャッフルやプレイリスト向け。</span>
          </button>
        </div>
        <div class="card">
          <div class="slider-row">
            <label for="xf">クロスフェードの長さ（基準）</label><output data-xf-out>${s.crossfadeSec} 秒</output>
            <input id="xf" type="range" min="2" max="12" step="1" value="${s.crossfadeSec}" data-xf>
          </div>
          <p class="note" style="margin-top:0">曲にフェードアウトがある場合は、その長さに合わせて自動で調整します。音量差の補正と、同じアルバムでのギャップレスは設定で切り替えられます。</p>
        </div>`;
    },

    theme() {
      return `
        ${toolHead('THEME', 'テーマ')}
        <div class="skins" role="radiogroup" aria-label="テーマ">
          ${MP.skins.LIST.map((k) => `
            <button class="skin press" role="radio" aria-checked="${S.skin === k.id}" data-skin-pick="${k.id}">
              <span class="skin-swatch" aria-hidden="true">${k.swatch.map((c) => `<i style="background:${c}"></i>`).join('')}</span>
              <strong>${esc(k.name)}</strong>
              <small>${esc(k.desc)}</small>
            </button>`).join('')}
        </div>`;
    },

    rg() {
      return `
        ${toolHead('REPLAYGAIN / -18 LUFS', 'ReplayGain')}
        ${bypassCard('rg', 'ReplayGain')}
        <div class="card">
          <div class="seg" role="radiogroup" aria-label="ReplayGain の単位">
            ${[['track', 'トラック単位'], ['album', 'アルバム単位']].map(([v, l]) => `<button role="radio" aria-checked="${S.rgMode === v}" data-rg="${v}">${l}</button>`).join('')}
          </div>
          <p class="note">曲やアルバムごとの音量差を、音量の調整だけでそろえます（音の強弱は圧縮しません）。基準は -18 LUFS。タグに ReplayGain があればそれを使い、無ければ再生前に解析して求めます。アルバム単位は、アルバムの全曲を解析済みのときに使えます（アルバム画面の「アルバムを解析」）。</p>
        </div>`;
    },

    gear() {
      const edit = S.gearEdit ? S.gears.find((g) => g.id === S.gearEdit) || null : null;
      const f = edit || { name: '', port: '4.4', mode: 'transistor', gain: 'low', phone: { name: '', sens: '', sensUnit: 'mW', imp: '' }, hearingId: '' };
      const opt = (map, cur) => Object.entries(map).map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${v}</option>`).join('');
      return `
        ${toolHead('GEAR / M8T', '機材プロファイル')}
        <p class="muted">使っている端子・出力モード・ゲインと、イヤホン・ヘッドホンの組み合わせを保存します。切り替えると、結び付けた聴力補正プロファイルも切り替わります。ゲインの目安と聴覚保護メーターは、ここの値を使います。</p>
        <div class="card">
          <div class="card-head"><span>プロファイル</span></div>
          ${S.gears.length ? S.gears.map((g) => `
            <div class="profile">
              <input type="radio" name="gear" id="gear-${g.id}" data-gear="${g.id}" ${g.id === S.activeGear ? 'checked' : ''} aria-label="${esc(g.name)} を使う">
              <span class="name">${esc(g.name)}<small>${esc(MP.gear.describe(g))}${g.phone.sens !== '' && g.phone.sens != null ? ` ・ ${esc(g.phone.name || 'イヤホン')} ${g.phone.sens}dB/${g.phone.sensUnit}${g.phone.imp ? ` ・ ${g.phone.imp}Ω` : ''}` : ' ・ 感度未入力'}</small></span>
              <button class="btn press" data-edit-gear="${g.id}">編集</button>
              <button class="btn press" data-delete-gear="${g.id}">削除</button>
            </div>`).join('') : '<p class="muted" style="margin:0">まだありません。下のフォームで追加してください。</p>'}
        </div>
        <h2>${edit ? '編集' : '追加'}</h2>
        <form class="card gear-form" data-gear-form>
          <div class="form-grid">
            <label>名前<input id="g-name" required value="${esc(f.name)}" placeholder="例：普段使い（4.4mm・三極管）"></label>
            <label>端子<select id="g-port">${opt(MP.gear.PORTS, f.port)}</select></label>
            <label>出力モード<select id="g-mode">${opt(MP.gear.MODES, f.mode)}</select></label>
            <label>ゲイン<select id="g-gain">${opt({ low: '低', mid: '中', high: '高' }, f.gain)}</select></label>
            <label>イヤホン・ヘッドホン<input id="g-phone" value="${esc(f.phone.name)}" placeholder="機種名"></label>
            <label>感度<span class="with-unit"><input id="g-sens" type="number" step="0.1" inputmode="decimal" value="${esc(f.phone.sens)}" placeholder="例：108"><select id="g-unit">${opt({ mW: 'dB/mW', V: 'dB/V' }, f.phone.sensUnit)}</select></span></label>
            <label>インピーダンス（Ω）<input id="g-imp" type="number" step="0.1" inputmode="decimal" value="${esc(f.phone.imp)}" placeholder="例：32"></label>
            <label>聴力補正プロファイル<select id="g-hearing"><option value="">結び付けない</option>${S.profiles.map((p) => `<option value="${p.id}" ${p.id === f.hearingId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
          </div>
          <p class="note">感度とインピーダンスは、イヤホンの仕様表の値を入れてください（dB/mW の場合はインピーダンスも必要です）。</p>
          <div class="actions" style="margin-top:12px">
            <button class="btn press primary" type="submit">${edit ? '保存' : '追加して使う'}</button>
            ${edit ? '<button class="btn press" type="button" data-action="cancel-gear">やめる</button>' : ''}
          </div>
        </form>
        <h2>本体の音量</h2>
        <div class="card">
          <div class="slider-row">
            <label for="hw-vol">M8T の音量表示</label><output data-hw-out>${S.hw.vol} / ${S.hw.max}（最大から −${hwAtten().toFixed(1)}dB）</output>
            <input id="hw-vol" type="range" min="0" max="${S.hw.max}" value="${S.hw.vol}" data-hw-vol>
          </div>
          <div class="form-grid">
            <label>音量表示の最大<input id="hw-max" type="number" min="10" max="200" value="${S.hw.max}" data-hw-max></label>
            <label>1 目盛りの変化（dB）<input id="hw-step" type="number" min="0.1" max="3" step="0.1" value="${S.hw.step}" data-hw-step></label>
          </div>
          <p class="note">本体の音量はアプリから読み取れないため、表示に合わせて入れてください。1 目盛りあたりの変化量は仮の値です。Android 版では自動で読み取る予定です。</p>
        </div>`;
    },

    gaincalc() {
      const g = activeGear();
      if (!g) return toolHead('GAIN', 'ゲインの目安') + needGear('ゲインの目安');
      const r = MP.gear.recommend(g, S.listenDb);
      if (!r.pick) return toolHead('GAIN', 'ゲインの目安') + needGear('ゲインの目安');
      const f1 = (v) => (v == null ? '—' : v.toFixed(1));
      return `
        ${toolHead('GAIN / ' + MP.gear.PORTS[g.port], 'ゲインの目安')}
        <p class="muted">${esc(g.name)}：${esc(MP.gear.describe(g))} ・ ${esc(g.phone.name || 'イヤホン')}（${g.phone.sens}dB/${g.phone.sensUnit}${g.phone.imp ? `・${g.phone.imp}Ω` : ''}）</p>
        <div class="card">
          <div class="slider-row">
            <label for="listen">ふだん聴く音量</label><output data-listen-out>${S.listenDb} dB SPL</output>
            <input id="listen" type="range" min="65" max="95" value="${S.listenDb}" data-listen>
          </div>
          <p class="note" style="margin-top:0">必要な最大音圧 = ふだんの音量 + 曲のピークの余裕 20dB + 音量つまみの余裕 6dB = <strong>${r.need} dB SPL</strong></p>
        </div>
        <div class="card">
          <div class="card-head"><span>おすすめ：${MP.gear.GAINS[r.pick]}ゲイン</span>${g.gain === r.pick ? '<span class="badge pure">いまの設定</span>' : `<button class="btn press" data-set-gain="${r.pick}">このゲインにする</button>`}</div>
          ${r.short ? '<div class="warning">高ゲインでも、必要な音量に届かない可能性があります。</div>' : ''}
          <div class="table-wrap"><table class="gtable">
            <thead><tr><th>ゲイン</th><th>出力電圧</th><th>最大音圧</th><th>ノイズ（推定）</th><th>サーッという音</th></tr></thead>
            <tbody>
              ${r.rows.map((row) => { const h = MP.gear.hissLevel(row.noiseSpl); return `
                <tr class="${row.gain === r.pick ? 'pick' : ''}">
                  <th>${MP.gear.GAINS[row.gain]}${row.gain === g.gain ? ' ・ いま' : ''}</th>
                  <td>${row.v.toFixed(2)}V${row.estimated ? '*' : ''}</td>
                  <td>${f1(row.maxSpl)} dB</td>
                  <td>${f1(row.noiseSpl)} dB</td>
                  <td><span class="dotlabel ${h.level}">${h.text}</span></td>
                </tr>`; }).join('')}
            </tbody>
          </table></div>
          <p class="note">最大音圧は、フルスケールの音を本体の音量最大で鳴らしたときの推定です。ノイズは公表の S/N（${MP.gear.snr(g.port, g.mode)}dB）から計算した推定です。「ごく静かなら」は、ごく静かな部屋で耳を澄ますと聞こえる可能性がある程度（ノイズが 0〜10 dB SPL）。ふつうの静かな部屋の環境音は 20〜30 dB SPL 程度です。${r.rows.some((x) => x.estimated) ? '* 真空管モードの低・中ゲインは公表値が無いため、トランジスタモードと同じ比率で推定しています。' : ''}</p>
        </div>`;
    },

    safety() {
      const off = splOffset();
      if (off == null) return toolHead('SAFE LISTENING', '聴覚保護メーター') + needGear('聴覚保護メーター');
      const week = MP.gear.weekPercent(), day = MP.gear.todayPercent();
      return `
        ${toolHead('SAFE LISTENING / WHO', '聴覚保護メーター')}
        <div class="card">
          <div class="card-head"><span>いま耳に届いている音（推定）</span><span class="note" style="margin:0">${esc(activeGear().name)}</span></div>
          <div class="big-meter"><strong data-safety-now>—</strong><span>dB SPL</span></div>
          <p class="note" data-safety-hint>再生中に表示します。</p>
        </div>
        <div class="card">
          <div class="card-head"><span>聴いた量（WHO の目安：80dB で週 40 時間まで）</span></div>
          <div class="dose"><span>今日</span><div class="progress"><span data-dose-day style="width:${Math.min(100, day)}%"></span></div><output data-dose-day-out>${day.toFixed(1)}%</output></div>
          <div class="dose"><span>直近 7 日</span><div class="progress"><span data-dose-week style="width:${Math.min(100, week)}%"></span></div><output data-dose-week-out>${week.toFixed(1)}%</output></div>
          <p class="note">音が 3dB 大きくなると、同じ量に達するまでの時間は半分になります（85dB なら週 12.5 時間、90dB なら週 4 時間）。</p>
        </div>
        <p class="note">推定の前提：機材プロファイルの端子・出力モード・ゲインとイヤホンの感度、本体の音量（${S.hw.vol} / ${S.hw.max}、−${hwAtten().toFixed(1)}dB）。耳の形や装着具合でも数 dB 変わるため、目安として使ってください。医療用の測定ではありません。</p>`;
    },
  };
  TOOL_VIEWS.eq = (function () {
    const VIEWS_EQ = {
    eq() {
      return `
        ${toolHead('PARAMETRIC EQ / 32-BIT FLOAT', 'EQ')}
        ${bypassCard('eq', 'EQ')}
        <div class="card">
          <canvas class="eq-graph" data-eq-graph></canvas>
          <div class="legend">
            <span><i style="background:var(--accent)"></i>合成特性</span>
            <span data-preamp></span>
          </div>
        </div>
        <h2>プリセット</h2>
        <div class="chips">
          ${MP.eq.PRESETS.map((p) => `<button class="chip press" data-preset="${p.id}" aria-pressed="${S.eqPreset === p.id}">${esc(p.name)}</button>`).join('')}
          ${S.eqPreset === 'custom' ? '<button class="chip press" aria-pressed="true">カスタム</button>' : ''}
          ${S.eqPreset === 'autoeq' ? '<button class="chip press" aria-pressed="true">AutoEQ</button>' : ''}
        </div>
        <h2>バンド</h2>
        <div class="card bands" data-bands>${bandRows()}</div>
        <h2>AutoEQ を読み込む</h2>
        <div class="card">
          <p class="note" style="margin-top:0">AutoEQ の <code>ParametricEQ.txt</code> の内容を貼り付けてください。お使いのイヤホン・ヘッドホン向けの補正カーブを適用できます。</p>
          <textarea data-autoeq placeholder="Preamp: -6.2 dB&#10;Filter 1: ON LSC Fc 105 Hz Gain 5.5 dB Q 0.70&#10;Filter 2: ON PK Fc 3000 Hz Gain -2.1 dB Q 1.41"></textarea>
          <div class="actions" style="margin-top:10px"><button class="btn press" data-action="import-autoeq">読み込む</button></div>
        </div>
        <p class="note">プリアンプは、ブーストした分だけ自動で音量を下げて音割れを防ぎます。処理は 32bit 浮動小数点です。</p>`;
    },

    };
    return VIEWS_EQ.eq;
  })();
  TOOL_VIEWS.hearing = (function () {
    const VIEWS_H = {
    hearing() {
      if (S.test) return testView();
      const active = S.profiles.find((p) => p.id === S.activeProfile);
      return `
        ${toolHead('HEARING / NOT A MEDICAL TEST', '聴力補正')}
        <p class="muted">左右の耳それぞれで、周波数ごとに聞こえる最小の音量を測り、聞こえにくい帯域だけを少し持ち上げる補正カーブを作ります。</p>
        <div class="warning">医療用の検査ではありません。耳に違和感がある場合は専門医に相談してください。テスト音は小さい音から始まります。</div>
        ${active ? bypassCard('hearing', '聴力補正', esc(active.name)) : '<div class="warning">プロファイルがまだありません。下のテストを受けると作成され、補正がかかります。</div>'}
        ${calibrationCard()}
        ${active && active.absolute ? audiogramCard(active) : ''}
        ${active ? `
          <div class="card">
            <div class="card-head"><span>補正カーブ</span></div>
            <canvas class="eq-graph" data-hearing-graph></canvas>
            <div class="legend">
              <span><i style="background:var(--info)"></i>左耳</span>
              <span><i style="background:var(--danger)"></i>右耳</span>
            </div>
            <div class="slider-row">
              <label for="h-strength">補正の強さ</label><output data-strength-out>${Math.round(active.strength * 100)}%</output>
              <input id="h-strength" type="range" min="0" max="100" value="${Math.round(active.strength * 100)}" data-h-strength>
            </div>
            <div class="slider-row">
              <label for="h-max">最大ブースト</label><output data-max-out>${active.maxBoost}dB</output>
              <input id="h-max" type="range" min="2" max="15" value="${active.maxBoost}" data-h-max>
            </div>
          </div>` : ''}
        <h2>プロファイル</h2>
        <div class="card">
          ${S.profiles.length ? S.profiles.map((p) => `
            <div class="profile">
              <input type="radio" name="profile" data-profile="${p.id}" ${p.id === S.activeProfile ? 'checked' : ''} aria-label="${esc(p.name)} を使う">
              <span class="name">${esc(p.name)}<small>${new Date(p.createdAt).toLocaleDateString('ja-JP')} ・ ${Object.keys(p.thresholds.L).length} 周波数 ・ ${p.absolute ? '絶対値（dB SPL）' : '相対値'}</small></span>
              <button class="btn press" data-delete-profile="${p.id}">削除</button>
            </div>`).join('') : '<p class="muted" style="margin:0">まだありません。テストを受けると作成されます。</p>'}
        </div>
        <p class="note">イヤホン・ヘッドホンと、M8T の出力モード（トランジスタ / 三極管 / ウルトラリニア）の組み合わせごとにプロファイルを作るのがおすすめです。</p>
        <div class="actions" style="margin-top:14px">
          <button class="btn press primary" data-action="start-test" data-test-kind="quick">クイックテスト（5 周波数）</button>
          <button class="btn press" data-action="start-test" data-test-kind="full">詳細テスト（9 周波数）</button>
        </div>`;
    },

    };
    return VIEWS_H.hearing;
  })();

  const AFTER = {
    tool() {
      if (S.toolId === 'eq') drawEq();
      if (S.toolId === 'hearing' && !S.test) drawHearing();
      if (S.toolId === 'safety') updateSafetyView();
    },
  };

  function songRows() {
    const q = S.search.trim().toLowerCase();
    const list = q ? S.tracks.filter((t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q)) : S.tracks;
    const cur = engine.queue[engine.index];
    return list.slice(0, 2000).map((t) => `
      <li><button class="row thumb ${cur === t ? 'playing' : ''}" data-play-track="${t.id}">
        ${artHtml(S.albumMap.get(albumKeyOf(t)))}
        <span class="main"><div class="title">${esc(t.title)}</div><div class="sub">${esc(t.artist)} ・ ${esc(t.album)}</div></span>
        <span class="dur">${fmtTime(t.duration)}</span>
      </button></li>`).join('') || '<li class="muted" style="padding:12px 0">見つかりませんでした</li>';
  }

  // ---------- EQ ----------
  function bandRows() {
    return engine.s.eqBands.map((b, i) => `
      <div class="band" data-band="${i}">
        <span class="freq">${fmtHz(b.freq)}</span>
        <input type="range" min="-12" max="12" step="0.5" value="${b.gain}" data-band-gain aria-label="${fmtHz(b.freq)} のゲイン">
        <span class="val" data-band-val>${b.gain > 0 ? '+' : ''}${b.gain.toFixed(1)}dB</span>
        <div class="detail">
          <select data-band-type aria-label="種類">${Object.entries(MP.eq.TYPES).map(([k, v]) => `<option value="${k}" ${b.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <label>周波数 <input type="number" min="20" max="20000" step="1" value="${Math.round(b.freq)}" data-band-freq></label>
          <label>Q <input type="number" min="0.1" max="10" step="0.05" value="${b.q}" data-band-q></label>
        </div>
      </div>`).join('');
  }

  const graphFreqs = MP.eq.logFreqs(240);
  function drawEq() {
    const c = $('[data-eq-graph]');
    if (!c) return;
    const data = MP.eq.responseDb(engine.s.eqBands, graphFreqs);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    MP.eq.draw(c, [{ data, color: accent, width: 2.5 }], {
      freqs: graphFreqs,
      points: engine.s.eqBands.filter((b) => b.enabled).map((b) => ({ freq: b.freq, gain: b.gain, color: accent })),
    });
    const pre = MP.eq.autoPreamp([data]);
    const el = $('[data-preamp]');
    if (el) el.textContent = pre < 0 ? `自動プリアンプ ${pre.toFixed(1)}dB` : 'プリアンプ 0dB';
  }

  function setBands(bands, presetId) {
    S.eqPreset = presetId;
    store.set('eqPreset', presetId);
    engine.update({ eqBands: bands });
    saveSettings();
  }

  // ---------- 聴力テスト ----------
  function drawHearing() {
    const c = $('[data-hearing-graph]');
    const p = S.profiles.find((x) => x.id === S.activeProfile);
    if (!c || !p) return;
    const css = getComputedStyle(document.documentElement);
    const toBands = (ear) => p[ear].map((x) => ({ type: 'peaking', freq: x.freq, gain: x.gain, q: 1.4, enabled: true }));
    MP.eq.draw(c, [
      { data: MP.eq.responseDb(toBands('L'), graphFreqs), color: css.getPropertyValue('--info').trim() },
      { data: MP.eq.responseDb(toBands('R'), graphFreqs), color: css.getPropertyValue('--danger').trim(), dash: [6, 4] },
    ], { freqs: graphFreqs, range: 15 });
  }

  // 絶対値（dB SPL）で測れるかの表示
  function calibrationCard() {
    const off = splOffset();
    const g = activeGear();
    if (off != null) {
      return `<div class="card"><div class="verdict ok"><span><strong>絶対値（dB SPL）で測れます</strong>：${esc(g.name)}（${esc(MP.gear.describe(g))}）、本体の音量 ${S.hw.vol} / ${S.hw.max}。テスト中は本体の音量とゲインを変えないでください。</span></div></div>`;
    }
    return `<div class="card"><div class="verdict"><span>今は<strong>相対値</strong>で測ります。機材プロファイルにイヤホンの感度を入れ、本体の音量を合わせると、耳に届いた音の大きさ（dB SPL）で測れて補正の精度が上がります。</span></div>${S.tools.gear ? '<div class="actions" style="margin-top:10px"><button class="btn press" data-tool="gear">機材プロファイルを開く</button></div>' : ''}</div>`;
  }

  // 絶対値で測ったプロファイルの結果（聴力レベルの目安）
  function audiogramCard(p) {
    const freqs = Object.keys(p.thresholdsSpl.L).map(Number).sort((a, b) => a - b);
    const cell = (ear, f) => {
      const hl = MP.hearing.hearingLevel(p.thresholdsSpl[ear][f], f);
      const c = MP.hearing.hlCategory(hl);
      return `<td><span class="dotlabel ${c.level}" title="${c.text}">${Math.round(hl)}</span></td>`;
    };
    return `
      <div class="card">
        <div class="card-head"><span>聴力レベルの目安（dB）</span></div>
        <div class="table-wrap"><table class="gtable">
          <thead><tr><th></th>${freqs.map((f) => `<th>${fmtHz(f)}</th>`).join('')}</tr></thead>
          <tbody>
            <tr><th>左耳</th>${freqs.map((f) => cell('L', f)).join('')}</tr>
            <tr><th>右耳</th>${freqs.map((f) => cell('R', f)).join('')}</tr>
          </tbody>
        </table></div>
        <p class="note">標準的な聴覚しきい値との差です。20 以下が正常範囲の目安で、補正は 20 を超えた分だけにかけます。イヤホンの周波数特性や装着具合の影響を受けるため、医療的な判断には使えません。</p>
      </div>`;
  }

  function testView() {
    const t = S.test;
    if (t.phase === 'calibrate') {
      return `
        <h1>聴力テスト</h1>
        <div class="card">
          <div class="card-head"><span>1. 音量の準備</span></div>
          <p style="margin-top:0">静かな場所で、いつものイヤホン・ヘッドホンを付けてください。M8T の出力モード（トランジスタ / 三極管 / ウルトラリニア）とゲインも、いつもの設定にします。</p>
          ${t.offset != null
            ? `<p>本体の音量は <strong>${S.hw.vol} / ${S.hw.max}</strong> のまま変えないでください（機材プロファイルの値で、耳に届く音の大きさを計算します）。基準音は約 ${Math.round(-30 + t.offset)} dB SPL です。</p>`
            : '<p>「基準音」を鳴らし、<strong>小さいけれどはっきり聞こえる</strong>音量に DAP のボリュームを合わせてください。テスト中はボリュームを変えないでください。</p>'}
          <div class="actions">
            <button class="btn press" data-action="ref-tone">${icon('play')}基準音を鳴らす</button>
            <button class="btn press primary" data-action="begin-test">テストを始める</button>
            <button class="btn press" data-action="cancel-test">やめる</button>
          </div>
        </div>`;
    }
    if (t.phase === 'done') {
      return `
        <h1>聴力テスト</h1>
        <div class="card">
          <div class="card-head"><span>完了しました</span></div>
          <label>プロファイル名
            <input class="search" style="margin-top:6px" data-profile-name value="${esc(t.defaultName)}">
          </label>
          <p class="note" style="margin-top:0">例：「M8T 真空管 + 〇〇（イヤホン名）」</p>
          <div class="actions">
            <button class="btn press primary" data-action="save-profile">保存して使う</button>
            <button class="btn press" data-action="cancel-test">保存しない</button>
          </div>
        </div>`;
    }
    const { ear, freq } = t.test.step;
    return `
      <h1>聴力テスト</h1>
      <div class="progress" aria-hidden="true"><span style="width:${Math.round(t.test.progress * 100)}%"></span></div>
      <div class="test-stage">
        <div class="test-ear">${ear === 'L' ? '左耳' : '右耳'}</div>
        <div class="test-freq">${fmtHz(freq)}</div>
        <div class="muted" data-test-status>ピッ・ピッ・ピッという音が聞こえましたか？</div>
      </div>
      <div class="test-buttons">
        <button class="btn press" data-action="answer" data-heard="0">聞こえない</button>
        <button class="btn press primary" data-action="answer" data-heard="1">聞こえた</button>
      </div>
      <div class="actions" style="justify-content:center;margin-top:12px">
        <button class="btn press" data-action="replay-tone">もう一度鳴らす</button>
        <button class="btn press" data-action="cancel-test">中止</button>
      </div>`;
  }

  function startTest(kind) {
    if (engine.state === 'playing') engine.pause();
    const test = new MP.hearing.Test(kind === 'full' ? MP.hearing.FULL : MP.hearing.QUICK);
    S.test = { phase: 'calibrate', test, kind, offset: splOffset(), gearId: activeGear() ? activeGear().id : null };
    test.addEventListener('update', () => { render(); presentSoon(); });
    test.addEventListener('done', () => {
      S.test.phase = 'done';
      S.test.defaultName = `プロファイル ${S.profiles.length + 1}`;
      render();
    });
    render();
  }

  let presentTimer;
  function presentSoon() {
    clearTimeout(presentTimer);
    // 予測で答えないよう、提示のタイミングを少しばらつかせる
    presentTimer = setTimeout(() => { if (S.test && S.test.phase === 'test') S.test.test.present(); }, 500 + Math.random() * 700);
  }

  function endTest() {
    clearTimeout(presentTimer);
    if (S.test) S.test.test.close();
    S.test = null;
    render();
  }

  function applyProfile(id) {
    S.activeProfile = id;
    store.set('activeProfile', id);
    applyTools();
  }

  // ---------- 聴覚保護メーター：再生中の音の大きさを推定し、聴いた量を積算する ----------
  const safetyBuf = new Float32Array(2048);
  let safetyPow = null;
  setInterval(() => {
    const off = S.tools.safety ? splOffset() : null;
    if (off == null || engine.state !== 'playing' || !engine.meters) { S.safetyNow = null; updateSafetyView(); return; }
    let sum = 0, n = 0;
    for (const a of engine.meters) {
      a.getFloatTimeDomainData(safetyBuf);
      for (let i = 0; i < safetyBuf.length; i++) sum += safetyBuf[i] * safetyBuf[i];
      n += safetyBuf.length;
    }
    const pow = sum / n;
    safetyPow = safetyPow == null ? pow : safetyPow * 0.8 + pow * 0.2; // 約 2.5 秒でならす
    const db = safetyPow > 0 ? 10 * Math.log10(safetyPow * 2) : -Infinity; // 正弦波換算の dBFS
    S.safetyNow = Number.isFinite(db) ? db + off : null;
    if (S.safetyNow != null) MP.gear.addDose(0.5, S.safetyNow);
    updateSafetyView();
  }, 500);

  function updateSafetyView() {
    const el = $('[data-safety-now]');
    if (el) {
      el.textContent = S.safetyNow == null ? '—' : Math.max(0, S.safetyNow).toFixed(0);
      const hint = $('[data-safety-hint]');
      if (hint) hint.textContent = S.safetyNow == null ? '再生中に表示します。' : S.safetyNow >= 85 ? '大きめです。長時間続けると、聴いてよい量をすぐ使い切ります。' : S.safetyNow >= 75 ? 'ふつうの音量です。' : '控えめな音量です。';
      const week = MP.gear.weekPercent(), day = MP.gear.todayPercent();
      const set = (sel, v) => { const x = $(sel); if (x) { if (x.tagName === 'OUTPUT') x.textContent = v.toFixed(1) + '%'; else x.style.width = Math.min(100, v) + '%'; } };
      set('[data-dose-day]', day); set('[data-dose-day-out]', day); set('[data-dose-week]', week); set('[data-dose-week-out]', week);
    }
    if (nowOpen) updateSignal();
  }

  // ---------- 再生画面 ----------
  let nowOpen = false;
  function setPlayIcons() {
    const playing = engine.state === 'playing' || engine.state === 'loading';
    for (const el of $$('[data-playicon]')) {
      el.innerHTML = icon(playing ? 'pause' : 'play');
      el.setAttribute('aria-label', playing ? '一時停止' : '再生');
    }
    const spinning = engine.state === 'playing';
    document.body.classList.toggle('is-playing', spinning);
    $('#now').classList.toggle('is-playing', spinning);
  }

  function updateMini() {
    const t = engine.queue[engine.index];
    $('#mini').hidden = !t;
    if (!t) return;
    $('.mini-art').src = t.artUrl || PLACEHOLDER;
    $('.mini-title').textContent = t.title;
    $('.mini-sub').textContent = t.artist;
  }

  function updateSignal() {
    const { stages, pure } = engine.signalPath();
    const g = activeGear();
    const at = stages.findIndex((x) => x.label === '出力');
    const extra = [];
    if (g) extra.push({ label: '機材', value: `${g.name}（${MP.gear.describe(g)}）`, status: 'info' });
    if (S.tools.safety && S.safetyNow != null) extra.push({ label: '耳に届く音', value: `約 ${Math.max(0, S.safetyNow).toFixed(0)} dB SPL（推定）`, status: S.safetyNow >= 85 ? 'warn' : 'info' });
    if (extra.length) stages.splice(at < 0 ? stages.length : at + 1, 0, ...extra);
    for (const b of $$('[data-pure-badge]')) {
      const has = engine.queue[engine.index];
      b.textContent = has ? (pure ? '素通し' : '加工中') : '';
      b.className = b.className.replace(/\b(pure|processed)\b/g, '').trim() + ' ' + (pure ? 'pure' : 'processed');
    }
    if (!nowOpen) return;
    $('.stages').innerHTML = stages.map((s) => `<li class="${s.status}"><span class="dot"></span><span class="k">${esc(s.label)}</span><span>${esc(s.value)}</span></li>`).join('');
  }

  function updateTransitionHint() {
    const el = $('.transition-hint');
    const t = engine.transition;
    const ni = engine.nextIndex();
    const next = engine.queue[ni];
    if (!next) { el.textContent = engine.queue.length ? 'これが最後の曲です' : ''; return; }
    let text = `次：${next.title}`;
    if (t && t.type === 'crossfade') {
      text += ` ・ ${t.dur.toFixed(1)} 秒でクロスフェード`;
      const why = [];
      if (t.fadeDetected) why.push('フェードアウトを検出');
      if (t.skipHead > 0.05) why.push(`頭の無音 ${t.skipHead.toFixed(1)} 秒を省略`);
      if (Math.abs(t.ratioDb) >= 0.5) why.push(`音量差 ${t.ratioDb > 0 ? '+' : ''}${t.ratioDb.toFixed(1)}dB を補正`);
      if (why.length) text += `（${why.join('・')}）`;
    } else if (t && t.type === 'gapless') {
      text += t.reason === 'album' ? ' ・ 同じアルバムなのでギャップレス' : ' ・ ギャップレス';
    } else if (t && t.type === 'cut') {
      text += ' ・ 無音を飛ばしてつなぎます';
    } else {
      text += ' ・ 準備中…';
    }
    el.textContent = text;
  }

  function updateQueue() {
    if (!nowOpen) return;
    const upcoming = engine.queue.slice(engine.index + 1, engine.index + 31);
    $('.queue').innerHTML = upcoming.map((t, i) => `
      <li><button class="row thumb" data-queue-jump="${engine.index + 1 + i}">
        <img class="qart" src="${esc(t.artUrl || PLACEHOLDER)}" alt="">
        <span class="main"><div class="title">${esc(t.title)}</div><div class="sub">${esc(t.artist)}</div></span>
        <span class="dur">${fmtTime(t.duration)}</span>
      </button></li>`).join('') || '<li class="muted">ありません</li>';
  }

  function updateNow() {
    const t = engine.queue[engine.index];
    if (nowOpen && t) {
      $('.now-art').src = t.artUrl || PLACEHOLDER;
      $('.now-title').textContent = t.title;
      $('.now-sub').textContent = `${t.artist} — ${t.album}`;
    }
    $('[data-action="shuffle"]').setAttribute('aria-pressed', S.shuffle);
    $('[data-action="repeat"]').setAttribute('aria-pressed', S.repeat);
    for (const b of $$('.seg [data-mode]')) b.setAttribute('aria-checked', b.dataset.mode === engine.s.mode);
    $('#now .seg').hidden = !S.tools.nonstop;
    const vol = Math.round(engine.s.volume * 100);
    $('.volume').value = vol;
    $('.vol-label').textContent = vol === 100 ? '100%（素通し）' : `${vol}%（デジタル音量）`;
    setPlayIcons();
    updateSignal();
    updateTransitionHint();
    updateQueue();
    updateTime();
  }

  let seeking = false;
  function updateTime() {
    const pos = engine.position(), dur = engine.duration();
    $('.mini-progress span').style.transform = `scaleX(${dur ? Math.min(1, pos / dur) : 0})`;
    if (!nowOpen) return;
    if (!seeking) $('.seek').value = dur ? Math.round(pos / dur * 1000) : 0;
    $('.t-pos').textContent = fmtTime(seeking ? $('.seek').value / 1000 * dur : pos);
    $('.t-dur').textContent = '-' + fmtTime(dur - pos);
    const cur = engine.queue[engine.index];
    const full = cur && MP.insights.getFull(cur);
    const prog = dur ? (seeking ? $('.seek').value / 1000 : pos / dur) : 0;
    MP.insights.drawWave($('.wave'), full ? full.wave : null, prog);
  }

  function openNow() { nowOpen = true; $('#now').hidden = false; updateNow(); renderNowAnalysis(); startVu(); }
  function closeNow() { nowOpen = false; $('#now').hidden = true; vu.stop(); }

  // ---------- VU メーター ----------
  const vu = new MP.insights.VUMeter($('.vu'));
  function startVu() {
    $('[data-vu-card]').hidden = !S.vu;
    if (nowOpen && S.vu) vu.start(() => engine.meters || null, () => engine.state === 'playing');
    else vu.stop();
  }

  // ---------- 音源の分析（再生画面） ----------
  function analyzeCurrent() {
    const t = engine.queue[engine.index];
    if (!t) return;
    const p = engine.currentPlayer;
    const buffer = p && p.track === t ? p.buffer : null;
    if (!buffer) return;
    MP.insights.ensure(t, { buffer, full: true }).catch((e) => console.warn('解析できませんでした', e));
  }

  const fmtDb = (v, unit) => (Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(1)}${unit}` : '—');
  function renderNowAnalysis() {
    if (!nowOpen) return;
    const t = engine.queue[engine.index];
    const box = $('[data-now-analysis]');
    const drEl = $('[data-now-dr]');
    const fig = $('[data-spectro]');
    if (!t) { box.innerHTML = '<p class="note">再生すると解析します。</p>'; drEl.innerHTML = ''; fig.hidden = true; return; }
    const r = MP.insights.getFull(t) || MP.insights.get(t);
    if (!r) { box.innerHTML = '<p class="note">解析中…</p>'; drEl.innerHTML = ''; fig.hidden = true; return; }
    drEl.outerHTML = `<span class="drb dr-${MP.inspect.drLevel(r.dr)}" data-now-dr title="ダイナミックレンジ">DR${r.dr}</span>`;
    const rg = engine.s.replayGain !== 'off' ? MP.insights.gainInfo(t, engine.s.replayGain) : null;
    const p = engine.currentPlayer;
    box.innerHTML = `
      <div class="facts">
        <div class="fact"><span>ラウドネス</span><strong>${Number.isFinite(r.lufs) ? r.lufs.toFixed(1) : '—'}<small> LUFS</small></strong></div>
        <div class="fact"><span>ピーク</span><strong>${fmtDb(r.peakDb, '')}<small> dBFS</small></strong></div>
        <div class="fact"><span>高域の上限</span><strong>${(r.cutoff / 1000).toFixed(1)}<small> kHz</small></strong></div>
        <div class="fact"><span>ReplayGain</span><strong>${rg ? fmtDb(p && p.track === t ? p.rgDb : rg.db, '') + '<small> dB</small>' : 'オフ'}</strong></div>
      </div>
      <div class="verdict ${r.verdict.level}"><span>${esc(r.verdict.text)}</span>${r.verdict.notes.map((n) => `<small>${esc(n)}</small>`).join('')}</div>
      ${rg ? `<p class="note">ReplayGain の値：${esc(rg.source)}</p>` : ''}
      <p class="note">DR はダイナミックレンジ（音の強弱の幅）。14 以上は豊か、8〜13 は普通、7 以下は強く圧縮された音源です。</p>`;
    const full = MP.insights.getFull(t);
    fig.hidden = !full;
    if (full) {
      MP.insights.drawSpectrogram($('.spectro'), full.spec, full.native ? full.cutoff : null);
      $('[data-ax-top]').textContent = `${(full.spec.nyq / 1000).toFixed(1)}k`;
      $('[data-ax-mid]').textContent = `${(full.spec.nyq / 2000).toFixed(1)}k`;
    }
  }

  let albumRefresh = null;
  MP.insights.events.addEventListener('analyzed', (e) => {
    const t = e.detail.track;
    if (t === engine.queue[engine.index]) { renderNowAnalysis(); updateTime(); }
    if (S.view === 'album' && S.albumKey === albumKeyOf(t)) {
      clearTimeout(albumRefresh);
      albumRefresh = setTimeout(() => { const v = $('#view'), y = v.scrollTop; render(); v.scrollTop = y; }, 150);
    }
  });

  async function analyzeAlbum() {
    const a = S.albumMap.get(S.albumKey);
    if (!a) return;
    let n = 0;
    for (const t of a.tracks) {
      n++;
      toast(`解析中… ${n} / ${a.tracks.length}　${t.title}`, 0);
      try { await MP.insights.ensure(t, { needNative: true }); }
      catch (e) { console.warn(e); toast(`${t.title} を解析できませんでした（${t.codec} はこのブラウザで読めない可能性があります）`, 4000); await new Promise((r) => setTimeout(r, 1200)); }
    }
    toast('解析が終わりました');
    if (engine.s.replayGain === 'album') engine.applyRg();
  }

  // ---------- Media Session（ロック画面・通知の操作） ----------
  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const t = engine.queue[engine.index];
    if (!t) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title, artist: t.artist, album: t.album,
        artwork: t.artUrl ? [{ src: t.artUrl, sizes: '512x512' }] : [],
      });
    } catch (e) { /* 対応していない環境 */ }
  }
  if ('mediaSession' in navigator) {
    const h = {
      play: () => engine.resume(), pause: () => engine.pause(),
      nexttrack: () => engine.next(), previoustrack: () => engine.prev(),
      seekto: (d) => engine.seek(d.seekTime),
    };
    for (const [k, fn] of Object.entries(h)) { try { navigator.mediaSession.setActionHandler(k, fn); } catch (e) { /* 無視 */ } }
  }

  // ---------- エンジンのイベント ----------
  let analyzeTimer = null;
  engine.addEventListener('trackchange', () => {
    updateMini(); updateNow(); updateMediaSession(); renderNowAnalysis();
    clearTimeout(analyzeTimer);
    analyzeTimer = setTimeout(analyzeCurrent, 400);
    for (const row of $$('#view .row')) row.classList.remove('playing');
    const cur = engine.queue[engine.index];
    if (cur) {
      const r = $(`#view [data-play-track="${cur.id}"]`);
      if (r) r.classList.add('playing');
      if (S.view === 'album' && S.albumKey === albumKeyOf(cur)) {
        const a = S.albumMap.get(S.albumKey);
        const rr = $(`#view [data-play-album-index="${a.tracks.indexOf(cur)}"]`);
        if (rr) rr.classList.add('playing');
      }
    }
  });
  engine.addEventListener('state', () => {
    if (engine.state === 'playing') { startVu(); clearTimeout(analyzeTimer); analyzeTimer = setTimeout(analyzeCurrent, 400); }
    setPlayIcons();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = engine.state === 'playing' ? 'playing' : 'paused';
  });
  engine.addEventListener('transition', () => { updateTransitionHint(); updateQueue(); });
  engine.addEventListener('signalpath', updateSignal);
  engine.addEventListener('queue', updateQueue);
  let lastXf = false;
  engine.addEventListener('time', () => {
    updateTime();
    const xf = engine.inCrossfade();
    if (xf !== lastXf) { lastXf = xf; updateSignal(); }
  });
  engine.addEventListener('error', (e) => toast(e.detail.message, 4000));

  // ---------- 操作 ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, [data-profile]');
    if (!el) return;
    const d = el.dataset;

    if (d.nav) return go(d.nav);
    if (d.tool) return go('tool', { toolId: d.tool });
    if (d.editGear) { S.gearEdit = d.editGear; render(); $('[data-gear-form]').scrollIntoView({ block: 'start' }); return; }
    if (d.deleteGear) {
      S.gears = S.gears.filter((g) => g.id !== d.deleteGear);
      if (S.activeGear === d.deleteGear) S.activeGear = S.gears[0] ? S.gears[0].id : null;
      if (S.gearEdit === d.deleteGear) S.gearEdit = null;
      store.set('gears', S.gears); store.set('activeGear', S.activeGear);
      updateNow();
      return render();
    }
    if (d.setGain) {
      const g = activeGear();
      if (g) { g.gain = d.setGain; store.set('gears', S.gears); toast(`${g.name} のゲインを「${MP.gear.GAINS[g.gain]}」にしました。本体のゲインも合わせてください`, 4000); }
      return render();
    }
    if (d.album) return go('album', { albumKey: d.album });
    if (d.genre) return go('genre', { genreName: d.genre });
    if (d.rg) {
      S.rgMode = d.rg;
      store.set('rgMode', S.rgMode);
      for (const x of $$('[data-rg]')) x.setAttribute('aria-checked', x.dataset.rg === d.rg);
      applyTools();
      refreshRg();
      return;
    }
    if (d.skinPick) {
      store.set('skin', d.skinPick);
      S.skin = MP.skins.apply(d.skinPick);
      const y = $('#view').scrollTop;
      render();
      $('#view').scrollTop = y;
      return;
    }
    if (d.playAlbumIndex != null) {
      const a = S.albumMap.get(S.albumKey);
      return playList(a.tracks, Number(d.playAlbumIndex));
    }
    if (d.playTrack) {
      const q = S.search.trim().toLowerCase();
      const list = q ? S.tracks.filter((t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q)) : S.tracks;
      return playList(list, list.findIndex((t) => t.id === d.playTrack));
    }
    if (d.queueJump) return engine.play(engine.queue, Number(d.queueJump), 0);
    if (d.preset) {
      const p = MP.eq.PRESETS.find((x) => x.id === d.preset);
      setBands(p.bands(), p.id);
      return render();
    }
    if (d.profile) return;
    if (d.deleteProfile) {
      S.profiles = S.profiles.filter((p) => p.id !== d.deleteProfile);
      store.set('profiles', S.profiles);
      if (S.activeProfile === d.deleteProfile) applyProfile(S.profiles[0] ? S.profiles[0].id : null);
      return render();
    }

    switch (d.action) {
      case 'pick-dir': return $('#pick-dir').click();
      case 'pick-files': return $('#pick-files').click();
      case 'demo': return addDemo();
      case 'toggle': return engine.toggle();
      case 'next': return engine.next();
      case 'prev': return engine.prev();
      case 'shuffle': return toggleShuffle();
      case 'repeat': return toggleRepeat();
      case 'open-now': return openNow();
      case 'close-now': return closeNow();
      case 'analyze-album': return analyzeAlbum();
      case 'play-album': case 'shuffle-album': {
        const a = S.albumMap.get(S.albumKey);
        if (d.action === 'shuffle-album' && !S.shuffle) S.shuffle = true;
        if (d.action === 'play-album' && S.shuffle) S.shuffle = false;
        playList(a.tracks, d.action === 'shuffle-album' ? Math.floor(Math.random() * a.tracks.length) : 0);
        return;
      }
      case 'play-genre': case 'shuffle-genre': {
        const g = S.genres.find((x) => x.name === S.genreName);
        const list = g.albums.flatMap((a) => a.tracks);
        S.shuffle = d.action === 'shuffle-genre';
        playList(list, S.shuffle ? Math.floor(Math.random() * list.length) : 0);
        return;
      }
      case 'mode':
        S.nsMode = d.mode;
        store.set('nsMode', S.nsMode);
        applyTools();
        if (S.view === 'tool') render();
        return;
      case 'cancel-gear':
        S.gearEdit = null;
        return render();
      case 'import-autoeq': {
        try {
          const { bands } = MP.eq.parseAutoEq($('[data-autoeq]').value);
          setBands(bands, 'autoeq');
          if (!S.tools.eq) { S.tools.eq = true; store.set('tools', S.tools); }
          S.bypass.eq = false;
          applyTools();
          toast(`${bands.length} 個のフィルターを読み込みました（プリアンプは自動で計算します）`);
          render();
        } catch (err) { toast(err.message, 4000); }
        return;
      }
      case 'start-test': return startTest(d.testKind);
      case 'ref-tone': return S.test.test.tone(1000, -30, 'both', 1, 1.5, 0);
      case 'begin-test':
        S.test.phase = 'test';
        render();
        presentSoon();
        return;
      case 'replay-tone': return S.test.test.present();
      case 'answer': {
        const status = $('[data-test-status]');
        if (status) status.textContent = '…';
        S.test.test.answer(d.heard === '1');
        return;
      }
      case 'cancel-test': return endTest();
      case 'save-profile': {
        const name = ($('[data-profile-name]').value || S.test.defaultName).trim();
        const p = MP.hearing.makeProfile(name, S.test.test.results, 0.5, 10, S.test.offset, S.test.gearId);
        S.profiles.push(p);
        store.set('profiles', S.profiles);
        S.test.test.close();
        // 機材プロファイルに結び付ける
        const g = S.gears.find((x) => x.id === S.test.gearId);
        if (g) { g.hearingId = p.id; store.set('gears', S.gears); }
        S.test = null;
        applyProfile(p.id);
        toast(`プロファイルを保存し、聴力補正をオンにしました（${p.absolute ? '絶対値' : '相対値'}）`);
        return render();
      }
    }
  });

  document.addEventListener('input', (e) => {
    const el = e.target;
    const d = el.dataset;
    if ('search' in d) {
      S.search = el.value;
      $('[data-songlist]').innerHTML = songRows();
      return;
    }
    if ('bandGain' in d) {
      const i = Number(el.closest('[data-band]').dataset.band);
      const b = engine.s.eqBands[i];
      b.gain = Number(el.value);
      el.closest('[data-band]').querySelector('[data-band-val]').textContent = `${b.gain > 0 ? '+' : ''}${b.gain.toFixed(1)}dB`;
      if (S.eqPreset !== 'custom') { S.eqPreset = 'custom'; store.set('eqPreset', 'custom'); for (const c of $$('[data-preset]')) c.setAttribute('aria-pressed', 'false'); }
      engine.update({ eqBands: engine.s.eqBands });
      drawEq();
      return;
    }
    if (el.classList.contains('volume')) {
      engine.update({ volume: Number(el.value) / 100 });
      const vol = Number(el.value);
      $('.vol-label').textContent = vol === 100 ? '100%（素通し）' : `${vol}%（デジタル音量）`;
      return;
    }
    if (el.classList.contains('seek')) { seeking = true; updateTime(); return; }
    if ('xf' in d) {
      $('[data-xf-out]').textContent = `${el.value} 秒`;
      return;
    }
    if ('hwVol' in d) {
      S.hw.vol = Number(el.value);
      store.set('hw', S.hw);
      $('[data-hw-out]').textContent = `${S.hw.vol} / ${S.hw.max}（最大から −${hwAtten().toFixed(1)}dB）`;
      return;
    }
    if ('listen' in d) {
      S.listenDb = Number(el.value);
      store.set('listenDb', S.listenDb);
      const v = $('#view'), y = v.scrollTop; render(); v.scrollTop = y;
      $('#listen').focus();
      return;
    }
    if ('hStrength' in d || 'hMax' in d) {
      const p = S.profiles.find((x) => x.id === S.activeProfile);
      const strength = Number($('[data-h-strength]').value) / 100;
      const maxBoost = Number($('[data-h-max]').value);
      $('[data-strength-out]').textContent = `${Math.round(strength * 100)}%`;
      $('[data-max-out]').textContent = `${maxBoost}dB`;
      const np = MP.hearing.retune(p, strength, maxBoost);
      S.profiles[S.profiles.indexOf(p)] = np;
      drawHearing();
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    const d = el.dataset;
    if (el.id === 'pick-dir' || el.id === 'pick-files') {
      if (el.files.length) importFiles(el.files);
      el.value = '';
      return;
    }
    if (el.classList.contains('seek')) {
      seeking = false;
      engine.seek(Number(el.value) / 1000 * engine.duration());
      return;
    }
    if ('vuToggle' in d) {
      S.vu = el.checked;
      store.set('vu', S.vu);
      startVu();
      return;
    }
    if ('spinToggle' in d) {
      S.spin = el.checked;
      store.set('spin', S.spin);
      document.documentElement.dataset.spin = S.spin ? 'on' : 'off';
      return;
    }
    if ('toolToggle' in d) {
      S.tools[d.toolToggle] = el.checked;
      store.set('tools', S.tools);
      if (!el.checked && d.toolToggle in S.bypass) S.bypass[d.toolToggle] = false;
      applyTools();
      return;
    }
    if ('bypass' in d) {
      S.bypass[d.bypass] = el.checked;
      applyTools();
      toast(el.checked ? '一時的にオフにしました（素通しで聴き比べられます）' : 'オンに戻しました');
      return;
    }
    if ('gear' in d && el.type === 'radio') {
      S.activeGear = d.gear;
      store.set('activeGear', S.activeGear);
      const g = activeGear();
      if (g && g.hearingId && S.profiles.some((p) => p.id === g.hearingId)) applyProfile(g.hearingId);
      updateNow();
      toast(`機材を「${g.name}」に切り替えました`);
      return render();
    }
    if ('hwMax' in d || 'hwStep' in d) {
      S.hw.max = Math.min(200, Math.max(10, Number($('#hw-max').value) || 100));
      S.hw.step = Math.min(3, Math.max(0.1, Number($('#hw-step').value) || 0.5));
      S.hw.vol = Math.min(S.hw.vol, S.hw.max);
      store.set('hw', S.hw);
      return render();
    }
    if ('setting' in d) { engine.update({ [d.setting]: el.checked }); saveSettings(); return; }
    if ('xf' in d) { engine.update({ crossfadeSec: Number(el.value) }); saveSettings(); return; }
    if ('profile' in d) { applyProfile(d.profile); render(); return; }
    if ('hwVol' in d) { if (S.view === 'tool') render(); return; }
    if ('hStrength' in d || 'hMax' in d) {
      store.set('profiles', S.profiles);
      applyProfile(S.activeProfile);
      return;
    }
    const band = el.closest('[data-band]');
    if (band && ('bandType' in d || 'bandFreq' in d || 'bandQ' in d)) {
      const b = engine.s.eqBands[Number(band.dataset.band)];
      if ('bandType' in d) b.type = el.value;
      if ('bandFreq' in d) b.freq = Math.min(20000, Math.max(20, Number(el.value) || b.freq));
      if ('bandQ' in d) b.q = Math.min(10, Math.max(0.1, Number(el.value) || b.q));
      band.querySelector('.freq').textContent = fmtHz(b.freq);
      S.eqPreset = 'custom';
      store.set('eqPreset', 'custom');
      engine.update({ eqBands: engine.s.eqBands });
      saveSettings();
      drawEq();
    }
  });

  document.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-gear-form]')) return;
    e.preventDefault();
    const num = (id) => { const v = $(id).value.trim(); return v === '' ? '' : Number(v); };
    const data = {
      name: $('#g-name').value.trim() || '機材',
      port: $('#g-port').value, mode: $('#g-mode').value, gain: $('#g-gain').value,
      phone: { name: $('#g-phone').value.trim(), sens: num('#g-sens'), sensUnit: $('#g-unit').value, imp: num('#g-imp') },
      hearingId: $('#g-hearing').value,
    };
    if (S.gearEdit) {
      Object.assign(S.gears.find((g) => g.id === S.gearEdit), data);
      S.gearEdit = null;
      toast('保存しました');
    } else {
      const g = { id: 'g' + Date.now().toString(36), ...data };
      S.gears.push(g);
      S.activeGear = g.id;
      toast(`「${g.name}」を追加して、使うようにしました`);
    }
    store.set('gears', S.gears);
    store.set('activeGear', S.activeGear);
    const g = activeGear();
    if (g && g.hearingId && S.profiles.some((p) => p.id === g.hearingId)) applyProfile(g.hearingId);
    updateNow();
    render();
  });

  // EQ スライダーを離したら保存
  document.addEventListener('pointerup', (e) => { if (e.target.matches('[data-band-gain]')) saveSettings(); });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.code === 'Space') { e.preventDefault(); engine.toggle(); }
    else if (e.key === 'Escape' && nowOpen) closeNow();
  });

  window.addEventListener('resize', () => { if (S.view === 'tool' && S.toolId === 'eq') drawEq(); if (S.view === 'tool' && S.toolId === 'hearing' && !S.test) drawHearing(); });

  // 初期化
  for (const el of $$('[data-icon]')) el.innerHTML = icon(el.dataset.icon);
  setPlayIcons();
  render();

  MP.app = { engine, S, addDemo, playList };
})(window.MP = window.MP || {});
