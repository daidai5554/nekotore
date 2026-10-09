// 公開用ファイルを作る
//  1) dist/nekotore.html … claude.ai Artifact 用（文書の外枠・PWA用タグを外したもの）
//  2) docs/              … スマホアプリ（PWA）として公開するフォルダ。GitHub Pages が main ブランチの /docs をそのまま公開する
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const out = src.split('\n').filter(l => !/^<!doctype html>$|^<html lang|^<\/?head>$|^<\/?body>$|^<\/html>$|^<meta |rel="manifest"|apple-touch-icon|rel="icon"/.test(l)).join('\n');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'nekotore.html'), out);
console.log(`dist/nekotore.html を作成（${(out.length / 1024).toFixed(0)}KB）`);

const pub = path.join(root, 'docs');
fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(path.join(pub, 'icons'), { recursive: true });
for (const f of ['index.html', 'manifest.json', 'sw.js']) fs.copyFileSync(path.join(root, f), path.join(pub, f));
for (const f of fs.readdirSync(path.join(root, 'icons'))) fs.copyFileSync(path.join(root, 'icons', f), path.join(pub, 'icons', f));
console.log(`docs/ を作成（${fs.readdirSync(pub).length}項目）`);
