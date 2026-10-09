// 到達度：体格に応じた基準が現実的か（体重が重いほど重さは増えるが体重比は下がる・女性/高齢は低め・最上位でも競技トップ未満）
const { loadApp } = require('./harness');
const app = loadApp();
const errs = [], log = [];
const check = (ok, m) => { if (!ok) errs.push(m); };
const prof = o => Object.assign({ name: 'x', sex: 'male', age: 35, height: 172, weight: 70, goal: 'muscle', level: 'beginner', equipment: [], limits: [], days: 3, minutes: 30, cat: { name: 'n', per: 'gentle' } }, o);
const T = (id, o) => app.rankTable(id, prof(o));
const lv = (t, name) => t[app.RANKS.indexOf(name)];

// 基準の人（男性70kg・35歳）
const sq = T('bb_squat', {}), bp = T('bb_bench', {}), pu = T('pushup', {});
log.push(`男性70kg：スクワット 一般人${lv(sq, '一般人')} 中級${lv(sq, '中級')} 達人${lv(sq, '達人')}kg ／ ベンチ 中級${lv(bp, '中級')} 達人${lv(bp, '達人')}kg ／ 腕立て 一般人${lv(pu, '一般人')} 中級${lv(pu, '中級')} 達人${lv(pu, '達人')}回`);
check(lv(sq, '中級') === 105, 'スクワット中級は体重の1.5倍（105kg）のはず');
// 最上位でも競技トップ（ベンチ体重の2倍・スクワット2.75倍）より下
check(lv(bp, '達人') < 70 * 2 && lv(sq, '達人') < 70 * 2.75, '達人が競技トップ水準を超えている');
// 体重：重い人ほど基準の重さは大きいが、体重比は小さい
const sq100 = T('bb_squat', { weight: 100, height: 180 }), sq55 = T('bb_squat', { weight: 55, height: 165 });
check(lv(sq100, '中級') > lv(sq, '中級') && lv(sq100, '中級') / 100 < lv(sq, '中級') / 70, '体重100kgの基準が体重比で下がっていない');
check(lv(sq55, '中級') / 55 > lv(sq, '中級') / 70, '体重55kgの基準が体重比で上がっていない');
// 自重：体重が重いほど回数は少なめ
check(lv(T('pushup', { weight: 100 }), '中級') < lv(pu, '中級'), '体重が重い人の腕立ての基準が下がっていない');
// 女性・高齢
const fsq = T('bb_squat', { sex: 'female', weight: 55, height: 158 }), fbp = T('bb_bench', { sex: 'female', weight: 55, height: 158 }), fpu = T('pushup', { sex: 'female', weight: 55, height: 158 });
log.push(`女性55kg：スクワット 中級${lv(fsq, '中級')}kg ／ ベンチ 中級${lv(fbp, '中級')}kg ／ 腕立て 中級${lv(fpu, '中級')}回`);
check(lv(fbp, '中級') < lv(fsq, '中級') * .7, '女性の上半身の基準が下半身に比べて高すぎる');
const old = T('bb_squat', { age: 65 }), oldBal = T('single_leg_stand', { age: 70 }), youngBal = T('single_leg_stand', { age: 30 });
log.push(`65歳男性：スクワット 中級${lv(old, '中級')}kg ／ 片脚立ち 中級 70歳${lv(oldBal, '中級')}秒・30歳${lv(youngBal, '中級')}秒`);
check(lv(old, '中級') < lv(sq, '中級'), '高齢の基準が下がっていない');
check(lv(oldBal, '中級') < lv(youngBal, '中級'), '高齢のバランス基準が下がっていない');
// 表は単調に増える
for (const id of Object.keys(app.STD)) for (const o of [{}, { sex: 'female', weight: 48, height: 150, age: 72 }, { weight: 120, height: 175 }]) {
  const t = T(id, o); for (let i = 2; i < t.length; i++) if (!(t[i] > t[i - 1])) { errs.push(`${id} の基準が増えていない`); break; }
}
// 記録からの判定：男性70kg、スクワット 80kg×5回 → 推定 93.3kg → 「経験者」（84kg以上・105kg未満）
app.S = Object.assign(app.fresh(), { profile: prof({}) });
app.S.history = [{ ts: Date.now(), items: [{ id: 'bb_squat', sets: [{ w: 80, r: 5 }] }] }];
const r = app.rankOf('bb_squat');
log.push(`判定：80kg×5回 → 推定${r.v.toFixed(1)}kg → ${app.RANKS[r.i]}`);
check(app.RANKS[r.i] === '経験者', `80kg×5回の判定が「経験者」にならない（${app.RANKS[r.i]}）`);
// 全種目が実在
for (const id of Object.keys(app.STD)) check(app.EXM[id], `到達度の基準に存在しない種目: ${id}`);
console.log(log.join('\n'));
errs.forEach(e => console.log(' - ' + e));
console.log(errs.length ? `到達度：問題 ${errs.length}件` : '到達度：体格に応じた基準はすべて妥当');
process.exitCode = errs.length ? 1 : 0;
