// お手本のキーポーズを自動調整する：物理的な違反（めりこみ・浮き・届かない・逆関節・重心）を最小化しつつ元の姿勢からの変化を小さくする
// 使い方: node tests/tools/tune.js <motion> <pose番号> <動かすパラメータ,カンマ区切り>
//   例: node tests/tools/tune.js plank 0 t,thN,thF,uaN,uaF,ay
//   配列パラメータは hN.0 / hN.1 のように成分を指定
const { loadApp } = require('../harness');
const { MOT, solve } = loadApp();
const CONTACTS = require('../contacts.json');
const { angles, REF } = require('../biomech');
const [id, pi, keys] = process.argv.slice(2);
const m = MOT[id], i = +pi, base = JSON.parse(JSON.stringify(m.P[i]));
const params = keys.split(',');
const norm = a => ((a + 180) % 360 + 360) % 360 - 180;
const ang = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]) * 180 / Math.PI;
// 別名：legs=両脚まっすぐ（太もも・すね同じ角度）、th2/sn2/ua2/fa2=左右同じ値、h2.0/h2.1=両手の目標、p2.*=両足の目標
const ALIAS = { legs: ['thN', 'snN', 'thF', 'snF'], th2: ['thN', 'thF'], sn2: ['snN', 'snF'], ua2: ['uaN', 'uaF'], fa2: ['faN', 'faF'], h2: ['hN', 'hF'], p2: ['pN', 'pF'] };
const expand = k => { const [a, b] = k.split('.'); return (ALIAS[a] || [a]).map(x => b === undefined ? x : x + '.' + b); };
const get1 = (P, k) => { const [a, b] = k.split('.'); return b === undefined ? P[a] : P[a][+b]; };
const set1 = (P, k, v) => { const [a, b] = k.split('.'); if (b === undefined) P[a] = v; else P[a][+b] = v; };
// body=頭からかかとまで一直線（胴の角度 t と脚の角度 t-180 を連動）
const get = (P, k) => k === 'body' ? P.t : get1(P, expand(k)[0]);
const set = (P, k, v) => { if (k === 'body') { P.t = v; ['thN', 'snN', 'thF', 'snF'].forEach(x => P[x] = v - 180); } else expand(k).forEach(x => set1(P, x, v)); };
const tops = (m.props || []).filter(p => ['box', 'bench', 'chair'].includes(p.k)).map(p => [p.x, p.x + p.w, p.y]);
function cost(P, verbose) {
  const J = solve(m, P); let c = 0; const why = [];
  const pen = (w, v, s) => { if (v > 0) { c += w * v; if (verbose) why.push(`${s}:${v.toFixed(1)}`); } };
  for (const k of ['head', 'sh', 'hip', 'elbN', 'elbF', 'handN', 'handF', 'kneeN', 'kneeF', 'ankN', 'ankF', 'toeN', 'toeF', 'heelN', 'heelF']) pen(10, J[k][1] - 170.5, k + '↓');
  for (const k of (CONTACTS[id] || [])[i] || []) {
    const onTop = tops.find(([a, b]) => J[k][0] >= a - 3 && J[k][0] <= b + 3);
    const ty = onTop && Math.abs(J[k][1] - onTop[2]) < 12 ? onTop[2] - 2 : 169.5;
    pen(5, Math.abs(J[k][1] - ty) - 1, k + '浮');
  }
  for (const [h, t] of [['handN', 'hN'], ['handF', 'hF']]) if (P[t]) pen(5, Math.hypot(J[h][0] - P[t][0], J[h][1] - P[t][1]) - .5, h + '届');
  if (m.v !== 'f' && !m.abd) for (const s of ['N', 'F']) {
    pen(3, -8 - norm(ang(J['hip' + s], J['knee' + s]) - ang(J['knee' + s], J['ank' + s])), '膝逆' + s);
    pen(3, -10 - norm(ang(J['elb' + s], J['hand' + s]) - ang(J['sh' + s], J['elb' + s])), '肘逆' + s);
  }
  for (const [rid, ri, rk, lo, hi, rs = 'N'] of REF) if (rid === id && ri === i) { const v = angles(J, rs)[rk]; pen(1, lo - v, rk + '<'); pen(1, v - hi, rk + '>'); }
  params.forEach(k => { const d = get(P, k) - get(base, k); c += .004 * d * d; });
  return verbose ? why : c;
}
let P = JSON.parse(JSON.stringify(base)), best = cost(P);
for (const step of [8, 4, 2, 1, .5, .25]) {
  let improved = true;
  while (improved) {
    improved = false;
    for (const k of params) for (const dir of [1, -1]) {
      const Q = JSON.parse(JSON.stringify(P)); set(Q, k, get(Q, k) + dir * step);
      const c = cost(Q); if (c < best - 1e-6) { best = c; P = Q; improved = true; }
    }
  }
}
const out = {}; params.flatMap(k => k === 'body' ? ['t', 'thN', 'snN', 'thF', 'snF'] : expand(k)).forEach(k => { const [a] = k.split('.'); out[a] = P[a]; });
for (const k in out) if (typeof out[k] === 'number') out[k] = Math.round(out[k] * 2) / 2; else out[k] = out[k].map(v => Math.round(v * 2) / 2);
console.log(JSON.stringify({ [id]: { [i]: out } }), '残り:', cost(P, true).join(' ') || 'なし', 'before:', cost(base, true).join(' ') || 'なし');
