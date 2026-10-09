// 古い版のデータの引き継ぎ：最初の公開版の保存形式（猫の毛色・アクセサリー・経験値のない記録など）を読みこんでも動くか
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
const errs = [];
// 最初の版（v1）で保存されていた形のデータ
const old = {
  v: 1, profile: { name: 'テスト', sex: 'male', age: 35, height: 172, weight: 70, goal: 'muscle', level: 'beginner', equipment: ['dumbbell', 'chair'], limits: [], days: 3, minutes: 20, cat: { name: 'ムギ', coat: 'chatora', per: 'tsundere' } },
  program: null, history: [{ ts: Date.now() - 3 * 864e5, label: 'DAY 1 全身', mini: false, dur: 1200, items: [{ id: 'goblet_squat', sets: [{ w: 8, r: 12 }, { w: 8, r: 11 }] }, { id: 'pushup', sets: [{ w: 0, r: 10 }] }], kcal: 80, vol: 184, rpe: 'ok' }],
  weights: [{ d: '2026-10-01', kg: 70 }], prog: { goblet_squat: { w: 8 } }, xp: 34, lastPet: null, volAdj: 0, acc: 'band', rot: 1, session: null, lastResult: null
};
function boot(state) {
  const store = { 'nekotore.v1': JSON.stringify(state) };
  const el = () => ({ innerHTML: '', hidden: true, textContent: '', value: '', style: {}, classList: { add() { }, remove() { } }, querySelector: () => null, querySelectorAll: () => [], setAttribute() { } });
  const els = {};
  const g = { document: { addEventListener() { }, querySelector: s => els[s] || (els[s] = el()) }, window: { scrollTo() { } }, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    navigator: {}, location: { protocol: 'file:' }, setInterval: () => 0, setTimeout: () => 0, clearTimeout() { }, requestAnimationFrame: () => 0, matchMedia: () => ({ matches: false }), performance: { now: () => 0 } };
  const f = new Function(...Object.keys(g), js + '\nreturn { get S() { return S; }, render, buildProgram, startSession, finishSession, player, set view(v) { view = v; } };');
  return f(...Object.values(g));
}
try {
  // 古いデータにはメニューが入っている前提なので、当時の形でメニューも用意する
  const tmp = boot({ ...old, program: null, profile: null });
  old.program = tmp.buildProgram(old.profile); delete old.program.ver;   // 当時のメニューには版番号がない
  const app = boot(old);
  const S = app.S;
  if (S.profile.cat.name !== 'にゃんだ') errs.push('猫の名前「ムギ」が「にゃんだ」に置きかわらない');
  if (S.equip.head !== 'band' || !S.items.includes('band')) errs.push('はちまきが装備として引き継がれない');
  if ('acc' in S) errs.push('古い acc が残っている');
  if (!S.items.includes('collar')) errs.push('なかよし度Lv2のごほうび（鈴の首輪）がもらえていない');
  const pl = app.player();
  if (!(pl.exp > 0)) errs.push('古い記録から経験値が計算されない');
  if (S.program.ver !== 4 || !S.programNote) errs.push('古いメニューが新しい作り方で作り直されていない');
  for (const v of ['home', 'status', 'equip', 'plan', 'log', 'settings']) { app.view = v; app.render(); }
  app.startSession(false); app.finishSession();
} catch (e) { errs.push('読みこみで例外: ' + e.message); }
errs.forEach(e => console.log(' - ' + e));
console.log(errs.length ? `データ引き継ぎ：問題 ${errs.length}件` : 'データ引き継ぎ：最初の版のデータを問題なく読みこめた');
process.exitCode = errs.length ? 1 : 0;
