// メニュー生成のプロパティテスト：ランダムな利用者条件で、守るべきルールがすべて守られているかを確かめる
const { loadApp } = require('./harness');
const app = loadApp();
const { EXM, buildProgram, canUse, allowImpact, dayEst, EQUIP, LIMITS, GOALS, LEVELS } = app;
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
const sub = a => a.filter(() => rnd() < .35);
const fails = {}; const fail = (k, msg) => { (fails[k] = fails[k] || []).length < 3 && fails[k].push(msg); fails[k].n = (fails[k].n || 0) + 1; };
const GROUP = { squat: 'legs', lunge: 'legs', hinge: 'legs', glute: 'legs', calf: 'legs', push_h: 'push', push_v: 'push', tri: 'push', pull_v: 'pull', pull_h: 'pull', posture: 'pull', bi: 'pull', core: 'core', cardio: 'cardio' };
// 痛みのある部位ごとに、出してはいけない種目（データの書きかえで安全性が崩れないように固定で持つ）
const CONTRA = {
  back: ['superman', 'crunch', 'leg_raise', 'ab_roll', 'bb_dl', 'db_rdl', 'kb_swing', 'bb_row', 'bb_squat', 'hang_knee'],
  knee: ['jump_squat', 'pistol_box', 'split_squat', 'reverse_lunge', 'step_up', 'db_lunge', 'bulgarian', 'burpee', 'bw_squat', 'goblet_squat', 'bb_squat'],
  shoulder: ['pullup', 'neg_pullup', 'dead_hang', 'pike_pushup', 'db_press', 'band_ohp', 'bench_dip', 'bb_bench', 'decline_pushup', 'hang_knee'],
  wrist: ['pushup', 'knee_pushup', 'diamond', 'decline_pushup', 'pike_pushup', 'mountain', 'burpee', 'bench_dip']
};
const N = 3000; const over = []; let dup = 0;
for (let n = 0; n < N; n++) {
  const p = { name: 'x', sex: pick(['male', 'female', 'none']), age: 15 + Math.floor(rnd() * 70), height: 145 + Math.floor(rnd() * 50), weight: 40 + Math.floor(rnd() * 80),
    goal: pick(GOALS)[0], level: pick(LEVELS)[0], equipment: sub(EQUIP.map(e => e[0])), limits: sub(LIMITS.map(l => l[0])), days: 2 + Math.floor(rnd() * 5), minutes: pick([10, 20, 30, 45, 60]), cat: { name: 'n', per: 'gentle' } };
  app.S = Object.assign(app.fresh(), { profile: p });
  const prog = buildProgram(p), tag = `${p.goal}/${p.level}/週${p.days}/${p.minutes}分/器具[${p.equipment}]/制限[${p.limits}]`;
  if (prog.days.length !== p.days) fail('日数', tag);
  const week = new Set();
  prog.days.forEach((d, di) => {
    const ids = d.items.map(i => i.id);
    if (new Set(ids).size !== ids.length) fail('同じ日に同じ種目', tag);
    if (d.items.length < (p.minutes <= 10 ? 2 : 3)) fail('種目が少なすぎる', `${tag} DAY${di + 1}:${d.items.length}種目`);
    const est = dayEst(d, p); over.push(est / p.minutes);
    if (est > p.minutes * 1.15 + 1) fail('時間オーバー(15%超)', `${tag} DAY${di + 1}: ${est}分`);
    d.items.forEach(it => {
      const e = EXM[it.id];
      if (!canUse(e, p)) fail('使えない種目（器具・痛み・衝撃）', `${tag} ${e.n}`);
      if (e.impact && !allowImpact(p)) fail('衝撃のある種目', `${tag} ${e.n}`);
      p.limits.forEach(l => { if (CONTRA[l].includes(e.id)) fail(`痛み(${l})のある人に禁止種目`, `${tag} ${e.n}`); });
      if (p.level === 'beginner' && e.lv >= 3) fail('初心者に上級種目', `${tag} ${e.n}`);
      if (!e.w && (app.bmi(p) >= 30 || p.age >= 65) && p.level !== 'advanced' && e.lv >= 3) fail('体重が重め・高齢の人に上級の自重種目', `${tag} ${e.n}`);
      if (it.rest < 20 || it.rest > 180) fail('休憩時間が範囲外', `${tag} ${e.n} ${it.rest}秒`);
      if ((e.req || []).some(r => r.includes('barbell')) && it.rest < 90) fail('バーベル種目の休憩が短い', `${tag} ${e.n} ${it.rest}秒`);
      week.add(GROUP[e.p]);
    });
    const rank = e => e.p === 'cardio' ? 3 : e.p === 'core' ? 2 : 0;
    const rs = d.items.map(it => rank(EXM[it.id])); if (rs.some((r, i) => i && r < rs[i - 1])) fail('順番（体幹・有酸素が先に来る）', `${tag} DAY${di + 1}: ${d.items.map(it => EXM[it.id].n).join('→')}`);
    if (p.goal === 'posture' && !d.items.some(it => ['posture', 'pull_h', 'pull_v'].includes(EXM[it.id].p))) fail('姿勢目標なのに背中の種目がない日', `${tag} DAY${di + 1}`);
  });
  // 「全身トレ×3パターン」の説明どおり、全身の日どうしはまったく同じメニューにしない（分割法で同じ日を週2回くり返すのは一般的なので対象外）
  const sig = prog.days.filter(d => d.type === 'full').map(d => d.items.map(i => i.id).sort().join(','));
  if (p.equipment.length >= 2 && p.minutes >= 20 && new Set(sig).size < sig.length) dup++;
  if (p.minutes >= 20) for (const g of ['legs', 'push', 'pull', 'core']) if (!week.has(g)) fail(`1週間で${g}の種目がない`, tag);
  if (p.goal === 'diet' && p.minutes >= 20 && !prog.days.some(d => d.items.some(it => EXM[it.id].p === 'cardio'))) fail('減量目標なのに有酸素がない', tag);
}
over.sort((a, b) => a - b);
console.log(`全身の日が同じ内容になるメニュー: ${(dup / N * 100).toFixed(1)}%`);
if (dup / N > .01) fail('全身の日に同じ内容が多い', `${dup}件 / ${N}`);
const q = f => over[Math.floor(over.length * f)].toFixed(2);
console.log(`${N}人分のメニューを検査。所要時間/指定時間: 中央値 ${q(.5)}  90% ${q(.9)}  最大 ${over[over.length - 1].toFixed(2)}`);
const keys = Object.keys(fails);
keys.forEach(k => { console.log(`■ ${k}: ${fails[k].n}件`); fails[k].forEach(m => console.log('   例) ' + m)); });
console.log(keys.length ? `ルール違反 ${keys.length}種類` : 'ルール違反なし');
process.exitCode = keys.length ? 1 : 0;
