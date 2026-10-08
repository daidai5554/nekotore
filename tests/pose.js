// 調整用：node tests/pose.js <motion> [pose] … 主要関節の座標を表示
const { loadApp } = require('./harness');
const { MOT, solve } = loadApp();
const [id, pi] = process.argv.slice(2);
const m = MOT[id];
(pi !== undefined ? [+pi] : m.P.map((_, i) => i)).forEach(i => {
  const J = solve(m, m.P[i]);
  console.log(`${id} P${i}: ` + ['head', 'sh', 'hip', 'elbN', 'handN', 'kneeN', 'ankN', 'heelN', 'toeN', 'kneeF', 'ankF', 'toeF'].map(k => `${k}(${J[k].map(v => v.toFixed(0)).join(',')})`).join(' '));
});
