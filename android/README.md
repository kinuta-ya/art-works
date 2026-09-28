# Tube Player（Android 試作版）

Web 版（`../public/`）の画面を WebView で表示するアプリです。Android 側では次のことを受け持ちます。

- SD カードの音楽フォルダーを選ぶ画面を開き、中身の一覧を画面側へ渡す
- ファイルの中身を配信する（タグを読むときは必要な部分だけ）
- 選んだフォルダーを覚えておき、次に起動したときに自動で読み込む
- M8T 本体の曲送り・曲戻し・再生ボタン（長押しで早送り・早戻し）
- 戻るボタン（再生画面やツール画面を閉じる。閉じるものが無ければ、再生を続けたまま裏に回る）
- ファイルを選ぶ画面（歌詞ファイルの読み込みなど）

## APK の入手

`android/` か `public/` を変更して push すると、GitHub Actions が APK を作ります。

- リリース「android-debug」: https://github.com/kinuta-ya/art-works/releases/tag/android-debug
- または Actions の実行結果の Artifacts「TubePlayer-debug」

## M8T へのインストール

1. `TubePlayer-debug.apk` をパソコンにダウンロードする
2. SD カードにコピーして、M8T に入れる
3. M8T のファイルマネージャーで APK を開く（初回は「提供元不明のアプリ」の許可を求められます）
4. アプリを開いて「SD カードのフォルダーを選ぶ」から音楽フォルダーを選ぶ

`debug.keystore` は試作版専用の署名鍵です。どのビルドも同じ鍵で署名するので、新しい APK を上書きインストールできます。公開用の鍵ではありません。

## 手元でのビルド

Android SDK と Gradle 8.9 以上、JDK 17 が必要です。

```sh
gradle -p android assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

## いまの限界

- 音は WebView から Android の標準の出力に渡しています。M8T の Global Lossless Output でビットパーフェクトになるかは未確認です。
- 画面を消したときやほかのアプリに切り替えたときの再生の継続は、端末の省電力の設定しだいです（通知からの操作もまだありません）。
- ALAC と DSD はまだ再生できません。
