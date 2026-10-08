// 12週間の使用シミュレーション：筋力が少しずつ伸びる仮想ユーザーで、重さ・回数の上げ方が現実的か確かめる
// 仮想ユーザー：各種目の最大筋力（1RM）が週1%、自重の回数は週2.5%伸びる。できる回数は Epley 式（回数 = 30×(1RM/重さ − 1)）、セットごとに1回ずつ疲れる
const { loadApp } = require('./harness');
const app = loadApp();
const { EXM } = app;
const errs = [], log = [];
const check = (ok, m) => { if (!ok) errs.push(m); };

function run(profile, weeks = 12, label = '') {
  app.S = Object.assign(app.fresh(), { profile });
  app.S.program = app.buildProgram(profile);
  app.view = 'home';
  const oneRM = {}, bwCap = {};   // ウエイト種目の1RM（kg・器具1つあたり）と自重種目の最大回数
  const series = {};
  let t0 = Date.now() - weeks * 7 * 864e5, sessions = 0, wins = 0;
  for (let w = 0; w < weeks; w++) for (let d = 0; d < profile.days; d++) {
    const now = t0 + (w * 7 + d * Math.floor(7 / profile.days)) * 864e5;
    const realNow = Date.now; Date.now = () => now;
    try {
      app.startSession(false);
      const s = app.S.session;
      s.items.forEach((it, ci) => {
        const e = EXM[it.id]; s.cur = ci;
        if (e.w) { if (!oneRM[it.id]) oneRM[it.id] = app.startW(e, profile, 12) * (1 + 12 / 30); }   // 体の実力：表の「12回できる重さ」どおりの人とする
        else if (!bwCap[it.id]) bwCap[it.id] = (it.hiT || it.secT || 10) * .9;
        const grow = e.w ? 1 + .01 * w : 1 + .025 * w;   // 重さの筋力は週1%、自重の回数は週2.5%（初心者の典型的な伸び）
        it.log.forEach((l, j) => {
          let can;
          if (it.secT) can = Math.floor(bwCap[it.id] * grow) - j * 2;
          else if (e.w) can = Math.floor(30 * (oneRM[it.id] * grow / (+l.w || 1) - 1)) - j;
          else can = Math.floor(bwCap[it.id] * grow) - j;
          l.r = Math.max(0, Math.min(can, it.secT || it.hiT));   // 目標の上限までやって止める
          app.markDone(j); app.stopTimer(false);
        });
        (series[it.id] = series[it.id] || []).push(e.w ? +it.log[0].w : it.secT || it.hiT);
      });
      if (s.battle && s.battle.won) wins++;
      app.finishSession(); sessions++;
      app.A.rpe({ dataset: { v: 'ok' } });
      app.S.lastResult = null; app.view = 'home';
    } finally { Date.now = realNow; }
  }
  const pl = app.player();
  return { series, oneRM, sessions, wins, pl, prog: app.S.prog };
}

for (const [label, prof] of [
  ['男性・筋肥大・ダンベル', { sex: 'male', age: 30, height: 172, weight: 70, goal: 'muscle', level: 'beginner', equipment: ['dumbbell', 'bench', 'chair'], limits: [], days: 3, minutes: 45 }],
  ['女性・健康・器具なし', { sex: 'female', age: 45, height: 158, weight: 55, goal: 'health', level: 'beginner', equipment: ['chair'], limits: [], days: 2, minutes: 20 }],
  ['男性・減量・バーベル', { sex: 'male', age: 40, height: 175, weight: 85, goal: 'diet', level: 'intermediate', equipment: ['barbell', 'bench', 'dumbbell'], limits: [], days: 4, minutes: 45 }]
]) {
  const r = run({ name: 'sim', cat: { name: 'n', per: 'gentle' }, ...prof });
  log.push(`■ ${label}：${r.sessions}回 / 勝利 ${r.wins}回 / Lv ${r.pl.lv.L}`);
  for (const [id, ser] of Object.entries(r.series)) {
    const e = EXM[id];
    if (ser.length < 3) continue;
    const ups = ser.slice(1).filter((v, i) => v > ser[i]).length, downs = ser.slice(1).filter((v, i) => v < ser[i]).length;
    log.push(`   ${e.n}: ${ser.join('→')}${e.w ? 'kg' : ''}  (上げ${ups}・下げ${downs})`);
    if (e.w) {
      const first = ser[0], last = ser[ser.length - 1];
      check(last >= first, `${label} ${e.n}: 12週で重さが下がった（${first}→${last}kg）`);
      check(downs <= ups, `${label} ${e.n}: 下げる回数が上げる回数より多い（行ったり来たり）`);
      const maxReal = r.oneRM[id] * (1 + .01 * 12) / (1 + 8 / 30);   // 8回できる重さ（現実の上限）
      check(last <= maxReal + (e.step || 1) + .01, `${label} ${e.n}: 実力以上の重さになった（${last}kg > ${maxReal.toFixed(1)}kg）`);
    }
    // 12週で筋力は約12%伸びるので、8回以上出てくる種目は少なくとも1回は負荷が上がるはず
    if (ser.length >= 8) check(ups >= 1 || (r.prog[id] && (r.prog[id].extra || r.prog[id].sec)), `${label} ${e.n}: 12週で一度も負荷が上がらない`);
  }
  check(r.wins >= r.sessions * .8, `${label}: 全セットこなしてもモンスターに勝てない回が多い（${r.wins}/${r.sessions}）`);
}
console.log(log.join('\n'));
if (errs.length) { console.log('■ 問題'); errs.forEach(e => console.log('   - ' + e)); } else console.log('シミュレーション：問題なし');
process.exitCode = errs.length ? 1 : 0;
