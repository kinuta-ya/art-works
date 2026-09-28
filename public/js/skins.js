// テーマ（スキン）の一覧と切り替え。フォントは選んだテーマの分だけ読み込む。
(function (MP) {
  'use strict';

  const LIST = [
    { id: 'midcentury', name: 'ミッドセンチュリー', desc: '1950〜60年代のハイファイ。からし色・オレンジ・ティールと円', swatch: ['#f2e8d3', '#d45f2a', '#1e7471', '#e1a42a'], theme: '#f2e8d3',
      fonts: 'family=Jost:wght@400;500;600&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=DM+Mono:wght@400;500' },
    { id: 'bauhaus', name: 'バウハウス', desc: '赤・青・黄と黒。円・四角・三角の幾何学', swatch: ['#efe9dc', '#d42a1c', '#1d4aa6', '#f1c21b'], theme: '#efe9dc',
      fonts: 'family=Jost:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@400;700&family=DM+Mono' },
    { id: 'swiss', name: 'スイス・スタイル', desc: '白と黒と赤。厳格なグリッドと大きなグロテスク体', swatch: ['#ffffff', '#000000', '#e30613', '#f1f1f1'], theme: '#ffffff',
      fonts: 'family=Archivo:wght@400;600;800&family=Zen+Kaku+Gothic+New:wght@400;700&family=DM+Mono' },
    { id: 'artdeco', name: 'アール・デコ', desc: '黒と金、細い線と左右対称。1920年代の華やかさ', swatch: ['#0e0e10', '#c9a24a', '#1d4d48', '#7a2b26'], theme: '#0e0e10',
      fonts: 'family=Poiret+One&family=Shippori+Mincho:wght@400;600&family=DM+Mono' },
    { id: 'memphis', name: 'メンフィス', desc: 'パステルと原色、太い黒線、紙吹雪のような柄', swatch: ['#fff6e3', '#ff5a9e', '#25c2b4', '#ffd23f'], theme: '#fff6e3',
      fonts: 'family=Bungee&family=Zen+Kaku+Gothic+New:wght@400;700&family=DM+Mono' },
    { id: 'y2k', name: 'Y2K', desc: 'クロームの銀と氷の青。光沢のある丸いボタン', swatch: ['#e7ecf4', '#2b6cff', '#9a6bff', '#74f0ff'], theme: '#e7ecf4',
      fonts: 'family=Orbitron:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;700&family=Share+Tech+Mono' },
    { id: 'minimal', name: 'ミニマリズム', desc: '白とグレーと余白だけ。装飾をすべて外す', swatch: ['#fafafa', '#171717', '#737373', '#e5e5e5'], theme: '#fafafa',
      fonts: 'family=Noto+Sans+JP:wght@300;400;700&family=Noto+Sans+Mono' },
    { id: 'glass', name: 'グラスモーフィズム', desc: '色の光の上に重なる、すりガラスの面', swatch: ['#241a4d', '#ff7eb6', '#6fd8ff', '#b18cff'], theme: '#241a4d',
      fonts: 'family=Jost:wght@400;500;600&family=Zen+Kaku+Gothic+New:wght@400;700&family=DM+Mono' },
    { id: 'neumorph', name: 'ニューモーフィズム', desc: '同じ色の面を、光と影でやわらかく押し出す', swatch: ['#e4e8ef', '#5c6cf2', '#38b3a6', '#c3c9d4'], theme: '#e4e8ef',
      fonts: 'family=M+PLUS+Rounded+1c:wght@400;500;700&family=DM+Mono' },
    { id: 'vaporwave', name: 'ヴェイパーウェイブ', desc: '夕焼けの太陽とグリッド、ピンクとシアン', swatch: ['#1a0e36', '#ff5ec8', '#29e6ff', '#fff27a'], theme: '#1a0e36',
      fonts: 'family=DotGothic16&family=IBM+Plex+Mono' },
  ];

  const loaded = new Set(['midcentury']); // 既定テーマのフォントは index.html で読み込み済み

  function loadFonts(skin) {
    if (loaded.has(skin.id)) return;
    loaded.add(skin.id);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${skin.fonts}&display=swap`;
    document.head.appendChild(link);
  }

  function apply(id) {
    const skin = LIST.find((s) => s.id === id) || LIST[0];
    loadFonts(skin);
    document.documentElement.dataset.skin = skin.id;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = skin.theme;
    return skin.id;
  }

  MP.skins = { LIST, apply };
})(window.MP = window.MP || {});
