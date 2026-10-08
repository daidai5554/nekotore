// tune.js の出力（JSON行）を index.html の MOT_TUNE にマージする
// 使い方: node tests/tools/tune.js ... | node tests/tools/apply_tune.js
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const re = /const MOT_TUNE = (\{.*\});/;
const cur = JSON.parse(s.match(re)[1]);
const input = fs.readFileSync(0, 'utf8').split('\n').filter(l => l.startsWith('{'));
for (const line of input) {
  const o = JSON.parse(line.split(' 残り:')[0]);
  for (const [k, ps] of Object.entries(o)) { cur[k] = cur[k] || {}; for (const [i, v] of Object.entries(ps)) cur[k][i] = { ...(cur[k][i] || {}), ...v }; }
}
s = s.replace(re, 'const MOT_TUNE = ' + JSON.stringify(cur) + ';');
fs.writeFileSync(file, s);
console.log('MOT_TUNE:', Object.keys(cur).join(', '));
