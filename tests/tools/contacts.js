// 指定した index.html で、各お手本のキーポーズごとに床（または台）についている関節を列挙する
const fs = require('fs'), path = require('path');
const src = process.argv[2];
const tmp = path.join(__dirname, '..', '..', '.contacts_tmp.html');
fs.copyFileSync(src, path.join(__dirname, '..', '..', 'index.html.bak_contacts'));
const harness = require('../harness');
const orig = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, '..', '..', 'index.html'), fs.readFileSync(src, 'utf8'));
let app; try { app = harness.loadApp(); } finally { fs.writeFileSync(path.join(__dirname, '..', '..', 'index.html'), orig); fs.unlinkSync(path.join(__dirname, '..', '..', 'index.html.bak_contacts')); }
const { MOT, solve } = app, out = {};
const J0 = ['handN', 'handF', 'elbN', 'elbF', 'kneeN', 'kneeF', 'toeN', 'toeF', 'sh', 'hip'];
for (const [id, m] of Object.entries(MOT)) {
  if (m.rot) continue;
  const tops = (m.props || []).filter(p => ['box', 'bench', 'chair', 'handle'].includes(p.k)).map(p => [p.x, p.x + p.w, p.y]);
  out[id] = m.P.map(P => { const J = solve(m, P); return J0.filter(k => J[k][1] >= 166 || tops.some(([a, b, y]) => J[k][0] >= a - 3 && J[k][0] <= b + 3 && Math.abs(J[k][1] - y) < 9)); });
}
console.log(JSON.stringify(out));
