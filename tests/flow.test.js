// 画面の流れのテスト：初回設定→ホーム→トレーニング→結果→各タブ が例外なく描画でき、記録が残るか
const { loadApp } = require('./harness');
const app = loadApp();
const errs = [];
const step = (name, f) => { try { f(); } catch (e) { errs.push(`${name}: ${e.message}`); } };
step('初回設定', () => {
  app.S = app.fresh(); app.draft = null; app.view = 'onboard'; app.render();
  Object.assign(app.draft, { name: 'テスト', equipment: ['dumbbell', 'chair', 'band'], limits: ['knee'], goal: 'muscle', agree: true });
  for (let i = 0; i < 5; i++) { app.step = i; app.render(); }
  app.step = 4; app.A.obNext({});
  if (!app.S.profile || !app.S.program) throw new Error('プロフィールかメニューができていない');
});
for (const v of ['home', 'status', 'equip', 'plan', 'log', 'settings']) step(`タブ ${v}`, () => { app.view = v; app.render(); });
step('トレーニング', () => {
  app.startSession(false);
  const s = app.S.session; app.render();
  s.items.forEach((it, ci) => { s.cur = ci; app.render(); it.log.forEach((l, j) => { app.A.step({ dataset: { v: `${j}|1` } }); app.markDone(j); app.stopTimer(false); }); });
  app.finishSession(); app.render();
  if (app.S.history.length !== 1) throw new Error('記録が残っていない');
  const h = app.S.history[0];
  if (!(h.kcal > 0 && h.exp > 0)) throw new Error(`カロリーか経験値が0（kcal=${h.kcal}, exp=${h.exp}）`);
  app.A.rpe({ dataset: { v: 'hard' } }); app.render();
});
step('5分だけモード', () => { app.S.lastResult = null; app.startSession(true); const s = app.S.session; s.items.forEach((it, ci) => { s.cur = ci; it.log.forEach((l, j) => { app.markDone(j); app.stopTimer(false); }); }); app.finishSession(); });
step('途中でやめる（記録なし）', () => { app.S.lastResult = null; app.startSession(false); app.finishSession(); if (app.S.history.length !== 2) throw new Error('空のトレーニングが記録された'); });
step('作り直し', () => { app.A.editProfile(); app.draft.days = 5; app.step = 4; app.A.obNext({}); if (app.S.program.days.length !== 5) throw new Error('週5回のメニューにならない'); });
errs.forEach(e => console.log(' - ' + e));
console.log(errs.length ? `画面の流れ：問題 ${errs.length}件` : '画面の流れ：すべてOK');
process.exitCode = errs.length ? 1 : 0;
