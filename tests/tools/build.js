// 公開用ファイルを作る：index.html から文書の外枠（doctype・head・body・PWA用タグ）を外して dist/nekotore.html に書き出す
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const out = src.split('\n').filter(l => !/^<!doctype html>$|^<html lang|^<\/?head>$|^<\/?body>$|^<\/html>$|^<meta |rel="manifest"|apple-touch-icon/.test(l)).join('\n');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'nekotore.html'), out);
console.log(`dist/nekotore.html を作成（${(out.length / 1024).toFixed(0)}KB）`);
