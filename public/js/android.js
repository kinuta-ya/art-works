// Android アプリ（試作版）のときだけ動く橋渡し。
// SD カードのファイルを、Web 版と同じ「ファイル」として扱えるようにする。
(function (MP) {
  'use strict';

  const B = window.TubeBridge;
  if (!B) return;
  document.documentElement.classList.add('in-app');

  // SD カードのファイル。中身はアプリが /sd/<番号> で配信する（一部だけ読むときは範囲を指定）
  const read = (url) => fetch(url).then((r) => {
    if (!r.ok) throw new Error(`読めませんでした（${r.status}）`);
    return r.arrayBuffer();
  });
  class SdFile {
    constructor(e) {
      this.name = e.name;
      this.size = e.size;
      this.type = e.mime || '';
      this.webkitRelativePath = e.path;
      this.url = `/sd/${e.n}`;
    }
    slice(start = 0, end = this.size) {
      const s = Math.max(0, start), l = Math.max(0, Math.min(this.size, end) - s);
      return { size: l, arrayBuffer: () => read(`${this.url}?s=${s}&l=${l}`) };
    }
    arrayBuffer() { return read(this.url); }
  }

  const toast = (m, ms) => MP.app && MP.app.toast(m, ms);
  let lastSeek = 0;

  window.TubeAndroid = {
    onScanStart() { toast('フォルダーの中身を調べています…', 0); },
    onProgress(n) { toast(`フォルダーの中身を調べています… ${n} 件`, 0); },
    onCancel() { toast('フォルダーの選択をやめました'); },
    onError(msg) { toast(`フォルダーを読めませんでした：${msg}`, 6000); },
    async onFolderReady() {
      const list = JSON.parse(B.takeFolderJson() || '[]');
      const files = list.map((e) => new SdFile(e));
      if (!files.some((f) => MP.metadata.isAudio(f.name))) { toast('このフォルダーには音楽ファイルが見つかりませんでした', 5000); return; }
      await MP.app.importFiles(files, { replace: true });
    },
    // 本体のボタン
    key(k) {
      const e = MP.app.engine;
      switch (k) {
        case 'next': e.next(); break;
        case 'prev': e.prev(); break;
        case 'toggle': e.toggle(); break;
        case 'play': e.resume(); break;
        case 'pause': e.pause(); break;
        case 'ff': case 'rew': {
          // 長押しの繰り返しは 0.3 秒に 1 回だけ、10 秒ずつ動かす
          const now = performance.now();
          if (now - lastSeek < 300) return;
          lastSeek = now;
          const pos = e.position() + (k === 'ff' ? 10 : -10);
          e.seek(Math.max(0, Math.min(e.duration() - 1, pos)));
          break;
        }
      }
    },
    // 戻るボタン：閉じるものがあれば閉じて true
    back() { return MP.app.back(); },
  };

  MP.android = {
    pick() { B.pickFolder(); },
    rescan() { if (!B.rescan()) toast('先に「SD カードのフォルダーを選ぶ」でフォルダーを選んでください', 4000); },
    hasFolder: () => B.hasFolder(),
    folderName: () => B.folderName(),
    version: () => B.version(),
  };

  // 起動したら、前回選んだフォルダーを読み込む
  if (B.hasFolder()) setTimeout(() => B.rescan(), 300);
})(window.MP = window.MP || {});
