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
step('痛みがある → 別の種目に替える', () => {
  app.S.lastResult = null; app.startSession(false); const s = app.S.session; s.cur = 0; const before = s.items[0].id;
  app.A.pain(); app.A.mYes();
  if (s.items[0].id === before) throw new Error('種目が替わっていない');
  app.S.session = null;
});
step('5分だけモード', () => { app.S.lastResult = null; app.startSession(true); const s = app.S.session; s.items.forEach((it, ci) => { s.cur = ci; it.log.forEach((l, j) => { app.markDone(j); app.stopTimer(false); }); }); app.finishSession(); });
step('途中でやめる（記録なし）', () => { app.S.lastResult = null; app.startSession(false); app.finishSession(); if (app.S.history.length !== 2) throw new Error('空のトレーニングが記録された'); });
step('種目ごとの伸び（推定最大重量）', () => {
  const h = app.S.history; const id = 'goblet_squat';
  h.push({ ts: Date.now(), label: 't', mini: false, dur: 600, items: [{ id, sets: [{ w: 10, r: 10 }] }], kcal: 1, vol: 0, exp: 1, sx: {} });
  h.push({ ts: Date.now(), label: 't', mini: false, dur: 600, items: [{ id, sets: [{ w: 12, r: 10 }] }], kcal: 1, vol: 0, exp: 1, sx: {} });
  app.view = 'log'; app.render();
  const html = app.strengthHTML();
  if (!html.includes('16.0kg') || !html.includes('+2.7')) throw new Error('推定最大重量の計算が違う（12kg×10回 → 16.0kg、差+2.7のはず）');
});
step('猫の性別で一人称が変わる', () => {
  const cat = app.S.profile.cat; cat.sex = 'female'; cat.per = 'gentle';
  let hit = false; for (let i = 0; i < 300 && !hit; i++) { const t = app.say('pet'); if (t.includes('ぼく')) throw new Error('メスなのに「ぼく」'); if (t.includes('わたし')) hit = true; }
  if (!hit) throw new Error('メスの一人称「わたし」が出ない');
  cat.sex = 'male'; cat.per = 'hot'; hit = false;
  for (let i = 0; i < 300 && !hit; i++) { const t = app.say('pet'); if (t.includes('おれ')) hit = true; }
  if (!hit) throw new Error('オス・熱血の一人称「おれ」が出ない');
  app.view = 'status'; app.render(); app.view = 'settings'; app.render();
});
step('作り直し', () => { app.A.editProfile(); app.draft.days = 5; app.step = 4; app.A.obNext({}); if (app.S.program.days.length !== 5) throw new Error('週5回のメニューにならない'); });
errs.forEach(e => console.log(' - ' + e));
console.log(errs.length ? `画面の流れ：問題 ${errs.length}件` : '画面の流れ：すべてOK');
process.exitCode = errs.length ? 1 : 0;
