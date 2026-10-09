# スマホアプリとして公開する手順（Android）

## 1. 公開用フォルダを作る
```
node tests/tools/build.js
```
`docs/` フォルダができます（index.html・manifest.json・sw.js・icons）。

## 2. 無料ホスティングに置く（Netlify Drop の場合）
1. https://app.netlify.com/drop を開き、無料アカウントでログインする
2. `docs` フォルダをそのままドラッグ＆ドロップする
3. `https://〇〇.netlify.app` のURLが発行される（サイト名は設定で変更できる）

## 3. Android にインストールする
1. スマホの Chrome で発行されたURLを開く
2. 「アプリをインストール」または メニュー（︙）→「ホーム画面に追加」
3. ホーム画面のにゃんだのアイコンから、全画面のアプリとして起動できる（オフラインでも動く）

## 更新するとき
1. `sw.js` の `CACHE = 'nekotore-v2'` の数字を1つ上げる
2. `node tests/tools/build.js` で作り直す
3. Netlify のサイトの「Deploys」に `docs` フォルダをもう一度ドラッグ＆ドロップ

## データについて
記録はスマホの中（そのURLごと）に保存されます。claude.ai で試していたときのデータは自動では移りません。
claude.ai 側の「設定 → データの引っ越し → データをコピー」で出た文字を、アプリ側の同じ欄に貼りつけて「読み込む」と移せます。

## Google Play で配信するとき（次の段階）
公開したURLを https://www.pwabuilder.com に入れると、Play ストア用のパッケージ（Android Studio 不要）を作れます。
Google Play の開発者登録（1回 25ドル）が必要です。
