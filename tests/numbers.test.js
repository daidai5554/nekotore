// 数値モデルの妥当性チェック：所要時間・消費カロリー・重さの目安が現実的な範囲に入っているか
const { loadApp } = require('./harness');
const app = loadApp();
const { EXM, buildProgram, dayEst, dayKcal, sessionKcal, startW, repSec, fresh } = app;
const errs = []; const check = (ok, msg) => { if (!ok) errs.push(msg); };
const prof = (o) => Object.assign({ name: 'x', sex: 'male', age: 35, height: 170, weight: 65, goal: 'health', level: 'beginner', equipment: ['dumbbell', 'chair', 'band'], limits: [], days: 3, minutes: 30, cat: { name: 'n', per: 'gentle' } }, o);

// 1回の動作時間：2〜6秒（一般的な筋トレのテンポ 1〜2秒で上げ・2〜3秒で下ろす）
for (const e of Object.values(EXM)) if (e.unit !== 'sec' && e.p !== 'cardio') { const r = repSec(e.id); check(r >= 1.2 && r <= 6.5, `${e.n} の1回の時間 ${r.toFixed(1)}秒`); }

// 消費カロリー：体重65kg・30分の筋トレでおよそ 80〜250kcal（METs 3.5〜6 × 65kg × 0.5時間 ≒ 115〜195）
for (const goal of ['health', 'muscle', 'diet', 'posture']) {
  const p = prof({ goal }); app.S = Object.assign(fresh(), { profile: p });
  const prog = buildProgram(p);
  prog.days.forEach((d, i) => { const k = dayKcal(d, p), m = dayEst(d, p); const perMin = k / m; check(perMin > 2.5 && perMin < 9, `${goal} DAY${i + 1}: ${m}分で${k}kcal（1分あたり${perMin.toFixed(1)}）`); console.log(`  ${goal} DAY${i + 1}: 約${m}分 ${k}kcal`); });
}
// 実際の記録からのカロリー：腕立て10回×3セット＋スクワット15回×3セットを20分で → 60〜140kcal
{
  const p = prof({}); app.S = Object.assign(fresh(), { profile: p });
  const k = sessionKcal([{ id: 'pushup', sets: [{ w: 0, r: 10 }, { w: 0, r: 10 }, { w: 0, r: 10 }] }, { id: 'bw_squat', sets: [{ w: 0, r: 15 }, { w: 0, r: 15 }, { w: 0, r: 15 }] }], 20 * 60, p);
  console.log(`  記録からの計算（20分・自重2種目）: ${k}kcal`); check(k > 40 && k < 140, `記録からのカロリー ${k}kcal`);
}
// 重さの目安：一般的な初心者の開始重量の範囲に入っているか（片手あたりkg）
const W = [
  [{ sex: 'male', weight: 70 }, 'goblet_squat', 6, 14], [{ sex: 'male', weight: 70 }, 'db_curl', 2, 6], [{ sex: 'female', weight: 52 }, 'db_curl', 1, 4],
  [{ sex: 'female', weight: 52 }, 'db_lateral', 1, 2], [{ sex: 'male', weight: 70 }, 'db_bench', 4, 8], [{ sex: 'male', weight: 70, level: 'intermediate', equipment: ['barbell', 'bench'] }, 'bb_squat', 30, 50],
  [{ sex: 'female', weight: 55, equipment: ['barbell'] }, 'bb_dl', 20, 40], [{ sex: 'male', weight: 110, height: 170 }, 'goblet_squat', 6, 14]
];
for (const [o, id, lo, hi] of W) { const p = prof(o); app.S = Object.assign(fresh(), { profile: p }); const w = startW(EXM[id], p); console.log(`  目安 ${EXM[id].n}（${o.sex === 'female' ? '女性' : '男性'}${o.weight}kg）: ${w}kg`); check(w >= lo && w <= hi, `${EXM[id].n} の目安 ${w}kg（期待 ${lo}〜${hi}kg）`); }

if (errs.length) { console.log('■ 範囲外'); errs.forEach(e => console.log('   - ' + e)); } else console.log('数値チェック：すべて範囲内');
process.exitCode = errs.length ? 1 : 0;
