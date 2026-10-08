// 呼吸の案内：回数で行う種目には「吐く」と「吸う」の両方があり、ラベルのある動きはすべて分類されているか
const { loadApp } = require('./harness');
const app = loadApp();
const errs = [];
for (const [id, m] of Object.entries(app.MOT)) {
  const kinds = m.ph.map(p => app.breath(p[2], p[3] === 'k', id));
  m.ph.forEach((p, i) => { if (p[2] && !kinds[i]) errs.push(`${id}: 「${p[2]}」の呼吸が決まらない`); });
  const steady = m.ph.some(p => p[3] === 'k') || kinds.some(k => k === 'リズムよく呼吸') || id === 'negpull';
  if (!steady && !(kinds.includes('吐く') && kinds.includes('吸う'))) errs.push(`${id}: 吐く・吸うがそろわない [${m.ph.map((p, i) => (p[2] || '-') + '=' + (kinds[i] || '?')).join(', ')}]`);
}
errs.forEach(e => console.log(' - ' + e));
console.log(errs.length ? `呼吸チェック：問題 ${errs.length}件` : '呼吸チェック：すべてOK');
process.exitCode = errs.length ? 1 : 0;
