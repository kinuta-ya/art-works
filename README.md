# Tube Player

音に何も足さず、ダイナミックに再生する音楽プレイヤー。Shanling M8T（Android）向けに作っていく。

- 要求定義: [docs/requirements.md](docs/requirements.md)
- 今あるもの: 画面と機能の Web デモ（`public/`）

## Web デモの起動

ビルドは不要です。`public/` を静的サーバーで配信してブラウザで開きます。

```sh
npx http-server public -p 8080
# → http://localhost:8080
```

「デモ音源」ボタンを押すと、ギャップレスとスマートクロスフェードを確認するための合成音アルバムが追加されます。
「フォルダーを読み込む」で手持ちの音楽フォルダーも読み込めます。

## 構成

| ファイル | 役割 |
|---|---|
| `public/js/engine.js` | 再生エンジン（素通しの経路、ギャップレス、スマートクロスフェード、EQ・聴力補正の処理） |
| `public/js/analysis.js` | クロスフェード用の解析（無音・フェードアウト・音量） |
| `public/js/metadata.js` | タグ解析（FLAC / MP3 / M4A / WAV） |
| `public/js/eq.js` | パラメトリック EQ、プリセット、AutoEQ 読み込み、特性グラフ |
| `public/js/hearing.js` | 聴力テストと補正カーブの計算 |
| `public/js/demo-tracks.js` | 合成音のデモアルバム |
| `public/js/app.js` | 画面 |
