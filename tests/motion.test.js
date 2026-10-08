// お手本アニメーションの物理チェック：床へのめりこみ・接地点のすべり・重心・関節の向き・手の到達
const { loadApp } = require('./harness');
const app = loadApp();
const { MOT, MOTMAP, EX, solve, lerpP } = app;
const CONTACTS = require('./contacts.json');

const FLOOR = 171;          // 関節中心の許容最下点（線の太さを考慮）
const CONTACT = 167.5;      // これより下にある関節は「床についている」
const SLIDE_MAX = 4;        // 接地点が動いてよい距離(px)
const REACH_MAX = 2.5;      // 手の目標位置との誤差(px)
const norm = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a; };
const ang = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]) * 180 / Math.PI;   // 真下=0・前=90
// Dempster の体節質量比
const MASS = { head: .081, trunk: .497, ua: .028, fa: .022, th: .10, sn: .0465, ft: .0145 };

function rotJ(J, m) {
  if (!m.rot) return J;
  const r = m.rot * Math.PI / 180, [cx, cy] = m.at, o = {};
  for (const k in J) { const x = J[k][0] - cx, y = J[k][1] - cy; o[k] = [cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]; }
  return o;
}
function frames(m, per = 24) {
  const out = [];
  m.ph.forEach((p, i) => {
    const from = m.P[m.ph[(i - 1 + m.ph.length) % m.ph.length][0]], to = m.P[p[0]];
    for (let s = 0; s <= per; s++) { const f = s / per, e = f * f * (3 - 2 * f); const P = lerpP(from, to, e); out.push({ P, J: rotJ(solve(m, P), m), ph: i, key: s === per }); }
  });
  return out;
}
function com(J) {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const parts = [[J.head, MASS.head], [mid(J.hip, J.sh), MASS.trunk],
    [mid(J.shN, J.elbN), MASS.ua], [mid(J.elbN, J.handN), MASS.fa], [mid(J.shF, J.elbF), MASS.ua], [mid(J.elbF, J.handF), MASS.fa],
    [mid(J.hipN, J.kneeN), MASS.th], [mid(J.kneeN, J.ankN), MASS.sn], [mid(J.ankN, J.toeN), MASS.ft],
    [mid(J.hipF, J.kneeF), MASS.th], [mid(J.kneeF, J.ankF), MASS.sn], [mid(J.ankF, J.toeF), MASS.ft]];
  let x = 0, w = 0; parts.forEach(([p, m]) => { x += p[0] * m; w += m; });
  return x / w;
}
const JOINTS = ['head', 'sh', 'hip', 'elbN', 'elbF', 'handN', 'handF', 'kneeN', 'kneeF', 'ankN', 'ankF', 'toeN', 'toeF', 'heelN', 'heelF'];

const report = {};
let total = 0;
for (const [id, m] of Object.entries(MOT)) {
  const F = frames(m), issues = [];
  const add = s => { const k = s.replace(/[-\d.]+/g, '#'); const v = Math.max(...(s.match(/-?[\d.]+/g) || ['0']).map(x => Math.abs(+x))); const o = issues.find(x => x.k === k); if (!o) issues.push({ k, s, v }); else if (v > o.v) { o.s = s; o.v = v; } };
  const js = JOINTS.filter(k => F[0].J[k]);
  // 1) めりこみ
  for (const k of js) { const mx = Math.max(...F.map(f => f.J[k][1])); if (mx > FLOOR) add(`${k} が床にめりこむ (y=${mx.toFixed(1)})`); }
  // 2) 接地点のすべり（全フレームで床についている関節）
  for (const k of js) {
    if (F.every(f => f.J[k][1] >= CONTACT)) {
      const xs = F.map(f => f.J[k][0]), d = Math.max(...xs) - Math.min(...xs);
      if (d > SLIDE_MAX) add(`${k} が床の上ですべる (${d.toFixed(1)}px)`);
    }
  }
  // 3) 手の目標位置
  for (const f of F) for (const [h, t] of [['handN', 'hN'], ['handF', 'hF']]) {
    if (f.P[t] && !m.rot) { const e = Math.hypot(f.J[h][0] - f.P[t][0], f.J[h][1] - f.P[t][1]); if (e > REACH_MAX) add(`${h} が目標に届かない (最大${e.toFixed(1)}px)`); }
  }
  // 4) 関節の向き（横から見た種目のみ）
  if (m.v !== 'f' && !m.abd) for (const f of F) {
    const J = f.J;
    for (const s of ['N', 'F']) {
      const kf = norm(ang(J['hip' + s], J['knee' + s]) - ang(J['knee' + s], J['ank' + s]));
      if (kf < -8) add(`膝(${s})が逆に曲がる (${kf.toFixed(0)}°)`);
      if (kf > 160) add(`膝(${s})の曲げすぎ (${kf.toFixed(0)}°)`);
      const ef = norm(ang(J['elb' + s], J['hand' + s]) - ang(J['sh' + s], J['elb' + s]));
      if (ef < -10) add(`ひじ(${s})が逆に曲がる (${ef.toFixed(0)}°)`);
      if (ef > 165) add(`ひじ(${s})の曲げすぎ (${ef.toFixed(0)}°)`);
      const e = norm(ang(J.hip, J.sh) - ang(J['hip' + s], J['knee' + s]));
      const flex = e >= 0 ? 180 - e : null, ext = e < 0 ? 180 + e : 0;
      if (flex !== null && flex > 150) add(`股関節(${s})の曲げすぎ (${flex.toFixed(0)}°)`);
      if (ext > 40) add(`股関節(${s})の反りすぎ (${ext.toFixed(0)}°)`);
    }
  }
  // 5) 立位の重心（両足が床・手で支えていない・ぶら下がりでない）
  const tops = (m.props || []).filter(p => ['box', 'bench', 'chair'].includes(p.k)).map(p => [p.x, p.x + p.w, p.y]);
  if (!m.rot && m.an !== 'handN' && !m.sup) for (const f of F.filter(f => f.key)) {
    const J = f.J, onProp = s => tops.some(([a, b, y]) => J['ank' + s][0] >= a - 4 && J['ank' + s][0] <= b + 4 && Math.abs(J['ank' + s][1] - y) < 10);
    const feet = ['N', 'F'].filter(s => onProp(s) || (m.v === 'f' ? J['ank' + s][1] >= CONTACT - 6 : J['toe' + s][1] >= CONTACT));
    const handsOn = f.P.hN || f.P.hF || J.handN[1] >= CONTACT || J.handF[1] >= CONTACT;
    const lying = Math.abs(J.sh[1] - J.hip[1]) < 30;
    const seated = (m.props || []).some(p => p.k === 'chair' || p.k === 'bench') && J.hip[1] > 120;
    if (!feet.length || handsOn || lying || seated || f.P.jy) continue;
    // かかとが浮いている足（つま先立ち）は、つま先の周りだけを支えとみなす
    const xs = feet.flatMap(s => m.v === 'f' ? [J['ank' + s][0] - 6, J['ank' + s][0] + 6] : J['heel' + s][1] >= CONTACT || onProp(s) ? [J['heel' + s][0], J['toe' + s][0]] : [J['toe' + s][0] - 4, J['toe' + s][0] + 2]);
    const lo = Math.min(...xs) - 3, hi = Math.max(...xs) + 3, c = com(J);
    if (c < lo || c > hi) add(`重心が足の外 (重心x=${c.toFixed(0)}, 足=${lo.toFixed(0)}〜${hi.toFixed(0)}, ${m.ph[f.ph][2] || '静止'})`);
  }
  // 6) 床（台）につくべき関節がついているか（tests/contacts.json の期待値）
  const exp = CONTACTS[id];
  if (exp) m.P.forEach((P, i) => {
    const J = solve(m, P), tops = (m.props || []).filter(p => ['box', 'bench', 'chair'].includes(p.k)).map(p => [p.x, p.x + p.w, p.y]);
    (exp[i] || []).forEach(k => { const ok = J[k][1] >= 164.5 || tops.some(([a, b, y]) => J[k][0] >= a - 3 && J[k][0] <= b + 3 && Math.abs(J[k][1] - y) < 9); if (!ok) add(`P${i} の ${k} が床・台から浮く (y=${J[k][1].toFixed(1)})`); });
  });
  if (issues.length) { report[id] = issues; total += issues.length; }
}
const unmapped = EX.filter(e => !MOTMAP[e.id] || !MOT[MOTMAP[e.id]]).map(e => e.id);
for (const [id, is] of Object.entries(report)) { console.log(`■ ${id}`); is.forEach(x => console.log('   - ' + x.s)); }
console.log(`\nお手本 ${Object.keys(MOT).length}種類 / 問題 ${total}件 / お手本なしの種目 ${unmapped.length}件 ${unmapped.join(',')}`);
process.exitCode = total || unmapped.length ? 1 : 0;
