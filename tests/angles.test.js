// お手本のキーポーズの関節角度が、運動指導で一般的な範囲に入っているか
// 角度の定義：膝・ひじ・股関節は「曲がっている角度」（まっすぐ=0°）、上体は「垂直からの前傾」、足首は「床からかかとが上がった角度」
const { loadApp } = require('./harness');
const { MOT, solve } = loadApp();
const { angles, REF } = require('./biomech');
const errs = [];
for (const [id, i, k, lo, hi, s = 'N'] of REF) {
  const m = MOT[id], v = angles(solve(m, m.P[i]), s)[k];
  if (!(v >= lo && v <= hi)) errs.push(`${id} P${i} ${k}${s === 'F' ? '(奥)' : ''} = ${v.toFixed(0)}°（目安 ${lo}〜${hi}°）`);
}
// テンポ：筋トレは「下ろす（伸ばされながら耐える）」を「上げる」以上の長さに。勢いを使う種目は除く
const FAST = ['jumpsquat', 'swing', 'burpee', 'jack', 'stepjack', 'highknee', 'mountain', 'rope', 'sidewalk', 'negpull', 'hang', 'plank', 'sideplank', 'wallsit'];
for (const [id, m] of Object.entries(MOT)) {
  if (FAST.includes(id)) continue;
  const lab = m.ph.filter(p => p[2] && p[3] !== 'k' && !/止め|キープ|胸を張る|のばしきる|しめる|寄せる$/.test(p[2]));
  const down = lab.filter(p => /下ろ|しゃがむ|落と|近づけ|座る|戻す|もどす|閉じる|下り|転がす|お尻を後ろへ引く|脚を後ろへ引く/.test(p[2]) && !/押し|引き|バーに近づけ/.test(p[2]));
  const up = lab.filter(p => !down.includes(p));
  if (down.length && up.length) {
    const d = Math.max(...down.map(p => p[1])), u = Math.max(...up.map(p => p[1]));
    if (d < u) errs.push(`${id}: 戻す動き(${d}秒)が力を出す動き(${u}秒)より速い`);
    if (u > 2.6) errs.push(`${id}: 力を出す動きが遅すぎる(${u}秒)`);
  }
}
errs.forEach(e => console.log(' - ' + e));
console.log(errs.length ? `関節角度・テンポ：問題 ${errs.length}件` : `関節角度・テンポ：${REF.length}項目すべて目安内`);
process.exitCode = errs.length ? 1 : 0;
